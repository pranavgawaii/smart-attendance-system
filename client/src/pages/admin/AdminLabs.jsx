import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { Plus, Edit2, CheckCircle, Ban, Monitor, Server, X } from 'lucide-react';
import StatsCard from '../../components/StatsCard';

export default function AdminLabs() {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ id: null, name: '', total_seats: '' });
    const [isEditing, setIsEditing] = useState(false);

    const fetchLabs = async () => {
        try {
            const res = await api.get('/labs');
            setLabs(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch labs', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchLabs();
        }, 0);

        return () => {
            clearTimeout(timeoutId);
        };
    }, []);

    const handleOpenCreate = () => {
        setFormData({ id: null, name: '', total_seats: '' });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleOpenEdit = (lab) => {
        setFormData({ id: lab.id, name: lab.name, total_seats: lab.total_seats });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                total_seats: parseInt(formData.total_seats)
            };

            if (isEditing) {
                await api.put(`/labs/${formData.id}`, payload);
            } else {
                await api.post('/labs', payload);
            }

            setShowModal(false);
            fetchLabs();
        } catch (error) {
            console.error('Save failed', error);
            alert(error.response?.data?.error || 'Failed to save lab');
        }
    };

    const toggleStatus = async (lab) => {
        const newStatus = lab.status === 'active' ? 'disabled' : 'active';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'disabled' ? 'DISABLE' : 'ENABLE'} ${lab.name}?`)) return;

        try {
            await api.put(`/labs/${lab.id}`, { ...lab, status: newStatus });
            fetchLabs();
        } catch (error) {
            console.error('Status update failed', error);
            alert('Failed to update status');
        }
    };

    const totalCapacity = labs.reduce((acc, lab) => acc + (lab.status === 'active' ? lab.total_seats : 0), 0);
    const activeLabs = labs.filter(l => l.status === 'active').length;

    return (
        <AdminLayout title="Labs">
            <PageHeader
                title="Infrastructure & Labs"
                description="Manage computer labs, seating capacities, and operational status."
                actions={
                    <button
                        onClick={handleOpenCreate}
                        className="bg-zinc-900 hover:bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus size={16} strokeWidth={1.5} /> Add Lab
                    </button>
                }
            />

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    title="Total Capacity"
                    value={totalCapacity}
                    icon={Server}
                    iconColor="text-zinc-600"
                    iconBg="bg-zinc-100"
                    trendLabel="seats available"
                />
                <StatsCard
                    title="Active Labs"
                    value={activeLabs}
                    icon={Monitor}
                    iconColor="text-zinc-900"
                    iconBg="bg-zinc-100"
                />
            </div>

            {loading ? (
                <div className="p-12 text-center text-zinc-400">Loading labs...</div>
            ) : labs.length === 0 ? (
                <EmptyState
                    title="No Labs Configured"
                    description="Add a computer lab to start planning seating allocations."
                    actionLabel="Add New Lab"
                    actionLink="#" // We use the button manually
                    icon={Monitor}
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
                                    <tr key={lab.id} className={`hover:bg-zinc-50 transition-colors group ${lab.status === 'disabled' ? 'opacity-60 bg-zinc-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-zinc-100 text-zinc-500">
                                                    <Monitor size={16} strokeWidth={1.5} />
                                                </div>
                                                <div className="font-semibold text-zinc-900">{lab.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 font-medium">
                                            {lab.total_seats} Seats
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={lab.status || 'active'} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEdit(lab)}
                                                    className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                                                    title="Edit Lab"
                                                >
                                                    <Edit2 size={16} strokeWidth={1.5} />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(lab)}
                                                    className={`
                                                        p-2 rounded-lg border transition-colors
                                                        ${lab.status === 'active'
                                                            ? 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                                                            : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                                                        }
                                                    `}
                                                    title={lab.status === 'active' ? 'Disable Lab' : 'Enable Lab'}
                                                >
                                                    {lab.status === 'active' ? <Ban size={16} strokeWidth={1.5} /> : <CheckCircle size={16} strokeWidth={1.5} />}
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h3 className="text-lg font-bold text-zinc-900">{isEditing ? 'Edit Lab' : 'Add New Lab'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Lab Name/Number</label>
                                    <input
                                        placeholder="e.g. N-516"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Total Capacity</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 60"
                                        value={formData.total_seats}
                                        onChange={e => setFormData({ ...formData, total_seats: e.target.value })}
                                        required
                                        min="1"
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                                    />
                                </div>

                                <div className="flex gap-3 justify-end mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-black shadow-sm transition-colors"
                                    >
                                        {isEditing ? 'Save Changes' : 'Add Lab'}
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
