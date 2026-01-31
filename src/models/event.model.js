const { supabase } = require('../config/db');

const createEvent = async ({ name, venue, start_time, end_time, qr_refresh_interval, created_by, entry_window_mins = 15, exit_window_mins = 15 }) => {
  const { data, error } = await supabase
    .from('events')
    .insert([{
      name,
      venue,
      start_time,
      end_time,
      qr_refresh_interval,
      created_by,
      entry_window_mins,
      exit_window_mins,
      attendance_phase: 'CLOSED',
      session_state: 'DRAFT'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

const updatePhase = async (id, phase) => {
  const { data, error } = await supabase
    .from('events')
    .update({ attendance_phase: phase })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const ALLOWED_TRANSITIONS = {
  'DRAFT': ['READY', 'ACTIVE'],
  'READY': ['ACTIVE', 'DRAFT'],
  'ACTIVE': ['PAUSED', 'ENDED'],
  'PAUSED': ['ACTIVE', 'ENDED'],
  'ENDED': []
};

const updateSessionState = async (id, newState) => {
  // 1. Fetch current state
  const currentEvent = await findById(id);
  if (!currentEvent) throw new Error('Event not found');

  const currentState = currentEvent.session_state || 'DRAFT';

  // 2. Validate Transition
  if (currentState === newState) return currentEvent;

  const allowed = ALLOWED_TRANSITIONS[currentState];
  if (!allowed || !allowed.includes(newState)) {
    throw new Error(`Invalid state transition: ${currentState} -> ${newState}`);
  }

  // 3. Update
  const { data, error } = await supabase
    .from('events')
    .update({ session_state: newState })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findAll = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const updateEvent = async (id, { name, venue, qr_refresh_interval }) => {
  const { data, error } = await supabase
    .from('events')
    .update({ name, venue, qr_refresh_interval })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteEvent = async (id) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

module.exports = {
  createEvent,
  findById,
  updatePhase,
  updateSessionState,
  findAll,
  updateEvent,
  deleteEvent
};
