import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { QrCode, LogOut, MapPin, ClipboardList, Home, History, ScanLine, X, Briefcase, ArrowRight, UserCheck } from 'lucide-react';

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
        <div className="p-6 pb-28 max-w-2xl mx-auto flex flex-col gap-8">

            {/* Dashboard Actions */}
            <div className="flex flex-col gap-4">

                {/* Placements Card */}
                <Link to="/student/placements" className="block group">
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex items-center gap-6">
                        <div className="bg-zinc-100 w-14 h-14 rounded-2xl flex items-center justify-center text-zinc-900">
                            <Briefcase size={24} strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-zinc-900">Placement Drives</h3>
                            <p className="mt-1 text-sm text-zinc-500 font-medium">View and apply for opportunities</p>
                        </div>
                        <div className="text-zinc-300 group-hover:text-zinc-400 transition-colors">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                </Link>

                {/* Mark Attendance Card */}
                <Link to="/student/attendance" className="block group">
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex items-center gap-6">
                        <div className="bg-zinc-100 w-14 h-14 rounded-2xl flex items-center justify-center text-zinc-900">
                            <QrCode size={24} strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-zinc-900">Mark Attendance</h3>
                            <p className="mt-1 text-sm text-zinc-500 font-medium">Scan QR or enter code manually</p>
                        </div>
                        <div className="text-zinc-300 group-hover:text-zinc-400 transition-colors">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                </Link>

            </div>

            {/* Today's Assessment Card */}
            {(activeAssessment || myAllocation) && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>

                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Today's Assessment</h3>
                        {activeAssessment && (
                            <span className="text-[10px] font-bold text-zinc-700 bg-zinc-100 px-3 py-1.5 rounded-full uppercase tracking-wider border border-zinc-200">
                                {activeAssessment.status}
                            </span>
                        )}
                    </div>

                    {activeAssessment && (
                        <div className="mb-6 relative z-10">
                            <h4 className="text-xl font-bold text-zinc-800 leading-tight">{activeAssessment.title}</h4>
                        </div>
                    )}

                    {myAllocation && (
                        <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200/60 flex items-center gap-4 relative z-10">
                            <div className="bg-white border border-zinc-200 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                                <MapPin size={20} className="text-zinc-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Your Seat</div>
                                <div className="text-base font-bold text-zinc-900 truncate">
                                    {myAllocation.lab_name} • Seat {myAllocation.seat_number}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );

    const renderHistory = () => (
        <div className="p-6 pb-28 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6 tracking-tight">Attendance History</h2>
            <div className="flex flex-col gap-4">
                {history.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-zinc-100">
                        <div className="bg-zinc-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-300">
                            <History size={32} />
                        </div>
                        <h4 className="text-zinc-900 font-semibold mb-2">No Records Yet</h4>
                        <p className="text-zinc-400 text-sm">
                            Your past attendance will appear here.
                        </p>
                    </div>
                ) : (
                    history.map((h, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-zinc-200/60 shadow-sm flex items-center justify-between">
                            <div className="flex gap-4 items-center">
                                <div className="bg-zinc-100 w-10 h-10 rounded-xl flex items-center justify-center text-zinc-900 shrink-0">
                                    <ClipboardList size={20} />
                                </div>
                                <div>
                                    <div className="font-semibold text-zinc-900 text-sm">{h.event_name}</div>
                                    <div className="text-xs text-zinc-500 mt-0.5 font-medium">
                                        {new Date(h.scan_time).toLocaleDateString()} • {new Date(h.scan_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-700 bg-zinc-100 px-3 py-1 rounded-full uppercase tracking-wider border border-zinc-200">
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
        <div className="min-h-screen bg-zinc-50 font-sans">

            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-zinc-200 sticky top-0 z-50 flex justify-between items-center shadow-sm/50 backdrop-blur-md bg-white/90">
                <div className="flex items-center gap-3">
                    <img src="/mitadtlogo.png" alt="Logo" className="h-9" />
                    <div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Student Portal</div>
                        <div className="text-sm font-bold text-zinc-900 leading-tight">{user.name}</div>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white active:scale-95 transition-transform"
                    >
                        {user.name?.charAt(0)}
                    </button>

                    {showProfileMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-40 bg-zinc-900/10 backdrop-blur-[1px]"
                                onClick={() => setShowProfileMenu(false)}
                            />
                            <div className="absolute top-full right-0 mt-3 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-5 border-b border-zinc-50 bg-zinc-50/50">
                                    <p className="font-bold text-zinc-900 text-sm">{user.name}</p>
                                    <p className="mt-1 text-xs text-zinc-500 font-medium font-mono">{user.enrollment_no}</p>
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

            {/* Content Area */}
            <div className="min-h-[calc(100vh-140px)]">
                {activeTab === 'HOME' && renderHome()}
                {activeTab === 'HISTORY' && renderHistory()}

                {/* Result Overlay */}
                {scanResult && (
                    <div className="fixed inset-0 z-[60] bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-white p-10 rounded-3xl text-center w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
                            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${scanResult.status === 'success' ? 'bg-zinc-100 text-zinc-900' : 'bg-red-50 text-red-600'}`}>
                                {scanResult.status === 'success' ? <ClipboardList size={40} /> : <X size={40} />}
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-900 mb-3 tracking-tight">{scanResult.title}</h3>
                            <p className="text-zinc-500 mb-8 font-medium">{scanResult.message}</p>
                            <button
                                onClick={() => { setScanResult(null); setActiveTab('HOME'); }}
                                className="w-full py-3.5 bg-zinc-900 text-white rounded-xl font-bold shadow-lg hover:bg-zinc-800 transition-transform active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-white border-t border-zinc-200 flex justify-around items-center z-40 pb-4">
                <button
                    onClick={() => setActiveTab('HOME')}
                    className={`flex flex-col items-center gap-1.5 flex-1 p-2 transition-colors ${activeTab === 'HOME' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                    <Home size={24} strokeWidth={activeTab === 'HOME' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
                </button>

                <Link
                    to="/student/attendance"
                    className="flex flex-col items-center gap-1 flex-1 -translate-y-6"
                >
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-zinc-900/30 hover:scale-105 transition-transform">
                        <QrCode size={32} strokeWidth={2} />
                    </div>
                </Link>

                <button
                    onClick={() => setActiveTab('HISTORY')}
                    className={`flex flex-col items-center gap-1.5 flex-1 p-2 transition-colors ${activeTab === 'HISTORY' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                    <History size={24} strokeWidth={activeTab === 'HISTORY' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
                </button>
            </div>

        </div>
    );
}
