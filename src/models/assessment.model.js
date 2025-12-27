const db = require('../config/db');

const create = async ({ title, description, date, start_time, end_time }) => {
    const query = `
    INSERT INTO assessments (title, description, date, start_time, end_time, status)
    VALUES ($1, $2, $3, $4, $5, 'DRAFT')
    RETURNING *;
  `;
    const { rows } = await db.query(query, [title, description, date, start_time, end_time]);
    return rows[0];
};

const findById = async (id) => {
    const query = 'SELECT * FROM assessments WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
};

const findAll = async () => {
    const query = 'SELECT * FROM assessments ORDER BY date DESC, start_time DESC';
    const { rows } = await db.query(query);
    return rows;
};

// --- Eligibility Methods ---

const addEligible = async (assessmentId, userIds) => {
    // Bulk Insert ignoring duplicates
    if (!userIds || userIds.length === 0) return 0;

    // Use a transaction or simpler, just loop insert or UNNEST if performant enough.
    // For simplicity with pg library:
    // Generate VALUES ($1, $2), ($1, $3)...
    const placeholders = userIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    const query = `
        INSERT INTO assessment_eligibility (assessment_id, user_id)
        VALUES ${placeholders}
        ON CONFLICT (assessment_id, user_id) DO NOTHING
        RETURNING user_id;
    `;
    const { rowCount } = await db.query(query, [assessmentId, ...userIds]);
    return rowCount;
};

const removeEligible = async (assessmentId, userId) => {
    const query = 'DELETE FROM assessment_eligibility WHERE assessment_id = $1 AND user_id = $2';
    await db.query(query, [assessmentId, userId]);
};

const getEligibleCandidates = async (assessmentId) => {
    const query = `
        SELECT u.id, u.name, u.email, u.enrollment_no, u.branch, u.academic_year
        FROM users u
        JOIN assessment_eligibility ae ON u.id = ae.user_id
        WHERE ae.assessment_id = $1
        ORDER BY u.name ASC;
    `;
    const { rows } = await db.query(query, [assessmentId]);
    return rows;
};

// --- Allocation Methods ---

const createAllocations = async (allocations) => {
    if (!allocations || allocations.length === 0) return 0;

    // allocations = [{ assessment_id, user_id, lab_id, seat_number }]
    // Construct bulk insert
    const values = allocations.map((_, i) => {
        const offset = i * 4;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
    }).join(', ');

    const params = [];
    allocations.forEach(a => {
        params.push(a.assessment_id, a.user_id, a.lab_id, a.seat_number);
    });

    const query = `
        INSERT INTO assessment_allocations (assessment_id, user_id, lab_id, seat_number)
        VALUES ${values}
        ON CONFLICT (assessment_id, user_id) DO UPDATE SET
            lab_id = EXCLUDED.lab_id,
            seat_number = EXCLUDED.seat_number
        RETURNING id;
    `;

    const { rowCount } = await db.query(query, params);

    // Update status to ALLOCATED
    if (allocations.length > 0) {
        await db.query('UPDATE assessments SET status = $1 WHERE id = $2', ['ALLOCATED', allocations[0].assessment_id]);
    }

    return rowCount;
};

const getAllocations = async (assessmentId) => {
    const query = `
        SELECT aa.id, aa.seat_number, 
               u.id as user_id, u.name as user_name, u.enrollment_no, 
               l.id as lab_id, l.name as lab_name
        FROM assessment_allocations aa
        JOIN users u ON aa.user_id = u.id
        JOIN labs l ON aa.lab_id = l.id
        WHERE aa.assessment_id = $1
        ORDER BY l.name ASC, aa.seat_number ASC;
    `;
    const { rows } = await db.query(query, [assessmentId]);
    return rows;
};

const deleteAllAllocations = async (assessmentId) => {
    await db.query('DELETE FROM assessment_allocations WHERE assessment_id = $1', [assessmentId]);
};

const updateAllocation = async (allocationId, labId, seatNumber) => {
    const query = `
        UPDATE assessment_allocations
        SET lab_id = $1, seat_number = $2
        WHERE id = $3
        RETURNING *;
    `;
    const { rows } = await db.query(query, [labId, seatNumber, allocationId]);
    return rows[0];
};

const findActiveAssessmentForUser = async (userId) => {
    // Find an assessment that is EITHER active manually (status='LIVE') OR scheduled for now
    // AND the user is eligible for it.
    // FIX: Use LOCALTIMESTAMP to compare with timestamp columns (start_time/end_time)
    const query = `
        SELECT a.* 
        FROM assessments a
        JOIN assessment_eligibility ae ON a.id = ae.assessment_id
        WHERE ae.user_id = $1
        AND (
            a.status IN ('LIVE', 'ALLOCATED') 
            OR (
                a.start_time <= LOCALTIMESTAMP 
                AND a.end_time >= LOCALTIMESTAMP
            )
        )
        LIMIT 1;
    `;
    const { rows } = await db.query(query, [userId]);
    return rows[0];
};

const findAllocationForUser = async (assessmentId, userId) => {
    const query = `
        SELECT aa.seat_number, l.name as lab_name
        FROM assessment_allocations aa
        JOIN labs l ON aa.lab_id = l.id
        WHERE aa.assessment_id = $1 AND aa.user_id = $2;
    `;
    const { rows } = await db.query(query, [assessmentId, userId]);
    return rows[0];
};

module.exports = {
    create,
    findById,
    findAll,
    addEligible,
    removeEligible,
    getEligibleCandidates,
    createAllocations,
    getAllocations,
    deleteAllAllocations,
    updateAllocation,
    findActiveAssessmentForUser,
    findAllocationForUser
};
