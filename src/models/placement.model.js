const db = require('../config/db');

// --- Drives ---

const createDrive = async (data) => {
    // data = { company_name, role, job_type, stipend_ctc, description, deadline }
    const query = `
        INSERT INTO placement_drives (company_name, role, job_type, stipend_ctc, description, deadline)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const values = [
        data.company_name,
        data.role,
        data.job_type,
        data.stipend_ctc,
        data.description,
        data.deadline
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
};

const getAllDrives = async () => {
    const query = `
        SELECT pd.*, 
               er.min_cgpa, er.allowed_branches, er.allowed_years
        FROM placement_drives pd
        LEFT JOIN eligibility_rules er ON pd.id = er.drive_id
        ORDER BY pd.created_at DESC;
    `;
    const { rows } = await db.query(query);
    return rows;
};

const getDriveById = async (id) => {
    const query = `
        SELECT pd.*, 
               er.min_cgpa, er.allowed_branches, er.allowed_years
        FROM placement_drives pd
        LEFT JOIN eligibility_rules er ON pd.id = er.drive_id
        WHERE pd.id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
};

// --- Eligibility Rules ---

const setEligibilityRules = async (driveId, rules) => {
    // rules = { min_cgpa, allowed_branches, allowed_years }
    const query = `
        INSERT INTO eligibility_rules (drive_id, min_cgpa, allowed_branches, allowed_years)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [
        driveId,
        rules.min_cgpa || 0,
        rules.allowed_branches || [], // DB expects array
        rules.allowed_years || []     // DB expects array
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
};

// --- Applications ---

const checkApplicationExists = async (driveId, studentId) => {
    const query = 'SELECT 1 FROM drive_applications WHERE drive_id = $1 AND student_id = $2';
    const { rows } = await db.query(query, [driveId, studentId]);
    return rows.length > 0;
};

const applyToDrive = async (driveId, studentId) => {
    const query = `
        INSERT INTO drive_applications (drive_id, student_id, status)
        VALUES ($1, $2, 'APPLIED')
        RETURNING *;
    `;
    const { rows } = await db.query(query, [driveId, studentId]);
    return rows[0];
};

const getStudentApplications = async (studentId) => {
    const query = `
        SELECT da.*, pd.company_name, pd.role
        FROM drive_applications da
        JOIN placement_drives pd ON da.drive_id = pd.id
        WHERE da.student_id = $1
        ORDER BY da.applied_at DESC;
    `;
    const { rows } = await db.query(query, [studentId]);
    return rows;
};

module.exports = {
    createDrive,
    getAllDrives,
    getDriveById,
    setEligibilityRules,
    checkApplicationExists,
    applyToDrive,
    getStudentApplications
};
