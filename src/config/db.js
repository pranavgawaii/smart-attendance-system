const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  CRITICAL: Missing Supabase URL or Key! Check Vercel/Local environment variables.');
}

// Server-side Supabase client initialization
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })
  : null;

module.exports = { supabase };
