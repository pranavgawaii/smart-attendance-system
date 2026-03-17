const placementModel = require('../models/placement.model');
const userModel = require('../models/user.model');
const { sendApiError } = require('../utils/api-response');

// --- Admin Controllers ---

const createDrive = async (req, res) => {
    try {
        const { company_name, role, job_type, stipend_ctc, description, deadline, eligibility } = req.body;

        // 1. Basic Validation
        if (!company_name || !role || !job_type || !deadline) {
            return sendApiError(res, 400, 'PLACEMENT_DRIVE_VALIDATION_FAILED', 'Missing required fields');
        }

        // 2. Create Drive
        const drive = await placementModel.createDrive({
            company_name, role, job_type, stipend_ctc, description, deadline
        });

        // 3. Set Eligibility Rules (if provided, default otherwise)
        let rules = null;
        if (eligibility) {
            rules = await placementModel.setEligibilityRules(drive.id, eligibility);
        } else {
            // Create default permissive rule if none provided? Or enforce providing it?
            // For now, let's enforce providing them for safety, or pass defaults.
            rules = await placementModel.setEligibilityRules(drive.id, {
                min_cgpa: 0,
                allowed_branches: [], // empty = all? logic needs to clarify. Let's assume empty array means NO RESTRICTION check logic later
                allowed_years: []
            });
        }

        res.status(201).json({ message: 'Drive created successfully', drive, rules });

    } catch (err) {
        console.error('Create Drive Error:', err);
        return sendApiError(res, 500, 'PLACEMENT_DRIVE_CREATE_FAILED', 'Internal Server Error');
    }
};

// --- Student Controllers ---

const deleteDrive = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await placementModel.deleteDrive(id);

        if (!deleted) {
            return sendApiError(res, 404, 'PLACEMENT_DRIVE_NOT_FOUND', 'Drive not found');
        }

        res.json({ message: 'Drive deleted successfully', id });
    } catch (err) {
        console.error('Delete Drive Error:', err);
        return sendApiError(res, 500, 'PLACEMENT_DRIVE_DELETE_FAILED', 'Internal Server Error');
    }
};

// --- Student Controllers ---

const getAllDrives = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role ? req.user.role.toLowerCase() : '';

        const drives = await placementModel.getAllDrives();

        // If Admin, return raw drives
        if (userRole === 'admin' || userRole === 'super_admin') {
            return res.json(drives);
        }

        // If Student, compute eligibility
        const student = await userModel.findById(userId);
        if (!student) {
            console.error('Student profile not found for ID:', userId);
            return sendApiError(res, 404, 'STUDENT_PROFILE_NOT_FOUND', 'Student profile not found');
        }

        const drivesWithEligibility = drives.map(drive => {
            const isEligible = checkEligibility(student, drive);
            return { ...drive, isEligible };
        });

        res.json(drivesWithEligibility);

    } catch (err) {
        console.error('Get All Drives Error:', err);
        return sendApiError(res, 500, 'PLACEMENT_DRIVE_FETCH_FAILED', 'Internal Server Error');
    }
};

const applyToDrive = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { driveId } = req.body;

        if (!driveId) return sendApiError(res, 400, 'PLACEMENT_DRIVE_ID_REQUIRED', 'Drive ID is required');

        // 1. Check if already applied
        const alreadyApplied = await placementModel.checkApplicationExists(driveId, studentId);
        if (alreadyApplied) {
            return sendApiError(res, 400, 'PLACEMENT_ALREADY_APPLIED', 'You have already applied to this drive');
        }

        // 2. Fetch Drive & Rules to check eligibility
        const drive = await placementModel.getDriveById(driveId);
        if (!drive) return sendApiError(res, 404, 'PLACEMENT_DRIVE_NOT_FOUND', 'Drive not found');

        const student = await userModel.findById(studentId);

        // 3. Verify Eligibility
        if (!checkEligibility(student, drive)) {
            return sendApiError(res, 403, 'PLACEMENT_NOT_ELIGIBLE', 'You are not eligible for this drive');
        }

        // 4. Apply
        const application = await placementModel.applyToDrive(driveId, studentId);
        res.status(201).json({ message: 'Application submitted successfully', application });

    } catch (err) {
        console.error('Apply Drive Error:', err);
        return sendApiError(res, 500, 'PLACEMENT_APPLY_FAILED', 'Internal Server Error');
    }
};

// --- Helper Logic ---

const checkEligibility = (student, driveRules) => {
    // driveRules object contains merged fields from the join: min_cgpa, allowed_branches, allowed_years

    // 1. CGPA Check
    const studentCgpa = parseFloat(student.cgpa || 0);
    const minCgpa = parseFloat(driveRules.min_cgpa || 0);
    if (studentCgpa < minCgpa) return false;

    // 2. Branch Check
    // If allowed_branches is empty or null, assume OPEN TO ALL? 
    // Usually explicit is better. Let's say if it exists and has length, we check.
    if (driveRules.allowed_branches && driveRules.allowed_branches.length > 0) {
        if (!driveRules.allowed_branches.includes(student.branch)) {
            return false;
        }
    }

    // 3. Year Check
    if (driveRules.allowed_years && driveRules.allowed_years.length > 0) {
        // student.academic_year might be a string "2024" or int 2024. Safe cast.
        const studentYear = parseInt(student.academic_year);
        if (!driveRules.allowed_years.includes(studentYear)) {
            return false;
        }
    }

    return true;
};

const updateDrive = async (req, res) => {
    try {
        const { id } = req.params;
        const { company_name, role, job_type, stipend_ctc, description, deadline, eligibility } = req.body;

        // 1. Update Drive Details
        const updatedDrive = await placementModel.updateDrive(id, {
            company_name, role, job_type, stipend_ctc, description, deadline
        });

        if (!updatedDrive) {
            return sendApiError(res, 404, 'PLACEMENT_DRIVE_NOT_FOUND', 'Drive not found');
        }

        // 2. Update Eligibility (if provided)
        if (eligibility) {
            await placementModel.setEligibilityRules(id, eligibility);
        }

        res.json({ message: 'Drive updated successfully', drive: updatedDrive });
    } catch (err) {
        console.error('Update Drive Error:', err);
        return sendApiError(res, 500, 'PLACEMENT_DRIVE_UPDATE_FAILED', 'Internal Server Error');
    }
};

const getStudentApplications = async (req, res) => {
    try {
        const studentId = req.user.id;
        const applications = await placementModel.getStudentApplications(studentId);
        res.json(applications);
    } catch (err) {
        console.error('Get Student Applications Error:', err);
        return sendApiError(res, 500, 'PLACEMENT_APPLICATION_FETCH_FAILED', 'Internal Server Error');
    }
};

module.exports = {
    createDrive,
    updateDrive,
    deleteDrive,
    getAllDrives,
    applyToDrive,
    getStudentApplications
};
