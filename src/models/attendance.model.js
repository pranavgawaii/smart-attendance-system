const { supabase } = require('../config/db');

const logAttendance = async ({ user_id, event_id, qr_session_id, device_hash, status = 'ENTRY' }) => {
  // Use a transaction-like approach or just a check-then-insert since Supabase insert with upsert/constraints is different
  // The original SQL used "INSERT ... WHERE NOT EXISTS"

  // 1. Check if already exists
  const { data: existing, error: checkError } = await supabase
    .from('attendance_logs')
    .select('id')
    .eq('user_id', user_id)
    .eq('event_id', event_id)
    .maybeSingle();

  if (checkError) throw checkError;
  if (existing) return null; // Already logged

  // 2. Insert
  const { data, error } = await supabase
    .from('attendance_logs')
    .insert([{
      user_id,
      event_id,
      qr_session_id,
      device_hash,
      status
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const checkDeviceUsed = async (event_id, device_hash) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('user_id')
    .eq('event_id', event_id)
    .eq('device_hash', device_hash)
    .maybeSingle();

  if (error) throw error;
  return data ? data.user_id : null;
};

const findByUserAndEvent = async (user_id, event_id) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', user_id)
    .eq('event_id', event_id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const updateStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const countByEvent = async (event_id) => {
  const { count, error } = await supabase
    .from('attendance_logs')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event_id);

  if (error) throw error;
  return count;
};

const exportByEvent = async (event_id) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select(`
      scan_time,
      status,
      user_profiles (
        name,
        email,
        enrollment_no
      )
    `)
    .eq('event_id', event_id)
    .order('scan_time', { ascending: true }); // Previous query ordered by users.name, but Supabase order on joined tables is restricted.

  if (error) throw error;

  return data.map(log => ({
    name: log.user_profiles?.name,
    email: log.user_profiles?.email,
    enrollment_no: log.user_profiles?.enrollment_no,
    scan_time: log.scan_time,
    status: log.status
  }));
};

const getRecentByEvent = async (event_id, limit = 15) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select(`
      scan_time,
      status,
      user_profiles (
        name,
        enrollment_no
      )
    `)
    .eq('event_id', event_id)
    .order('id', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map(log => ({
    name: log.user_profiles?.name,
    enrollment_no: log.user_profiles?.enrollment_no,
    scan_time: log.scan_time,
    status: log.status
  }));
};

const findAllByEvent = async (event_id) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select(`
      id,
      user_id,
      scan_time,
      status,
      device_hash,
      user_profiles (
        name,
        email,
        enrollment_no
      )
    `)
    .eq('event_id', event_id)
    .order('scan_time', { ascending: false });

  if (error) throw error;

  return data.map(log => ({
    log_id: log.id,
    user_id: log.user_id,
    name: log.user_profiles?.name,
    email: log.user_profiles?.email,
    enrollment_no: log.user_profiles?.enrollment_no,
    scan_time: log.scan_time,
    status: log.status,
    device_hash: log.device_hash
  }));
};

const findByUser = async (user_id) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select(`
      event_id,
      scan_time,
      status,
      events (
        name,
        venue
      )
    `)
    .eq('user_id', user_id)
    .order('scan_time', { ascending: false });

  if (error) throw error;

  return data.map(log => ({
    event_name: log.events?.name,
    venue: log.events?.venue,
    event_id: log.event_id,
    scan_time: log.scan_time,
    status: log.status
  }));
};

const findAllLogs = async () => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select(`
      id,
      event_id,
      scan_time,
      status,
      device_hash,
      user_profiles (
        name,
        enrollment_no
      ),
      events (
        name
      )
    `)
    .order('scan_time', { ascending: false })
    .limit(1000);

  if (error) throw error;

  return data.map(log => ({
    log_id: log.id,
    user_name: log.user_profiles?.name,
    enrollment_no: log.user_profiles?.enrollment_no,
    event_name: log.events?.name,
    event_id: log.event_id,
    scan_time: log.scan_time,
    status: log.status,
    device_hash: log.device_hash
  }));
};

const getProxyAttemptsByEvent = async (event_id) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select(`
      scan_time,
      device_hash,
      user_profiles (
        name,
        enrollment_no
      )
    `)
    .eq('event_id', event_id)
    .eq('status', 'PROXY_REJECTED')
    .order('scan_time', { ascending: false });

  if (error) throw error;

  return data.map(log => ({
    name: log.user_profiles?.name,
    enrollment_no: log.user_profiles?.enrollment_no,
    scan_time: log.scan_time,
    device_hash: log.device_hash
  }));
};

module.exports = {
  logAttendance,
  checkDeviceUsed,
  findByUserAndEvent,
  updateStatus,
  countByEvent,
  exportByEvent,
  getRecentByEvent,
  getProxyAttemptsByEvent,
  findAllByEvent,
  findByUser,
  findAllLogs
};
