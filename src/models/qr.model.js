const { supabase } = require('../config/db');

// Create a new QR token for a session
const createToken = async ({ session_id, token, code, expires_at }) => {
  const { data, error } = await supabase
    .from('qr_tokens')
    .insert([{
      session_id,
      token,
      code,
      expires_at
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get the latest active token for a session
const getLatestToken = async (session_id) => {
  const { data, error } = await supabase
    .from('qr_tokens')
    .select('*')
    .eq('session_id', session_id)
    .gt('expires_at', new Date().toISOString())
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Get latest N tokens for a session (used for rotation-boundary tolerance)
const getLatestTokensForSession = async (session_id, limit = 2) => {
  const { data, error } = await supabase
    .from('qr_tokens')
    .select('*')
    .eq('session_id', session_id)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

// Verify if a token is valid for a session
const verifyToken = async (session_id, token) => {
  try {
    const { data, error } = await supabase
      .from('qr_tokens')
      .select('id')
      .eq('session_id', session_id)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (error) return false;
    return !!data;
  } catch (error) {
    return false;
  }
};

// Find a token by string (for manual entry or validation)
const findByToken = async (session_id, tokenString) => {
  // Check main token OR code
  const { data, error } = await supabase
    .from('qr_tokens')
    .select('*')
    .eq('session_id', session_id)
    .or(`token.eq.${tokenString},code.eq.${tokenString}`)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
};

// Cleanup routine (Required by server.js)
const cleanupOrphanedSessions = async () => {
  try {
    const { error } = await supabase
      .from('qr_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) console.error('[QR] Cleanup failed:', error.message);
    else console.log('[QR] Cleanup complete');
  } catch (e) {
    console.error('[QR] Cleanup error:', e);
  }
};

// Legacy method alias if needed
const createSession = createToken;
const getSessionByToken = findByToken;

module.exports = {
  createToken,
  getLatestToken,
  getLatestTokensForSession,
  verifyToken,
  findByToken,
  cleanupOrphanedSessions,
  createSession,
  getSessionByToken
};
