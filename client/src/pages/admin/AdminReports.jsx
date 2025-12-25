import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { Search, Eye, Download, Calendar, Users, TrendingUp, BarChart3 } from 'lucide-react';

export default function AdminReports() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ totalEvents: 0, totalAttendance: 0, avgAttendance: 0 });

    useEffect(() => {
        fetchEvents();
        fetchOverallStats();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setEvents(sorted);
        } catch (error) {
            console.error('Failed to load events', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOverallStats = async () => {
        try {
            const res = await api.get('/events');
            const totalEvents = res.data.length;
            let totalAttendance = 0;

            // Fetch attendance count for each event
            for (const event of res.data) {
                try {
                    const statsRes = await api.get(`/events/${event.id}/stats`);
                    totalAttendance += statsRes.data.count || 0;
                } catch (err) {
                    console.error(`Failed to fetch stats for event ${event.id}`);
                }
            }

            setStats({
                totalEvents,
                totalAttendance,
                avgAttendance: totalEvents > 0 ? Math.round(totalAttendance / totalEvents) : 0
            });
        } catch (error) {
            console.error('Failed to load overall stats', error);
        }
    };

    const filteredEvents = events.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (state) => {
        let color = '#64748b';
        let bg = '#f1f5f9';
        let label = 'NOT STARTED';

        if (state === 'ACTIVE') { color = '#15803d'; bg = '#dcfce7'; label = 'LIVE'; }
        else if (state === 'PAUSED') { color = '#b45309'; bg = '#fef3c7'; label = 'PAUSED'; }
        else if (state === 'STOPPED') { color = '#b91c1c'; bg = '#fee2e2'; label = 'CLOSED'; }

        return (
            <span style={{
                color: color, backgroundColor: bg, padding: '4px 10px',
                borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                letterSpacing: '0.02em', textTransform: 'uppercase'
            }}>
                {label}
            </span>
        );
    };

    return (
        <AdminLayout title="Reports & Analytics">
            {/* Search */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search Events..."
                        style={{
                            width: '100%', padding: '0.85rem 1rem 0.85rem 3rem',
                            borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem',
                            outline: 'none', background: '#f8fafc', color: '#334155'
                        }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '12px 0 0 12px' }}>Event Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '0 12px 12px 0' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading events...</td></tr>
                        ) : filteredEvents.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No events found.</td></tr>
                        ) : (
                            filteredEvents.map(event => (
                                <tr key={event.id} style={{ transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', fontWeight: '600', color: '#0f172a' }}>
                                        {event.name}
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>{event.venue || 'No Venue'}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                                        {new Date(event.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        {getStatusBadge(event.session_state)}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                                        <Link to={`/admin/events/${event.id}/attendance`} style={{ textDecoration: 'none' }}>
                                            <button style={{
                                                background: 'white', color: '#4c1d95', border: '1px solid #e2e8f0',
                                                padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600',
                                                fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#ddd6fe'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                            >
                                                <Eye size={16} /> View Details
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
