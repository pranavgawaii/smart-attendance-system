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
    const { login, requestOTP, verifyOTP } = useAuth();
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const fullEmail = `${username}${domain}`;
        setEmail(fullEmail);
        try {
            const res = await requestOTP(fullEmail);
            console.log('OTP Response:', res.data);

            if (res.data.is_test) {
                alert(`✅ Test Mode!\n\nEmail: ${fullEmail}\nOTP: 123456`);
                setOtp('123456');
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
            const data = await verifyOTP(email, otp);
            const { user: userData } = data;

            // Redirect based on role or profile completeness
            if (userData.role === 'admin' || userData.role === 'super_admin') {
                navigate('/admin');
            } else if (!userData.enrollment_no) {
                navigate('/profile-setup');
            } else {
                navigate('/student');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP');
            setIsLoading(false);
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>

            {/* Minimal Header */}
            <div style={{ padding: '1.5rem 2rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
                <img src="/mitadtlogo.png" alt="MIT Logo" style={{ height: '52px' }} />
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.125rem', margin: 0, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Training & Placement Cell</h1>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#f8fafc' }}>
                <div className="mit-card" style={{ width: '100%', maxWidth: '420px', textAlign: 'center', padding: '3rem 2.5rem', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', borderRadius: '16px' }}>

                    <h2 style={{ color: '#0f172a', marginTop: '0', marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.025em' }}>Student Access Portal</h2>
                    <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: '1.6' }}>
                        Sign in using your official university email to access placement activities.
                    </p>

                    {error && <div style={{ marginBottom: '1.5rem', color: '#b91c1c', background: '#fef2f2', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #fecaca', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚠️ {error}</div>}

                    {step === 1 ? (
                        <form onSubmit={handleRequestOtp}>
                            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '600', fontSize: '0.9rem' }}>University Email / Personal Email</label>
                                <div style={{ display: 'flex', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                                    <input
                                        className="mit-input"
                                        type="text"
                                        required
                                        placeholder="Username / Enrollment"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        style={{
                                            flex: '1 1 70%',
                                            height: '48px',
                                            fontSize: '0.95rem',
                                            borderColor: '#cbd5e1',
                                            color: '#1e293b',
                                            background: '#ffffff',
                                            borderTopRightRadius: 0,
                                            borderBottomRightRadius: 0,
                                            borderRight: 'none',
                                            borderTopLeftRadius: '8px',
                                            borderBottomLeftRadius: '8px',
                                            padding: '0 1rem',
                                            borderWidth: '1px',
                                            borderStyle: 'solid',
                                            minWidth: '0' // Prevent overflow
                                        }}
                                    />
                                    <select
                                        value={domain}
                                        onChange={e => setDomain(e.target.value)}
                                        style={{
                                            flex: '0 0 35%', // Slightly more than 30 to accommodate longer domain text if needed, or stick to 30. User said 70-30.
                                            // Let's use 30% as requested but ensure text truncation or clear fit.
                                            height: '48px',
                                            fontSize: '0.9rem',
                                            borderColor: '#cbd5e1',
                                            color: '#475569',
                                            background: '#f8fafc',
                                            borderTopLeftRadius: 0,
                                            borderBottomLeftRadius: 0,
                                            borderTopRightRadius: '8px',
                                            borderBottomRightRadius: '8px',
                                            padding: '0 0.5rem', // Reduce padding slightly
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            borderWidth: '1px',
                                            borderStyle: 'solid',
                                            borderLeft: '1px solid #e2e8f0'
                                        }}
                                        className="mit-input"
                                    >
                                        <option value="@gmail.com">@gmail.com</option>
                                        <option value="@students.mituniversity.edu.in">@students.mituniversity.edu.in</option>
                                        <option value="@test.com">@test.com</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="mit-btn" style={{ width: '100%', height: '48px', fontSize: '1rem', justifyContent: 'center', fontWeight: '600', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s', marginTop: '0.5rem' }} disabled={isLoading}>
                                {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp}>
                            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '600', fontSize: '0.9rem' }}>Verification Code</label>
                                <input
                                    className="mit-input"
                                    type="text"
                                    required
                                    placeholder="Enter 6-digit code"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    disabled={isLoading}
                                    style={{ height: '48px', letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem', fontWeight: '700', borderColor: '#cbd5e1', color: '#1e293b', background: '#ffffff', borderRadius: '8px', width: '100%', padding: '0 1rem', borderStyle: 'solid', borderWidth: '1px' }}
                                    maxLength={6}
                                />
                            </div>
                            <button type="submit" className="mit-btn" style={{ width: '100%', height: '48px', fontSize: '1rem', justifyContent: 'center', fontWeight: '600', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }} disabled={isLoading}>
                                {isLoading ? 'Verifying...' : 'Access Portal'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: '#64748b', fontSize: '0.9rem', width: '100%', cursor: 'pointer', fontWeight: '500' }}
                            >
                                <span style={{ textDecoration: 'underline' }}>Change email address</span>
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', borderTop: '1px solid #e2e8f0', background: 'white' }}>
                &copy; 2026 MIT Art, Design and Technology University. All rights reserved.
            </div>
        </div>
    );
}
