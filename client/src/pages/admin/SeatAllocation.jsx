import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ArrowLeft, Edit2, RefreshCcw, Save, FileText, Printer, Armchair, AlertCircle, X } from 'lucide-react';

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

    const handleExport = async (type, labId = null) => {
        try {
            const url = `/assessments/${id}/allocations/export/${type}${labId ? `?labId=${labId}` : ''}`;
            const response = await api.get(url, {
                responseType: 'blob'
            });

            const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

            if (type === 'pdf') {
                window.open(blobUrl, '_blank');
            } else {
                const link = document.createElement('a');
                link.href = blobUrl;
                link.setAttribute('download', `allocations-${id}${labId ? `-${labId}` : ''}.${type}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }

            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);

        } catch (error) {
            console.error('Export failed', error);
            alert('Failed to execute export');
        }
    };

    const groupedAllocations = allocations.reduce((acc, curr) => {
        const lab = curr.lab_name || 'Unassigned';
        if (!acc[lab]) acc[lab] = [];
        acc[lab].push(curr);
        return acc;
    }, {});

    const actionButtons = (
        <div className="flex items-center gap-3">
            {view === 'PREVIEW' && (
                <>
                    <button
                        onClick={() => { setView('EMPTY'); setAllocations([]); }}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 shadow-sm flex items-center gap-2"
                    >
                        <Save size={16} strokeWidth={1.5} />Commit & Save
                    </button>
                </>
            )}
            {view === 'ALLOCATED' && (
                <>
                    <button
                        onClick={() => handleExport('csv')}
                        className="px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <FileText size={16} strokeWidth={1.5} /> CSV
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <Printer size={16} strokeWidth={1.5} /> Print All
                    </button>
                    <button
                        onClick={handleAutoAllocate}
                        className="px-3 py-2 text-sm font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors flex items-center gap-2"
                    >
                        <RefreshCcw size={16} strokeWidth={1.5} /> Re-Allocate
                    </button>
                </>
            )}
        </div>
    );

    if (loading) return <AdminLayout title="Seat Allocation"><div className="p-12 text-center text-slate-400">Loading workspace...</div></AdminLayout>;
    if (!assessment) return <AdminLayout title="Seat Allocation"><div className="p-12 text-center text-red-400">Assessment not found</div></AdminLayout>;

    return (
        <AdminLayout title="Seat Allocation">
            <PageHeader
                title={
                    <div className="flex items-center gap-2">
                        <Link to="/admin/allocations" className="text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowLeft size={24} strokeWidth={1.5} />
                        </Link>
                        <span>Seat Allocation</span>
                    </div>
                }
                description={`Managing seats for: ${assessment.title}`}
                actions={actionButtons}
            />

            {view === 'EMPTY' && (
                <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-zinc-50 text-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Armchair size={40} strokeWidth={1.5} />
                    </div>

                    {assessment.candidates && assessment.candidates.length === 0 ? (
                        <>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Candidates Found</h3>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                You cannot allocate seats because no students have been added to this assessment yet.
                            </p>
                            <Link to={`/admin/assessments/${id}`}>
                                <button className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 shadow-lg shadow-zinc-200 transition-all">
                                    &larr; Go Back & Add Candidates
                                </button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Allocate?</h3>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                Use our intelligent auto-allocation to distribute {assessment.candidates?.length || 0} eligible students across available labs optimizing for capacity.
                            </p>
                            <button
                                onClick={handleAutoAllocate}
                                className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 shadow-lg shadow-zinc-200 transition-all flex items-center gap-2 mx-auto"
                            >
                                <RefreshCcw size={18} strokeWidth={1.5} /> Run Auto Allocation
                            </button>
                        </>
                    )}
                </div>
            )}

            {(view === 'PREVIEW' || view === 'ALLOCATED') && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Object.keys(groupedAllocations).map(labName => (
                        <div key={labName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{labName}</h3>
                                    <div className="text-xs text-slate-500 mt-1">{groupedAllocations[labName].length} Seats Assigned</div>
                                </div>
                                <button
                                    onClick={() => {
                                        const labId = groupedAllocations[labName][0]?.lab_id;
                                        if (labId) handleExport('pdf', labId);
                                    }}
                                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-zinc-900 hover:border-zinc-300 transition-colors"
                                    title="Print this lab"
                                >
                                    <Printer size={16} strokeWidth={1.5} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 w-16 text-center">Seat</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-slate-500">Student</th>
                                            {view === 'ALLOCATED' && <th className="px-2 py-2 w-8"></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {groupedAllocations[labName].map(a => (
                                            <tr key={`${a.seat_number}-${a.user_id}`} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-block w-8 h-8 leading-8 rounded-lg bg-zinc-100 text-zinc-900 font-bold text-xs ring-1 ring-zinc-200">
                                                        {a.seat_number}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900 truncate max-w-[150px]" title={a.user_name}>{a.user_name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{a.enrollment_no}</div>
                                                </td>
                                                {view === 'ALLOCATED' && (
                                                    <td className="px-2 py-3 text-right">
                                                        <button
                                                            onClick={() => { setEditingAllocation(a); setShowEditModal(true); }}
                                                            className="p-1.5 rounded-md text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Edit2 size={14} strokeWidth={1.5} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingAllocation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Edit Seat</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-sm font-semibold text-slate-900">{editingAllocation.user_name}</div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">{editingAllocation.enrollment_no}</div>
                            </div>

                            <form onSubmit={handleUpdateSeat} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">New Lab</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 outline-none transition-all bg-white"
                                        value={editingAllocation.lab_id}
                                        onChange={e => setEditingAllocation({ ...editingAllocation, lab_id: parseInt(e.target.value) })}
                                    >
                                        {labs.map(l => (
                                            <option key={l.id} value={l.id}>{l.name} (Max {l.total_seats})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">New Seat Number</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                                        value={editingAllocation.seat_number}
                                        onChange={e => setEditingAllocation({ ...editingAllocation, seat_number: parseInt(e.target.value) })}
                                        min="1"
                                    />
                                </div>

                                <div className="flex gap-3 justify-end mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 shadow-sm shadow-zinc-200 transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
