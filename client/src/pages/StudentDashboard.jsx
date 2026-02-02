import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/mitadtlogo.png';
import { QrCode, LogOut, MapPin, ClipboardList, Home, History, ScanLine, X, Briefcase, ChevronRight, UserCheck } from 'lucide-react';

export default function StudentDashboard() {
    const { user, logout } = useAuth();

    const [activeAssessment, setActiveAssessment] = useState(null);
    const [myAllocation, setMyAllocation] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('HOME');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [scanResult, setScanResult] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch placement allocations for this student
            const allocationsRes = await api.get(`/allocations/student/${user.id}`);
            if (allocationsRes.data && allocationsRes.data.length > 0) {
                const nextAllocation = allocationsRes.data[0]; // First upcoming allocation
                setActiveAssessment({
                    title: `${nextAllocation.placement_assessment.company_name}${nextAllocation.placement_assessment.position ? ` - ${nextAllocation.placement_assessment.position}` : ''}`,
                    start_time: nextAllocation.placement_assessment.start_time,
                    end_time: nextAllocation.placement_assessment.end_time,
                    status: 'UPCOMING'
                });
                setMyAllocation({
                    lab_name: nextAllocation.lab.lab_name,
                    seat_number: nextAllocation.seat_number
                });
            }

            const historyRes = await api.get('/attendance/my-history');
            setHistory(historyRes.data);

        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderHome = () => (
        <div className="px-6 py-8 pb-32 max-w-lg mx-auto flex flex-col gap-8">

            {/* Header Greeting */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                    Hello, {user?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-sm font-medium text-zinc-500">
                    Here is your daily overview.
                </p>
            </div>

            {/* Hero: Active Assessment / Status */}
            {(activeAssessment || myAllocation) ? (
                <div className="relative overflow-hidden bg-zinc-900 rounded-3xl p-6 shadow-xl shadow-zinc-900/10 text-white ring-1 ring-zinc-900/5 group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-colors duration-500"></div>

                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white/90 border border-white/10 mb-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    {activeAssessment?.status || 'Active'}
                                </span>
                                <h3 className="text-xl font-bold leading-tight max-w-[80%]">
                                    {activeAssessment?.title || 'Placement Assessment'}
                                </h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                <ScanLine size={20} className="text-white" strokeWidth={2} />
                            </div>
                        </div>

                        {myAllocation && (
                            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/5">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                                    <MapPin size={20} className="text-zinc-900" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Your Seat</p>
                                    <p className="text-sm font-bold text-white tabular-nums">
                                        {myAllocation.lab_name} • Seat {myAllocation.seat_number}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                        <UserCheck size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="font-bold text-zinc-900">No Active Exams</h3>
                        <p className="text-sm text-zinc-500 font-medium">You are all caught up for today!</p>
                    </div>
                </div>
            )}

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 gap-4">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Quick Actions</p>

                <Link to="/student/placements" className="group">
                    <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-zinc-300 hover:-translate-y-0.5 flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-200">
                            <Briefcase size={22} strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-zinc-900">Placement Drives</h3>
                            <p className="text-xs text-zinc-500 font-medium mt-0.5">Browse and apply for jobs</p>
                        </div>
                        <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                </Link>

                <Link to="/student/attendance" className="group">
                    <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-zinc-300 hover:-translate-y-0.5 flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-200">
                            <QrCode size={22} strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-zinc-900">Mark Attendance</h3>
                            <p className="text-xs text-zinc-500 font-medium mt-0.5">Scan QR for sessions</p>
                        </div>
                        <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                </Link>
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="px-6 py-8 pb-32 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">Attendance History</h2>
                <div className="px-3 py-1 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 uppercase tracking-wide border border-zinc-200">
                    Recent
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-100 rounded-3xl bg-zinc-50/50">
                        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4 text-zinc-400">
                            <History size={24} strokeWidth={1.5} />
                        </div>
                        <h4 className="text-sm font-bold text-zinc-900">No Records Found</h4>
                        <p className="text-xs text-zinc-400 mt-1 max-w-[200px]">
                            Your attendance history will appear here once you attend sessions.
                        </p>
                    </div>
                ) : (
                    history.map((h, i) => (
                        <div key={i} className="group bg-white p-4 rounded-2xl border border-zinc-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:border-zinc-200 transition-all">
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-900 shrink-0 group-hover:bg-zinc-100 transition-colors">
                                        <ClipboardList size={18} strokeWidth={2} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-zinc-900 leading-tight mb-1 truncate pr-2">
                                            {h.event_name}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                            <span>{new Date(h.scan_time).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                                            <span>{new Date(h.scan_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-100">
                                        Present
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-zinc-50 font-sans selection:bg-zinc-900 selection:text-white pb-24">

            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
                <div className="max-w-lg mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
                            <img src={logo} alt="M" className="w-5 h-5 object-contain opacity-90" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-zinc-900 leading-none tracking-tight">MIT ADT University</span>
                            <span className="text-[10px] font-medium text-zinc-500 leading-none mt-1">Student Portal</span>
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition-colors"
                        >
                            {user.name?.charAt(0)}
                        </button>
                        {showProfileMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowProfileMenu(false)}
                                />
                                <div className="absolute top-full right-0 mt-3 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl shadow-zinc-900/5 overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-5 border-b border-zinc-50 bg-zinc-50/50">
                                        <p className="font-bold text-zinc-900 text-sm">{user.name}</p>
                                        <p className="mt-1 text-xs text-zinc-500 font-medium font-mono bg-white px-2 py-1 rounded border border-zinc-200 inline-block">{user.enrollment_no}</p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="w-full p-4 text-left flex items-center gap-3 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={16} strokeWidth={2} /> Sign Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'HOME' && renderHome()}
                {activeTab === 'HISTORY' && renderHistory()}
            </main>

            {/* Result Overlay */}
            {scanResult && (
                <div className="fixed inset-0 z-[60] bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-[2rem] text-center w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-300 border border-zinc-200">
                        <div className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center ${scanResult.status === 'success' ? 'bg-zinc-900 text-white' : 'bg-red-50 text-red-600'}`}>
                            {scanResult.status === 'success' ? <ClipboardList size={32} /> : <X size={32} />}
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2 tracking-tight">{scanResult.title}</h3>
                        <p className="text-zinc-500 mb-8 font-medium text-sm leading-relaxed">{scanResult.message}</p>
                        <button
                            onClick={() => { setScanResult(null); setActiveTab('HOME'); }}
                            className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 transition-transform active:scale-95"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Navigation Dock */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-6 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-xl border border-zinc-200/80 shadow-2xl shadow-zinc-900/10 rounded-full px-2 py-2 flex items-center gap-1 pointer-events-auto ring-1 ring-zinc-900/5">

                    <button
                        onClick={() => setActiveTab('HOME')}
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 relative ${activeTab === 'HOME' ? 'text-zinc-900 bg-zinc-100' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
                            }`}
                    >
                        <Home size={22} strokeWidth={activeTab === 'HOME' ? 2.5 : 2} />
                        {activeTab === 'HOME' && <span className="absolute -bottom-1 w-1 h-1 bg-zinc-900 rounded-full"></span>}
                    </button>

                    <div className="w-px h-6 bg-zinc-200 mx-1"></div>

                    <Link
                        to="/student/attendance"
                        className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-zinc-900/25 hover:scale-110 active:scale-95 transition-all duration-300 mx-1"
                    >
                        <QrCode size={24} strokeWidth={2} />
                    </Link>

                    <div className="w-px h-6 bg-zinc-200 mx-1"></div>

                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 relative ${activeTab === 'HISTORY' ? 'text-zinc-900 bg-zinc-100' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
                            }`}
                    >
                        <History size={22} strokeWidth={activeTab === 'HISTORY' ? 2.5 : 2} />
                        {activeTab === 'HISTORY' && <span className="absolute -bottom-1 w-1 h-1 bg-zinc-900 rounded-full"></span>}
                    </button>

                </div>
            </div>

        </div>
    );
}
