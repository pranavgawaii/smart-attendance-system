const db = require('../config/db');

const logAttendance = async ({ user_id, event_id, qr_session_id, device_hash }) => {
  const query = `
    INSERT INTO attendance_logs (user_id, event_id, qr_session_id, device_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [user_id, event_id, qr_session_id, device_hash];
  const { rows } = await db.query(query, values);
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
      attendance_logs.scan_time
    FROM attendance_logs
    JOIN users ON attendance_logs.user_id = users.id
    WHERE attendance_logs.event_id = $1
    ORDER BY attendance_logs.id DESC
    LIMIT $2;
  `;
  const { rows } = await db.query(query, [event_id, limit]);
  return rows;
};

module.exports = {
  logAttendance,
  countByEvent,
  exportByEvent,
  getRecentByEvent,
};
