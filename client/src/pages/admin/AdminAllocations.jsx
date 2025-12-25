import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { Settings, Calendar } from 'lucide-react';

export default function AdminAllocations() {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const res = await api.get('/assessments');
                setAssessments(res.data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch assessments', error);
                setLoading(false);
            }
        };
        fetchAssessments();
    }, []);

    return (
        <AdminLayout title="Seat Allocations">
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '12px 0 0 12px' }}>Assessment</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Date & Time</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '0 12px 12px 0' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading assessments...</td></tr>
                        ) : assessments.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No assessments found.</td></tr>
                        ) : (
                            assessments.map(a => (
                                <tr key={a.id} style={{ transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', fontWeight: '600', color: '#0f172a' }}>{a.title}</td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569' }}>
                                            <Calendar size={14} />
                                            {new Date(a.date).toLocaleDateString()}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                            {a.start_time.slice(0, 5)} - {a.end_time.slice(0, 5)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                                            color: a.status === 'ALLOCATED' ? '#15803d' : '#854d0e',
                                            background: a.status === 'ALLOCATED' ? '#dcfce7' : '#fef9c3',
                                            letterSpacing: '0.02em'
                                        }}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                                        <Link to={`/admin/allocations/${a.id}`} style={{ textDecoration: 'none' }}>
                                            <button style={{
                                                background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                                padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: '600',
                                                color: '#4c1d95', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                transition: 'all 0.2s'
                                            }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#ddd6fe'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                            >
                                                <Settings size={14} /> Manage Seats
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
