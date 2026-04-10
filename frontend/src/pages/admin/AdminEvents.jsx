import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Monitor, Plus, Edit, Trash2, Calendar, Activity, X, Play, Square, Loader2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import StatsCard from '../../components/StatsCard';

export default function AdminEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Form State
    const [editingEventId, setEditingEventId] = useState(null);
    const [newEventName, setNewEventName] = useState('');
    const [venue, setVenue] = useState('');
    const [interval, setInterval] = useState(10);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/events');
            // Sort by ID desc (newest first)
            const sorted = res.data.sort((a, b) => b.id - a.id);
            setEvents(sorted);
        } catch (err) {
            console.error('Failed to fetch events', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingEventId(null);
        setNewEventName('');
        setVenue('');
        setInterval(10);
        setCreateModalOpen(true);
    };

    const handleEdit = (event) => {
        setEditingEventId(event.id);
        setNewEventName(event.name);
        setVenue(event.venue || '');
        setInterval(event.qr_refresh_interval || 10);
        setCreateModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;

        try {
            await api.delete(`/events/${id}`);
            setSuccessMsg('Session deleted successfully');
            fetchEvents();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error(err);
            alert('Failed to delete session');
        }
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!newEventName.trim()) {
            setError('Event Name is required');
            return;
        }

        try {
            const payload = {
                name: newEventName.trim(),
                venue: venue?.trim() || 'TBD',
                qr_refresh_interval: Number(interval) || 10
            };

            if (editingEventId) {
                await api.put(`/events/${editingEventId}`, payload);
                setSuccessMsg('Event updated successfully');
            } else {
                await api.post('/events', payload);
                setSuccessMsg('Event created successfully');
            }

            setCreateModalOpen(false);
            setNewEventName('');
            setVenue('');
            setInterval(10);
            setEditingEventId(null);
            fetchEvents();

            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save event');
        }
    };

    const handleToggleSession = async (eventId, currentState) => {
        setActionLoading(eventId);
        try {
            if (currentState === 'ACTIVE' || currentState === 'LIVE') {
                await api.post(`/events/${eventId}/stop-session`);
                setSuccessMsg('Session ended successfully');
            } else {
                await api.post(`/events/${eventId}/start-session`);
                setSuccessMsg('Session activated successfully');
            }
            fetchEvents();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error(err);
            alert('Failed to change session state');
        } finally {
            setActionLoading(null);
        }
    };

    const activeSessions = events.filter(e => e.session_state === 'ACTIVE' || e.session_state === 'LIVE').length;

    return (
        <AdminLayout title="Sessions Management">
            <PageHeader
                title="Sessions Management"
                description="Create and manage attendance sessions, venues, and configurations."
                actions={
                    <button
                        onClick={openCreateModal}
                        className="bg-zinc-900 hover:bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus size={16} strokeWidth={1.5} /> Create Session
                    </button>
                }
            />

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Sessions"
                    value={events.length}
                    icon={Calendar}
                    iconColor="text-zinc-600"
                    iconBg="bg-zinc-100"
                />
                <StatsCard
                    title="Active Now"
                    value={activeSessions}
                    icon={Activity}
                    iconColor="text-zinc-900"
                    iconBg="bg-zinc-100"
                    trend={activeSessions > 0 ? "LIVE" : null}
                />
            </div>

            {/* Success Toast */}
            {successMsg && (
                <div className="mb-6 p-4 bg-zinc-50 text-zinc-900 rounded-xl border border-zinc-200 flex items-center shadow-sm animate-fade-in-down">
                    ✅ <span className="ml-2 font-medium">{successMsg}</span>
                </div>
            )}

            {/* Events Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Event Name</th>
                                <th className="px-6 py-4">Venue</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-zinc-400">Loading sessions...</td></tr>
                            ) : events.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-zinc-400">No sessions found. Create one to get started.</td></tr>
                            ) : (
                                events.map(event => (
                                    <tr key={event.id} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-6 py-4 text-zinc-400 font-mono text-xs">#{event.event_display_id || '--'}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-zinc-900">{event.name}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5">{event.qr_refresh_interval}s interval</div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 font-medium">{event.venue || 'N/A'}</td>
                                        <td className="px-6 py-4 text-zinc-500 text-sm">
                                            {new Date(event.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={event.session_state} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Session Control Button */}
                                                <button
                                                    onClick={() => handleToggleSession(event.id, event.session_state)}
                                                    disabled={actionLoading === event.id}
                                                    className={`p-2 rounded-lg border transition-all ${event.session_state === 'ACTIVE' || event.session_state === 'LIVE'
                                                        ? 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                                                        : 'bg-green-50 border-green-100 text-green-600 hover:bg-green-100'
                                                        }`}
                                                    title={event.session_state === 'ACTIVE' || event.session_state === 'LIVE' ? 'Stop Session' : 'Start Session'}
                                                >
                                                    {actionLoading === event.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : event.session_state === 'ACTIVE' || event.session_state === 'LIVE' ? (
                                                        <Square size={16} fill="currentColor" strokeWidth={1} />
                                                    ) : (
                                                        <Play size={16} fill="currentColor" strokeWidth={1} />
                                                    )}
                                                </button>

                                                <Link to={`/admin/events/${event.id}`} target="_blank" rel="noopener noreferrer">
                                                    <button className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors" title="Projector View">
                                                        <Monitor size={16} strokeWidth={1.5} />
                                                    </button>
                                                </Link>

                                                <button
                                                    onClick={() => handleEdit(event)}
                                                    className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} strokeWidth={1.5} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(event.id)}
                                                    className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} strokeWidth={1.5} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h3 className="text-lg font-bold text-zinc-900">
                                {editingEventId ? 'Edit Session' : 'Create New Session'}
                            </h3>
                            <button onClick={() => setCreateModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSaveEvent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Event Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. TCS Pre-placement Talk"
                                        value={newEventName}
                                        onChange={e => setNewEventName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all placeholder:text-zinc-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Venue</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Main Auditorium"
                                        value={venue}
                                        onChange={e => setVenue(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all placeholder:text-zinc-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">
                                        QR Refresh Interval (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="60"
                                        value={interval}
                                        onChange={e => setInterval(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all placeholder:text-zinc-400"
                                    />
                                    <p className="mt-1 text-xs text-zinc-500">Recommended: 10 seconds for optimal security.</p>
                                </div>

                                <div className="flex gap-3 justify-end mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-black shadow-sm transition-colors"
                                    >
                                        {editingEventId ? 'Save Changes' : 'Create Session'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
