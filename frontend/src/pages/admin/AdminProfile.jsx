import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminProfile() {
    const { login } = useAuth();
    const [user, setUser] = useState({ name: '', email: '', role: '' });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/profile');
            setUser(res.data);
        } catch (err) {
            console.error('Failed to fetch profile', err);
            setMessage({ type: 'error', text: 'Failed to load profile data.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setIsSaving(true);

        try {
            const res = await api.put('/users/profile', {
                name: user.name
                // Admin doesn't have enrollment_no
            });

            // Update Auth Context if token refreshed
            if (res.data.token) {
                login(res.data.token);
            }

            setUser(prev => ({ ...prev, ...res.data.user }));
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            console.error('Update error', err);
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', color: '#64748b' }}>Loading profile...</div>;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

            {/* Header Card */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                borderRadius: '24px',
                padding: '3rem',
                color: 'white',
                marginBottom: '2rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem'
            }}>
                <div style={{
                    width: '100px', height: '100px',
                    borderRadius: '50%',
                    background: 'white',
                    color: '#1e293b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2.5rem', fontWeight: '800',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', opacity: 0.8 }}>
                        <Shield size={16} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Administrator</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, lineHeight: 1 }}>{user.name}</h1>
                    <p style={{ margin: '0.5rem 0 0', opacity: 0.8, fontSize: '1.1rem' }}>Manage your account details and security.</p>
                </div>
            </div>

            {/* Form Card */}
            <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '2.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <User size={24} color="#4c1d95" />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Account Information</h2>
                </div>

                {message.text && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '2rem',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: message.type === 'success' ? '#166534' : '#991b1b',
                        border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                    }}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Email Field (Read Only) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Email Address</label>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '0.875rem 1rem', background: '#f8fafc',
                                borderRadius: '12px', border: '1px solid #e2e8f0',
                                color: '#94a3b8'
                            }}>
                                <Mail size={18} />
                                {user.email}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Email cannot be changed directly.</span>
                        </div>

                        {/* Name Field */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>Full Name</label>
                            <input
                                type="text"
                                value={user.name}
                                onChange={(e) => setUser({ ...user, name: e.target.value })}
                                style={{
                                    padding: '0.875rem 1rem', borderRadius: '12px',
                                    border: '1px solid #cbd5e1', fontSize: '1rem',
                                    outline: 'none', transition: 'border-color 0.2s',
                                    color: '#0f172a'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#4c1d95'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="submit"
                            disabled={isSaving}
                            style={{
                                background: '#4c1d95',
                                color: 'white',
                                border: 'none',
                                padding: '1rem 2rem',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: isSaving ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                transition: 'background 0.2s',
                                opacity: isSaving ? 0.8 : 1
                            }}
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
