const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');
const { requireRole } = require('../middlewares/auth.middleware');

const ADMIN_ROLES = ['admin', 'super_admin', 'coordinator_admin'];

// Get all labs
router.get('/', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('labs')
            .select('*')
            .order('lab_name', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).json({ error: 'Failed to fetch labs' });
    }
});

// Get enabled labs only
router.get('/enabled', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('labs')
            .select('*')
            .eq('status', 'enabled')
            .order('lab_name', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching enabled labs:', error);
        res.status(500).json({ error: 'Failed to fetch enabled labs' });
    }
});

// Get single lab
router.get('/:id', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('labs')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Lab not found' });

        res.json(data);
    } catch (error) {
        console.error('Error fetching lab:', error);
        res.status(500).json({ error: 'Failed to fetch lab' });
    }
});

// Create lab
router.post('/', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const { lab_name, capacity, status = 'enabled' } = req.body;

        if (!lab_name || !capacity) {
            return res.status(400).json({ error: 'Lab name and capacity are required' });
        }

        if (capacity <= 0) {
            return res.status(400).json({ error: 'Capacity must be greater than 0' });
        }

        const { data, error } = await supabase
            .from('labs')
            .insert([{ lab_name, capacity: parseInt(capacity), status }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'A lab with this name already exists' });
            }
            throw error;
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating lab:', error);
        res.status(500).json({ error: 'Failed to create lab' });
    }
});

// Update lab
router.put('/:id', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const { lab_name, capacity, status } = req.body;
        const updates = {};

        if (lab_name !== undefined) updates.lab_name = lab_name;
        if (capacity !== undefined) {
            if (capacity <= 0) {
                return res.status(400).json({ error: 'Capacity must be greater than 0' });
            }
            updates.capacity = parseInt(capacity);
        }
        if (status !== undefined) updates.status = status;

        const { data, error } = await supabase
            .from('labs')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'A lab with this name already exists' });
            }
            throw error;
        }

        if (!data) return res.status(404).json({ error: 'Lab not found' });

        res.json(data);
    } catch (error) {
        console.error('Error updating lab:', error);
        res.status(500).json({ error: 'Failed to update lab' });
    }
});

// Delete lab
router.delete('/:id', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const { error } = await supabase
            .from('labs')
            .delete()
            .eq('id', req.params.id);

        if (error) {
            if (error.code === '23503') {
                return res.status(400).json({ error: 'Cannot delete lab. It has existing allocations.' });
            }
            throw error;
        }

        res.json({ message: 'Lab deleted successfully' });
    } catch (error) {
        console.error('Error deleting lab:', error);
        res.status(500).json({ error: 'Failed to delete lab' });
    }
});

module.exports = router;
