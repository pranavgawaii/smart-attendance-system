const db = require('../config/db');

const createEvent = async ({ name, venue, start_time, end_time, qr_refresh_interval, created_by, entry_window_mins = 15, exit_window_mins = 15 }) => {
  const query = `
    INSERT INTO events (name, venue, start_time, end_time, qr_refresh_interval, created_by, entry_window_mins, exit_window_mins, attendance_phase)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CLOSED')
    RETURNING *;
  `;
  const values = [name, venue, start_time, end_time, qr_refresh_interval, created_by, entry_window_mins, exit_window_mins];
  const { rows } = await db.query(query, values);
  return rows[0];
};

const findById = async (id) => {
  const query = 'SELECT * FROM events WHERE id = $1';
  const { rows } = await db.query(query, [id]);
  return rows[0];
};

const updatePhase = async (id, phase) => {
  const query = 'UPDATE events SET attendance_phase = $1 WHERE id = $2 RETURNING *';
  const { rows } = await db.query(query, [phase, id]);
  return rows[0];
};

const updateSessionState = async (id, state) => {
  const query = 'UPDATE events SET session_state = $1 WHERE id = $2 RETURNING *';
  const { rows } = await db.query(query, [state, id]);
  return rows[0];
};

const findAll = async () => {
  const query = 'SELECT * FROM events ORDER BY created_at DESC';
  const { rows } = await db.query(query);
  return rows;
};

const updateEvent = async (id, { name, venue, qr_refresh_interval }) => {
  const query = `
    UPDATE events 
    SET name = $1, venue = $2, qr_refresh_interval = $3
    WHERE id = $4
    RETURNING *;
  `;
  const { rows } = await db.query(query, [name, venue, qr_refresh_interval, id]);
  return rows[0];
};

const deleteEvent = async (id) => {
  const query = 'DELETE FROM events WHERE id = $1 RETURNING id';
  const { rowCount } = await db.query(query, [id]);
  return rowCount > 0;
};

module.exports = {
  createEvent,
  findById,
  updatePhase,
  updateSessionState,
  findAll,
  updateEvent,
  deleteEvent
};
