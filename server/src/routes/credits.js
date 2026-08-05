const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { sendError, sendSuccess } = require('../utils/responses');
const logger = require('../utils/logger');

router.use(requireAdmin);

const BUSINESS_RULE_CODES = ['P0001', '23514', '23505', '42501', 'P0002'];

const callRpc = async (res, fnName, args, label) => {
    const { data, error } = await supabaseAdmin.rpc(fnName, args);

    if (error) {
        if (BUSINESS_RULE_CODES.includes(error.code)) {
            return sendError(res, error.message, 400);
        }
        logger.error(`Credit RPC ${fnName} failed:`, error);
        return sendError(res, label || 'Credit operation failed', 500);
    }

    return sendSuccess(res, { result: data });
};

const rupeesToPaise = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return null;
    return Math.round(amount * 100);
};

const requireText = (value) => typeof value === 'string' && value.trim().length > 0;

router.get('/metrics', async (req, res) => {
    const { data, error } = await supabaseAdmin.rpc('credit_dashboard_metrics');
    if (error) {
        logger.error('Credit metrics failed:', error);
        return sendError(res, 'Failed to load credit metrics', 500);
    }
    return sendSuccess(res, { metrics: data });
});

router.get('/plans', async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('credit_plans')
        .select('*')
        .order('code', { ascending: true })
        .order('version', { ascending: false });

    if (error) {
        logger.error('Credit plans fetch failed:', error);
        return sendError(res, 'Failed to load plans', 500);
    }

    const issued = await supabaseAdmin.from('credit_lots').select('plan_id');
    const issuedIds = new Set((issued.data || []).map(row => row.plan_id).filter(Boolean));

    return sendSuccess(res, {
        plans: (data || []).map(plan => ({ ...plan, has_issued: issuedIds.has(plan.id) }))
    });
});

router.post('/plans', async (req, res) => {
    const { plan_id, code, name, price_rupees, credit_rupees, validity_days } = req.body;

    const price = rupeesToPaise(price_rupees);
    const credit = rupeesToPaise(credit_rupees);
    const validity = parseInt(validity_days, 10);

    if (!requireText(name)) return sendError(res, 'Plan name is required', 400);
    if (price === null || price <= 0) return sendError(res, 'Enter a valid price', 400);
    if (credit === null || credit <= 0) return sendError(res, 'Enter valid credits', 400);
    if (!Number.isInteger(validity) || validity <= 0) return sendError(res, 'Enter valid validity in days', 400);

    return callRpc(res, 'credit_plan_save', {
        p_plan_id: plan_id ?? null,
        p_code: code ?? null,
        p_name: name,
        p_price_paise: price,
        p_credit_paise: credit,
        p_validity_days: validity,
        p_actor_id: req.user.id
    }, 'Failed to save plan');
});

router.patch('/plans/:planId/active', async (req, res) => {
    const planId = parseInt(req.params.planId, 10);
    if (!Number.isInteger(planId)) return sendError(res, 'Invalid plan id', 400);

    return callRpc(res, 'credit_plan_set_active', {
        p_plan_id: planId,
        p_active: Boolean(req.body?.is_active),
        p_actor_id: req.user.id
    }, 'Failed to update plan');
});

router.delete('/plans/:planId', async (req, res) => {
    const planId = parseInt(req.params.planId, 10);
    if (!Number.isInteger(planId)) return sendError(res, 'Invalid plan id', 400);

    return callRpc(res, 'credit_plan_delete', { p_plan_id: planId }, 'Failed to delete plan');
});

router.get('/customers', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (query.length < 2) return sendSuccess(res, { result: [] });

    return callRpc(res, 'credit_search_customers', {
        p_query: query,
        p_limit: Math.min(parseInt(req.query.limit, 10) || 20, 50)
    }, 'Customer search failed');
});

router.get('/customers/:userId', async (req, res) => {
    return callRpc(res, 'credit_customer_detail', { p_user_id: req.params.userId }, 'Failed to load customer');
});

router.post('/customers/:userId/activate', async (req, res) => {
    const { plan_id, receipt_reference, note, idempotency_key } = req.body;

    const planId = parseInt(plan_id, 10);
    if (!Number.isInteger(planId)) return sendError(res, 'Choose a plan', 400);
    if (!requireText(receipt_reference)) return sendError(res, 'Receipt reference is required', 400);
    if (!requireText(idempotency_key)) return sendError(res, 'Missing idempotency key', 400);

    return callRpc(res, 'credit_activate_plan', {
        p_user_id: req.params.userId,
        p_plan_id: planId,
        p_receipt_reference: receipt_reference.trim(),
        p_actor_id: req.user.id,
        p_idempotency_key: idempotency_key.trim(),
        p_note: requireText(note) ? note.trim() : null
    }, 'Activation failed');
});

router.post('/customers/:userId/adjust', async (req, res) => {
    const { amount_rupees, direction, validity_days, reason, idempotency_key } = req.body;

    const magnitude = rupeesToPaise(amount_rupees);
    if (magnitude === null || magnitude <= 0) return sendError(res, 'Enter a valid amount', 400);
    if (!requireText(reason)) return sendError(res, 'A reason is required for every adjustment', 400);
    if (!requireText(idempotency_key)) return sendError(res, 'Missing idempotency key', 400);
    if (!['credit', 'debit'].includes(direction)) return sendError(res, 'Choose credit or debit', 400);

    const signed = direction === 'debit' ? -magnitude : magnitude;

    return callRpc(res, 'credit_adjust', {
        p_user_id: req.params.userId,
        p_amount_paise: signed,
        p_validity_days: parseInt(validity_days, 10) || 30,
        p_reason: reason.trim(),
        p_actor_id: req.user.id,
        p_idempotency_key: idempotency_key.trim()
    }, 'Adjustment failed');
});

