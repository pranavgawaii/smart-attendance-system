import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { Search, Eye, Calendar, Users, TrendingUp, BarChart3, FileBarChart } from 'lucide-react';
import StatsCard from '../../components/StatsCard';

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
            // Note: Optimally this should be a single backend call, but keeping logic effectively same for now
            const attendancePromises = res.data.map(event =>
                api.get(`/events/${event.id}/stats`).then(r => r.data.count || 0).catch(() => 0)
            );

            const results = await Promise.all(attendancePromises);
            totalAttendance = results.reduce((a, b) => a + b, 0);

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

    return (
        <AdminLayout title="Reports & Analytics">
            <PageHeader
                title="Reports & Analytics"
                description="View attendance records, session performance, and student engagement metrics."
            />

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    title="Total Sessions Conducted"
                    value={stats.totalEvents}
                    icon={Calendar}
                    iconColor="text-zinc-600"
                    iconBg="bg-zinc-100"
                />
                <StatsCard
                    title="Total Attendance"
                    value={stats.totalAttendance}
                    icon={Users}
                    iconColor="text-zinc-900"
                    iconBg="bg-zinc-100"
                />
                <StatsCard
                    title="Avg. Attendance / Session"
                    value={stats.avgAttendance}
                    icon={TrendingUp}
                    iconColor="text-zinc-500"
                    iconBg="bg-zinc-100"
                />
            </div>

            {/* Search & Table */}
            <div className="flex flex-col gap-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} strokeWidth={1.5} />
                    <input
                        type="text"
                        placeholder="Search session reports..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="p-12 text-center text-zinc-400">Loading reports...</div>
                ) : filteredEvents.length === 0 ? (
                    <EmptyState
                        title="No Reports Found"
                        description="No sessions match your search criteria."
                        icon={FileBarChart}
                    />
                ) : (
                    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Event Name</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {filteredEvents.map(event => (
                                        <tr key={event.id} className="hover:bg-zinc-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-zinc-900">{event.name}</div>
                                                <div className="text-xs text-zinc-500 mt-0.5">{event.venue || 'No Venue'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600">
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
                                                        <Eye size={14} strokeWidth={1.5} /> View Report
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
