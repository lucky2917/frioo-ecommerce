require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
};

const missingVars = Object.keys(requiredEnvVars).filter(key => !requiredEnvVars[key]);

if (missingVars.length > 0) {
  console.error('\n❌ FATAL ERROR: Missing required environment variables:\n');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📝 Please check your .env file and ensure all variables are set.');
  console.error('   See .env.example for reference.\n');
  process.exit(1); // Exit with error code
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public',
     
      poolSettings: {
        max: 10,                      
        idleTimeoutMillis: 30000,     // 30 seconds idle timeout
        connectionTimeoutMillis: 2000 // 2 seconds connection timeout
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'frioo-server'
      }
    }
  }
);

module.exports = { supabaseAdmin };