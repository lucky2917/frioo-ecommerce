const webpush = require('web-push');
const { supabaseAdmin } = require('../db');
const logger = require('../utils/logger');

const SEND_TIMEOUT_MS = 8000;
const MAX_FAILURES = 3;
const GONE_STATUS = [404, 410];

let configured = false;

const getPublicKey = () => process.env.VAPID_PUBLIC_KEY || null;

const configure = () => {
    if (configured) return true;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:frioo.trust@gmail.com';

    if (!publicKey || !privateKey) return false;

    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
    return true;
};

const NOTIFICATION_BUILDERS = {
    NEW_ORDER: (payload) => ({
        title: 'New order received',
        body: [
            `Order #${payload.orderId}`,
            payload.total !== undefined ? `₹${Number(payload.total).toFixed(0)}` : null,
            payload.itemCount ? `${payload.itemCount} ${payload.itemCount === 1 ? 'item' : 'items'}` : null,
            payload.orderType ? payload.orderType.charAt(0).toUpperCase() + payload.orderType.slice(1) : null
        ].filter(Boolean).join(' · '),
        tag: `frioo-order-${payload.orderId}`,
        url: '/admin/orders',
        actions: [
            { action: 'view', title: 'View order' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    })
};

const buildNotification = (type, payload) => {
    const builder = NOTIFICATION_BUILDERS[type];
    if (!builder) return null;
    return { ...builder(payload || {}), type };
};

const resolveRecipients = async (event) => {
    if (event.recipient_id) return [event.recipient_id];

    if (event.recipient_type === 'admin') {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('role', 'admin');

        if (error) throw error;
        return (data || []).map((row) => row.id);
    }

    return [];
};

const removeSubscription = async (endpoint) => {
    await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint);
};

const recordFailure = async (subscription) => {
    const nextCount = (subscription.failure_count || 0) + 1;

    if (nextCount >= MAX_FAILURES) {
        await removeSubscription(subscription.endpoint);
        return;
    }

    await supabaseAdmin
        .from('push_subscriptions')
        .update({ failure_count: nextCount })
        .eq('endpoint', subscription.endpoint);
};

const sendToSubscription = async (subscription, notification) => {
    const target = {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth }
    };

    try {
        await webpush.sendNotification(target, JSON.stringify(notification), {
            TTL: 3600,
            timeout: SEND_TIMEOUT_MS
        });

        await supabaseAdmin
            .from('push_subscriptions')
            .update({ last_seen_at: new Date().toISOString(), failure_count: 0 })
            .eq('endpoint', subscription.endpoint);

        return { ok: true };
    } catch (err) {
        const status = err?.statusCode;

        if (GONE_STATUS.includes(status)) {
            await removeSubscription(subscription.endpoint);
            return { ok: false, removed: true, status };
        }

        await recordFailure(subscription);
        return { ok: false, status, message: err?.message };
    }
};

const processEvent = async (eventId) => {
    const { data: event, error } = await supabaseAdmin
        .from('notification_events')
        .select('*')
        .eq('id', eventId)
        .single();

    if (error || !event) throw new Error('Notification event not found');
    if (event.status !== 'pending') return { skipped: true, reason: 'already-processed' };

    const finish = async (status, extra = {}) => {
        await supabaseAdmin
            .from('notification_events')
            .update({
                status,
                attempts: (event.attempts || 0) + 1,
                processed_at: new Date().toISOString(),
                last_error: extra.error || null
            })
            .eq('id', eventId);
    };

    if (!configure()) {
        await finish('skipped', { error: 'VAPID keys not configured' });
        return { skipped: true, reason: 'no-vapid' };
    }

    const notification = buildNotification(event.notification_type, event.payload);
    if (!notification) {
        await finish('skipped', { error: `No builder for ${event.notification_type}` });
        return { skipped: true, reason: 'unknown-type' };
    }

    const recipients = await resolveRecipients(event);
    if (recipients.length === 0) {
        await finish('skipped', { error: 'No recipients' });
        return { skipped: true, reason: 'no-recipients' };
    }

    const { data: subscriptions, error: subError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .in('user_id', recipients);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
        await finish('skipped', { error: 'No push subscriptions' });
        return { skipped: true, reason: 'no-subscriptions' };
    }

    const results = await Promise.allSettled(
        subscriptions.map((subscription) => sendToSubscription(subscription, notification))
    );

    const delivered = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;
    const failed = results.length - delivered;

    await finish(delivered > 0 ? 'sent' : 'failed', {
        error: delivered > 0 ? null : 'All deliveries failed'
    });

    logger.info('Notification dispatched', {
        eventId,
        type: event.notification_type,
        recipients: recipients.length,
        subscriptions: subscriptions.length,
        delivered,
        failed
    });

    return { delivered, failed, subscriptions: subscriptions.length };
};

const saveSubscription = async (userId, subscription, userAgent) => {
    const { endpoint, keys } = subscription || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        const error = new Error('Invalid push subscription');
        error.status = 400;
        throw error;
    }

    const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .upsert({
            user_id: userId,
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
            user_agent: userAgent ? String(userAgent).slice(0, 300) : null,
            last_seen_at: new Date().toISOString(),
            failure_count: 0
        }, { onConflict: 'endpoint' });

    if (error) throw error;
};

const deleteSubscription = async (userId, endpoint) => {
    const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

    if (error) throw error;
};

const listSubscriptions = async (userId) => {
    const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('id, endpoint, user_agent, created_at, last_seen_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

module.exports = {
    getPublicKey,
    isConfigured: configure,
    processEvent,
    saveSubscription,
    deleteSubscription,
    listSubscriptions,
    buildNotification
};
