import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import AddCandidateModal from '../../components/admin/AddCandidateModal';
import AdminLayout from '../../components/admin/AdminLayout';
import { ArrowLeft, Clock, Calendar, Users, Briefcase, Trash2, Plus } from 'lucide-react';

export default function AdminAssessmentDetails() {
    const { id } = useParams();
    const [assessment, setAssessment] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchDetails = useCallback(async () => {
        try {
            const res = await api.get(`/assessments/${id}`);
            setAssessment(res.data);
            setCandidates(res.data.candidates || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch details', error);
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchDetails();
        }, 0);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [fetchDetails]);

    const handleRemoveCandidate = async (userId) => {
        if (!window.confirm('Remove this student from eligibility?')) return;
        try {
            await api.delete(`/assessments/${id}/candidates/${userId}`);
            fetchDetails(); // Refresh list
        } catch {
            alert('Failed to remove candidate');
        }
    };

    const handleSuccess = () => {
        setShowModal(false);
        fetchDetails();
        alert("Candidates added successfully!");
    };

    // Helper to format ISO time (2025-12-25T10:00:00) to "10:00 AM"
    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return (
        <AdminLayout title="Assessment Details">
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading details...</div>
        </AdminLayout>
    );

    if (!assessment) return (
        <AdminLayout title="Not Found">
            <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Assessment not found</div>
        </AdminLayout>
    );

    const headerActions = (
        <Link to="/admin/assessments" style={{ textDecoration: 'none' }}>
            <button style={{
                background: 'white', border: '1px solid #e2e8f0', color: '#64748b',
                padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
            }}>
                <ArrowLeft size={16} /> Back
            </button>
        </Link>
    );

    return (
        <AdminLayout title={assessment.title} actions={headerActions}>
            <div style={{ maxWidth: '100%' }}>

                {/* 1. Overview Section */}
                <div style={{
                    display: 'flex', gap: '2rem', marginBottom: '2.5rem',
                    paddingBottom: '2rem', borderBottom: '1px solid #f1f5f9',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <span style={{
                            background: assessment.status === 'PUBLISHED' ? '#f4f4f5' : '#f4f4f5',
                            color: assessment.status === 'PUBLISHED' ? '#18181b' : '#71717a',
                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em'
                        }}>
                            {assessment.status || 'DRAFT'}
                        </span>
                        <div style={{ height: '20px', width: '1px', background: '#cbd5e1' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.9rem', fontWeight: '500' }}>
                            <Calendar size={16} color="#64748b" /> {new Date(assessment.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.9rem', fontWeight: '500', marginLeft: '0.5rem' }}>
                            <Clock size={16} color="#64748b" /> {formatTime(assessment.start_time)} - {formatTime(assessment.end_time)}
                        </div>
                    </div>
                </div>

                {/* 2. Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '2.5rem' }}>

                    {/* Left Column: Candidates list */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Users size={20} color="#18181b" /> Eligible Students
                                <span style={{ background: '#f4f4f5', color: '#18181b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                                    {candidates.length}
                                </span>
                            </h3>
                            <button
                                onClick={() => setShowModal(true)}
                                style={{
                                    background: '#18181b', color: 'white', border: 'none',
                                    padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '600', fontSize: '0.85rem',
                                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <Plus size={16} /> Add Students
                            </button>
                        </div>

                        <div style={{
                            background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0',
                            overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Enrollment</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Name</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Branch</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidates.length === 0 ? (
                                        <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No eligible students added yet.</td></tr>
                                    ) : (
                                        candidates.map(c => (
                                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#334155', fontWeight: '500' }}>{c.enrollment_no || '-'}</td>
                                                <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{c.name}</td>
                                                <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{c.branch || '-'} <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>({c.academic_year === 4 ? 'BE' : 'TE'})</span></td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => handleRemoveCandidate(c.id)}
                                                        title="Remove student"
                                                        style={{
                                                            border: 'none', background: '#fef2f2', color: '#ef4444',
                                                            cursor: 'pointer', padding: '6px', borderRadius: '6px'
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column: Actions & Meta */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Description Card */}
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: '700', color: '#334155' }}>Instructions</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: '#64748b' }}>
                                {assessment.description || 'No specific instructions provided for this assessment.'}
                            </p>
                        </div>

                        {/* Allocation Action Card */}
                        <div style={{
                            background: 'white', padding: '1.5rem', borderRadius: '16px',
                            border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                                <div style={{ background: '#f4f4f5', padding: '8px', borderRadius: '8px', color: '#18181b' }}><Briefcase size={20} /></div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>Seat Allocation</h4>
                            </div>

                            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5' }}>
                                {assessment.status === 'ALLOCATED'
                                    ? '✅ Allocation complete. View seating.'
                                    : 'Auto-assign labs and seats to students.'}
                            </p>

                            <Link to={`/admin/allocations/${id}`}>
                                <button style={{
                                    width: '100%',
                                    background: assessment.status === 'ALLOCATED' ? 'white' : '#18181b',
                                    color: assessment.status === 'ALLOCATED' ? '#18181b' : 'white',
                                    border: assessment.status === 'ALLOCATED' ? '1px solid #18181b' : 'none',
                                    padding: '0.75rem', borderRadius: '10px', fontWeight: '600',
                                    cursor: 'pointer', fontSize: '0.9rem',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                }}>
                                    {assessment.status === 'ALLOCATED' ? 'View Seating Plan' : 'Start Allocation'}
                                </button>
                            </Link>
                        </div>

                    </div>
                </div>

                {/* Add Candidates Modal */}
                {showModal && (
                    <AddCandidateModal
                        assessmentId={id}
                        onClose={() => setShowModal(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
