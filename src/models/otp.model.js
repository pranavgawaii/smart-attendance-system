const db = require('../config/db');

const saveOtp = async (email, otpHash, expiresAt, devOtp = null) => {
  const query = `
    INSERT INTO otp_tokens (email, otp_hash, expires_at, dev_otp)
    VALUES ($1, $2, $3, $4)
    RETURNING id;
  `;
  const values = [email, otpHash, expiresAt, devOtp];
  const { rows } = await db.query(query, values);
  return rows[0];
};

const getLatestOtp = async (email) => {
  const query = `
    SELECT * FROM otp_tokens
    WHERE email = $1 AND expires_at > $2
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const values = [email, new Date()]; // Use Node's time
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
