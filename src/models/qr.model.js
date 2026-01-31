const { supabase } = require('../config/db');

const createSession = async ({ event_id, token, expires_at }) => {
  const { data, error } = await supabase
    .from('qr_sessions')
    .insert([{
      event_id,
      token,
      expires_at
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const getLatestSession = async (event_id) => {
  const { data, error } = await supabase
    .from('qr_sessions')
    .select('*')
    .eq('event_id', event_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const findValidSession = async (token) => {
  const { data, error } = await supabase
    .from('qr_sessions')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  return data;
};

const verifyToken = async (event_id, token) => {
  try {
    const { data, error } = await supabase
      .from('qr_sessions')
      .select('id')
      .eq('token', token)
      .eq('event_id', event_id)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[QR Model] Error verifying token:', error);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
};

const getSessionByToken = async (event_id, token) => {
  const { data, error } = await supabase
    .from('qr_sessions')
    .select('*')
    .eq('event_id', event_id)
    .eq('token', token)
    .maybeSingle();

  if (error) return null;
  return data;
};

const cleanupOrphanedSessions = async () => {
  try {
    // In Supabase/PostgreSQL, we can do this with a filter on delete
    // However, Supabase doesn't support subqueries in delete directly via the client easily.
    // Given Supabase usually has Cascade deletes set up at the DB level, this might be redundant.
    // But to match behavior:
    const { data: validEventIds, error: eventError } = await supabase.from('events').select('id');
    if (eventError) throw eventError;

    const ids = validEventIds.map(e => e.id);

    const { data, error } = await supabase
      .from('qr_sessions')
      .delete()
      .not('event_id', 'in', `(${ids.join(',')})`)
      .select();

    if (error) throw error;

    if (data?.length > 0) {
      console.log(`[QR Model] 🧹 Cleaned up ${data.length} orphaned QR sessions.`);
    }
    return data?.length || 0;
  } catch (error) {
    console.error('[QR Model] Error cleaning up orphaned sessions:', error.message);
    return 0;
  }
};

module.exports = {
  createSession,
  getLatestSession,
  findValidSession,
  verifyToken,
  getSessionByToken,
  cleanupOrphanedSessions
};
