const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendError, sendSuccess } = require('../utils/responses');
const logger = require('../utils/logger');

router.get('/plans', async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('credit_plans')
        .select('id, code, name, price_paise, credit_paise, validity_days')
        .eq('is_active', true)
        .order('price_paise', { ascending: true });

    if (error) {
        logger.error('Public plans fetch failed:', error);
        return sendError(res, 'Could not load plans', 500);
    }

    return sendSuccess(res, { plans: data || [] });
});

router.use(requireAuth);

router.get('/summary', async (req, res) => {
    const { data, error } = await supabaseAdmin.rpc('credit_account_summary', {
        p_user_id: req.user.id
    });

    if (error) {
        logger.error('Credit summary failed:', error);
        return sendError(res, 'Could not load your credits', 500);
    }

    return sendSuccess(res, { summary: data });
});

router.get('/history', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const { data, error } = await supabaseAdmin.rpc('credit_ledger_search', {
        p_user_id: req.user.id,
        p_entry_type: null,
        p_from: null,
        p_to: null,
        p_query: null,
        p_limit: limit,
        p_offset: offset
    });

    if (error) {
        logger.error('Credit history failed:', error);
        return sendError(res, 'Could not load your credit history', 500);
    }

    const rows = (data?.rows || []).map((row) => ({
        id: row.id,
        entry_type: row.entry_type,
        amount_paise: row.amount_paise,
        balance_after_paise: row.balance_after_paise,
        reason: row.reason,
        order_id: row.order_id,
        created_at: row.created_at
    }));

    return sendSuccess(res, { total: data?.total || 0, rows });
});

router.get('/preview', async (req, res) => {
    const totalPaise = parseInt(req.query.total_paise, 10);

    if (!Number.isInteger(totalPaise) || totalPaise < 0) {
        return sendError(res, 'Invalid order total', 400);
    }

    const { data, error } = await supabaseAdmin.rpc('credit_account_summary', {
        p_user_id: req.user.id
    });

    if (error) {
        logger.error('Credit preview failed:', error);
        return sendError(res, 'Could not check your credits', 500);
    }

    const suspended = data?.status === 'suspended';
    const available = suspended ? 0 : Number(data?.available_paise || 0);
    const applicable = Math.min(available, totalPaise);

    return sendSuccess(res, {
        preview: {
            available_paise: Number(data?.available_paise || 0),
            applicable_paise: applicable,
            remaining_paise: totalPaise - applicable,
            covers_order: applicable > 0 && applicable === totalPaise,
            account_status: data?.status || 'active',
            suspended
        }
    });
});

router.get('/requests', async (req, res) => {
    const { data, error } = await supabaseAdmin.rpc('credit_request_mine', {
        p_user_id: req.user.id
    });

    if (error) {
        logger.error('Own requests fetch failed:', error);
        return sendError(res, 'Could not load your requests', 500);
    }

    return sendSuccess(res, { requests: data || [] });
});

router.post('/requests', async (req, res) => {
    const { plan_id, contact_phone, note } = req.body;

    const planId = parseInt(plan_id, 10);
    if (!Number.isInteger(planId)) return sendError(res, 'Choose a plan', 400);

    const { data, error } = await supabaseAdmin.rpc('credit_request_create', {
        p_user_id: req.user.id,
        p_plan_id: planId,
        p_contact_phone: typeof contact_phone === 'string' ? contact_phone.slice(0, 20) : null,
        p_customer_note: typeof note === 'string' ? note.slice(0, 500) : null
    });

    if (error) {
        if (['P0001', '23514', '23505', 'P0002'].includes(error.code)) {
            return sendError(res, error.message, 400);
        }
        logger.error('Request create failed:', error);
        return sendError(res, 'Could not send your request', 500);
    }

    if (data?.status === 'created') {
        const { data: profile } = await supabaseAdmin
            .from('profiles').select('full_name, phone_number').eq('id', req.user.id).maybeSingle();

        try {
            await supabaseAdmin.from('notification_events').insert([{
                recipient_type: 'admin',
                notification_type: 'PLAN_REQUEST_NEW',
                payload: {
                    requestId: data.request_id,
                    planName: data.plan_name,
                    pricePaise: data.price_paise,
                    customerName: profile?.full_name || null,
                    phone: contact_phone || profile?.phone_number || null
                }
            }]);
        } catch (notifyErr) {
            logger.warn('Could not queue plan request notification', notifyErr);
        }
    }

    return sendSuccess(res, { result: data });
});

router.post('/requests/:requestId/cancel', async (req, res) => {
    const requestId = parseInt(req.params.requestId, 10);
    if (!Number.isInteger(requestId)) return sendError(res, 'Invalid request', 400);

    const { data, error } = await supabaseAdmin.rpc('credit_request_cancel', {
        p_request_id: requestId,
        p_user_id: req.user.id
    });

    if (error) {
        if (['P0001', '23514', '42501', 'P0002'].includes(error.code)) {
            return sendError(res, error.message, 400);
        }
        logger.error('Request cancel failed:', error);
        return sendError(res, 'Could not cancel the request', 500);
    }

    return sendSuccess(res, { result: data });
});

module.exports = router;
