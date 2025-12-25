import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { ArrowLeft, Edit2, CheckCircle, RefreshCcw, Save } from 'lucide-react';

export default function SeatAllocation() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [assessment, setAssessment] = useState(null);
    const [view, setView] = useState('LOADING'); // LOADING, EMPTY, PREVIEW, ALLOCATED
    const [allocations, setAllocations] = useState([]);

    // Modal for Edit
    const [editingAllocation, setEditingAllocation] = useState(null);
    const [labs, setLabs] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Fetch Assessment
                const res = await api.get(`/assessments/${id}`);
                setAssessment(res.data);

                // 2. Fetch Labs (always needed for edit)
                const labsRes = await api.get('/labs');
                setLabs(labsRes.data);

                // 3. Check status
                const allocRes = await api.get(`/assessments/${id}/allocations`);
                if (allocRes.data.length > 0) {
                    setAllocations(allocRes.data);
                    setView('ALLOCATED');
                } else {
                    setView('EMPTY');
                }
                setLoading(false);
            } catch (error) {
                console.error('Failed to load data', error);
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleAutoAllocate = async () => {
        setLoading(true);
        try {
            const res = await api.post(`/assessments/${id}/allocations/generate`);
            if (res.data.warning) alert(res.data.warning);
            setAllocations(res.data.allocations);
            setView('PREVIEW');
            setLoading(false);
        } catch (error) {
            alert(error.response?.data?.error || 'Allocation failed');
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!window.confirm('Confirm these seat allocations? This will save them to the database.')) return;
        setLoading(true);
        try {
            await api.post(`/assessments/${id}/allocations/confirm`, { allocations });
            setView('ALLOCATED');
            setLoading(false);
        } catch (error) {
            alert('Failed to save allocations');
            setLoading(false);
        }
    };

    const handleUpdateSeat = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/assessments/${id}/allocations/${editingAllocation.id}`, {
                labId: editingAllocation.lab_id,
                seatNumber: editingAllocation.seat_number
            });
            setShowEditModal(false);

            // Refresh allocations locally or fetch
            const allocRes = await api.get(`/assessments/${id}/allocations`);
            setAllocations(allocRes.data);
        } catch (error) {
            alert(error.response?.data?.error || 'Update failed');
        }
    };

    const groupedAllocations = allocations.reduce((acc, curr) => {
        const lab = curr.lab_name || 'Unassigned';
        if (!acc[lab]) acc[lab] = [];
        acc[lab].push(curr);
        return acc;
    }, {});

    const actionButtons = (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            {view === 'PREVIEW' && (
                <>
                    <button onClick={() => { setView('EMPTY'); setAllocations([]); }} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleConfirm} style={{ background: '#4c1d95', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Save size={16} /> Commit & Save
                    </button>
                </>
            )}
            {view === 'ALLOCATED' && (
                <button onClick={handleAutoAllocate} style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCcw size={16} /> Reset / Re-Allocate
                </button>
            )}
        </div>
    );

    if (loading) return <AdminLayout title="Seat Allocation"><div>Loading...</div></AdminLayout>;
    if (!assessment) return <AdminLayout title="Seat Allocation"><div>Assessment not found</div></AdminLayout>;

    return (
        <AdminLayout
            title={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link to={`/admin/assessments/${id}`} style={{ textDecoration: 'none', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                            <ArrowLeft size={20} />
                        </Link>
                        <span>Seat Allocation</span>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal', marginLeft: 'calc(20px + 1rem)' }}>{assessment.title}</span>
                </div>
            }
            actions={actionButtons}
        >
            {view === 'EMPTY' && (
                <div style={{ padding: '6rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem', background: '#f8fafc', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🪑</div>

                    {assessment.candidates && assessment.candidates.length === 0 ? (
                        <>
                            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No Candidates Found</h3>
                            <p style={{ maxWidth: '500px', color: '#64748b', marginBottom: '2rem' }}>
                                You cannot allocate seats because no students have been added to this assessment yet.
                            </p>
                            <Link to={`/admin/assessments/${id}`} style={{ textDecoration: 'none' }}>
                                <button style={{ background: '#4c1d95', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                                    &larr; Go Back & Add Candidates
                                </button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No Seats Allocated</h3>
                            <p style={{ maxWidth: '500px', color: '#64748b', marginBottom: '2rem' }}>
                                Ready to assign seats? Use Auto-Allocate to distribute eligible students across active labs sequentially.
                            </p>
                            <button onClick={handleAutoAllocate} style={{ background: '#4c1d95', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(76, 29, 149, 0.4)' }}>
                                ⚡ Auto Allocation
                            </button>
                        </>
                    )}
                </div>
            )}

            {(view === 'PREVIEW' || view === 'ALLOCATED') && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {Object.keys(groupedAllocations).map(labName => (
                        <div key={labName} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {labName} <span style={{ fontSize: '0.75rem', color: '#64748b', background: 'white', padding: '2px 8px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>{groupedAllocations[labName].length} Students</span>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <tbody>
                                    {groupedAllocations[labName].map(a => (
                                        <tr key={a.seat_number + a.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: '700', width: '50px', textAlign: 'center', color: '#4c1d95', background: '#f5f3ff' }}>
                                                {a.seat_number}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div style={{ fontWeight: '500', color: '#0f172a' }}>{a.user_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{a.enrollment_no}</div>
                                            </td>
                                            {view === 'ALLOCATED' && (
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => { setEditingAllocation(a); setShowEditModal(true); }}
                                                        style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                                        title="Edit Seat"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingAllocation && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', width: '400px', padding: '2rem', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a' }}>Edit Seat Allocation</h3>
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ fontWeight: '600', color: '#334155' }}>{editingAllocation.user_name}</div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{editingAllocation.enrollment_no}</div>
                        </div>
                        <form onSubmit={handleUpdateSeat}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Lab</label>
                                <select
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white' }}
                                    value={editingAllocation.lab_id}
                                    onChange={e => setEditingAllocation({ ...editingAllocation, lab_id: parseInt(e.target.value) })}
                                >
                                    {labs.map(l => (
                                        <option key={l.id} value={l.id}>{l.name} (Max {l.total_seats})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Seat Number</label>
                                <input
                                    type="number"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                                    value={editingAllocation.seat_number}
                                    onChange={e => setEditingAllocation({ ...editingAllocation, seat_number: parseInt(e.target.value) })}
                                    min="1"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowEditModal(false)} style={{ background: 'white', color: '#475569', border: '1px solid #cbd5e1', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ background: '#4c1d95', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
