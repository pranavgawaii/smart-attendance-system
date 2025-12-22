const db = require('../config/db');

const createEvent = async ({ name, venue, start_time, end_time, qr_refresh_interval, created_by }) => {
  const query = `
    INSERT INTO events (name, venue, start_time, end_time, qr_refresh_interval, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [name, venue, start_time, end_time, qr_refresh_interval, created_by];
  const { rows } = await db.query(query, values);
  return rows[0];
};

const findById = async (id) => {
  const query = 'SELECT * FROM events WHERE id = $1';
  const { rows } = await db.query(query, [id]);
  return rows[0];
};

const findAll = async () => {
  const query = 'SELECT * FROM events ORDER BY created_at DESC';
  const { rows } = await db.query(query);
  return rows;
};

module.exports = {
  createEvent,
  findById,
  findAll,
};
