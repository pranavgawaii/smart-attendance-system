import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import AddCandidateModal from '../../components/admin/AddCandidateModal';

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
        fetchDetails();
    }, [fetchDetails]);

    const handleRemoveCandidate = async (userId) => {
        if (!window.confirm('Remove this student from eligibility?')) return;
        try {
            await api.delete(`/assessments/${id}/candidates/${userId}`);
            fetchDetails(); // Refresh list
        } catch (error) {
            alert('Failed to remove candidate');
        }
    };

    const handleSuccess = () => {
        setShowModal(false);
        fetchDetails();
        alert("Candidates added successfully!");
    };



    if (loading) return <div className="mit-container">Loading...</div>;
    if (!assessment) return <div className="mit-container">Assessment not found</div>;

    return (
        <div className="mit-container" style={{ maxWidth: '100%', padding: '1rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/admin/assessments" style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'inline-block', marginBottom: '1rem' }}>
                    &larr; Back to Assessments
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>{assessment.title}</h1>
                        <span style={{
                            background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569'
                        }}>
                            {assessment.status}
                        </span>
                        <div style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                            📅 {new Date(assessment.date).toLocaleDateString()} &nbsp;|&nbsp; ⏰ {assessment.start_time.slice(0, 5)} - {assessment.end_time.slice(0, 5)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>

                {/* Left: Eligible Candidates */}
                <div className="mit-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Eligible Candidates ({candidates.length})</h3>
                        <button onClick={() => setShowModal(true)} className="mit-btn" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            + Add Candidates
                        </button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--bg-primary)', fontSize: '0.9rem' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Enrollment</th>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Branch</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidates.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No candidates shortlisted yet.</td></tr>
                            ) : (
                                candidates.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{c.enrollment_no || '-'}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{c.name}</td>
                                        <td style={{ padding: '1rem' }}>{c.branch || '-'} <small>({c.academic_year === 4 ? 'Final' : '3rd'} Yr)</small></td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleRemoveCandidate(c.id)}
                                                style={{ border: 'none', background: 'none', color: '#dc3545', cursor: 'pointer' }}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Right: Info / Placeholder for Seat Allocation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="mit-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>Description</h4>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {assessment.description || 'No description provided.'}
                        </p>
                    </div>

                    <div className="mit-card" style={{ padding: '1.5rem', opacity: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Seat Allocation</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            {assessment.status === 'ALLOCATED'
                                ? 'Seats have been allocated for this assessment.'
                                : 'Allocate labs and seats to eligible candidates.'}
                        </p>
                        <Link to={`/admin/allocations/${id}`}>
                            <button className="mit-btn" style={{ width: '100%', justifyContent: 'center' }}>
                                {assessment.status === 'ALLOCATED' ? 'View Allocations' : 'Manage Allocations'}
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
    );
}
