const db = require('../config/db');

const saveOtp = async (email, otpHash, expiresAt) => {
    const query = `
    INSERT INTO otp_tokens (email, otp_hash, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id;
  `;
    const values = [email, otpHash, expiresAt];
    const { rows } = await db.query(query, values);
    return rows[0];
};

const getLatestOtp = async (email) => {
    const query = `
    SELECT * FROM otp_tokens
    WHERE email = $1 AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
  `;
    const values = [email];
    const { rows } = await db.query(query, values);
    return rows[0];
};

const deleteOtps = async (email) => {
    const query = 'DELETE FROM otp_tokens WHERE email = $1';
    await db.query(query, [email]);
};

module.exports = {
    saveOtp,
    getLatestOtp,
    deleteOtps,
};
