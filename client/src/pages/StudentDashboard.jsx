import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    Clock,
    User
} from 'lucide-react';

export default function StudentDashboard() {
    const { user, logout } = useAuth();

    const [activeAssessment, setActiveAssessment] = useState(null);
    const [myAllocation, setMyAllocation] = useState(null);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('HOME');
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const fetchData = async () => {
        if (!user?.id) return;
        try {
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

            const historyRes = await api.get('/attendance/my-history');
            setHistory(historyRes.data);

        } catch (error) {
            console.error("Dashboard data fetch error:", error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchData();
        }, 0);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const Header = () => (
        <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-medium tracking-tight text-zinc-900">Dashboard</h1>
                    <p className="text-zinc-500 mt-1 text-sm font-normal">Welcome back, {user?.name?.split(' ')[0]}</p>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-9 h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 shadow-sm hover:border-zinc-300 transition-colors"
                    >
                        <span className="text-sm font-semibold">{user?.name?.charAt(0)}</span>
                    </button>

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
        </div>
    );

    const ActiveAssessmentCard = () => (
        <div className="px-6 mb-6">
            <div className="bg-zinc-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Clock size={100} strokeWidth={1} />
                </div>
                <div className="relative z-10">
                    <span className="inline-block px-2 py-1 rounded-md bg-white/10 text-xs font-medium mb-4 backdrop-blur-sm border border-white/10">
                        Live Assessment
                    </span>
                    <h3 className="text-xl font-medium tracking-tight mb-1">{activeAssessment?.title}</h3>
                    {activeAssessment?.position && (
                        <p className="text-zinc-400 text-sm mb-6">{activeAssessment.position}</p>
                    )}

                    {myAllocation && (
                        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white text-zinc-900 flex items-center justify-center shrink-0">
                                <MapPin size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Assigned Seat</p>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <span>{myAllocation.lab_name}</span>
                                    <span className="text-zinc-600">•</span>
                                    <span>Seat {myAllocation.seat_number}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const QuickActionCard = ({ to, icon, title, desc }) => {
        const ActionIcon = icon;

        return (
            <Link to={to} className="group">
                <div className="bg-white p-5 rounded-xl border border-zinc-200/60 shadow-card hover:shadow-card-hover flex flex-col justify-between h-32 hover:border-zinc-300 transition-all">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wide">{title}</span>
                            <span className="text-sm text-zinc-600 mt-1 font-normal">{desc}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
                            <ActionIcon size={16} strokeWidth={1.5} />
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    const RenderHome = () => (
        <div className="pb-32 flex flex-col">
            <Header />

            {(activeAssessment && myAllocation) && <ActiveAssessmentCard />}

            <div className="px-6">
                <h2 className="text-base font-medium text-zinc-900 mb-4">Quick Actions</h2>
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
                        to="/student/attendance"
                        icon={History}
                        title="History"
                        desc="View logs"
                    />
                    <QuickActionCard
                        to="/student/profile"
                        icon={User}
                        title="Profile"
                        desc="Your details"
                    />
                </div>
            </div>
        </div>
    );

    const RenderHistory = () => (
        <div className="pb-32 flex flex-col">
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight text-zinc-900">Attendance History</h1>
                        <p className="text-zinc-500 mt-1 text-sm font-normal">Your recent attendance records</p>
                    </div>
                </div>
            </div>

            <div className="px-6">
                <div className="bg-white rounded-xl border border-zinc-200/60 shadow-card overflow-hidden">
                    {history.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center text-zinc-400">
                            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3">
                                <History size={20} strokeWidth={1.5} />
                            </div>
                            <p className="text-sm">No attendance records found.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-50">
                            {history.map((h, i) => (
                                <div key={i} className="p-4 hover:bg-zinc-50 transition-colors flex items-center justify-between">
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
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        Present
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-zinc-50 font-sans selection:bg-zinc-900 selection:text-white">
            <main className="max-w-md mx-auto bg-zinc-50 min-h-screen border-x border-zinc-200 shadow-2xl shadow-zinc-200/50 overflow-hidden relative">
                {activeTab === 'HOME' ? <RenderHome /> : <RenderHistory />}

                {/* Bottom Navigation Dock */}
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
