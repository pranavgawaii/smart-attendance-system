import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [events, setEvents] = useState([]);
    const [newEventName, setNewEventName] = useState('');
    const [venue, setVenue] = useState('');
    const [interval, setInterval] = useState(10);
    const [message, setMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const [adminName, setAdminName] = useState(user?.name || 'Admin');
    const [viewingAlerts, setViewingAlerts] = useState(null); // Array of alerts or null
    const [alertModalOpen, setAlertModalOpen] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetchAdminProfile();
    }, []);

    const fetchAdminProfile = async () => {
        try {
            const res = await api.get('/users/profile');
            setAdminName(res.data.name);
        } catch (err) {
            console.error('Failed to fetch admin profile');
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data);
        } catch (err) {
            console.error('Failed to fetch events');
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!newEventName) {
            setMessage('Please enter event name');
            return;
        }


        const payload = {
            name: newEventName.trim(),
            venue: venue?.trim() || 'TBD',
            qr_refresh_interval: Number(interval) || 10
        };

        console.log("🚀 FRONTEND v2: Preparing payload:", payload);

        try {
            await api.post('/events', JSON.stringify(payload), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Reset form
            setNewEventName('');
            setVenue('');
            setInterval(10);
            setMessage('Event created successfully');
            fetchEvents();
        } catch (err) {
            console.error("❌ FRONTEND: CREATE EVENT ERROR", err);
            console.error("❌ Response:", err.response?.data);
            setMessage(err.response?.data?.error || 'Failed to create event');
        }
    };

    const handleSessionAction = async (eventId, action) => {
        setActionLoading(eventId);
        try {
            await api.post(`/events/${eventId}/${action}`);
            await fetchEvents();
        } catch (err) {
            console.error(`Failed to ${action}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewErrors = async (eventId) => {
        try {
            const res = await api.get(`/events/${eventId}/audit-alerts`);
            setViewingAlerts(res.data);
            setAlertModalOpen(true);
        } catch (err) {
            console.error('Failed to fetch alerts');
        }
    };

    const closeAlertModal = () => {
        setAlertModalOpen(false);
        setViewingAlerts(null);
    };

    // Helper to get status color
    const getStatusColor = (state) => {
        switch (state) {
            case 'ACTIVE': return '#4caf50'; // Green
            case 'STOPPED': return '#f44336'; // Red
            default: return '#9e9e9e'; // Grey (Not Started)
        }
    };

    const downloadCsv = async (id) => {
        try {
            const response = await api.get(`/events/${id}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${id}.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Export failed');
            setMessage('Failed to export CSV');
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-grey)' }}>
            {/* Header */}
            <div className="mit-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src="/mitadtlogo.png" alt="MIT ADT Logo" className="mit-logo" />
                    <div>
                        <h1 style={{ fontSize: '1.25rem', marginBottom: 0 }}>AttendEase</h1>
                        <small style={{ color: 'var(--text-light)' }}>Smart Placement Attendance System</small>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
                    <span style={{ fontWeight: '500', fontSize: '0.9rem', color: '#555', display: 'none' }} className="admin-name-desktop">
                        {adminName}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to="/profile" style={{ textDecoration: 'none' }}>
                            <button
                                className="header-profile-btn"
                                title="My Profile"
                                style={{
                                    background: '#fff',
                                    border: '1px solid #ddd',
                                    color: '#555',
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    padding: 0
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#f5f5f5';
                                    e.currentTarget.style.borderColor = '#bbb';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#fff';
                                    e.currentTarget.style.borderColor = '#ddd';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </button>
                        </Link>
                        <button
                            className="header-signout-btn"
                            onClick={logout}
                            title="Sign out"
                            style={{
                                background: 'var(--mit-purple)',
                                border: 'none',
                                color: 'white',
                                padding: '0.6rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                minHeight: '44px'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.opacity = '0.9';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}>
                            Sign out
                        </button>
                    </div>
                </div>
            </div>

            <div className="mit-container" style={{ marginTop: '2rem' }}>

                {/* Create Event Section */}
                <div className="mit-card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Create New Session</h2>
                    <form onSubmit={handleCreateEvent} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: 2, minWidth: '300px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Session Name *</label>
                            <input
                                type="text"
                                className="mit-input"
                                style={{ marginBottom: 0 }}
                                value={newEventName}
                                onChange={e => setNewEventName(e.target.value)}
                                placeholder="e.g. Capgemini's Pre-Placement Talk"
                                required
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Venue</label>
                            <input
                                type="text"
                                className="mit-input"
                                style={{ marginBottom: 0 }}
                                value={venue}
                                onChange={e => setVenue(e.target.value)}
                                placeholder="e.g. Hall A"
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>QR Refresh (sec)</label>
                            <input
                                type="number"
                                className="mit-input"
                                style={{ marginBottom: 0 }}
                                value={interval}
                                onChange={e => setInterval(Number(e.target.value))}
                                min="5"
                            />
                        </div>
                        <button type="submit" className="mit-btn" style={{ minWidth: '150px' }}>Create Session</button>
                    </form>
                    {message && <p style={{ marginTop: '1rem', color: 'green' }}>{message}</p>}
                </div>

                {/* Active/Upcoming Sessions */}
                <div className="mit-card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--mit-purple)' }}>
                        Active & Upcoming Sessions
                    </h2>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', color: 'var(--text-light)' }}>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Name</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Status</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.filter(e => e.session_state !== 'STOPPED').length === 0 && (
                                    <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>No active sessions.</td></tr>
                                )}
                                {events.filter(e => e.session_state !== 'STOPPED').map(event => (
                                    <tr key={event.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>#{event.id} - {event.name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', color: 'white', background: getStatusColor(event.session_state || 'NOT_STARTED') }}>
                                                {event.session_state || 'NOT_STARTED'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <Link to={`/admin/events/${event.id}`} style={{ textDecoration: 'none' }}>
                                                <button type="button" className="mit-btn" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: 'var(--mit-purple)' }}>
                                                    Open Projector View
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Past Sessions */}
                <div className="mit-card">
                    <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#666' }}>
                        Past Sessions (History)
                    </h2>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', color: 'var(--text-light)' }}>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Name</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Date</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Export</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Action</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Errors</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.filter(e => e.session_state === 'STOPPED').length === 0 && (
                                    <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>No past sessions found.</td></tr>
                                )}
                                {events.filter(e => e.session_state === 'STOPPED').map(event => (
                                    <tr key={event.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>#{event.id} - {event.name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-light)' }}>
                                            {new Date(event.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => downloadCsv(event.id)}
                                                className="mit-btn"
                                                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: 'white', color: 'var(--mit-purple)', border: '1px solid var(--mit-purple)', marginRight: '10px' }}
                                            >
                                                Export CSV
                                            </button>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <Link to={`/admin/events/${event.id}`} style={{ textDecoration: 'none' }}>
                                                <button type="button" className="mit-btn" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: '#6c757d' }}>
                                                    View
                                                </button>
                                            </Link>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => handleViewErrors(event.id)}
                                                className="mit-btn"
                                                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: '#f5f5f5', color: '#555', border: '1px solid #ddd' }}
                                            >
                                                View Logs ⚠️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Error Alerts Modal */}
            {
                alertModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div className="mit-card" style={{
                            width: '90%', maxWidth: '600px', maxHeight: '85vh',
                            background: '#fff', borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                            display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '1.25rem 1.5rem',
                                background: '#fff',
                                borderBottom: '1px solid #eee',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#d32f2f' }}>🛡️</span> Security Audit Log
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.85rem' }}>
                                        Review blocked attempts and suspicious activity for this session.
                                    </p>
                                </div>
                                <button
                                    onClick={closeAlertModal}
                                    style={{
                                        background: '#f5f5f5', border: 'none', width: '32px', height: '32px',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#666', fontSize: '1.2rem', transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#e0e0e0'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                >
                                    &times;
                                </button>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '0', overflowY: 'auto', flex: 1, background: '#fafafa' }}>
                                {(!viewingAlerts || viewingAlerts.length === 0) ? (
                                    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#888' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>✅</div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>No Security Threats Detected</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>This session has no recorded anomalies or proxy attempts.</p>
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead style={{ background: '#f5f5f5', color: '#555', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                            <tr>
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600' }}>Timestamp</th>
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600' }}>Threat Type</th>
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600' }}>Source Device</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingAlerts.map((alert, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
                                                    <td style={{ padding: '1rem 1.5rem', color: '#444' }}>
                                                        {new Date(alert.scan_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </td>
                                                    <td style={{ padding: '1rem 1.5rem' }}>
                                                        <span style={{
                                                            background: '#ffebee', color: '#c62828',
                                                            padding: '4px 8px', borderRadius: '4px',
                                                            fontWeight: '600', fontSize: '0.75rem',
                                                            border: '1px solid #ffcdd2'
                                                        }}>
                                                            PROXY BLOCKED
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', color: '#333' }}>
                                                        {alert.device_id}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '1rem 1.5rem', background: '#fff', borderTop: '1px solid #eee', textAlign: 'right' }}>
                                <button
                                    onClick={closeAlertModal}
                                    className="mit-btn"
                                    style={{
                                        background: '#fff', color: '#666', border: '1px solid #ddd',
                                        padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '500'
                                    }}
                                >
                                    Close Log
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
