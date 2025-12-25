import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { Plus, Beaker, Edit } from 'lucide-react';

export default function AdminAssessments() {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const res = await api.get('/assessments');
                setAssessments(res.data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch', error);
                setLoading(false);
            }
        };
        fetchAssessments();
    }, []);

    const actionButtons = (
        <Link to="/admin/assessments/create" style={{ textDecoration: 'none' }}>
            <button style={{
                background: '#4c1d95', color: 'white', border: 'none',
                padding: '0.75rem 1.5rem', borderRadius: '12px',
                fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(76, 29, 149, 0.3)'
            }}>
                <Plus size={18} /> Create Assessment
            </button>
        </Link>
    );

    return (
        <AdminLayout title="Assessments" actions={actionButtons}>
            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading assessments...</div>
            ) : assessments.length === 0 ? (
                <div style={{ padding: '6rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <Beaker size={32} />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.25rem', fontWeight: '700' }}>No Assessments Yet</h3>
                    <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 0 2rem 0' }}>
                        Create your first assessment to start evaluating student performance and allocating labs.
                    </p>
                    <Link to="/admin/assessments/create" style={{ textDecoration: 'none' }}>
                        <button style={{
                            background: 'white', border: '1px solid #cbd5e1', color: '#475569',
                            padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer'
                        }}>
                            Create Now
                        </button>
                    </Link>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '12px 0 0 12px' }}>Title</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Time</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '0 12px 12px 0' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessments.map(a => (
                                <tr key={a.id} style={{ transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', fontWeight: '600', color: '#0f172a' }}>{a.title}</td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{new Date(a.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                                        {a.start_time.slice(0, 5)} - {a.end_time.slice(0, 5)}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                                            background: a.status === 'PUBLISHED' ? '#dcfce7' : '#f1f5f9',
                                            color: a.status === 'PUBLISHED' ? '#15803d' : '#64748b',
                                            letterSpacing: '0.02em'
                                        }}>
                                            {a.status || 'DRAFT'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                                        <Link to={`/admin/assessments/${a.id}`} style={{ textDecoration: 'none' }}>
                                            <button style={{
                                                fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'white',
                                                color: '#4c1d95', border: '1px solid #e2e8f0', borderRadius: '8px',
                                                fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
                                            }}>
                                                <Edit size={14} /> Manage
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
}
