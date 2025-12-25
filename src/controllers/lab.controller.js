const labModel = require('../models/lab.model');

const createLab = async (req, res) => {
    try {
        const { name, total_seats } = req.body;
        if (!name || !total_seats) {
            return res.status(400).json({ error: 'Name and Total Seats are required' });
        }

        // Ensure name is unique handled by DB constraint, but let's handle error gracefully
        try {
            const lab = await labModel.createLab({ name, total_seats });
            res.status(201).json(lab);
        } catch (err) {
            if (err.code === '23505') { // Unique constraint violation
                return res.status(409).json({ error: 'Lab name already exists' });
            }
            throw err;
        }
    } catch (error) {
        console.error('Error creating lab:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAllLabs = async (req, res) => {
    try {
        const labs = await labModel.findAll();
        res.json(labs);
    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateLab = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, total_seats, status } = req.body;

        const updatedLab = await labModel.updateLab(id, { name, total_seats, status });
        if (!updatedLab) return res.status(404).json({ error: 'Lab not found' });

        res.json(updatedLab);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Lab name already exists' });
        }
        console.error('Error updating lab:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    createLab,
    getAllLabs,
    updateLab
};
