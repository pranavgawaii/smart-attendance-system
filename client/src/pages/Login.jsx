import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

export default function Login() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/request-otp', { email });
            // For Dev: pre-fill OTP if returned
            if (res.data.dev_otp) {
                alert(`Dev OTP: ${res.data.dev_otp}`);
                setOtp(res.data.dev_otp);
            }
            setStep(2);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/verify-otp', { email, otp });
            const token = res.data.token;
            login(token);

            // Redirect based on role or profile completeness
            const decoded = jwtDecode(token);
            if (decoded.role === 'admin') {
                navigate('/admin');
            } else if (!decoded.enrollment_no) {
                navigate('/profile-setup');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP');
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-grey)' }}>

            {/* Minimal Header */}
            <div style={{ padding: '1rem 2rem', background: 'white', borderBottom: '1px solid #eee' }}>
                <img src="/mitadtlogo.png" alt="MIT Logo" style={{ height: '40px' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div className="mit-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>

                    <h2 style={{ color: 'var(--mit-purple)', marginTop: '0.5rem' }}>Student Login</h2>
                    <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>Sign in with your university email</p>

                    {error && <div style={{ marginBottom: '1rem', color: 'var(--error-red)', background: '#ffebee', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

                    {step === 1 ? (
                        <form onSubmit={handleRequestOtp}>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dark)', fontWeight: '500' }}>Email Address</label>
                                <input
                                    className="mit-input"
                                    type="email"
                                    required
                                    placeholder="student@mitadt.edu.in"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="mit-btn" style={{ width: '100%' }}>Send Verification Code</button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp}>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dark)', fontWeight: '500' }}>Enter OTP</label>
                                <input
                                    className="mit-input"
                                    type="text"
                                    required
                                    placeholder="123456"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="mit-btn" style={{ width: '100%' }}>Verify & Login</button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-light)', textDecoration: 'underline', width: '100%' }}
                            >
                                Change Email
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div style={{ padding: '1rem', textAlign: 'center', color: '#999', fontSize: '0.8rem' }}>
                &copy; 2024 MIT Art, Design and Technology University. All rights reserved.
            </div>
        </div>
    );
}
