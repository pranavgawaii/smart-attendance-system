import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import { Download, RefreshCw, Search, ArrowLeft } from 'lucide-react';

export default function AdminEventAttendance() {
    const { id } = useParams();
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [eventName, setEventName] = useState('');
    const [sessionState, setSessionState] = useState('');

    const fetchEventDetails = useCallback(async () => {
        try {
            const res = await api.get(`/events/${id}/stats`);
            setEventName(res.data.name);
            setSessionState(res.data.session_state);
        } catch (error) {
            console.error('Failed to load event details', error);
        }
    }, [id]);

    const fetchAttendance = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.get(`/events/${id}/attendance`);
            setAttendance(res.data);
        } catch (error) {
            console.error('Failed to fetch attendance', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchEventDetails();
        fetchAttendance();

        const interval = setInterval(() => {
            fetchEventDetails();
            if (sessionState === 'ACTIVE' || sessionState === 'LIVE') {
                fetchAttendance(true);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchEventDetails, fetchAttendance, sessionState]);

    const handleUpdateStatus = async (logId, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this student as ${newStatus}?`)) return;

        const oldStatus = attendance.find(r => r.log_id === logId)?.status;
        setAttendance(prev => prev.map(r => r.log_id === logId ? { ...r, status: newStatus } : r));

        try {
            await api.put(`/attendance/${logId}/status`, { status: newStatus });
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
            setAttendance(prev => prev.map(r => r.log_id === logId ? { ...r, status: oldStatus } : r));
        }
    };

    const downloadCsv = async () => {
        try {
            const response = await api.get(`/events/${id}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${id}.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Export CSV failed', error);
            alert('Failed to download CSV');
        }
    };

    const downloadPdf = async () => {
        try {
            const response = await api.get(`/events/${id}/export-pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Export PDF failed', error);
            alert('Failed to download PDF');
        }
    };

    const filteredData = attendance.filter(record => {
        const matchesSearch = (record.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (record.enrollment_no?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'ALL' || record.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <AdminLayout title="Attendance Logs">
            <PageHeader
                title={eventName || 'Attendance List'}
                description={`Viewing attendance logs for ${eventName || 'this event'}.`}
                actions={
                    <div className="flex items-center gap-3">
                        <Link to="/admin/events">
                            <button className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm" title="Back to Sessions">
                                <ArrowLeft size={16} strokeWidth={1.5} />
                            </button>
                        </Link>
                        <button onClick={downloadCsv} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-semibold hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm">
                            <Download size={14} strokeWidth={1.5} /> CSV
                        </button>
                        <button onClick={downloadPdf} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-semibold hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm">
                            <Download size={14} strokeWidth={1.5} /> PDF
                        </button>
                        <button onClick={() => fetchAttendance()} className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm" title="Refresh Feed">
                            <RefreshCw size={16} strokeWidth={1.5} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                }
            >
                {/* Live Status Indicator */}
                {(sessionState === 'ACTIVE' || sessionState === 'LIVE') && (
                    <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse border border-zinc-800">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        Live Session Active
                    </div>
                )}
            </PageHeader>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
                <div className="relative w-full sm:w-96 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" size={18} strokeWidth={1.5} />
                    <input
                        type="text"
                        placeholder="Search by Name or Enrollment..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 shadow-sm">
                    {['ALL', 'PRESENT', 'REVOKED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`
                                px-4 py-1.5 rounded-lg text-xs font-semibold transition-all
                                ${filter === f
                                    ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200'
                                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                }
                            `}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Enrollment</th>
                                <th className="px-6 py-4">Student Name</th>
                                <th className="px-6 py-4">Scan Time</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading && attendance.length === 0 ? (
                                <tr><td colSpan="5" className="p-12 text-center text-zinc-400">Fetching attendance logs...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="5" className="p-12 text-center text-zinc-400">No records found matching criteria.</td></tr>
                            ) : (
                                filteredData.map(record => (
                                    <tr key={record.log_id} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs text-zinc-500">{record.enrollment_no || '-'}</td>
                                        <td className="px-6 py-4 font-semibold text-zinc-900">{record.name}</td>
                                        <td className="px-6 py-4 text-zinc-500 text-sm">
                                            {record.scan_time ? new Date(record.scan_time).toLocaleTimeString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${record.status === 'PRESENT'
                                                ? 'bg-zinc-50 text-zinc-900 border-zinc-200'
                                                : record.status === 'REVOKED'
                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                    : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                {record.status === 'PRESENT' ? (
                                                    <button
                                                        onClick={() => handleUpdateStatus(record.log_id, 'REVOKED')}
                                                        className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                                                    >
                                                        Revoke
                                                    </button>
                                                ) : record.status === 'REVOKED' ? (
                                                    <button
                                                        onClick={() => handleUpdateStatus(record.log_id, 'PRESENT')}
                                                        className="px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
                                                    >
                                                        Restore
                                                    </button>
                                                ) : null}
                                            </div>
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
