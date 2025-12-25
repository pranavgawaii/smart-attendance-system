import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { Plus, Edit2, CheckCircle, Ban, Monitor } from 'lucide-react';

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
        fetchLabs();
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

    const actionButtons = (
        <button
            onClick={handleOpenCreate}
            style={{
                background: '#4c1d95',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(76, 29, 149, 0.3)'
            }}
        >
            <Plus size={18} /> Add Lab
        </button>
    );

    return (
        <AdminLayout title="Labs Management" actions={actionButtons}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '12px 0 0 12px' }}>Lab Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Capacity</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', borderRadius: '0 12px 12px 0' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading labs...</td></tr>
                        ) : labs.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No labs found. Add one to get started.</td></tr>
                        ) : (
                            labs.map(lab => (
                                <tr key={lab.id} style={{ opacity: lab.status === 'disabled' ? 0.6 : 1, transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', fontWeight: '600', color: '#0f172a' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ padding: '6px', background: '#f1f5f9', borderRadius: '6px', color: '#475569' }}><Monitor size={16} /></div>
                                            {lab.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{lab.total_seats} Seats</td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            color: (lab.status || 'active') === 'active' ? '#15803d' : '#b91c1c',
                                            background: (lab.status || 'active') === 'active' ? '#dcfce7' : '#fee2e2',
                                            letterSpacing: '0.02em',
                                            textTransform: 'uppercase'
                                        }}>
                                            {lab.status || 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleOpenEdit(lab)}
                                                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Edit Lab"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(lab)}
                                                style={{
                                                    padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                                    background: lab.status === 'active' ? '#ef4444' : '#22c55e',
                                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                                title={lab.status === 'active' ? 'Disable Lab' : 'Enable Lab'}
                                            >
                                                {lab.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{ background: 'white', width: '90%', maxWidth: '400px', padding: '2rem', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a', fontSize: '1.5rem', fontWeight: '700' }}>{isEditing ? 'Edit Lab' : 'Add New Lab'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Lab Name</label>
                                <input
                                    placeholder="e.g. N-516"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                                />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Total Seats</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 60"
                                    value={formData.total_seats}
                                    onChange={e => setFormData({ ...formData, total_seats: e.target.value })}
                                    required
                                    min="1"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', color: '#475569', fontWeight: '600' }}>Cancel</button>
                                <button type="submit" style={{ background: '#4c1d95', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', color: 'white', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(76, 29, 149, 0.4)' }}>Save Lab</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