router.post('/customers/:userId/status', async (req, res) => {
    const { status, reason } = req.body;
    if (!['active', 'suspended'].includes(status)) return sendError(res, 'Invalid status', 400);
    if (status === 'suspended' && !requireText(reason)) {
        return sendError(res, 'A reason is required to suspend an account', 400);
    }

    return callRpc(res, 'credit_set_account_status', {
        p_user_id: req.params.userId,
        p_status: status,
        p_reason: requireText(reason) ? reason.trim() : null,
        p_actor_id: req.user.id
    }, 'Failed to update account status');
});

router.post('/lots/:lotId/extend', async (req, res) => {
    const lotId = parseInt(req.params.lotId, 10);
    const { new_expires_at, reason, idempotency_key } = req.body;

    if (!Number.isInteger(lotId)) return sendError(res, 'Invalid lot id', 400);
    if (!requireText(new_expires_at)) return sendError(res, 'Choose a new expiry date', 400);
    if (!requireText(reason)) return sendError(res, 'A reason is required to extend validity', 400);
    if (!requireText(idempotency_key)) return sendError(res, 'Missing idempotency key', 400);

    return callRpc(res, 'credit_extend_lot', {
        p_lot_id: lotId,
        p_new_expires_at: new_expires_at,
        p_reason: reason.trim(),
        p_actor_id: req.user.id,
        p_idempotency_key: idempotency_key.trim()
    }, 'Extension failed');
});

router.post('/orders/:orderId/refund', async (req, res) => {
    const orderId = parseInt(req.params.orderId, 10);
    const { refund_rupees, reason, idempotency_key } = req.body;

    const refund = rupeesToPaise(refund_rupees);
    if (!Number.isInteger(orderId)) return sendError(res, 'Invalid order id', 400);
    if (refund === null || refund <= 0) return sendError(res, 'Enter a valid refund amount', 400);
    if (!requireText(reason)) return sendError(res, 'A reason is required for every refund', 400);
    if (!requireText(idempotency_key)) return sendError(res, 'Missing idempotency key', 400);

    return callRpc(res, 'credit_refund_order', {
        p_order_id: orderId,
        p_refund_total_paise: refund,
        p_reason: reason.trim(),
        p_actor_id: req.user.id,
        p_idempotency_key: idempotency_key.trim()
    }, 'Refund failed');
});

router.post('/entries/:entryId/reverse', async (req, res) => {
    const entryId = parseInt(req.params.entryId, 10);
    const { reason, idempotency_key } = req.body;

    if (!Number.isInteger(entryId)) return sendError(res, 'Invalid entry id', 400);
    if (!requireText(reason)) return sendError(res, 'A reason is required for every reversal', 400);
    if (!requireText(idempotency_key)) return sendError(res, 'Missing idempotency key', 400);

    return callRpc(res, 'credit_reverse_entry', {
        p_entry_id: entryId,
        p_reason: reason.trim(),
        p_actor_id: req.user.id,
        p_idempotency_key: idempotency_key.trim()
    }, 'Reversal failed');
});

const parseLedgerFilters = (query) => ({
    p_user_id: query.user_id || null,
    p_entry_type: query.entry_type || null,
    p_from: query.from || null,
    p_to: query.to || null,
    p_query: typeof query.q === 'string' ? query.q : null,
    p_limit: Math.min(parseInt(query.limit, 10) || 50, 200),
    p_offset: Math.max(parseInt(query.offset, 10) || 0, 0)
});

router.get('/ledger', async (req, res) => {
    return callRpc(res, 'credit_ledger_search', parseLedgerFilters(req.query), 'Failed to load ledger');
});

const CSV_COLUMNS = [
    'id', 'created_at', 'entry_type', 'full_name', 'email',
    'amount_paise', 'balance_after_paise', 'reason', 'order_id', 'actor_name'
];

const toCsvCell = (value) => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

router.get('/ledger/export', async (req, res) => {
    const filters = parseLedgerFilters(req.query);
    filters.p_limit = 5000;
    filters.p_offset = 0;

    const { data, error } = await supabaseAdmin.rpc('credit_ledger_search', filters);

    if (error) {
        logger.error('Ledger export failed:', error);
        return sendError(res, 'Failed to export ledger', 500);
    }

    const rows = data?.rows || [];
    const header = CSV_COLUMNS.join(',');
    const body = rows.map(row => CSV_COLUMNS.map(col => toCsvCell(row[col])).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="frioo-credit-ledger-${Date.now()}.csv"`);
    return res.send(`${header}\n${body}`);
});

router.post('/expire', async (req, res) => {
    return callRpc(res, 'credit_expire_due_lots', { p_limit: 500 }, 'Expiry sweep failed');
});

router.get('/reconcile', async (req, res) => {
    const { data, error } = await supabaseAdmin.rpc('credit_reconcile');
    if (error) {
        logger.error('Reconciliation failed:', error);
        return sendError(res, 'Reconciliation failed', 500);
    }
    return sendSuccess(res, { drift: data || [] });
});

module.exports = router;
