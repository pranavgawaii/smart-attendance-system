import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Search, Filter, Edit2, Ban, CheckCircle, Plus, Eye, MoreHorizontal, UserCheck, X } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import AddStudentModal from '../../components/admin/AddStudentModal';
import StatsCard from '../../components/StatsCard';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [yearFilter, setYearFilter] = useState('ALL'); // ALL, 3, 4
    const [editUser, setEditUser] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            // Filter out admins (role !== 'admin')
            const studentsOnly = res.data.filter(u => u.role !== 'admin');
            setUsers(studentsOnly);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch users', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchUsers();
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: editUser.name,
                enrollment_no: editUser.enrollment_no,
                branch: editUser.branch,
                academic_year: editUser.academic_year ? parseInt(editUser.academic_year) : null,
                user_status: editUser.user_status
            };
            const res = await api.put(`/users/${editUser.id}`, payload);

            // Update local state
            setUsers(prev => prev.map(u => u.id === res.data.id ? res.data : u));
            setEditUser(null);
        } catch (error) {
            console.error('Update failed', error);
            alert('Failed to update user');
        }
    };

    const toggleStatus = async (user) => {
        const newStatus = user.user_status === 'disabled' ? 'active' : 'disabled';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'disabled' ? 'DISABLE' : 'ENABLE'} this user?`)) return;

        try {
            const res = await api.put(`/users/${user.id}`, { ...user, user_status: newStatus });
            setUsers(prev => prev.map(u => u.id === res.data.id ? res.data : u));
        } catch (error) {
            console.error('Status update failed', error);
        }
    };

    const filteredUsers = users.filter(user => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            (user.name?.toLowerCase() || '').includes(search) ||
            (user.enrollment_no?.toLowerCase() || '').includes(search) ||
            (user.email?.toLowerCase() || '').includes(search);

        let matchesYear = true;
        if (yearFilter !== 'ALL') {
            matchesYear = user.academic_year == yearFilter;
        }

        return matchesSearch && matchesYear;
    });

    const activeStudents = users.filter(u => !u.user_status || u.user_status === 'active').length;

    return (
        <AdminLayout title="Students">
            <PageHeader
                title="Student Directory"
                description="Manage student records, enrollment details, and account access."
                actions={
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg font-medium text-xs transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus size={14} strokeWidth={1.5} /> Add Student
                    </button>
                }
            />

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    title="Total Students"
                    value={users.length}
                    icon={UserCheck}
                    iconColor="text-zinc-600"
                    iconBg="bg-zinc-100"
                />
                <StatsCard
                    title="Active Accounts"
                    value={activeStudents}
                    icon={CheckCircle}
                    iconColor="text-zinc-900"
                    iconBg="bg-zinc-100"
                />
                <StatsCard
                    title="Disabled"
                    value={users.length - activeStudents}
                    icon={Ban}
                    iconColor="text-zinc-400"
                    iconBg="bg-zinc-100"
                />
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
                <div className="relative w-full sm:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" size={16} strokeWidth={1.5} />
                    <input
                        type="text"
                        placeholder="Search by Name, Email, or Enrollment..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium focus:border-zinc-400 focus:ring-2 focus:ring-zinc-50 outline-none transition-all shadow-sm placeholder:font-normal"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex bg-white p-1 rounded-lg border border-zinc-200 shadow-sm">
                    {['ALL', '3', '4'].map((yr) => (
                        <button
                            key={yr}
                            onClick={() => setYearFilter(yr)}
                            className={`
                                px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold transition-all
                                ${yearFilter === yr
                                    ? 'bg-zinc-900 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                }
                            `}
                        >
                            {yr === 'ALL' ? 'All' : yr === '3' ? '3rd Year' : 'Final Year'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-zinc-200/60 rounded-xl shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-200 text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Enrollment</th>
                                <th className="px-6 py-4">Student Name</th>
                                <th className="px-6 py-4">Branch</th>
                                <th className="px-6 py-4">Year</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-zinc-400">Loading directory...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-zinc-400">No students found matching your search.</td></tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className={`hover:bg-zinc-50 transition-colors group ${user.user_status === 'disabled' ? 'opacity-60 bg-zinc-50/50' : ''}`}>
                                        <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                                            {user.enrollment_no || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-zinc-900">{user.name}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 text-sm whitespace-nowrap">{user.branch || '-'}</td>
                                        <td className="px-6 py-4 text-zinc-600 text-sm">
                                            {user.academic_year ? (user.academic_year === 3 ? '3rd Year' : user.academic_year === 4 ? 'Final Year' : user.academic_year) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={user.user_status || 'active'} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    to={`/admin/students/${user.id}`}
                                                    className="p-1.5 rounded-md bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
                                                    title="View Profile"
                                                >
                                                    <Eye size={14} strokeWidth={1.5} />
                                                </Link>
                                                <button
                                                    onClick={() => setEditUser(user)}
                                                    className="p-1.5 rounded-md bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
                                                    title="Edit Details"
                                                >
                                                    <Edit2 size={14} strokeWidth={1.5} />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(user)}
                                                    className={`
                                                        p-1.5 rounded-md border transition-colors shadow-sm
                                                        ${user.user_status === 'disabled'
                                                            ? 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                                                            : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                                                        }
                                                    `}
                                                    title={user.user_status === 'disabled' ? 'Enable Account' : 'Disable Account'}
                                                >
                                                    {user.user_status === 'disabled' ? <CheckCircle size={14} strokeWidth={1.5} /> : <Ban size={14} strokeWidth={1.5} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h2 className="text-lg font-bold text-zinc-900">Edit Student</h2>
                            <button onClick={() => setEditUser(null)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                <X className="hidden" /> {/* Using hidden to import X logic if needed, but custom close usually preferred */}
                                <span className="text-2xl leading-none">&times;</span>
                            </button>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSaveUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Full Name</label>
                                    <input
                                        value={editUser.name}
                                        onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Enrollment Number</label>
                                    <input
                                        value={editUser.enrollment_no || ''}
                                        onChange={e => setEditUser({ ...editUser, enrollment_no: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">Branch</label>
                                        <input
                                            value={editUser.branch || ''}
                                            onChange={e => setEditUser({ ...editUser, branch: e.target.value })}
                                            placeholder="e.g. CSE"
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">Academic Year</label>
                                        <select
                                            value={editUser.academic_year || ''}
                                            onChange={e => setEditUser({ ...editUser, academic_year: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all bg-white"
                                        >
                                            <option value="">Select Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">Final Year</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setEditUser(null)}
                                        className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-black shadow-sm transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <AddStudentModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchUsers();
                    }}
                />
            )}
        </AdminLayout>
    );
}
