import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { ArrowLeft, Save } from 'lucide-react';

export default function CreateAssessment() {
    const [formData, setFormData] = useState({ title: '', date: '', start_time: '', end_time: '', description: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/assessments', formData);
            navigate(`/admin/assessments/${res.data.id}`);
        } catch (error) {
            console.error('Create failed', error);
            alert('Failed to create assessment');
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Create New Assessment">
            <Link to="/admin/assessments" style={{ textDecoration: 'none', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                <ArrowLeft size={18} /> Back to Assessments
            </Link>

            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '2.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>Assessment Details</h2>
                    <p style={{ margin: 0, color: '#64748b' }}>Set up a new lab test or coding challenge.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Assessment Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Data Structures Lab Test 1"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Start Time</label>
                            <input
                                type="time"
                                value={formData.start_time}
                                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>End Time</label>
                            <input
                                type="time"
                                value={formData.end_time}
                                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Description (Optional)</label>
                        <textarea
                            rows="4"
                            placeholder="Instructions for students..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Link to="/admin/assessments">
                            <button type="button" style={{ background: 'white', color: '#475569', border: '1px solid #cbd5e1', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </Link>
                        <button type="submit" disabled={loading} style={{
                            background: '#4c1d95', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '10px',
                            fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(76, 29, 149, 0.4)',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <Save size={18} /> {loading ? 'Creating...' : 'Create & Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
