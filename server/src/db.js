require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
};

const missingVars = Object.keys(requiredEnvVars).filter(key => !requiredEnvVars[key]);

if (missingVars.length > 0) {
  console.error('\n❌ FATAL ERROR: Missing required environment variables:\n');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  process.exit(1);
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: { 'X-Client-Info': 'frioo-server' }
    }
  }
);

module.exports = { supabaseAdmin };
