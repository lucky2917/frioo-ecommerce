require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { validateEnvironment } = require('./config/env');

validateEnvironment();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public',

      poolSettings: {
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
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
