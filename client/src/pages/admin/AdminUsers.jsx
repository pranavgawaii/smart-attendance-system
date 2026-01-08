import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { Search, Filter, Edit2, Ban, CheckCircle, Plus, Eye } from 'lucide-react';
import AddStudentModal from '../../components/admin/AddStudentModal';
import { Link } from 'react-router-dom';
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
        fetchUsers();
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

    const headerActions = (
        <button
            onClick={() => setShowAddModal(true)}
            style={{
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <Plus size={18} /> Add Student
        </button>
    );

    return (
        <AdminLayout title="User Management" actions={headerActions}>

            {/* Controls */}
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by Name, Email, or Enrollment..."
                        style={{
                            width: '100%',
                            padding: '0.85rem 1rem 0.85rem 3rem',
                            borderRadius: '12px',
                            border: '1px solid #cbd5e1',
                            fontSize: '1rem',
                            outline: 'none',
                            background: '#f8fafc',
                            color: '#334155'
                        }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                    {['ALL', '3', '4'].map((yr) => (
                        <button
                            key={yr}
                            onClick={() => setYearFilter(yr)}
                            style={{
                                background: yearFilter === yr ? 'white' : 'transparent',
                                color: yearFilter === yr ? '#4c1d95' : '#64748b',
                                border: 'none',
                                padding: '0.6rem 1.25rem',
                                borderRadius: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: yearFilter === yr ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s',
                                fontSize: '0.9rem'
                            }}
                        >
                            {yr === 'ALL' ? 'All Years' : yr === '3' ? '3rd Year' : 'Final Year'}
                        </button>
                    ))}
                </div>
            </div>



            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '12px 0 0 12px' }}>Enrollment</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Branch</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Year</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '0 12px 12px 0' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading users...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No users found matching filters.</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} style={{ opacity: user.user_status === 'disabled' ? 0.6 : 1, transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', color: '#475569', fontWeight: '500' }}>
                                        {user.enrollment_no || '-'}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{user.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>{user.email}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{user.branch || '-'}</td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                                        {user.academic_year ? (user.academic_year === 3 ? '3rd Year' : user.academic_year === 4 ? 'Final Year' : user.academic_year) : '-'}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            letterSpacing: '0.02em',
                                            color: user.user_status === 'active' || !user.user_status ? '#15803d' : '#b91c1c',
                                            backgroundColor: user.user_status === 'active' || !user.user_status ? '#dcfce7' : '#fee2e2'
                                        }}>
                                            {(user.user_status || 'ACTIVE').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <Link
                                                to={`/admin/students/${user.id}`}
                                                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="View Profile"
                                            >
                                                <Eye size={16} />
                                            </Link>
                                            <button
                                                onClick={() => setEditUser(user)}
                                                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Edit User"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(user)}
                                                style={{
                                                    padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                                    background: user.user_status === 'disabled' ? '#22c55e' : '#ef4444',
                                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                                title={user.user_status === 'disabled' ? 'Enable Account' : 'Disable Account'}
                                            >
                                                {user.user_status === 'disabled' ? <CheckCircle size={16} /> : <Ban size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {
                editUser && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{ background: 'white', width: '90%', maxWidth: '500px', padding: '2rem', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a', fontSize: '1.5rem' }}>Edit User</h2>
                            <form onSubmit={handleSaveUser}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Name</label>
                                    <input
                                        value={editUser.name}
                                        onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Enrollment Number</label>
                                    <input
                                        value={editUser.enrollment_no || ''}
                                        onChange={e => setEditUser({ ...editUser, enrollment_no: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Branch</label>
                                        <input
                                            value={editUser.branch || ''}
                                            onChange={e => setEditUser({ ...editUser, branch: e.target.value })}
                                            placeholder="e.g. CSE"
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Academic Year</label>
                                        <select
                                            value={editUser.academic_year || ''}
                                            onChange={e => setEditUser({ ...editUser, academic_year: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white' }}
                                        >
                                            <option value="">Select Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">Final Year</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" onClick={() => setEditUser(null)} style={{ background: 'white', color: '#475569', border: '1px solid #cbd5e1', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ background: '#4c1d95', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(76, 29, 149, 0.4)' }}>Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Add Student Modal */}
            {
                showAddModal && (
                    <AddStudentModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            fetchUsers();
                        }}
                    />
                )
            }
        </AdminLayout >
    );
}
