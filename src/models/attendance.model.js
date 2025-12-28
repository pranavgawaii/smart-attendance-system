const db = require('../config/db');

const logAttendance = async ({ user_id, event_id, qr_session_id, device_hash, status = 'ENTRY' }) => {
  const query = `
    INSERT INTO attendance_logs (user_id, event_id, qr_session_id, device_hash, status)
    SELECT $1, $2, $3, $4, $5
    WHERE NOT EXISTS (
      SELECT 1 FROM attendance_logs WHERE user_id = $1 AND event_id = $2
    )
    RETURNING *;
  `;
  const values = [user_id, event_id, qr_session_id, device_hash, status];
  const { rows } = await db.query(query, values);
  return rows[0];
};

const checkDeviceUsed = async (event_id, device_hash) => {
  const query = 'SELECT user_id FROM attendance_logs WHERE event_id = $1 AND device_hash = $2 LIMIT 1';
  const { rows } = await db.query(query, [event_id, device_hash]);
  return rows.length > 0 ? rows[0].user_id : null;
};

const findByUserAndEvent = async (user_id, event_id) => {
  const query = 'SELECT * FROM attendance_logs WHERE user_id = $1 AND event_id = $2';
  const { rows } = await db.query(query, [user_id, event_id]);
  return rows[0];
};

const updateStatus = async (id, status) => {
  const query = 'UPDATE attendance_logs SET status = $1 WHERE id = $2 RETURNING *';
  const { rows } = await db.query(query, [status, id]);
  return rows[0];
};

const countByEvent = async (event_id) => {
  const query = 'SELECT COUNT(*) FROM attendance_logs WHERE event_id = $1';
  const { rows } = await db.query(query, [event_id]);
  return parseInt(rows[0].count);
};

const exportByEvent = async (event_id) => {
  const query = `
    SELECT 
      users.name, 
      users.email, 
      users.enrollment_no, 
      attendance_logs.scan_time, 
      attendance_logs.status
    FROM attendance_logs
    JOIN users ON attendance_logs.user_id = users.id
    WHERE attendance_logs.event_id = $1
    ORDER BY users.name ASC;
  `;
  const { rows } = await db.query(query, [event_id]);
  return rows;
};

const getRecentByEvent = async (event_id, limit = 15) => {
  const query = `
    SELECT 
      users.name,
      users.enrollment_no, 
      attendance_logs.scan_time,
      attendance_logs.status
    FROM attendance_logs
    JOIN users ON attendance_logs.user_id = users.id
    WHERE attendance_logs.event_id = $1
    ORDER BY attendance_logs.id DESC
    LIMIT $2;
  `;
  const { rows } = await db.query(query, [event_id, limit]);
  return rows;
};

const findAllByEvent = async (event_id) => {
  const query = `
    SELECT 
      attendance_logs.id as log_id,
      users.id as user_id,
      users.name, 
      users.email, 
      users.enrollment_no, 
      attendance_logs.scan_time, 
      attendance_logs.status,
      attendance_logs.device_hash
    FROM attendance_logs
    JOIN users ON attendance_logs.user_id = users.id
    WHERE attendance_logs.event_id = $1
    ORDER BY attendance_logs.scan_time DESC;
  `;
  const { rows } = await db.query(query, [event_id]);
  return rows;
};

const findByUser = async (user_id) => {
  const query = `
    SELECT 
      events.title as event_name,
      events.venue,
      attendance_logs.event_id,
      attendance_logs.scan_time,
      attendance_logs.status
    FROM attendance_logs
    JOIN events ON attendance_logs.event_id = events.id
    WHERE attendance_logs.user_id = $1
    ORDER BY attendance_logs.scan_time DESC;
  `;
  const { rows } = await db.query(query, [user_id]);
  return rows;
};

const findAllLogs = async () => {
  const query = `
      SELECT 
        attendance_logs.id as log_id,
        users.name as user_name,
        users.enrollment_no,
        events.name as event_name,
        events.id as event_id,
        attendance_logs.scan_time,
        attendance_logs.status,
        attendance_logs.device_hash
      FROM attendance_logs
      JOIN users ON attendance_logs.user_id = users.id
      JOIN events ON attendance_logs.event_id = events.id
      ORDER BY attendance_logs.scan_time DESC
      LIMIT 1000;
    `;
  const { rows } = await db.query(query);
  return rows;
};

module.exports = {
  logAttendance,
  checkDeviceUsed,
  findByUserAndEvent,
  updateStatus,
  countByEvent,
  exportByEvent,
  getRecentByEvent,
  findAllByEvent,
  findAllByEvent,
  findByUser,
  findAllLogs
};
