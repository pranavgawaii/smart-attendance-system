const { supabase } = require('../config/db');

const create = async ({ title, description, date, start_time, end_time }) => {
    const { data, error } = await supabase
        .from('assessments')
        .insert([{
            title,
            description,
            date,
            start_time,
            end_time,
            status: 'DRAFT'
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

const findById = async (id) => {
    const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data;
};

const findAll = async () => {
    const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('date', { ascending: false })
        .order('start_time', { ascending: false });

    if (error) throw error;
    return data;
};

// --- Eligibility Methods ---

const addEligible = async (assessmentId, userIds) => {
    if (!userIds || userIds.length === 0) return 0;

    const inserts = userIds.map(userId => ({
        assessment_id: assessmentId,
        user_id: userId
    }));

    const { data, error } = await supabase
        .from('assessment_eligibility')
        .upsert(inserts, { onConflict: 'assessment_id,user_id' })
        .select('user_id');

    if (error) throw error;
    return data?.length || 0;
};

const removeEligible = async (assessmentId, userId) => {
    const { error } = await supabase
        .from('assessment_eligibility')
        .delete()
        .eq('assessment_id', assessmentId)
        .eq('user_id', userId);

    if (error) throw error;
};

const getEligibleCandidates = async (assessmentId) => {
    const { data, error } = await supabase
        .from('assessment_eligibility')
        .select(`
      user_id,
      user_profiles (
        id,
        name,
        email,
        enrollment_no,
        branch,
        academic_year
      )
    `)
        .eq('assessment_id', assessmentId);

    if (error) throw error;

    return data.map(item => ({
        ...item.user_profiles
    })).sort((a, b) => a.name.localeCompare(b.name));
};

// --- Allocation Methods ---

const createAllocations = async (allocations) => {
    if (!allocations || allocations.length === 0) return 0;

    const { data, error } = await supabase
        .from('assessment_allocations')
        .upsert(allocations, { onConflict: 'assessment_id,user_id' })
        .select('id');

    if (error) throw error;

    // Update assessment status to ALLOCATED
    const { error: updateError } = await supabase
        .from('assessments')
        .update({ status: 'ALLOCATED' })
        .eq('id', allocations[0].assessment_id);

    if (updateError) throw updateError;

    return data?.length || 0;
};

const getAllocations = async (assessmentId) => {
    const { data, error } = await supabase
        .from('assessment_allocations')
        .select(`
      id,
      seat_number,
      user_id,
      lab_id,
      user_profiles (
        name,
        enrollment_no
      ),
      labs (
        name
      )
    `)
        .eq('assessment_id', assessmentId);

    if (error) throw error;

    return data.map(item => ({
        id: item.id,
        seat_number: item.seat_number,
        user_id: item.user_id,
        user_name: item.user_profiles?.name,
        enrollment_no: item.user_profiles?.enrollment_no,
        lab_id: item.lab_id,
        lab_name: item.labs?.name
    })).sort((a, b) => {
        if (a.lab_name !== b.lab_name) return a.lab_name.localeCompare(b.lab_name);
        return a.seat_number - b.seat_number;
    });
};

const deleteAllAllocations = async (assessmentId) => {
    const { error } = await supabase
        .from('assessment_allocations')
        .delete()
        .eq('assessment_id', assessmentId);

    if (error) throw error;
};

const getAllocationById = async (allocationId) => {
    const { data, error } = await supabase
        .from('assessment_allocations')
        .select('*')
        .eq('id', allocationId)
        .maybeSingle();

    if (error) throw error;
    return data;
};

const closeAllocationGap = async (assessmentId, labId, removedSeatNumber, excludedAllocationId) => {
    // Supabase doesn't support complex reactive updates directly in one call like "seat_number = seat_number - 1"
    // unless we use a RPC. For small groups, we can fetch and update, but RPC is better.
    // However, I'll try to use the raw query feature if possible, but Supabase JS doesn't have it.
    // We'll use the 'rpc' method if the user has defined a function, otherwise we'll have to fetch and bulk update.
    // Sticking to standard client capabilities:

    const { data, error } = await supabase
        .from('assessment_allocations')
        .select('id, seat_number')
        .eq('assessment_id', assessmentId)
        .eq('lab_id', labId)
        .gt('seat_number', removedSeatNumber)
        .neq('id', excludedAllocationId);

    if (error) throw error;

    if (data?.length > 0) {
        const updates = data.map(item => ({
            id: item.id,
            seat_number: item.seat_number - 1,
            // We must include all required fields for upsert to work as an update if using onConflict
            // or just loop. Since it's infrequent, loop is safer for a model.
        }));

        for (const update of updates) {
            await supabase
                .from('assessment_allocations')
                .update({ seat_number: update.seat_number })
                .eq('id', update.id);
        }
    }
};

const updateAllocation = async (allocationId, labId, seatNumber) => {
    const { data, error } = await supabase
        .from('assessment_allocations')
        .update({ lab_id: labId, seat_number: seatNumber })
        .eq('id', allocationId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

const findActiveAssessmentForUser = async (userId) => {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('assessments')
        .select(`
      *,
      assessment_eligibility!inner(user_id)
    `)
        .eq('assessment_eligibility.user_id', userId)
        .or(`status.in.(LIVE,ALLOCATED),and(start_time.lte.${now},end_time.gte.${now})`)
        .limit(1)
        .maybeSingle();

    if (error) throw error;

    // Clean up the inner join artifact from the object
    if (data) delete data.assessment_eligibility;

    return data;
};

const findAllocationForUser = async (assessmentId, userId) => {
    const { data, error } = await supabase
        .from('assessment_allocations')
        .select(`
      seat_number,
      labs (
        name
      )
    `)
        .eq('assessment_id', assessmentId)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;

    return data ? {
        seat_number: data.seat_number,
        lab_name: data.labs?.name
    } : null;
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
    findAllocationForUser,
    getAllocationById,
    closeAllocationGap
};
