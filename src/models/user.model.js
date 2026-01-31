const { supabase } = require('../config/db');

const TABLE_NAME = 'user_profiles';

const createUser = async ({ name, email, enrollment_no, branch, role, academic_year }) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([{
      name,
      email,
      enrollment_no,
      branch,
      role,
      academic_year,
      user_status: 'active'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Handle "No rows returned"
  return data;
};

const updateUser = async (id, { name, enrollment_no, branch, academic_year }) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ name, enrollment_no, branch, academic_year })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findAll = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, name, email, enrollment_no, branch, role, academic_year, user_status, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const adminUpdate = async (id, { name, enrollment_no, branch, academic_year, user_status }) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ name, enrollment_no, branch, academic_year, user_status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findAdmins = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, name, email, role, user_status, created_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const toggleUserStatus = async (id, status) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ user_status: status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findByEnrollment = async (enrollment_no) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('enrollment_no', enrollment_no)
    .maybeSingle();

  if (error) throw error;
  return data;
};

module.exports = {
  createUser,
  findById,
  updateUser,
  findAll,
  adminUpdate,
  findAdmins,
  toggleUserStatus,
  findByEnrollment
};
