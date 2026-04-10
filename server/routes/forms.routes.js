const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middlewares/auth.middleware');
const { publicFormSubmitRateLimiter } = require('../middlewares/rate-limit.middleware');
const { sendApiError, sendApiSuccess } = require('../utils/api-response');

// Generate slug from title
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Math.random().toString(36).substring(2, 6);
};

const isPastDeadline = (deadlineValue) => {
    if (!deadlineValue) return false;
    const deadline = new Date(deadlineValue);
    if (Number.isNaN(deadline.getTime())) return false;
    return Date.now() > deadline.getTime();
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
        return sendApiError(res, 500, 'FORM_FETCH_FAILED', 'Failed to fetch forms');
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
        return sendApiError(res, 500, 'FORM_FETCH_FAILED', 'Failed to fetch form');
    }
});

// Create form (admin only)
router.post('/', authenticateToken, authorizeRole(['admin', 'super_admin', 'coordinator_admin']), async (req, res) => {
    try {
        const { title, description, status, fields, theme_settings, deadline } = req.body;

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
                deadline,
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
        return sendApiError(res, 500, 'FORM_CREATE_FAILED', 'Failed to create form');
    }
});

// Update form (admin only)
router.put('/:id', authenticateToken, authorizeRole(['admin', 'super_admin', 'coordinator_admin']), async (req, res) => {
    try {
        const { title, description, status, fields, theme_settings, deadline } = req.body;

        // Update form
        const { error: formError } = await supabase
            .from('forms')
            .update({ title, description, status, theme_settings, deadline })
            .eq('id', req.params.id);

        if (formError) throw formError;

        // Update fields:
        if (fields) {
            // 1. Get current IDs in database for this form
            const { data: currentFields, error: fetchError } = await supabase
                .from('form_fields')
                .select('id')
                .eq('form_id', req.params.id);

            if (fetchError) throw fetchError;
            const existingIds = (currentFields || []).map(f => f.id);

            // 2. Identify incoming IDs to preserve
            const incomingFieldIds = fields
                .filter(f => f.id && !String(f.id).startsWith('temp-'))
                .map(f => f.id);

            // 3. Delete only fields that were actually removed by the user
            const idsToDelete = existingIds.filter(id => !incomingFieldIds.includes(id));

            if (idsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('form_fields')
                    .delete()
                    .in('id', idsToDelete);

                if (deleteError) throw deleteError;
            }

            // 4. Split into existing (update) and new (insert)
            const existingFields = fields
                .filter(f => f.id && !String(f.id).startsWith('temp-'))
                .map((f, i) => ({
                    id: f.id,
                    form_id: req.params.id,
                    label: f.label,
                    field_type: f.field_type,
                    required: !!f.required,
                    options: f.options,
                    sort_order: i
                }));

            const newFields = fields
                .filter(f => !f.id || String(f.id).startsWith('temp-'))
                .map((f, i) => ({
                    form_id: req.params.id,
                    label: f.label,
                    field_type: f.field_type,
                    required: !!f.required,
                    options: f.options,
                    sort_order: i // Note: i is the index in the original 'fields' array
                }));

            // 5. Update existing
            if (existingFields.length > 0) {
                const { error: updateError } = await supabase
                    .from('form_fields')
                    .upsert(existingFields);
                if (updateError) throw updateError;
            }

            // 6. Insert new
            if (newFields.length > 0) {
                const { error: insertError } = await supabase
                    .from('form_fields')
                    .insert(newFields);
                if (insertError) throw insertError;
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating form:', err);
        return sendApiError(res, 500, 'FORM_UPDATE_FAILED', 'Failed to update form');
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
        return sendApiError(res, 500, 'FORM_STATUS_UPDATE_FAILED', 'Failed to update status');
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
        return sendApiError(res, 500, 'FORM_RESPONSE_FETCH_FAILED', 'Failed to fetch responses');
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
        return sendApiError(res, 500, 'FORM_RESPONSE_UPDATE_FAILED', 'Failed to update response');
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
            return sendApiError(res, 404, 'FORM_NOT_FOUND', 'Form not found');
        }

        if (isPastDeadline(form.deadline)) {
            return sendApiError(
                res,
                410,
                'FORM_DEADLINE_PASSED',
                'Form deadline has passed',
                { deadline: form.deadline }
            );
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
        return sendApiError(res, 500, 'FORM_FETCH_FAILED', 'Failed to fetch form');
    }
});

// PUBLIC: Submit response (no auth)
router.post('/public/:slug/submit', publicFormSubmitRateLimiter, async (req, res) => {
    try {
        const { answers } = req.body;
        if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
            return sendApiError(res, 400, 'FORM_VALIDATION_FAILED', 'Invalid answers payload');
        }

        // Get form by slug
        const { data: form, error: formError } = await supabase
            .from('forms')
            .select('id, title, description, theme_settings, deadline, status, is_public')
            .eq('slug', req.params.slug)
            .eq('status', 'active')
            .eq('is_public', true)
            .single();

        if (formError || !form) {
            return sendApiError(res, 404, 'FORM_NOT_FOUND', 'Form not found or closed');
        }

        if (isPastDeadline(form.deadline)) {
            return sendApiError(
                res,
                410,
                'FORM_DEADLINE_PASSED',
                'Form deadline has passed',
                { deadline: form.deadline }
            );
        }

        const { data: fields, error: fieldsError } = await supabase
            .from('form_fields')
            .select('id, required')
            .eq('form_id', form.id);

        if (fieldsError) throw fieldsError;

        const missingRequiredFields = (fields || [])
            .filter((field) => field.required)
            .map((field) => field.id)
            .filter((fieldId) => {
                const value = answers[fieldId];
                return value === null || value === undefined || String(value).trim() === '';
            });

        if (missingRequiredFields.length > 0) {
            return sendApiError(
                res,
                400,
                'FORM_VALIDATION_FAILED',
                'Required fields are missing',
                { missing_field_ids: missingRequiredFields }
            );
        }

        // Insert response
        const { error } = await supabase
            .from('form_responses')
            .insert({
                form_id: form.id,
                answers
            });

        if (error) throw error;
        return sendApiSuccess(res, 201, { message: 'Response submitted successfully' });
    } catch (err) {
        console.error('Error submitting response:', err);
        return sendApiError(res, 500, 'FORM_SUBMIT_FAILED', 'Failed to submit response');
    }
});

module.exports = router;
