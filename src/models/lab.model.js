const { supabase } = require('../config/db');

const createLab = async ({ name, total_seats }) => {
    if (!name || !total_seats) {
        throw new Error("Missing required fields: name, total_seats");
    }

    const { data, error } = await supabase
        .from('labs')
        .insert([{
            name,
            total_seats,
            status: 'active'
        }])
        .select()
        .single();

    if (error) {
        console.error("[LabModel] Create Error:", error.message);
        throw error;
    }
    return data;
};

const findAll = async () => {
    const { data, error } = await supabase
        .from('labs')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return data;
};

const updateLab = async (id, { name, total_seats, status }) => {
    const { data, error } = await supabase
        .from('labs')
        .update({ name, total_seats, status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

const findById = async (id) => {
    const { data, error } = await supabase
        .from('labs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data;
};

module.exports = {
    createLab,
    findAll,
    updateLab,
    findById
};
