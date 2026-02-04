import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithEmail } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = await loginWithEmail(email, password);
            const { user } = data;

            if (user.role === 'admin' || user.role === 'super_admin') {
                navigate('/admin');
            } else if (!user.enrollment_no) {
                navigate('/profile-setup');
            } else {
                navigate('/student');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Invalid email or password');
        } finally {
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
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2 tracking-tight">Login</h2>
                    <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
                        Enter your credentials to access the portal.
                    </p>

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-100 flex items-center gap-2 font-medium">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 outline-none text-zinc-900 placeholder:text-zinc-400 text-sm transition-all"
                                placeholder="name@mituniversity.edu.in"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 outline-none text-zinc-900 placeholder:text-zinc-400 text-sm transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Logging in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
            <div className="py-6 text-center text-xs text-zinc-400 bg-white border-t border-zinc-200">
                &copy; 2026 MIT Art, Design and Technology University. All rights reserved.
            </div>
        </div>
    );
}
