import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Plus, Building2, Calendar, Users, ArrowRight, Trash2, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminPlacements() {
    const { token } = useAuth();
    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDrives();
    }, []);

    const fetchDrives = async () => {
        try {
            const response = await fetch('/api/placement/drives', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errText = await response.text();
                console.error('Fetch Error:', {
                    url: response.url,
                    status: response.status,
                    text: errText
                });
                // Check if HTML
                if (errText.trim().startsWith('<')) {
                    throw new Error(`API Error: Endpoint returned HTML instead of JSON. (Status: ${response.status})`);
                }
                throw new Error(`Failed: ${response.status} ${response.statusText} - ${errText}`);
            }
            const data = await response.json();
            setDrives(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this drive? This cannot be undone.')) return;

        try {
            const response = await fetch(`/api/placement/admin/drives/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete drive');

            setDrives(drives.filter(d => d.id !== id));
        } catch (err) {
            alert('Error deleting drive: ' + err.message);
        }
    };

    return (
        <AdminLayout
            title="Placement Drives"
            actions={
                <Link to="/admin/placements/create" style={{ textDecoration: 'none' }}>
                    <button style={{
                        background: '#4c1d95',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(76, 29, 149, 0.3)'
                    }}>
                        <Plus size={20} /> New Drive
                    </button>
                </Link>
            }
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading placements...</div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>Error: {error}</div>
            ) : drives.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                    <Building2 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>No placement drives found. Create your first one!</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Company</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Role</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Type</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Stipend/CTC</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Deadline</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drives.map(drive => {
                                const isExpired = new Date(drive.deadline) < new Date();
                                return (
                                    <tr key={drive.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                    <Building2 size={20} />
                                                </div>
                                                {drive.company_name}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#334155' }}>{drive.role}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                                                background: drive.job_type === 'INTERNSHIP' ? '#eff6ff' : '#f0fdf4',
                                                color: drive.job_type === 'INTERNSHIP' ? '#2563eb' : '#16a34a'
                                            }}>
                                                {drive.job_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#64748b' }}>{drive.stipend_ctc || '-'}</td>
                                        <td style={{ padding: '1rem', color: '#64748b' }}>
                                            {new Date(drive.deadline).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                                                    background: isExpired ? '#fef2f2' : '#f0fdf4',
                                                    color: isExpired ? '#ef4444' : '#16a34a',
                                                    border: isExpired ? '1px solid #fecaca' : '1px solid #bbf7d0'
                                                }}>
                                                    {isExpired ? 'CLOSED' : 'OPEN'}
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(drive.id)}
                                                    style={{
                                                        background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444',
                                                        padding: '4px', borderRadius: '4px'
                                                    }}
                                                    title="Delete Drive"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <Link
                                                    to={`/admin/placements/edit/${drive.id}`}
                                                    style={{
                                                        color: '#2563eb', padding: '4px', display: 'flex', alignItems: 'center'
                                                    }}
                                                    title="Edit Drive"
                                                >
                                                    <Edit2 size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
}
