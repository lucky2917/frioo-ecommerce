const { supabaseAdmin } = require('../db');
const { sendUnauthorized, sendForbidden, sendError } = require('../utils/responses');
const logger = require('../utils/logger');

const requireAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendUnauthorized(res, 'No authorization token provided');
        }

        const token = authHeader.substring(7);

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return sendUnauthorized(res, 'Invalid or expired token');
        }

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return sendForbidden(res, 'Profile not found');
        }

        if (profile.role !== 'admin') {
            return sendForbidden(res, 'Admin access required');
        }

        req.user = user;
        req.profile = profile;

        next();
    } catch (err) {
        logger.error('Admin auth middleware error:', err);
        return sendError(res, 'Authentication failed', 500);
    }
};

module.exports = { requireAdmin };
