const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');
const { requireRole, requireSelfOrRole } = require('../middlewares/auth.middleware');

const ADMIN_ROLES = ['admin', 'super_admin', 'coordinator_admin'];

// Create allocations (allocation algorithm)
router.post('/create', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const { assessment_id, students, labs, seating_mode } = req.body;

        if (!assessment_id || !students || !labs || students.length === 0 || labs.length === 0) {
            return res.status(400).json({
                error: 'Assessment ID, students, and labs are required'
            });
        }

        // Calculate effective capacity per lab
        const getEffectiveCapacity = (capacity) => {
            switch (seating_mode) {
                case 'alternate': return Math.floor(capacity / 2);
                case 'distanced': return Math.floor(capacity / 3);
                default: return capacity;
            }
        };

        // Calculate total capacity
        const totalCapacity = labs.reduce((sum, lab) => sum + getEffectiveCapacity(lab.capacity), 0);

        if (totalCapacity < students.length) {
            return res.status(400).json({
                error: 'Insufficient lab capacity for all students'
            });
        }

        // Distribute students across labs
        const allocations = [];
        let studentIndex = 0;

        for (const lab of labs) {
            const effectiveCapacity = getEffectiveCapacity(lab.capacity);
            const studentsPerLab = Math.ceil((students.length - studentIndex) / (labs.length - labs.indexOf(lab)));
            const studentsForThisLab = Math.min(studentsPerLab, effectiveCapacity, students.length - studentIndex);

            // Generate seat numbers based on seating mode
            const getSeatNumber = (index) => {
                switch (seating_mode) {
                    case 'alternate': return (index * 2) + 1; // 1, 3, 5, 7...
                    case 'distanced': return (index * 3) + 1; // 1, 4, 7, 10...
                    default: return index + 1; // 1, 2, 3, 4...
                }
            };

            for (let i = 0; i < studentsForThisLab; i++) {
                if (studentIndex >= students.length) break;

                const student = students[studentIndex];
                const student_name = student.name || student.full_name || 'N/A';
                const enrollment_no = student.enrollment_no || 'N/A';

                allocations.push({
                    placement_assessment_id: assessment_id,
                    student_id: student.id || null,
                    student_name: student_name,
                    enrollment_no: enrollment_no,
                    lab_id: lab.id,
                    seat_number: getSeatNumber(i)
                });

                studentIndex++;
            }
        }

        // Insert allocations
        const { data, error } = await supabase
            .from('allocations')
            .insert(allocations)
            .select();

        if (error) throw error;

        res.status(201).json({
            message: 'Allocations created successfully',
            count: allocations.length,
            allocations: data
        });

    } catch (error) {
        console.error('Error creating allocations:', error);
        res.status(500).json({ error: 'Failed to create allocations' });
    }
});

// Get allocations for an assessment
router.get('/assessment/:assessmentId', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('allocations')
            .select(`
                *,
                student:user_profiles(name, enrollment_no),
                lab:labs(lab_name, capacity),
                placement_assessment:placement_assessments(company_name, assessment_date)
            `)
            .eq('placement_assessment_id', req.params.assessmentId)
            .order('seat_number', { ascending: true });

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error('Error fetching allocations:', error);
        res.status(500).json({ error: 'Failed to fetch allocations' });
    }
});

// Get allocation for a student
router.get('/student/:studentId', requireSelfOrRole({ param: 'studentId', roles: ADMIN_ROLES }), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('allocations')
            .select(`
                *,
                lab:labs(lab_name, capacity),
                placement_assessment:placement_assessments(
                    id,
                    company_name,
                    position,
                    assessment_date,
                    start_time,
                    end_time,
                    description
                )
            `)
            .eq('student_id', req.params.studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Client-side filter for future/today assessments and sort by date
        const today = new Date().toISOString().split('T')[0];
        const filtered = (data || [])
            .filter(a => a.placement_assessment?.assessment_date >= today)
            .sort((a, b) => {
                const dateA = a.placement_assessment?.assessment_date || '';
                const dateB = b.placement_assessment?.assessment_date || '';
                return dateA.localeCompare(dateB);
            });

        res.json(filtered);
    } catch (error) {
        console.error('Error fetching student allocation:', error);
        res.status(500).json({ error: 'Failed to fetch student allocation' });
    }
});

// Delete allocation
router.delete('/:id', requireRole(ADMIN_ROLES), async (req, res) => {
    try {
        const { error } = await supabase
            .from('allocations')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Allocation deleted successfully' });
    } catch (error) {
        console.error('Error deleting allocation:', error);
        res.status(500).json({ error: 'Failed to delete allocation' });
    }
});

module.exports = router;
