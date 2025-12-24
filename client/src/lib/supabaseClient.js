import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// CRITICAL: Validate environment variables at startup
if (!supabaseUrl || !supabaseKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
    if (!supabaseKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

    throw new Error(
        `❌ Missing required environment variables: ${missingVars.join(', ')}\n\n` +
        `Please check your .env file and ensure these variables are set.\n` +
        `See .env.example for reference.`
    );
}

// PRODUCTION FIX: Explicit session configuration
// This ensures sessions persist correctly on frioo.in (production domain)
// Without this, sessions may not be stored properly in localStorage
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        // Store session in localStorage for persistence across page reloads
        persistSession: true,

        // Automatically refresh tokens before they expire (1 hour default)
        autoRefreshToken: true,

        // Detect session from URL (after OAuth redirect from Google)
        detectSessionInUrl: true,

        // Use localStorage explicitly (fixes production domain issues)
        storage: window.localStorage,

        // Use Supabase's default storage key (sb-{project-ref}-auth-token)
        // This maintains backward compatibility with existing sessions

        // Flow type for OAuth
        flowType: 'pkce'
    }
});
