import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
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
        const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.enrollment_no?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'ALL' || record.status === filter;
        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status) => {
        let color = '#475569';
        let bg = '#f1f5f9';

        if (status === 'PRESENT') { color = '#15803d'; bg = '#dcfce7'; }
        else if (status === 'ABSENT') { color = '#b91c1c'; bg = '#fee2e2'; }
        else if (status === 'REVOKED') { color = '#b45309'; bg = '#fef3c7'; }

        return (
            <span style={{
                color: color, backgroundColor: bg, padding: '4px 10px',
                borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                letterSpacing: '0.02em', textTransform: 'uppercase'
            }}>
                {status}
            </span>
        );
    };

    const actionButtons = (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={downloadCsv} style={{
                background: 'white', color: '#15803d', border: '1px solid #dcfce7',
                padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600',
                fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                <Download size={16} /> CSV
            </button>
            <button onClick={downloadPdf} style={{
                background: 'white', color: '#b91c1c', border: '1px solid #fee2e2',
                padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600',
                fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                <Download size={16} /> PDF
            </button>
            <button onClick={() => fetchAttendance()} style={{
                background: 'white', color: '#4c1d95', border: '1px solid #e2e8f0',
                padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600',
                fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                <RefreshCw size={16} /> Refresh
            </button>
        </div>
    );

    return (
        <AdminLayout
            title={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link to="/admin/events" style={{ textDecoration: 'none', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                            <ArrowLeft size={20} />
                        </Link>
                        <span>{eventName || 'Attendance List'}</span>
                        {(sessionState === 'ACTIVE' || sessionState === 'LIVE') && (
                            <span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>LIVE</span>
                        )}
                    </div>
                </div>
            }
            actions={actionButtons}
        >
            {/* Controls */}
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by Name or Enrollment..."
                        style={{
                            width: '100%', padding: '0.85rem 1rem 0.85rem 3rem',
                            borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem',
                            outline: 'none', background: '#f8fafc', color: '#334155'
                        }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                    {['ALL', 'PRESENT', 'REVOKED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                background: filter === f ? 'white' : 'transparent',
                                color: filter === f ? '#4c1d95' : '#64748b',
                                border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px',
                                fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem',
                                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '12px 0 0 12px' }}>Enrollment</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Time</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '0 12px 12px 0' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading attendance...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No records found matching criteria.</td></tr>
                        ) : (
                            filteredData.map(record => (
                                <tr key={record.log_id} style={{ transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', color: '#475569', fontWeight: '500' }}>{record.enrollment_no}</td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', fontWeight: '500', color: '#0f172a' }}>{record.name}</td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.9rem' }}>
                                        {new Date(record.scan_time).toLocaleTimeString()}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        {getStatusBadge(record.status)}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                                        {record.status === 'PRESENT' && (
                                            <button
                                                onClick={() => handleUpdateStatus(record.log_id, 'REVOKED')}
                                                style={{ fontSize: '0.8rem', color: '#dc3545', background: 'white', border: '1px solid #fee2e2', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                                            >
                                                Revoke
                                            </button>
                                        )}
                                        {record.status === 'REVOKED' && (
                                            <button
                                                onClick={() => handleUpdateStatus(record.log_id, 'PRESENT')}
                                                style={{ fontSize: '0.8rem', color: '#15803d', background: 'white', border: '1px solid #dcfce7', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                                            >
                                                Restore
                                            </button>
                                        )}
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
