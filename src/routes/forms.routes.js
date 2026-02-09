const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middlewares/auth.middleware');

// Generate slug from title
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Math.random().toString(36).substring(2, 6);
};

// Get all forms (admin only)
router.get('/', authenticateToken, authorizeRole(['admin', 'super_admin', 'coordinator_admin']), async (req, res) => {
    try {
        const { data: forms, error } = await supabase
            .from('forms')
            .select(`*, form_responses(count)`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(forms);
    } catch (err) {
        console.error('Error fetching forms:', err);
        res.status(500).json({ error: 'Failed to fetch forms' });
    }
});

// Get single form with fields (admin only)
router.get('/:id', authenticateToken, authorizeRole(['admin', 'super_admin', 'coordinator_admin']), async (req, res) => {
    try {
        const { data: form, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (formError) throw formError;

        const { data: fields, error: fieldsError } = await supabase
            .from('form_fields')
            .select('*')
            .eq('form_id', req.params.id)
            .order('sort_order', { ascending: true });

        if (fieldsError) throw fieldsError;

        res.json({ form, fields });
    } catch (err) {
        console.error('Error fetching form:', err);
        res.status(500).json({ error: 'Failed to fetch form' });
    }
});

// Create form (admin only)
router.post('/', authenticateToken, authorizeRole(['admin', 'super_admin', 'coordinator_admin']), async (req, res) => {
    try {
        const { title, description, status, fields, theme_settings } = req.body;

        // Create form
        const { data: form, error: formError } = await supabase
            .from('forms')
            .insert({
                title,
                description,
                slug: generateSlug(title),
                status: status || 'draft',
                is_public: true,
                theme_settings: theme_settings || { primaryColor: '#6366f1', backgroundColor: '#f8fafc' },
                created_by: req.user.id
            })
            .select()
            .single();

        if (formError) throw formError;

        // Create fields
        if (fields && fields.length > 0) {
            const fieldsToInsert = fields.map((f, i) => ({
                form_id: form.id,
                label: f.label,
                field_type: f.field_type,
                required: f.required,
                options: f.options,
                sort_order: i
            }));

            const { error: fieldsError } = await supabase
                .from('form_fields')
                .insert(fieldsToInsert);

            if (fieldsError) throw fieldsError;
        }

        res.status(201).json(form);
    } catch (err) {
        console.error('Error creating form:', err);
        res.status(500).json({ error: 'Failed to create form' });
    }
});

// Update form (admin only)
router.put('/:id', authenticateToken, authorizeRole(['admin', 'super_admin', 'coordinator_admin']), async (req, res) => {
    try {
        const { title, description, status, fields, theme_settings } = req.body;

        // Update form
        const { error: formError } = await supabase
            .from('forms')
            .update({ title, description, status, theme_settings })
            .eq('id', req.params.id);

        if (formError) throw formError;

        // Delete old fields and insert new ones
        await supabase.from('form_fields').delete().eq('form_id', req.params.id);

        if (fields && fields.length > 0) {
            const fieldsToInsert = fields.map((f, i) => ({
                form_id: req.params.id,
                label: f.label,
                field_type: f.field_type,
                required: f.required,
                options: f.options,
                sort_order: i
            }));

            const { error: fieldsError } = await supabase
                .from('form_fields')
                .insert(fieldsToInsert);

            if (fieldsError) throw fieldsError;
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating form:', err);
        res.status(500).json({ error: 'Failed to update form' });
    }
});

// Toggle form status (admin only)
router.patch('/:id/status', authenticateToken, authorizeRole(['admin', 'super_admin', 'coordinator_admin']), async (req, res) => {
    try {
        const { status } = req.body;

        const { error } = await supabase
            .from('forms')
            .update({ status })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating status:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Get form responses (admin only)
router.get('/:id/responses', authenticateToken, authorizeRole(['admin', 'super_admin', 'coordinator_admin']), async (req, res) => {
    try {
        const { data: responses, error } = await supabase
            .from('form_responses')
            .select('*')
            .eq('form_id', req.params.id)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        res.json(responses);
    } catch (err) {
        console.error('Error fetching responses:', err);
        res.status(500).json({ error: 'Failed to fetch responses' });
    }
});

// Update response status/notes (admin only)
router.patch('/responses/:id', authenticateToken, authorizeRole(['admin', 'super_admin', 'coordinator_admin']), async (req, res) => {
    try {
        const { status, notes } = req.body;

        const { error } = await supabase
            .from('form_responses')
            .update({ status, notes })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating response:', err);
        res.status(500).json({ error: 'Failed to update response' });
    }
});

// PUBLIC: Get form by slug (no auth)
router.get('/public/:slug', async (req, res) => {
    try {
        const { data: form, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('slug', req.params.slug)
            .eq('status', 'active')
            .eq('is_public', true)
            .single();

        if (formError || !form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        const { data: fields, error: fieldsError } = await supabase
            .from('form_fields')
            .select('*')
            .eq('form_id', form.id)
            .order('sort_order', { ascending: true });

        if (fieldsError) throw fieldsError;

        res.json({ form, fields });
    } catch (err) {
        console.error('Error fetching public form:', err);
        res.status(500).json({ error: 'Failed to fetch form' });
    }
});

// PUBLIC: Submit response (no auth)
router.post('/public/:slug/submit', async (req, res) => {
    try {
        const { answers } = req.body;

        // Get form by slug
        const { data: form, error: formError } = await supabase
            .from('forms')
            .select('id')
            .eq('slug', req.params.slug)
            .eq('status', 'active')
            .eq('is_public', true)
            .single();

        if (formError || !form) {
            return res.status(404).json({ error: 'Form not found or closed' });
        }

        // Insert response
        const { error } = await supabase
            .from('form_responses')
            .insert({
                form_id: form.id,
                answers
            });

        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Error submitting response:', err);
        res.status(500).json({ error: 'Failed to submit response' });
    }
});

module.exports = router;
