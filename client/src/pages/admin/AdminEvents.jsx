import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Monitor, ExternalLink, Plus, Edit, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Form State
    const [editingEventId, setEditingEventId] = useState(null); // ID if editing
    const [newEventName, setNewEventName] = useState('');
    const [venue, setVenue] = useState('');
    const [interval, setInterval] = useState(10);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

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
                // Update
                await api.put(`/events/${editingEventId}`, payload);
                setSuccessMsg('Event updated successfully');
            } else {
                // Create
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



    const getStatusBadge = (state) => {
        const s = state || 'NOT_STARTED';
        let color = '#64748b'; // Slate
        let bg = '#f1f5f9';

        if (s === 'ACTIVE' || s === 'LIVE') {
            color = '#15803d'; bg = '#dcfce7'; // Green
        } else if (s === 'PAUSED') {
            color = '#b45309'; bg = '#fef3c7'; // Amber
        } else if (s === 'STOPPED' || s === 'CLOSED') {
            color = '#b91c1c'; bg = '#fee2e2'; // Red
        }

        return (
            <span style={{
                color: color,
                backgroundColor: bg,
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '0.02em'
            }}>
                {s.replace('_', ' ')}
            </span>
        );
    };

    const actionButtons = (
        <button
            onClick={openCreateModal}
            style={{
                background: '#4c1d95',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(76, 29, 149, 0.3)',
                transition: 'all 0.2s'
            }}
        >
            <Plus size={18} /> Create Session
        </button>
    );

    return (
        <AdminLayout title="Sessions Management" actions={actionButtons}>

            {/* Success Toast */}
            {successMsg && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center' }}>
                    ✅ <span style={{ marginLeft: '10px', fontWeight: '500' }}>{successMsg}</span>
                </div>
            )}

            {/* Events Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '12px 0 0 12px' }}>ID</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Event Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Venue</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '0 12px 12px 0' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading sessions...</td></tr>
                        ) : events.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No sessions found. Create one to get started.</td></tr>
                        ) : (
                            events.map(event => (
                                <tr key={event.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontWeight: '500', fontSize: '0.85rem' }}>#{event.id}</td>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', fontWeight: '600', color: '#1e293b' }}>{event.name}</td>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{event.venue || 'N/A'}</td>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.9rem' }}>
                                        {new Date(event.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        {getStatusBadge(event.session_state)}
                                    </td>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Link to={`/admin/events/${event.id}`} style={{ textDecoration: 'none' }}>
                                                <button style={{
                                                    background: 'white', border: '1px solid #cbd5e1', color: '#475569',
                                                    padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                                    fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px'
                                                }}>
                                                    <Monitor size={14} /> Manage
                                                </button>
                                            </Link>

                                            <button
                                                onClick={() => handleEdit(event)}
                                                style={{
                                                    background: '#e0e7ff', border: 'none', color: '#4338ca',
                                                    padding: '8px', borderRadius: '8px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                title="Edit Session"
                                            >
                                                <Edit size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                style={{
                                                    background: '#fee2e2', border: 'none', color: '#b91c1c',
                                                    padding: '8px', borderRadius: '8px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                title="Delete Session"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {createModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '16px',
                        width: '100%', maxWidth: '500px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <h2 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.5rem' }}>
                            {editingEventId ? 'Edit Session' : 'Create New Session'}
                        </h2>

                        {error && <div style={{ marginBottom: '1rem', color: '#b91c1c', background: '#fee2e2', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

                        <form onSubmit={handleSaveEvent}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Event Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. TCS Pre-placement Talk"
                                    value={newEventName}
                                    onChange={e => setNewEventName(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '8px',
                                        border: '1px solid #cbd5e1', fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Venue</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Main Auditorium"
                                    value={venue}
                                    onChange={e => setVenue(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '8px',
                                        border: '1px solid #cbd5e1', fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                                    QR Refresh Interval (seconds)
                                </label>
                                <input
                                    type="number"
                                    min="5"
                                    max="60"
                                    value={interval}
                                    onChange={e => setInterval(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '8px',
                                        border: '1px solid #cbd5e1', fontSize: '1rem'
                                    }}
                                />
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Recommended: 10 seconds</p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    style={{
                                        background: 'white', border: '1px solid #cbd5e1', color: '#64748b',
                                        padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        background: '#4c1d95', border: 'none', color: 'white',
                                        padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                                    }}
                                >
                                    {editingEventId ? 'Save Changes' : 'Create Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
