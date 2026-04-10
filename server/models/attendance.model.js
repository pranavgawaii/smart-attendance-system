const { supabase } = require('../config/db');

// Log successful attendance
const logAttendance = async ({ session_id, student_email, student_name, enrollment_no, device_fingerprint, scan_method, user_id }) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .insert([{
      session_id,
      student_email,
      student_name,
      enrollment_no,
      device_fingerprint,
      scan_method,
      user_id
    }])
    .select()
    .single();

  if (error) {
    // Unique constraint violation (session_id + student_email) implies already present
    if (error.code === '23505') return null;
    throw error;
  }
  return data;
};

// Check if device was used for this session by another user
const checkDeviceUsed = async (session_id, device_fingerprint) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('student_email, user_id')
    .eq('session_id', session_id)
    .eq('device_fingerprint', device_fingerprint)
    .maybeSingle();

  if (error) throw error;
  return data; // Returns { student_email, user_id } or null
};

// Log a proxy attempt
const logProxyAttempt = async ({
  session_id,
  student_id = null,
  student_email,
  attempted_fingerprint,
  original_fingerprint,
  original_device = null,
  attempted_device = null,
  attempted_at = new Date()
}) => {
  const { data, error } = await supabase
    .from('proxy_attempts')
    .insert([{
      session_id,
      student_id,
      student_email,
      attempted_fingerprint,
      original_fingerprint,
      original_device,
      attempted_device,
      attempted_at
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findByUserAndEvent = async (user_id, session_id) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', user_id)
    .eq('session_id', session_id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const findBySessionAndStudent = async (session_id, student_id) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('session_id', session_id)
    .eq('student_id', student_id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const findBySessionAndDevice = async (session_id, device_fingerprint) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('session_id', session_id)
    .eq('device_fingerprint', device_fingerprint)
    .order('scanned_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const countByEvent = async (session_id) => {
  const { count, error } = await supabase
    .from('attendance_logs')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session_id);

  if (error) throw error;
  return count;
};

const getRecentByEvent = async (session_id, limit = 10) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('session_id', session_id)
    .order('scanned_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  // Map to consistent structure if needed, but schema changes make fields direct
  return data.map(log => ({
    name: log.student_name,
    enrollment_no: log.enrollment_no,
    scan_time: log.scanned_at,
    status: 'PRESENT'
  }));
};

const getProxyAttemptsByEvent = async (session_id) => {
  const { data, error } = await supabase
    .from('proxy_attempts')
    .select('*')
    .eq('session_id', session_id)
    .order('attempted_at', { ascending: false });

  if (error) throw error;

  // Need to fetch user details for display? 
  // The table has student_email. In a real app we might join user_profiles or store names in proxy table.
  // For now, assuming student_email is useful.
  return data.map(log => ({
    name: log.student_email, // Using email as name if name not stored
    enrollment_no: 'N/A',
    scan_time: log.attempted_at,
    device_hash: log.attempted_fingerprint
  }));
};

const findAllByEvent = async (session_id) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('session_id', session_id)
    .order('scanned_at', { ascending: false });

  if (error) throw error;
  return data;
};

const exportByEvent = async (session_id) => {
  // For export, return raw rows
  return await findAllByEvent(session_id);
};

module.exports = {
  logAttendance,
  checkDeviceUsed,
  logProxyAttempt,
  findByUserAndEvent,
  findBySessionAndStudent,
  findBySessionAndDevice,
  countByEvent,
  getRecentByEvent,
  getProxyAttemptsByEvent,
  findAllByEvent,
  exportByEvent
};
