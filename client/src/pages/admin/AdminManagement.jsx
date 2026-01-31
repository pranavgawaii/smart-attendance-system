import React, { useState, useEffect } from 'react';
import { Plus, Search, Shield, Trash2, Power, UserCheck, UserX } from 'lucide-react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '' });
    const [error, setError] = useState('');

    const { user } = useAuth();

    useEffect(() => {
        if (user?.role !== 'super_admin') {
            navigate('/admin');
            return;
        }
        fetchAdmins();
    }, [user, navigate]);

    const fetchAdmins = async () => {
        try {
            const res = await api.get('/admin-management');
            // Hide Super Admins (including self) from management list
            const filteredAdmins = res.data.filter(admin => admin.role !== 'super_admin');
            setAdmins(filteredAdmins);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin-management', newAdmin);
            setShowModal(false);
            setNewAdmin({ name: '', email: '' });
            fetchAdmins();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create admin');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
        try {
            await api.put(`/admin-management/${id}/status`, { status: newStatus });
            fetchAdmins();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    return (
        <AdminLayout title="Admin Management">
            {/* Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} size={20} />
                    <input
                        type="text"
                        placeholder="Search admins..."
                        style={{
                            padding: '0.6rem 1rem 0.6rem 2.5rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            width: '300px',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        backgroundColor: '#0f172a',
                        color: 'white',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: '500'
                    }}
                >
                    <Plus size={18} />
                    Add New Admin
                </button>
            </div>

            {/* Admins Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Email</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : admins.map(admin => (
                            <tr key={admin.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem', color: '#0f172a', fontWeight: '500' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                                            <Shield size={16} />
                                        </div>
                                        {admin.name}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', color: '#64748b' }}>{admin.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        backgroundColor: admin.user_status === 'active' ? '#dcfce7' : '#fee2e2',
                                        color: admin.user_status === 'active' ? '#166534' : '#991b1b'
                                    }}>
                                        {admin.user_status?.toUpperCase() || 'ACTIVE'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => toggleStatus(admin.id, admin.user_status || 'active')}
                                        title={admin.user_status === 'active' ? "Disable Account" : "Activate Account"}
                                        style={{
                                            padding: '6px',
                                            borderRadius: '6px',
                                            border: '1px solid #e2e8f0',
                                            backgroundColor: 'white',
                                            cursor: 'pointer',
                                            color: admin.user_status === 'active' ? '#ef4444' : '#16a34a'
                                        }}
                                    >
                                        {admin.user_status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Admin Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '400px' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Add New Admin</h2>
                        {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
                        <form onSubmit={handleCreateAdmin}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newAdmin.name}
                                    onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={newAdmin.email}
                                    onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: 'none', background: '#0f172a', color: 'white', cursor: 'pointer' }}
                                >
                                    Create Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
