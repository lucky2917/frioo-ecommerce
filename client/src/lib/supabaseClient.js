import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,

        autoRefreshToken: true,

        detectSessionInUrl: true,

        storage: window.localStorage,

        flowType: 'pkce'
    }
});
