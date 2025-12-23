// Admin authentication middleware
// Verifies that the user has admin role before allowing access to admin endpoints

const { supabaseAdmin } = require('../db');
const { sendUnauthorized, sendForbidden, sendError } = require('../utils/responses');

const requireAdmin = async (req, res, next) => {
    try {
        // SECURITY: No logging of auth details to prevent information leakage

        // Get the authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendUnauthorized(res, 'No authorization token provided');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify the token with Supabase
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError) {
            return sendUnauthorized(res, 'Invalid or expired token');
        }

        if (!user) {
            return sendUnauthorized(res, 'Invalid or expired token');
        }

        // Token validation is handled by Supabase getUser()
        // Frontend now auto-refreshes tokens every 50 minutes
        // No need for aggressive expiration window check here

        // Fetch the user's profile to check role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) {
            return sendForbidden(res, 'Profile not found');
        }

        if (!profile) {
            return sendForbidden(res, 'Profile not found');
        }

        if (profile.role !== 'admin') {
            return sendForbidden(res, 'Admin access required');
        }

        // Attach user info to request for use in route handlers
        req.user = user;
        req.profile = profile;

        next();
    } catch (err) {
        // Only log errors (important for debugging failures)
        console.error('Admin auth middleware error:', err);
        return sendError(res, 'Authentication failed', 500);
    }
};

module.exports = { requireAdmin };
