const qrModel = require('../models/qr.model');

const createSession = async (req, res) => {
    try {
        const session = await qrModel.createSession(req.body);
        res.status(201).json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

module.exports = {
    createSession,
};
