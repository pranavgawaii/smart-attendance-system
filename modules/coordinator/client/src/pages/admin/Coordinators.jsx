import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { Plus, Search, Trash2, FileCheck, X, Loader2, Filter, ChevronDown, UserPlus, FileText, Edit2 } from 'lucide-react';

export default function Coordinators() {
    const navigate = useNavigate();
    const [coordinators, setCoordinators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCoordinator, setEditingCoordinator] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('ALL');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        enrollment_no: '',
        email: '',
        department: '',
        year: ''
    });

    const emptyForm = {
        name: '',
        enrollment_no: '',
        email: '',
        department: '',
        year: ''
    };

    useEffect(() => {
        fetchCoordinators();
    }, []);

    const fetchCoordinators = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/coordinators');
            setCoordinators(res.data);
        } catch (err) {
            console.error('Failed to fetch coordinators:', err);
            if (err.response?.status === 401) {
                setError('Session expired. Please log out and log back in.');
            } else {
                setError('Failed to load coordinators');
            }
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingCoordinator(null);
        setFormData(emptyForm);
        setError('');
    };

    const openAddModal = () => {
        setEditingCoordinator(null);
        setFormData(emptyForm);
        setError('');
        setShowAddModal(true);
    };

    const handleEdit = (coord) => {
        setEditingCoordinator(coord);
        setFormData({
            name: coord.name || '',
            enrollment_no: coord.enrollment_no || '',
            email: coord.email || '',
            department: coord.department || '',
            year: coord.year || ''
        });
        setError('');
        setShowAddModal(true);
    };

    const handleSaveCoordinator = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            if (editingCoordinator) {
                await api.put(`/coordinators/${editingCoordinator.id}`, formData);
                setSuccess('Coordinator updated successfully');
            } else {
                await api.post('/coordinators', formData);
                setSuccess('Coordinator added successfully');
            }

            closeModal();
            await fetchCoordinators();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || `Failed to ${editingCoordinator ? 'update' : 'add'} coordinator`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            await api.delete(`/coordinators/${id}`);
            setSuccess('Coordinator deleted successfully');
            fetchCoordinators();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete coordinator');
        }
    };

    const filteredCoordinators = coordinators.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.enrollment_no.toLowerCase().includes(searchTerm.toLowerCase());
        const matchDept = departmentFilter === 'ALL' || c.department === departmentFilter;
        return matchSearch && matchDept;
    });

    // Professional badge styles (subtle, monochromatic/muted)
    const yearBadge = (year) => {
        const styles = {
            FY: 'bg-zinc-100 text-zinc-600 border-zinc-200',
            SY: 'bg-zinc-100 text-zinc-600 border-zinc-200',
            TY: 'bg-zinc-100 text-zinc-600 border-zinc-200',
            LY: 'bg-zinc-100 text-zinc-600 border-zinc-200'
        };
        return styles[year] || 'bg-zinc-100 text-zinc-600 border-zinc-200';
    };

    const deptBadge = () => {
        return 'bg-white border border-zinc-200 text-zinc-600';
    };

    return (
        <AdminLayout title="Coordinator">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-zinc-900">Coordinator</h1>
                        <p className="text-sm text-zinc-500 mt-1">Manage coordinators for placement activities</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin/coordinators/attendance')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
                        >
                            <FileCheck size={16} />
                            Generate Letter
                        </button>
                        <button
                            onClick={() => navigate('/admin/coordinators/forms')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
                        >
                            <FileText size={16} />
                            PlacePro Forms
                        </button>
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm"
                        >
                            <Plus size={16} />
                            Add Coordinator
                        </button>
                    </div>
                </div>

                {/* Filters & Search - Clean Card Design */}
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by name or enrollment number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all"
                            />
                        </div>
                        <div className="relative w-full md:w-48">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                className="w-full pl-10 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 cursor-pointer text-zinc-700"
                            >
                                <option value="ALL">All Departments</option>
                                <option value="SOC">SOC</option>
                                <option value="SOE">SOE</option>
                                <option value="SODT">SODT</option>
                                <option value="SOM">SOM</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                        </div>
                    </div>
                </div>

                {/* Notifications - Subtle */}
                {error && (
                    <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        {success}
                    </div>
                )}

                {/* Professional Table */}
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-[30%]">Name / Email</th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-[20%]">Enrollment No.</th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-[12%]">Year</th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-[18%]">Department</th>
                                    <th className="text-center py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-[10%]">Edit</th>
                                    <th className="text-right py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-[10%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-zinc-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                                                <span className="text-xs">Loading data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCoordinators.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-zinc-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center">
                                                    <UserPlus className="w-5 h-5 text-zinc-300" />
                                                </div>
                                                <p className="text-sm font-medium text-zinc-600">No coordinators found</p>
                                                <p className="text-xs text-zinc-400">Add a new coordinator to get started</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCoordinators.map((coord) => (
                                        <tr key={coord.id} className="group hover:bg-zinc-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-zinc-900">{coord.name}</span>
                                                    <span className="text-xs text-zinc-500">{coord.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-zinc-600 font-mono tracking-wide">{coord.enrollment_no}</td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${yearBadge(coord.year)}`}>
                                                    {coord.year}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${deptBadge(coord.department)}`}>
                                                    {coord.department}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => handleEdit(coord)}
                                                    className="inline-flex items-center justify-center p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-all"
                                                    title="Edit Coordinator"
                                                >
                                                    <Edit2 size={16} strokeWidth={1.5} />
                                                </button>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleDelete(coord.id, coord.name)}
                                                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete Coordinator"
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
                    {/* Footer Stats */}
                    <div className="bg-zinc-50 border-t border-zinc-100 px-6 py-3 flex items-center justify-between text-xs text-zinc-500">
                        <span>Showing {filteredCoordinators.length} of {coordinators.length} coordinators</span>
                    </div>
                </div>
            </div>

            {/* Clean Modal Design */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-zinc-100 transform transition-all scale-100">
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                            <h2 className="text-base font-semibold text-zinc-900">
                                {editingCoordinator ? 'Edit Coordinator' : 'Add Coordinator'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCoordinator} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400"
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Enrollment Number</label>
                                <input
                                    type="text"
                                    value={formData.enrollment_no}
                                    onChange={(e) => setFormData({ ...formData, enrollment_no: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400"
                                    placeholder="e.g. ADT23SOCB0..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                                    Email Address
                                    <span className="ml-1.5 text-zinc-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400"
                                    placeholder="student@example.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Department</label>
                                    <div className="relative">
                                        <select
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all cursor-pointer"
                                            required
                                        >
                                            <option value="">Select</option>
                                            <option value="SOC">SOC</option>
                                            <option value="SOE">SOE</option>
                                            <option value="SODT">SODT</option>
                                            <option value="SOM">SOM</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Year</label>
                                    <div className="relative">
                                        <select
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all cursor-pointer"
                                            required
                                        >
                                            <option value="">Select</option>
                                            <option value="FY">FY</option>
                                            <option value="SY">SY</option>
                                            <option value="TY">TY</option>
                                            <option value="LY">LY</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">{error}</p>
                            )}

                            <div className="flex gap-3 pt-3 border-t border-zinc-50">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        editingCoordinator ? 'Save Changes' : 'Add Coordinator'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
