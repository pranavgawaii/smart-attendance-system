import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    const [user, setUser] = useState({ name: '', enrollment_no: '', email: '', role: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/profile');
            setUser(res.data);
            setLoading(false);
        } catch {
            setError('Failed to fetch profile');
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line
        fetchProfile();
    }, []);

    const { login } = useAuth(); // Import login from context

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const res = await api.put('/users/profile', {
                name: user.name,
                enrollment_no: user.enrollment_no
            });

            // Update Auth Context with new Token
            if (res.data.token) {
                login(res.data.token);
            }

            setUser(prev => ({ ...prev, ...res.data.user }));
            setMessage('Profile updated successfully!');
        } catch (err) {
            console.error("Profile update error:", err);
            setError(err.response?.data?.error || 'Failed to update profile');
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-grey)' }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--mit-purple)' }}>Loading Profile...</div>
        </div>
    );

    const goBack = () => {
        if (user.role === 'admin' || user.role === 'super_admin') navigate('/admin');
        else navigate('/student');
    };

    // Helper for initials
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-grey)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

            <div className="mit-card" style={{ width: '100%', maxWidth: '500px', padding: '0', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>

                {/* Header Banner */}
                <div style={{ background: 'var(--mit-purple)', padding: '2rem', textAlign: 'center', color: 'white' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'white',
                        borderRadius: '50%',
                        margin: '0 auto 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: 'var(--mit-purple)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                    }}>
                        {getInitials(user.name)}
                    </div>
                    <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{user.name || 'User Profile'}</h1>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>{user.role} Account</span>
                </div>

                <div style={{ padding: '2rem' }}>
                    <button onClick={goBack} style={{ display: 'block', marginBottom: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                        &larr; Return to Dashboard
                    </button>

                    {message && <div style={{ padding: '1rem', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', marginBottom: '1.5rem', border: '1px solid #c8e6c9', fontSize: '0.9rem' }}>{message}</div>}
                    {error && <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '1.5rem', border: '1px solid #ffcdd2', fontSize: '0.9rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>Email Address</label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="mit-input"
                                style={{ background: '#f9f9f9', color: '#666', cursor: 'not-allowed' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>Full Name</label>
                            <input
                                type="text"
                                value={user.name}
                                onChange={(e) => setUser({ ...user, name: e.target.value })}
                                required
                                className="mit-input"
                                placeholder="Enter your full name"
                            />
                        </div>

                        {(user.role !== 'admin' && user.role !== 'super_admin') && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>Enrollment Number</label>
                                <input
                                    type="text"
                                    value={user.enrollment_no || ''}
                                    onChange={(e) => setUser({ ...user, enrollment_no: e.target.value })}
                                    required
                                    className="mit-input"
                                    placeholder="e.g. 12345678"
                                />
                            </div>
                        )}

                        <div style={{ marginTop: '2.5rem' }}>
                            <button type="submit" className="mit-btn" style={{ width: '100%', padding: '1rem' }}>
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
