import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

export default function Login() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [domain, setDomain] = useState('@gmail.com');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const fullEmail = `${username}${domain}`;
        setEmail(fullEmail); // Store for step 2 verification
        try {
            const res = await api.post('/auth/request-otp', { email: fullEmail });
            console.log('OTP Response:', res.data);

            // For Dev: pre-fill OTP if returned
            if (res.data.dev_otp) {
                alert(`✅ OTP Generated!\n\nCode: ${res.data.dev_otp}\n\n(In production, this will be emailed to you)`);
                setOtp(res.data.dev_otp);
            }
            setStep(2);
        } catch (err) {
            console.error('OTP Request Error:', err);
            setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
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
                navigate('/student');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP');
            setIsLoading(false); // Only stop loading on error, success unmounts
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-grey)' }}>

            {/* Minimal Header */}
            <div style={{ padding: '2rem 1.5rem', background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem' }}>
                <img src="/mitadtlogo.png" alt="MIT Logo" style={{ height: '60px' }} />
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.25rem', margin: 0, color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Training & Placement Cell</h1>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563', fontWeight: '500' }}>Smart Placement Portal</p>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#f3f4f6' }}>
                <div className="mit-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2.5rem 2rem', background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: '12px' }}>

                    <h2 style={{ color: '#111827', marginTop: '0', marginBottom: '0.75rem', fontSize: '1.5rem', fontWeight: '700' }}>Student Access Portal</h2>
                    <p style={{ color: '#4b5563', marginBottom: '2rem', fontSize: '1rem', lineHeight: '1.5' }}>
                        Sign in using your official university email to access placement activities.
                    </p>

                    {error && <div style={{ marginBottom: '1.5rem', color: '#b91c1c', background: '#fef2f2', padding: '1rem', borderRadius: '8px', fontSize: '0.95rem', border: '1px solid #fecaca', fontWeight: '500' }}>{error}</div>}

                    {step === 1 ? (
                        <form onSubmit={handleRequestOtp}>
                            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#111827', fontWeight: '600', fontSize: '0.95rem' }}>University Email / Personal Email</label>
                                <div style={{ display: 'flex', gap: '0px' }}>
                                    <input
                                        className="mit-input"
                                        type="text"
                                        required
                                        placeholder="Username / Enrollment"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        style={{
                                            flex: 1,
                                            height: '52px',
                                            fontSize: '1rem',
                                            borderColor: '#d1d5db',
                                            color: '#1f2937',
                                            background: '#ffffff',
                                            borderTopRightRadius: 0,
                                            borderBottomRightRadius: 0,
                                            borderRight: 'none'
                                        }}
                                    />
                                    <select
                                        value={domain}
                                        onChange={e => setDomain(e.target.value)}
                                        style={{
                                            height: '52px',
                                            fontSize: '0.95rem',
                                            borderColor: '#d1d5db',
                                            color: '#4b5563',
                                            background: '#f9fafb',
                                            borderTopLeftRadius: 0,
                                            borderBottomLeftRadius: 0,
                                            padding: '0 1rem',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            maxWidth: '160px'
                                        }}
                                        className="mit-input"
                                    >
                                        <option value="@gmail.com">@gmail.com</option>
                                        <option value="@students.mituniversity.edu.in">@students.mituniversity.edu.in</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="mit-btn" style={{ width: '100%', height: '52px', fontSize: '1.05rem', justifyContent: 'center', fontWeight: 'bold' }} disabled={isLoading}>
                                {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp}>
                            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#111827', fontWeight: '600', fontSize: '0.95rem' }}>Verification Code</label>
                                <input
                                    className="mit-input"
                                    type="text"
                                    required
                                    placeholder="Enter 6-digit code"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    disabled={isLoading}
                                    style={{ height: '52px', letterSpacing: '4px', textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', borderColor: '#d1d5db', color: '#1f2937', background: '#ffffff' }}
                                    maxLength={6}
                                />
                            </div>
                            <button type="submit" className="mit-btn" style={{ width: '100%', height: '52px', fontSize: '1.05rem', justifyContent: 'center', fontWeight: 'bold' }} disabled={isLoading}>
                                {isLoading ? 'Verifying...' : 'Access Portal'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: 'var(--mit-purple)', fontSize: '0.95rem', width: '100%', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline', textUnderlineOffset: '4px' }}
                            >
                                Tried the wrong email? Go back
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
