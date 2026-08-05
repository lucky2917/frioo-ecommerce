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

module.exports = router;
