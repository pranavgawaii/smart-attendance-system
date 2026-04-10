const { supabase } = require('../config/db');

const createEvent = async ({ name, venue, start_time, end_time, qr_refresh_interval, created_by, entry_window_mins = 15, exit_window_mins = 15 }) => {
  console.log('[EventModel] Creating event:', { name, venue, qr_refresh_interval });

  const event_date = new Date(start_time).toISOString().split('T')[0];

  // Sequential 2-digit ID
  const { count } = await supabase.from('events').select('*', { count: 'exact', head: true });
  const displayId = ((count || 0) + 1).toString().padStart(2, '0');

  const { data, error } = await supabase
    .from('events')
    .insert([{
      title: name,
      event_date: event_date,
      name,
      venue,
      start_time,
      end_time,
      qr_refresh_interval,
      created_by,
      entry_window_mins,
      exit_window_mins,
      attendance_phase: 'CLOSED',
      session_state: 'DRAFT',
      event_display_id: displayId
    }])
    .select()
    .single();

  if (error) {
    console.error('[EventModel] Create Error:', error);
    throw new Error(`Failed to save event: ${error.message}`);
  }
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

const findByDisplayId = async (displayId) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_display_id', displayId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// ... keep existing update/find methods ...
const updatePhase = async (id, phase) => {
  const { data, error } = await supabase.from('events').update({ attendance_phase: phase }).eq('id', id).select().single();
  if (error) throw error; return data;
};

const updateSessionState = async (id, newState) => {
  const currentEvent = await findById(id);
  if (!currentEvent) throw new Error('Event not found');

  const updatePayload = { session_state: newState };
  if (newState === 'ACTIVE' && !currentEvent.started_at) updatePayload.started_at = new Date().toISOString();
  if (newState === 'ENDED') updatePayload.ended_at = new Date().toISOString();

  const { data, error } = await supabase.from('events').update(updatePayload).eq('id', id).select().single();
  if (error) throw error; return data;
};

const findAll = async () => {
  // Return all events, sorted by creation
  const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
  if (error) throw error; return data;
};

const updateEvent = async (id, payload) => {
  const { data, error } = await supabase.from('events').update(payload).eq('id', id).select().single();
  if (error) throw error; return data;
};

const deleteEvent = async (id) => {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error; return true;
};

module.exports = {
  createEvent,
  findById,
  findByDisplayId, // Exported
  updatePhase,
  updateSessionState,
  findAll,
  updateEvent,
  deleteEvent
};
