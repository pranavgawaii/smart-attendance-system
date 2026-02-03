import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    QrCode,
    LogOut,
    MapPin,
    ClipboardList,
    Home,
    History,
    ScanLine,
    Briefcase,
    ChevronRight,
    Building2,
    Calendar,
    Clock
} from 'lucide-react';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [activeAssessment, setActiveAssessment] = useState(null);
    const [myAllocation, setMyAllocation] = useState(null);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('HOME');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // 1. Fetch Active Allocations
            const allocationsRes = await api.get(`/allocations/student/${user.id}`);
            if (allocationsRes.data && allocationsRes.data.length > 0) {
                const nextAllocation = allocationsRes.data[0];
                setActiveAssessment({
                    title: nextAllocation.placement_assessment.company_name,
                    position: nextAllocation.placement_assessment.position,
                    start_time: nextAllocation.placement_assessment.start_time,
                    end_time: nextAllocation.placement_assessment.end_time,
                    status: 'LIVE'
                });
                setMyAllocation({
                    lab_name: nextAllocation.lab.lab_name,
                    seat_number: nextAllocation.seat_number
                });
            }

            // 2. Fetch History
            const historyRes = await api.get('/attendance/my-history');
            setHistory(historyRes.data);

        } catch (error) {
            console.error("Dashboard data fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Sub-Components ---

    const Header = () => (
        <div className="flex items-center justify-between px-6 pt-6 pb-4 bg-white/50 backdrop-blur-sm sticky top-0 z-30">
            <div>
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Welcome back, {user?.name?.split(' ')[0]}</p>
            </div>

            <div className="relative">
                <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-9 h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 shadow-sm hover:border-zinc-300 transition-colors"
                >
                    <span className="text-sm font-semibold">{user?.name?.charAt(0)}</span>
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-xl shadow-zinc-900/5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-zinc-50">
                                <p className="font-semibold text-zinc-900 text-sm truncate">{user?.name}</p>
                                <p className="text-xs text-zinc-500 font-mono mt-1 px-2 py-0.5 bg-zinc-50 rounded border border-zinc-100 inline-block">
                                    {user?.enrollment_no}
                                </p>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full p-4 text-left flex items-center gap-3 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={16} strokeWidth={1.5} />
                                Sign Out
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const ActiveAssessmentCard = () => (
        <div className="mx-6 mt-2 mb-6">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] overflow-hidden relative group">
                <div className="p-5 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Assessment
                        </span>
                        {/* Timer or Icon */}
                        <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
                            <Clock size={16} strokeWidth={1.5} />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-zinc-900 leading-tight mb-1">
                        {activeAssessment?.title}
                    </h3>
                    {activeAssessment?.position && (
                        <p className="text-sm text-zinc-500 font-medium">{activeAssessment.position}</p>
                    )}

                    {/* Seat Allocation Stripe */}
                    {myAllocation && (
                        <div className="mt-5 p-3 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-sm shrink-0">
                                <MapPin size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Assigned Seat</p>
                                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                                    <span>{myAllocation.lab_name}</span>
                                    <span className="text-zinc-300">•</span>
                                    <span>Seat {myAllocation.seat_number}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const QuickActionCard = ({ to, icon: Icon, title, desc }) => (
        <Link to={to} className="group flex flex-col justify-between bg-white p-5 rounded-xl border border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all duration-200 active:scale-[0.98]">
            <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-600 group-hover:text-zinc-900 group-hover:bg-zinc-100 transition-colors mb-4">
                <Icon size={20} strokeWidth={1.5} />
            </div>
            <div>
                <h3 className="font-semibold text-zinc-900 text-base leading-tight">{title}</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{desc}</p>
            </div>
        </Link>
    );

    const RenderHome = () => (
        <div className="pb-32 flex flex-col">
            <Header />

            {/* Active Assessment - Only show if active */}
            {(activeAssessment && myAllocation) && <ActiveAssessmentCard />}

            {/* Quick Actions Grid */}
            <div className="px-6 mt-2">
                <h2 className="text-sm font-bold text-zinc-900 mb-4 px-1">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                    <QuickActionCard
                        to="/student/attendance"
                        icon={QrCode}
                        title="Scan QR"
                        desc="Mark attendance"
                    />
                    <QuickActionCard
                        to="/student/placements"
                        icon={Briefcase}
                        title="Placements"
                        desc="View drives"
                    />
                    <QuickActionCard
                        to="/student/history"
                        icon={History}
                        title="History"
                        desc="View logs"
                    />
                    <QuickActionCard
                        to="/student/profile"
                        icon={Building2}
                        title="Profile"
                        desc="Your details"
                    />
                </div>
            </div>
        </div>
    );

    const RenderHistory = () => (
        <div className="pb-32 flex flex-col">
            <div className="px-6 pt-6 pb-4 bg-white/50 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Attendance Log</h1>
                <div className="px-2.5 py-1 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase">
                    Recent
                </div>
            </div>

            <div className="px-6 flex flex-col gap-3">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3 text-zinc-400">
                            <History size={20} strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-medium text-zinc-500">No history records found.</p>
                    </div>
                ) : (
                    history.map((h, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                            <div className="flex items-center gap-3.5">
                                <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 text-zinc-500">
                                    <ClipboardList size={16} strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-zinc-900 truncate pr-4">{h.event_name}</span>
                                    <span className="text-xs text-zinc-500 font-medium">
                                        {new Date(h.scan_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(h.scan_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
                                Present
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-zinc-50 font-sans selection:bg-zinc-900 selection:text-white">

            <main className="max-w-md mx-auto bg-zinc-50 min-h-screen border-x border-zinc-200 shadow-2xl shadow-zinc-200/50 overflow-hidden relative">
                {activeTab === 'HOME' ? <RenderHome /> : <RenderHistory />}

                {/* Bottom Navigation Dock - Admin Style */}
                <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl px-2 py-1.5 flex items-center gap-1 pointer-events-auto">

                        <button
                            onClick={() => setActiveTab('HOME')}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${activeTab === 'HOME' ? 'text-zinc-900 bg-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'}`}
                        >
                            <Home size={20} strokeWidth={activeTab === 'HOME' ? 2 : 1.5} />
                            <span className="text-[9px] mt-0.5">Home</span>
                        </button>

                        <div className="w-px h-6 bg-zinc-200 mx-1"></div>

                        <Link
                            to="/student/attendance"
                            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 text-white shadow-md hover:bg-zinc-800 transition-all duration-200 transform active:scale-95"
                        >
                            <ScanLine size={20} strokeWidth={2} />
                        </Link>

                        <div className="w-px h-6 bg-zinc-200 mx-1"></div>

                        <button
                            onClick={() => setActiveTab('HISTORY')}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${activeTab === 'HISTORY' ? 'text-zinc-900 bg-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'}`}
                        >
                            <History size={20} strokeWidth={activeTab === 'HISTORY' ? 2 : 1.5} />
                            <span className="text-[9px] mt-0.5">History</span>
                        </button>

                    </div>
                </div>
            </main>

        </div>
    );
}
