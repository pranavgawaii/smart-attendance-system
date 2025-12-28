const assessmentModel = require('../models/assessment.model');
const userModel = require('../models/user.model');
const auditStore = require('../utils/auditStore');
const PDFDocument = require('pdfkit');

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
        const { id, allocationId } = req.params;
        const { labId, seatNumber } = req.body;

        // 1. Fetch old state
        const oldAllocation = await assessmentModel.getAllocationById(allocationId);
        if (!oldAllocation) return res.status(404).json({ error: 'Allocation not found' });

        const oldLabId = oldAllocation.lab_id;
        const oldSeatNumber = oldAllocation.seat_number;

        // 2. Perform Update
        const updated = await assessmentModel.updateAllocation(allocationId, labId, seatNumber);

        // 3. Close Gap (Auto-Rearrange)
        try {
            await assessmentModel.closeAllocationGap(parseInt(id), parseInt(oldLabId), parseInt(oldSeatNumber), parseInt(allocationId));
        } catch (gapErr) {
            console.error('Gap closing failed (non-fatal)', gapErr);
        }

        // AUDIT LOG (Safe)
        try {
            auditStore.log({
                event_id: parseInt(id),
                action: 'SEAT_CHANGE',
                details: `Admin moved student from Lab ${oldLabId}/Seat ${oldSeatNumber} to Lab ${labId}/Seat ${seatNumber}`
            });
        } catch (logErr) {
            console.error('Audit log failed', logErr);
        }

        res.json(updated);
    } catch (error) {
        if (error.code === '23505') {
            res.status(409).json({ error: 'Seat already taken in this lab' });
        } else {
            console.error('Update allocation failed:', error);
            console.error('Params:', { id: req.params.id, allocationId: req.params.allocationId });
            console.error('Body:', req.body);
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    }
};

const exportAllocationsCsv = async (req, res) => {
    try {
        const { id } = req.params;
        const allocations = await assessmentModel.getAllocations(id);

        let csv = 'Enrollment No,Name,Lab,Seat Number\n';
        allocations.forEach(a => {
            csv += `${a.enrollment_no},${a.user_name},${a.lab_name},${a.seat_number}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`allocations-${id}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('CSV Export failed', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const exportAllocationsPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const { labId } = req.query; // Support filtering
        console.log(`Export PDF: id=${id}, labId=${labId} (Type: ${typeof labId})`);

        const allocations = await assessmentModel.getAllocations(id);
        const assessment = await assessmentModel.findById(id);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        // Rename file if specific lab
        const filename = labId ? `allocation-lab-${labId}.pdf` : `allocations-${id}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('MIT ADT University', { align: 'center' });
        doc.fontSize(14).text('Placement & Attendance Portal', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`Assessment: ${assessment.title}`, { align: 'center' });
        doc.fontSize(12).text(`Date: ${new Date(assessment.date).toDateString()}`, { align: 'center' });
        doc.moveDown();

        // Group by Lab
        const grouped = allocations.reduce((acc, curr) => {
            // Filter if labId is provided
            if (labId && curr.lab_id != labId) return acc;

            if (!acc[curr.lab_name]) acc[curr.lab_name] = [];
            acc[curr.lab_name].push(curr);
            return acc;
        }, {});

        Object.keys(grouped).forEach(labName => {
            doc.addPage();
            doc.fontSize(18).text(`Lab: ${labName}`, { underline: true });
            doc.moveDown();

            const items = grouped[labName];

            // Simple Table Header
            let y = doc.y;
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('Seat', 50, y);
            doc.text('Enrollment', 120, y);
            doc.text('Name', 250, y);
            doc.moveDown();
            doc.font('Helvetica');

            items.forEach(item => {
                y = doc.y;
                doc.text(item.seat_number.toString(), 50, y);
                doc.text(item.enrollment_no || '-', 120, y);
                doc.text(item.user_name, 250, y);
                doc.moveDown(0.5);
            });
        });

        doc.end();

    } catch (error) {
        console.error('PDF Export failed', error);
        res.status(500).end();
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
    updateAllocation,
    exportAllocationsCsv,
    exportAllocationsPdf
};
