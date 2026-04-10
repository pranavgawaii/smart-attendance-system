import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import logo from '../assets/mitadtlogo.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            } else if (user.role === 'coordinator_admin') {
                navigate('/admin/coordinators');
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 font-['Inter'] selection:bg-rose-100 selection:text-rose-900 relative overflow-hidden">

            {/* Ambient Background - Subtle Premium Feel */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white to-transparent opacity-60"></div>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-rose-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 mix-blend-multiply"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-100/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 mix-blend-multiply"></div>
                {/* Subtle Grid */}
                <div className="absolute inset-0 opacity-[0.3]"
                    style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-[440px] bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] rounded-3xl p-8 md:p-10 relative z-10 transition-all duration-300 hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] hover:bg-white/90">

                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 mb-6 bg-white rounded-2xl shadow-sm border border-zinc-100 ring-1 ring-zinc-50">
                        <img src={logo} alt="MIT ADT" className="h-12 w-auto object-contain" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 font-['Inter']">
                            Training & Placement Cell
                        </h1>
                        <p className="text-zinc-500 text-sm font-medium tracking-normal">
                            Please sign in to access your dashboard
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-rose-50/80 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium border border-rose-100 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-rose-600" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">University Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-[3px] focus:ring-rose-100 focus:border-rose-400 outline-none text-zinc-900 placeholder:text-zinc-400 text-sm transition-all hover:bg-white hover:border-zinc-300"
                            placeholder="Enter your university email"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Password</label>
                            <a href="#" className="text-xs font-medium text-rose-600 hover:text-rose-700 transition-colors">Forgot?</a>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-[3px] focus:ring-rose-100 focus:border-rose-400 outline-none text-zinc-900 placeholder:text-zinc-400 text-sm transition-all hover:bg-white hover:border-zinc-300 pr-10"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group w-full relative overflow-hidden bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-zinc-900/10 hover:shadow-zinc-900/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2 active:scale-[0.99] border border-transparent"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {isLoading ? 'Authenticating...' : 'Sign In'}
                            {!isLoading && <ArrowRight size={16} className="text-zinc-300 group-hover:text-white transition-colors" />}
                        </span>
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-dashed border-zinc-200 text-center">
                    <p className="text-xs text-zinc-400 font-medium">
                        &copy; {new Date().getFullYear()} MIT Art, Design & Technology University
                    </p>
                </div>
            </div>
        </div>
    );
}
