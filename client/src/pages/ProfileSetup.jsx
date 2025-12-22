import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfileSetup() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        enrollment_no: '',
        branch: 'CS'
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/users/profile', formData);
            if (res.data.token) {
                login(res.data.token); // Update context with new user data
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-grey)' }}>

            {/* Header */}
            <div className="mit-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src="/mitadtlogo.png" alt="MIT ADT Logo" className="mit-logo" />
                    <div>
                        <h1 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Smart Attendance</h1>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div className="mit-card" style={{ width: '100%', maxWidth: '500px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--mit-purple)', marginBottom: '0.5rem' }}>Complete Your Profile</h2>
                        <p style={{ color: 'var(--text-light)' }}>Please enter your academic details to continue.</p>
                    </div>

                    {error && <div style={{ marginBottom: '1rem', color: 'var(--error-red)', textAlign: 'center' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name</label>
                            <input
                                className="mit-input"
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Rohini Sharma"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Enrollment Number</label>
                            <input
                                className="mit-input"
                                type="text"
                                name="enrollment_no"
                                required
                                value={formData.enrollment_no}
                                onChange={handleChange}
                                placeholder="e.g. MIT12345678"
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Branch</label>
                            <select
                                className="mit-input"
                                name="branch"
                                value={formData.branch}
                                onChange={handleChange}
                                style={{ background: 'white' }}
                            >
                                <option value="CS">Computer Science</option>
                                <option value="IT">Information Technology</option>
                                <option value="ECE">Electronics (ECE)</option>
                                <option value="EE">Electrical (EE)</option>
                                <option value="ME">Mechanical</option>
                            </select>
                        </div>

                        <button type="submit" className="mit-btn" style={{ width: '100%' }}>Save & Continue</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
