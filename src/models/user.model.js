const db = require('../config/db');

const createUser = async ({ name, email, enrollment_no, branch, role }) => {
  const query = `
    INSERT INTO users (name, email, enrollment_no, branch, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [name, email, enrollment_no, branch, role];
  const { rows } = await db.query(query, values);
  return rows[0];
};



const findById = async (id) => {
  const query = 'SELECT * FROM users WHERE id = $1';
  const { rows } = await db.query(query, [id]);
  return rows[0];
};

const updateUser = async (id, { name, enrollment_no, branch }) => {
  const query = `
    UPDATE users 
    SET name = $1, enrollment_no = $2, branch = $3
    WHERE id = $4
    RETURNING *;
  `;
  const { rows } = await db.query(query, [name, enrollment_no, branch, id]);
  return rows[0];
};

module.exports = {
  createUser,
  findById,
  updateUser,
};
