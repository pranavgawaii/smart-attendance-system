const db = require('../config/db');

const createLab = async ({ name, total_seats }) => {
    if (!name || !total_seats) {
        throw new Error("Missing required fields: name, total_seats");
    }

    const query = `
    INSERT INTO labs (name, total_seats, status)
    VALUES ($1, $2, 'active')
    RETURNING *;
  `;

    try {
        const { rows } = await db.query(query, [name, total_seats]);
        return rows[0];
    } catch (error) {
        console.error("[LabModel] Create Error:", error.message);
        if (error.code === '42703') { // Undefined column
            throw new Error("Database schema mismatch: 'total_seats' column missing. Please run migration.");
        }
        throw error;
    }
};

const findAll = async () => {
    const query = 'SELECT * FROM labs ORDER BY name ASC';
    const { rows } = await db.query(query);
    return rows;
};

const updateLab = async (id, { name, total_seats, status }) => {
    const query = `
      UPDATE labs 
      SET name = $1, total_seats = $2, status = $3
      WHERE id = $4
      RETURNING *;
    `;
    const { rows } = await db.query(query, [name, total_seats, status, id]);
    return rows[0];
};

const findById = async (id) => {
    const query = 'SELECT * FROM labs WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
};

module.exports = {
    createLab,
    findAll,
    updateLab,
    findById
};
