import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Monitor, ExternalLink, Plus } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModalOpen, setCreateModalOpen] = useState(false);


    // Form State
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

    const handleCreateEvent = async (e) => {
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

            await api.post('/events', payload);

            // Success
            setSuccessMsg('Event created successfully');
            setCreateModalOpen(false);
            setNewEventName('');
            setVenue('');
            setInterval(10);
            fetchEvents();

            // Clear success msg after 3s
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create event');
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
            onClick={() => setCreateModalOpen(true)}
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
                                <tr key={event.id} style={{ transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontWeight: '500' }}>#{event.id}</td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', fontWeight: '600', color: '#0f172a' }}>{event.name}</td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{event.venue || '-'}</td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{new Date(event.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        {getStatusBadge(event.session_state)}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <Link to={`/admin/events/${event.id}`} target="_blank" style={{ textDecoration: 'none' }}>
                                            <button style={{
                                                background: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                padding: '0.5rem 1rem',
                                                cursor: 'pointer',
                                                color: '#4c1d95',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                transition: 'all 0.2s'
                                            }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#ddd6fe'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                            >
                                                <Monitor size={16} />
                                                Launch
                                                <ExternalLink size={12} style={{ opacity: 0.5 }} />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Event Modal */}
            {createModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'white',
                        width: '90%', maxWidth: '500px',
                        padding: '2rem', borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#0f172a', fontSize: '1.5rem', fontWeight: '700' }}>Create New Session</h2>
                        <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem' }}>Fill in the details to schedule a new attendance event.</p>

                        {error && <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

                        <form onSubmit={handleCreateEvent}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Session Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    value={newEventName}
                                    onChange={e => setNewEventName(e.target.value)}
                                    placeholder="e.g. Google Cloud Workshop"
                                    required
                                    autoFocus
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Venue</label>
                                <input
                                    value={venue}
                                    onChange={e => setVenue(e.target.value)}
                                    placeholder="e.g. Auditorium A"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>QR Refresh Interval (seconds)</label>
                                <input
                                    type="number"
                                    min="5"
                                    value={interval}
                                    onChange={e => setInterval(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                                />
                                <small style={{ color: '#64748b', display: 'block', marginTop: '0.5rem' }}>Recommended: 10 seconds for security.</small>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', color: '#475569', fontWeight: '600' }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" style={{ background: '#4c1d95', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', color: 'white', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(76, 29, 149, 0.4)' }}>
                                    Create Session
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}
