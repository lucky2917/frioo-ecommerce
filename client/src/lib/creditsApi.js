import { supabase } from './supabaseClient';
import { API_BASE_URL } from '../config/constants';

const BASE = `${API_BASE_URL}/api/admin/credits`;

const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Your session has expired. Sign in again.');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
    };
};

const unwrap = async (response) => {
    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error?.message || 'Request failed');
    }

    return payload?.data ?? null;
};

export const creditsApi = {
    async metrics() {
        const res = await fetch(`${BASE}/metrics`, { headers: await authHeaders() });
        return (await unwrap(res)).metrics;
    },

    async listPlans() {
        const res = await fetch(`${BASE}/plans`, { headers: await authHeaders() });
        return (await unwrap(res)).plans;
    },

    async savePlan(body) {
        const res = await fetch(`${BASE}/plans`, {
            method: 'POST', headers: await authHeaders(), body: JSON.stringify(body)
        });
        return (await unwrap(res)).result;
    },

    async setPlanActive(planId, isActive) {
        const res = await fetch(`${BASE}/plans/${planId}/active`, {
            method: 'PATCH', headers: await authHeaders(), body: JSON.stringify({ is_active: isActive })
        });
        return (await unwrap(res)).result;
    },

    async deletePlan(planId) {
        const res = await fetch(`${BASE}/plans/${planId}`, {
            method: 'DELETE', headers: await authHeaders()
        });
        return (await unwrap(res)).result;
    },

    async searchCustomers(query, signal) {
        const res = await fetch(`${BASE}/customers?q=${encodeURIComponent(query)}`, {
            headers: await authHeaders(), signal
        });
        return (await unwrap(res)).result;
    },

    async customer(userId) {
        const res = await fetch(`${BASE}/customers/${userId}`, { headers: await authHeaders() });
        return (await unwrap(res)).result;
    },

    async activate(userId, body) {
        const res = await fetch(`${BASE}/customers/${userId}/activate`, {
            method: 'POST', headers: await authHeaders(), body: JSON.stringify(body)
        });
        return (await unwrap(res)).result;
    },

    async adjust(userId, body) {
        const res = await fetch(`${BASE}/customers/${userId}/adjust`, {
            method: 'POST', headers: await authHeaders(), body: JSON.stringify(body)
        });
        return (await unwrap(res)).result;
    },

    async setStatus(userId, body) {
        const res = await fetch(`${BASE}/customers/${userId}/status`, {
            method: 'POST', headers: await authHeaders(), body: JSON.stringify(body)
        });
        return (await unwrap(res)).result;
    },

    async extendLot(lotId, body) {
        const res = await fetch(`${BASE}/lots/${lotId}/extend`, {
            method: 'POST', headers: await authHeaders(), body: JSON.stringify(body)
        });
        return (await unwrap(res)).result;
    },

    async refundOrder(orderId, body) {
        const res = await fetch(`${BASE}/orders/${orderId}/refund`, {
            method: 'POST', headers: await authHeaders(), body: JSON.stringify(body)
        });
        return (await unwrap(res)).result;
    },

    async reverseEntry(entryId, body) {
        const res = await fetch(`${BASE}/entries/${entryId}/reverse`, {
            method: 'POST', headers: await authHeaders(), body: JSON.stringify(body)
        });
        return (await unwrap(res)).result;
    },

    async ledger(params) {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, value]) => value !== '' && value != null)
        ).toString();
        const res = await fetch(`${BASE}/ledger?${query}`, { headers: await authHeaders() });
        return (await unwrap(res)).result;
    },

    async exportLedgerCsv(params) {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, value]) => value !== '' && value != null)
        ).toString();
        const res = await fetch(`${BASE}/ledger/export?${query}`, { headers: await authHeaders() });
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
    },

    async reconcile() {
        const res = await fetch(`${BASE}/reconcile`, { headers: await authHeaders() });
        return (await unwrap(res)).drift;
    }
};

export const newIdempotencyKey = (prefix) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
