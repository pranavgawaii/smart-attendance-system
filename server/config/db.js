const { createClient } = require('@supabase/supabase-js');
const { isProduction, shouldFailFast } = require('./runtime');

const configuredSupabaseUrl = process.env.SUPABASE_URL?.trim();
const fallbackSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseUrl = configuredSupabaseUrl || (!isProduction ? fallbackSupabaseUrl : null);
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const missingRequired = [
  !configuredSupabaseUrl ? 'SUPABASE_URL' : null,
  !supabaseServiceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null
].filter(Boolean);

if (missingRequired.length > 0) {
  const message = `[Config] Missing required Supabase environment variable(s): ${missingRequired.join(', ')}`;
  if (shouldFailFast) {
    throw new Error(message);
  }
  console.error(`${message}. Backend features will remain unavailable until variables are configured.`);
}

// Server-side Supabase client initialization
const supabase = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })
  : null;

module.exports = { supabase };
