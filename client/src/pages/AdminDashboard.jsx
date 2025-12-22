import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [events, setEvents] = useState([]);
    const [newEventName, setNewEventName] = useState('');
    const [interval, setInterval] = useState(10);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

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
        try {
            await api.post('/events', { name: newEventName, qr_refresh_interval: interval });
            setNewEventName('');
            setMessage('Event created successfully');
            fetchEvents();
        } catch (err) {
            setMessage('Failed to create event');
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-grey)' }}>
            {/* Header */}
            <div className="mit-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src="/mitadtlogo.png" alt="MIT ADT Logo" className="mit-logo" />
                    <div>
                        <h1 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Smart Attendance</h1>
                        <small style={{ color: 'var(--text-light)' }}>Admin Portal</small>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: '500' }}>Admin: {user?.name}</span>
                    <button onClick={logout} style={{ background: 'none', border: '1px solid var(--mit-purple)', color: 'var(--mit-purple)', padding: '0.4rem 0.8rem', borderRadius: '4px' }}>
                        Logout
                    </button>
                </div>
            </div>

            <div className="mit-container" style={{ marginTop: '2rem' }}>

                {/* Create Event Section */}
                <div className="mit-card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Create New Session</h2>
                    <form onSubmit={handleCreateEvent} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 2, minWidth: '300px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Session/Subject Name</label>
                            <input
                                type="text"
                                className="mit-input"
                                style={{ marginBottom: 0 }}
                                value={newEventName}
                                onChange={e => setNewEventName(e.target.value)}
                                placeholder="e.g. Data Structures Verification"
                                required
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Refresh (seconds)</label>
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

                {/* Event List */}
                <div className="mit-card">
                    <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Active Sessions</h2>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', color: 'var(--text-light)' }}>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>ID</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Name</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Created At</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map(event => (
                                    <tr key={event.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem' }}>#{event.id}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{event.name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-light)' }}>{new Date(event.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <Link to={`/admin/events/${event.id}`} style={{ textDecoration: 'none' }}>
                                                <button className="mit-btn" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
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

            </div>
        </div>
    );
}
