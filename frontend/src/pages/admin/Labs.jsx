import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { Plus, Edit2, Trash2, Power, X, AlertCircle, Beaker } from 'lucide-react';
import api from '../../services/api';

export default function Labs() {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLab, setEditingLab] = useState(null);
    const [formData, setFormData] = useState({ lab_name: '', capacity: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLabs();
    }, []);

    const fetchLabs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/labs');
            setLabs(response.data || []);
        } catch (err) {
            console.error('Failed to fetch labs:', err);
            setError('Failed to load labs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (lab = null) => {
        if (lab) {
            setEditingLab(lab);
            setFormData({ lab_name: lab.lab_name, capacity: lab.capacity });
        } else {
            setEditingLab(null);
            setFormData({ lab_name: '', capacity: '' });
        }
        setError('');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingLab(null);
        setFormData({ lab_name: '', capacity: '' });
        setError('');
    };

    const validateForm = () => {
        if (!formData.lab_name.trim()) {
            setError('Lab name is required');
            return false;
        }
        if (!formData.capacity || formData.capacity <= 0) {
            setError('Capacity must be greater than 0');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        setError('');

        try {
            const payload = {
                lab_name: formData.lab_name.trim(),
                capacity: parseInt(formData.capacity)
            };

            if (editingLab) {
                // Update existing lab
                await api.put(`/labs/${editingLab.id}`, payload);
            } else {
                // Create new lab
                await api.post('/labs', { ...payload, status: 'enabled' });
            }

            await fetchLabs();
            handleCloseModal();
        } catch (err) {
            console.error('Failed to save lab:', err);
            if (err.response?.data?.error?.includes('already exists') || err.response?.data?.error?.includes('duplicate')) {
                setError('A lab with this name already exists');
            } else {
                setError(err.response?.data?.error || 'Failed to save lab. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (lab) => {
        const newStatus = lab.status === 'enabled' ? 'disabled' : 'enabled';

        try {
            await api.put(`/labs/${lab.id}`, { status: newStatus });

            // Optimistic update
            setLabs(labs.map(l => l.id === lab.id ? { ...l, status: newStatus } : l));
        } catch (err) {
            console.error('Failed to toggle status:', err);
            setError('Failed to update lab status. Please try again.');
        }
    };

    const handleDelete = async (lab) => {
        if (!window.confirm(`Are you sure you want to delete "${lab.lab_name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete(`/labs/${lab.id}`);
            setLabs(labs.filter(l => l.id !== lab.id));
        } catch (err) {
            console.error('Failed to delete lab:', err);
            if (err.response?.data?.error?.includes('allocations') || err.response?.data?.error?.includes('foreign key')) {
                setError('Cannot delete lab. It has existing allocations.');
            } else {
                setError(err.response?.data?.error || 'Failed to delete lab. Please try again.');
            }
        }
    };

    return (
        <AdminLayout title="Labs Management">
            <PageHeader
                title="Labs Management"
                description="Manage computer labs for placement assessments and seat allocations."
                actions={
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-zinc-900 hover:bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus size={16} strokeWidth={1.5} /> Add Lab
                    </button>
                }
            />

            {/* Error Alert */}
            {error && !showModal && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                        <p className="text-red-800 font-semibold text-sm">Error</p>
                        <p className="text-red-600 text-sm mt-0.5">{error}</p>
                    </div>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                        <X size={18} strokeWidth={1.5} />
                    </button>
                </div>
            )}

            {/* Labs Table */}
            {loading ? (
                <div className="p-12 text-center text-zinc-400">Loading labs...</div>
            ) : labs.length === 0 ? (
                <EmptyState
                    title="No Labs Found"
                    description="Get started by creating your first computer lab for placement assessments."
                    icon={Beaker}
                />
            ) : (
                <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Lab Name</th>
                                    <th className="px-6 py-4">Capacity</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {labs.map(lab => (
                                    <tr key={lab.id} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-600">
                                                    <Beaker size={20} strokeWidth={1.5} />
                                                </div>
                                                <div className="font-semibold text-zinc-900">{lab.lab_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-zinc-600 font-mono text-sm">
                                                {lab.capacity} seats
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(lab)}
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${lab.status === 'enabled'
                                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 hover:bg-emerald-100'
                                                    : 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-300/50 hover:bg-zinc-200'
                                                    }`}
                                            >
                                                <Power size={14} strokeWidth={1.5} />
                                                {lab.status === 'enabled' ? 'Enabled' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(lab)}
                                                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                                    title="Edit Lab"
                                                >
                                                    <Edit2 size={16} strokeWidth={1.5} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(lab)}
                                                    className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Delete Lab"
                                                >
                                                    <Trash2 size={16} strokeWidth={1.5} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h3 className="text-lg font-bold text-zinc-900">
                                {editingLab ? 'Edit Lab' : 'Add New Lab'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {error && (
                                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                    <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">
                                        Lab Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lab_name}
                                        onChange={(e) => setFormData({ ...formData, lab_name: e.target.value })}
                                        placeholder="e.g., Lab 501"
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">
                                        Capacity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        placeholder="e.g., 60"
                                        min="1"
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                                        disabled={submitting}
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Number of seats available in this lab</p>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-black shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : editingLab ? 'Update Lab' : 'Create Lab'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
