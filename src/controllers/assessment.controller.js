const assessmentModel = require('../models/assessment.model');
const userModel = require('../models/user.model');
const attendanceModel = require('../models/attendance.model');

// Create Assessment
const createAssessment = async (req, res) => {
    try {
        const { title, description, date, start_time, end_time } = req.body;
        if (!title || !date || !start_time || !end_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Combine date and time to create full timestamps for DB
        // Frontend sends date="YYYY-MM-DD" and time="HH:mm"
        const fullStartTime = `${date}T${start_time}:00`;
        const fullEndTime = `${date}T${end_time}:00`;

        const assessment = await assessmentModel.create({
            title,
            description,
            date,
            start_time: fullStartTime,
            end_time: fullEndTime
        });
        res.status(201).json(assessment);
    } catch (error) {
        console.error('Error creating assessment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAssessments = async (req, res) => {
    try {
        const assessments = await assessmentModel.findAll();
        res.json(assessments);
    } catch (error) {
        console.error('Error fetching assessments:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAssessmentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const assessment = await assessmentModel.findById(id);
        if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

        const candidates = await assessmentModel.getEligibleCandidates(id);

        res.json({ ...assessment, candidates });
    } catch (error) {
        console.error('Error fetching assessment details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const addCandidates = async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds, sourceEventId } = req.body; // Expect explicit userIds OR eventId to fetch from

        let targetUserIds = userIds || [];

        if (sourceEventId) {
            // Fetch users who attended this event
            const logs = await attendanceModel.getEventLogs(sourceEventId); // Assuming we have or create this
            // We need a way to get user IDs from event logs. 
            // attendance.model.js might need a specific query for this or we reuse existing.
            // Let's assume logs contain user_id or we query attendance_logs directly here for simplicity if model lacks it.
            // Actually, best to fetch just IDs.
            // For now, let's assume client sends exact userIds after filtering on frontend OR 
            // we implement a dedicated "import from event" logic here.
            // Strategy: Client fetches event attendance, selects users, sends IDs. MUCH SAFER and FLEXIBLE.
        }

        if (targetUserIds.length === 0) {
            return res.status(400).json({ error: 'No users selected' });
        }

        const count = await assessmentModel.addEligible(id, targetUserIds);
        res.json({ message: `Added ${count} candidates` });

    } catch (error) {
        console.error('Error adding candidates:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const removeCandidate = async (req, res) => {
    try {
        const { id, userId } = req.params;
        await assessmentModel.removeEligible(id, userId);
        res.json({ message: 'Candidate removed' });
    } catch (error) {
        console.error('Error removing candidate:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- Allocation Logic ---

const labModel = require('../models/lab.model');

const generateAllocations = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get Eligible Candidates
        const candidates = await assessmentModel.getEligibleCandidates(id);
        if (candidates.length === 0) return res.status(400).json({ error: 'No candidates to allocate' });

        // 2. Get Active Labs
        const labs = await labModel.findAll();
        const activeLabs = labs.filter(l => l.status === 'active');
        if (activeLabs.length === 0) return res.status(400).json({ error: 'No active labs available' });

        // 3. Round Robin / Sequential Allocation
        let allocations = [];
        let currentLabIndex = 0;
        let currentSeat = 1;

        for (const candidate of candidates) {
            if (currentLabIndex >= activeLabs.length) {
                // Run out of space - stop but return what we have (or error)
                break;
            }

            const lab = activeLabs[currentLabIndex];

            allocations.push({
                assessment_id: parseInt(id),
                user_id: candidate.id,
                user_name: candidate.name,
                enrollment_no: candidate.enrollment_no,
                lab_id: lab.id,
                lab_name: lab.name,
                seat_number: currentSeat
            });

            currentSeat++;
            if (currentSeat > lab.total_seats) {
                currentLabIndex++;
                currentSeat = 1;
            }
        }

        if (allocations.length < candidates.length) {
            return res.json({
                warning: `Capacity insufficient! Allocated ${allocations.length} of ${candidates.length} students.`,
                allocations
            });
        }

        res.json({ allocations });

    } catch (error) {
        console.error('Allocation generation failed', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const confirmAllocations = async (req, res) => {
    try {
        const { id } = req.params;
        const { allocations } = req.body; // Expect array of { user_id, lab_id, seat_number }

        // Sanitize for DB (DB expects assessment_id, user_id, lab_id, seat_number)
        const dbPayload = allocations.map(a => ({
            assessment_id: parseInt(id),
            user_id: a.user_id,
            lab_id: a.lab_id,
            seat_number: a.seat_number
        }));

        await assessmentModel.deleteAllAllocations(id); // Clear old first
        const count = await assessmentModel.createAllocations(dbPayload);

        res.json({ message: `Successfully allocated seats for ${count} students` });

    } catch (error) {
        console.error('Confirm allocation failed', error);
        // Unique constraint violations will bubble up here
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

const getAllocations = async (req, res) => {
    try {
        const { id } = req.params;
        const allocations = await assessmentModel.getAllocations(id);
        res.json(allocations);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateAllocation = async (req, res) => {
    try {
        const { allocationId } = req.params;
        const { labId, seatNumber } = req.body;

        // TODO: Validate conflicts

        const updated = await assessmentModel.updateAllocation(allocationId, labId, seatNumber);
        res.json(updated);
    } catch (error) {
        if (error.code === '23505') {
            res.status(409).json({ error: 'Seat already taken in this lab' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

module.exports = {
    createAssessment,
    getAssessments,
    getAssessmentDetails,
    addCandidates,
    removeCandidate,
    generateAllocations,
    confirmAllocations,
    getAllocations,
    updateAllocation
};
