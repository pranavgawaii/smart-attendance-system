const { supabase } = require('../config/db');

// --- Drives ---

const createDrive = async (data) => {
    const { data: drive, error } = await supabase
        .from('placement_drives')
        .insert([{
            company_name: data.company_name,
            role: data.role,
            job_type: data.job_type,
            stipend_ctc: data.stipend_ctc,
            description: data.description,
            deadline: data.deadline,
            industry: data.industry,
            location: data.location,
            about_company: data.about_company,
            selection_process: data.selection_process,
            bond_details: data.bond_details,
            criteria_details: data.criteria_details
        }])
        .select()
        .single();

    if (error) throw error;
    return drive;
};

const getAllDrives = async () => {
    const { data, error } = await supabase
        .from('placement_drives')
        .select(`
            *,
            eligibility_rules (
                min_cgpa,
                allowed_branches,
                allowed_years
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten eligibility_rules if needed to match previous output
    return data.map(drive => ({
        ...drive,
        min_cgpa: drive.eligibility_rules?.[0]?.min_cgpa,
        allowed_branches: drive.eligibility_rules?.[0]?.allowed_branches,
        allowed_years: drive.eligibility_rules?.[0]?.allowed_years
    }));
};

const getDriveById = async (id) => {
    const { data, error } = await supabase
        .from('placement_drives')
        .select(`
            *,
            eligibility_rules (
                min_cgpa,
                allowed_branches,
                allowed_years
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return {
        ...data,
        min_cgpa: data.eligibility_rules?.[0]?.min_cgpa,
        allowed_branches: data.eligibility_rules?.[0]?.allowed_branches,
        allowed_years: data.eligibility_rules?.[0]?.allowed_years
    };
};

const deleteDrive = async (id) => {
    const { data, error } = await supabase
        .from('placement_drives')
        .delete()
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// --- Eligibility Rules ---

const setEligibilityRules = async (driveId, rules) => {
    const { data, error } = await supabase
        .from('eligibility_rules')
        .insert([{
            drive_id: driveId,
            min_cgpa: rules.min_cgpa || 0,
            allowed_branches: rules.allowed_branches || [],
            allowed_years: rules.allowed_years || []
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// --- Applications ---

const checkApplicationExists = async (driveId, studentId) => {
    const { data, error } = await supabase
        .from('drive_applications')
        .select('id')
        .eq('drive_id', driveId)
        .eq('student_id', studentId);

    if (error) throw error;
    return data.length > 0;
};

const applyToDrive = async (driveId, studentId) => {
    const { data, error } = await supabase
        .from('drive_applications')
        .insert([{
            drive_id: driveId,
            student_id: studentId,
            status: 'APPLIED'
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

const getStudentApplications = async (studentId) => {
    const { data, error } = await supabase
        .from('drive_applications')
        .select(`
            *,
            placement_drives (
                company_name,
                role
            )
        `)
        .eq('student_id', studentId)
        .order('applied_at', { ascending: false });

    if (error) throw error;

    // Flatten placement_drives to match previous output
    return data.map(app => ({
        ...app,
        company_name: app.placement_drives?.company_name,
        role: app.placement_drives?.role
    }));
};

const updateDrive = async (id, data) => {
    const { data: drive, error } = await supabase
        .from('placement_drives')
        .update({
            company_name: data.company_name,
            role: data.role,
            job_type: data.job_type,
            stipend_ctc: data.stipend_ctc,
            description: data.description,
            deadline: data.deadline,
            industry: data.industry,
            location: data.location,
            about_company: data.about_company,
            selection_process: data.selection_process,
            bond_details: data.bond_details,
            criteria_details: data.criteria_details
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return drive;
};

module.exports = {
    createDrive,
    updateDrive,
    getAllDrives,
    getDriveById,
    deleteDrive,
    setEligibilityRules,
    checkApplicationExists,
    applyToDrive,
    getStudentApplications
};
