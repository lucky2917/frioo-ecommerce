require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { validateEnvironment } = require('./config/env');

validateEnvironment();

const DB_TIMEOUT_MS = Number(process.env.DB_TIMEOUT_MS) || 8000;

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public'
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'frioo-server'
      },
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), DB_TIMEOUT_MS);
        return fetch(url, { ...options, signal: controller.signal })
          .finally(() => clearTimeout(timer));
      }
    }
  }
);

module.exports = { supabaseAdmin };
