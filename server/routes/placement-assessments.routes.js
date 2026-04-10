const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');
const { requireRole } = require('../middlewares/auth.middleware');

const ADMIN_ROLES = ['admin', 'super_admin', 'coordinator_admin'];

// Get all placement assessments
router.get('/', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('placement_assessments')
            .select(`
                *,
                student_count:allocations(count),
                lab_count:allocations(lab_id)
            `)
            .order('assessment_date', { ascending: false });

        if (error) throw error;

        // Process to get unique lab count
        const processed = (data || []).map(assessment => ({
            ...assessment,
            student_count: assessment.student_count?.[0]?.count || 0,
            lab_count: new Set(
                assessment.lab_count?.map(a => a.lab_id).filter(Boolean)
            ).size || 0
        }));

        res.json(processed);
    } catch (error) {
        console.error('Error fetching placement assessments:', error);
        res.status(500).json({ error: 'Failed to fetch placement assessments' });
    }
});

// Get single placement assessment
router.get('/:id', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('placement_assessments')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Assessment not found' });

        res.json(data);
    } catch (error) {
        console.error('Error fetching placement assessment:', error);
        res.status(500).json({ error: 'Failed to fetch placement assessment' });
    }
});

// Create placement assessment
router.post('/', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const {
            company_name,
            position,
            assessment_date,
            start_time,
            end_time,
            description,
            seating_mode = 'normal',
            status = 'active'
        } = req.body;

        // Only company_name is required
        if (!company_name) {
            return res.status(400).json({
                error: 'Company name is required'
            });
        }

        const { data, error } = await supabase
            .from('placement_assessments')
            .insert([{
                company_name,
                position: position || null,
                assessment_date: assessment_date || null,
                start_time: start_time || null,
                end_time: end_time || null,
                description: description || null,
                seating_mode,
                status,
                created_by: req.user.id
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating placement assessment:', error);
        res.status(500).json({ error: 'Failed to create placement assessment' });
    }
});

// Update placement assessment
router.put('/:id', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const updates = {};
        const allowedFields = [
            'company_name', 'position', 'assessment_date',
            'start_time', 'end_time', 'description',
            'seating_mode', 'status'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const { data, error } = await supabase
            .from('placement_assessments')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Assessment not found' });

        res.json(data);
    } catch (error) {
        console.error('Error updating placement assessment:', error);
        res.status(500).json({ error: 'Failed to update placement assessment' });
    }
});

// Delete placement assessment
router.delete('/:id', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const { error } = await supabase
            .from('placement_assessments')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Assessment deleted successfully' });
    } catch (error) {
        console.error('Error deleting placement assessment:', error);
        res.status(500).json({ error: 'Failed to delete placement assessment' });
    }
});

module.exports = router;
