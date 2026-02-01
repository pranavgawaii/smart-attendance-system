import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [domain, setDomain] = useState('@gmail.com');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { requestOTP, verifyOTP } = useAuth();
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
                // Not using alert, just filling it in
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
        <div className="min-h-screen flex flex-col bg-zinc-50 font-sans selection:bg-zinc-200">

            {/* Header */}
            <div className="py-6 bg-white border-b border-zinc-200 flex flex-col items-center justify-center gap-2">
                <img src="/mitadtlogo.png" alt="MIT Logo" className="h-12" />
                <div className="text-center">
                    <h1 className="text-lg font-bold text-zinc-900 uppercase tracking-widest">Training & Placement Cell</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-10">

                    <h2 className="text-2xl font-bold text-zinc-900 mb-2 tracking-tight">Student Access Portal</h2>
                    <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
                        Sign in using your official university email to access placement activities.
                    </p>

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-100 flex items-center gap-2 font-medium">
                            ⚠️ {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleRequestOtp} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 mb-2">University Email</label>
                                <div className="flex shadow-sm rounded-lg overflow-hidden">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Username"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-white border border-zinc-300 border-r-0 rounded-l-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 outline-none text-zinc-900 placeholder:text-zinc-400 text-sm transition-all"
                                    />
                                    <select
                                        value={domain}
                                        onChange={e => setDomain(e.target.value)}
                                        className="px-3 bg-zinc-50 border border-zinc-300 rounded-r-lg text-zinc-600 text-sm font-medium focus:outline-none cursor-pointer hover:bg-zinc-100 transition-colors"
                                    >
                                        <option value="@gmail.com">@gmail.com</option>
                                        <option value="@students.mituniversity.edu.in">@students.mituniversity.edu.in</option>
                                        <option value="@test.com">@test.com</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 mb-2">Verification Code</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="000000"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    maxLength={6}
                                    className="w-full px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 outline-none text-zinc-900 placeholder:text-zinc-200 transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Verifying...' : 'Access Portal'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-zinc-500 hover:text-zinc-900 text-sm transition-colors mt-4 font-medium"
                            >
                                Change email address
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div className="py-6 text-center text-xs text-zinc-400 bg-white border-t border-zinc-200">
                &copy; 2026 MIT Art, Design and Technology University. All rights reserved.
            </div>
        </div>
    );
}
