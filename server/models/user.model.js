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

const findAll = async ({ page, limit, role, q } = {}) => {
  const hasPagination = Number.isFinite(Number(page)) || Number.isFinite(Number(limit));
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);

  let query = supabase
    .from(TABLE_NAME)
    .select('id, name, email, enrollment_no, branch, role, academic_year, user_status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (role) {
    query = query.eq('role', role);
  }

  if (q) {
    const escaped = String(q).replace(/%/g, '\\%').replace(/,/g, '\\,');
    query = query.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%,enrollment_no.ilike.%${escaped}%`);
  }

  if (hasPagination) {
    const from = (safePage - 1) * safeLimit;
    const to = from + safeLimit - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  if (hasPagination || role || q) {
    return { rows: data || [], count: count || 0 };
  }

  return data || [];
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

const countStudents = async () => {
  const { count, error } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  if (error) throw error;
  return count || 0;
};

module.exports = {
  createUser,
  findById,
  updateUser,
  findAll,
  adminUpdate,
  findAdmins,
  toggleUserStatus,
  findByEnrollment,
  countStudents
};
