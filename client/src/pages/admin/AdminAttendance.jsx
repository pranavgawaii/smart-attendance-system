import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { Search, Eye } from 'lucide-react';

export default function AdminAttendance() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEvents();
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

    const filteredEvents = events.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (state) => {
        let color = '#71717a'; // Zinc-500
        let bg = '#f4f4f5'; // Zinc-100
        let label = 'NOT STARTED';

        if (state === 'ACTIVE') { color = '#18181b'; bg = '#f4f4f5'; label = 'LIVE'; } // Zinc-900 / Zinc-100
        else if (state === 'PAUSED') { color = '#52525b'; bg = '#f4f4f5'; label = 'PAUSED'; } // Zinc-600 / Zinc-100
        else if (state === 'STOPPED') { color = '#71717a'; bg = '#f4f4f5'; label = 'CLOSED'; } // Zinc-500 / Zinc-100

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
        <AdminLayout title="Attendance Reports">
            <PageHeader
                title="Attendance Reports"
                description="View and manage attendance records across all sessions and events."
            />

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md group">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" strokeWidth={1.5} />
                    <input
                        type="text"
                        placeholder="Search events or venues..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Event Details</th>
                                <th className="px-6 py-4">Creation Date</th>
                                <th className="px-6 py-4">Session Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-zinc-400">Loading sessions...</td></tr>
                            ) : filteredEvents.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-zinc-400">No sessions found matching your search.</td></tr>
                            ) : (
                                filteredEvents.map(event => (
                                    <tr key={event.id} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-zinc-900">{event.name}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5">{event.venue || 'No Venue Specified'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-zinc-400" strokeWidth={1.5} />
                                                {new Date(event.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={event.session_state} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to={`/admin/events/${event.id}/attendance`}>
                                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-semibold hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm">
                                                    <Eye size={14} strokeWidth={1.5} /> View Attendance
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
