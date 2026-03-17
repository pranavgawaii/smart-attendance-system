/* eslint-disable react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import {
    Clock, MapPin, Users, Monitor, Maximize,
    ArrowLeft, RefreshCw, ShieldCheck,
    ShieldAlert, ShieldClose, Layout, PanelRightClose, PanelRightOpen,
    AlertTriangle, Activity
} from 'lucide-react';

export default function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [qrData, setQrData] = useState({ token: '', code: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const [stats, setStats] = useState({ present: 0, total: 0 });
    const [recentScans, setRecentScans] = useState([]);
    const [proxyAttempts, setProxyAttempts] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showHelp, setShowHelp] = useState(false);

    // Sidebar Tabs State
    const [sidebarTab, setSidebarTab] = useState('live'); // 'live' | 'security'

    // Fetch Event Info
    const fetchEvent = useCallback(async () => {
        try {
            const res = await api.get(`/events/${id}`);
            setEvent(res.data);
            return res.data;
        } catch (err) {
            console.error(err);
            setError('Failed to load event details.');
            return null;
        }
    }, [id]);

    // QR & Code Management
    const fetchQrData = useCallback(async () => {
        try {
            const res = await api.get(`/events/${id}/current-qr`);
            setQrData({ token: res.data.token, code: res.data.code });
            // Reset countdown based on interval or default to 10
            setTimeLeft(event?.qr_refresh_interval || 10);
        } catch (err) {
            console.error('QR Fetch Error:', err);
        }
    }, [id, event?.qr_refresh_interval]);

    const fetchLiveStats = useCallback(async () => {
        try {
            const [statsRes, attendanceRes, proxyRes] = await Promise.all([
                api.get(`/events/${id}/stats`),
                api.get(`/events/${id}/recent-attendance`),
                api.get(`/events/${id}/proxy-attempts`)
            ]);

            setStats({
                present: statsRes.data.count || 0,
                total: statsRes.data.total_students || 0
            });
            setRecentScans(attendanceRes.data || []);
            setProxyAttempts(proxyRes.data || []);
        } catch (err) {
            console.error('Stats Sync Error:', err);
        }
    }, [id]);

    useEffect(() => {
        let isMounted = true;
        fetchEvent().then(initialEvent => {
            if (isMounted) {
                setLoading(false);
                if (initialEvent && (initialEvent.session_state === 'ACTIVE' || initialEvent.session_state === 'LIVE')) {
                    fetchQrData();
                    fetchLiveStats();
                }
            }
        });
        return () => { isMounted = false; };
    }, [fetchEvent, fetchQrData, fetchLiveStats]);

    // Timer Logic
    useEffect(() => {
        if (!event || (event.session_state !== 'ACTIVE' && event.session_state !== 'LIVE')) return;

        // Decrease timer every second
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [event]);

    // Fetch QR when timer hits 0
    useEffect(() => {
        if (!event || (event.session_state !== 'ACTIVE' && event.session_state !== 'LIVE')) return;

        if (timeLeft === 0) {
            fetchQrData().then(() => {
                // Reset timer matching server interval or fallback to 10s
                setTimeLeft(event.qr_refresh_interval || 10);
            });
        }
    }, [timeLeft, event, fetchQrData]);

    // Initial Fetch
    useEffect(() => {
        if (event && (event.session_state === 'ACTIVE' || event.session_state === 'LIVE')) {
            fetchQrData();
            setTimeLeft(event.qr_refresh_interval || 10);
        }
    }, [event, qrData.token, fetchQrData]);

    // Live Stats Poller
    useEffect(() => {
        if (!event || (event.session_state !== 'ACTIVE' && event.session_state !== 'LIVE')) return;

        const statsInterval = setInterval(fetchLiveStats, 5000);
        return () => clearInterval(statsInterval);
    }, [event, fetchLiveStats]);

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const qrPayload = (!qrData.token || !event?.id)
        ? ''
        : JSON.stringify({
            session_id: event.id,
            token: qrData.token
        });

    if (loading) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin"></div>
            <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs animate-pulse">Launching Control HUD...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-8 border border-red-100">
                <ShieldAlert className="text-red-500" size={40} />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 mb-3">Sync Interrupted</h1>
            <p className="text-zinc-500 mb-10 max-w-sm">{error}</p>
            <button
                onClick={() => navigate('/admin/events')}
                className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-black shadow-lg hover:bg-black transition-all uppercase tracking-tighter text-sm"
            >
                Return to Base
            </button>
        </div>
    );

    // Inactive Projector State
    if (event?.session_state !== 'ACTIVE' && event?.session_state !== 'LIVE') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-3xl bg-zinc-50 border border-zinc-100 rounded-[3rem] p-16 text-center relative overflow-hidden">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-10 mx-auto border border-zinc-100 shadow-xl">
                        <Monitor size={40} className="text-zinc-400" />
                    </div>
                    <h1 className="text-5xl font-black text-zinc-900 mb-6 tracking-tighter uppercase">Broadcasting Offline</h1>
                    <p className="text-zinc-500 max-w-lg mx-auto mb-12 leading-relaxed font-medium text-lg">
                        Session <span className="text-zinc-900 font-bold">"{event?.name}"</span> is currently inactive.
                        <br />Initiate from the admin dashboard to begin.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                        <button
                            onClick={() => navigate('/admin/events')}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest shadow-sm"
                        >
                            <ArrowLeft size={16} /> Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-zinc-900 flex flex-col overflow-hidden font-sans selection:bg-zinc-100 selection:text-zinc-900">

            {/* NEW: Center-Right Sidebar Toggle (Premium Tab) */}
            <button
                onClick={() => setShowSidebar(true)}
                className={`fixed top-1/2 -translate-y-1/2 right-0 z-50 pl-3 pr-2 py-6 rounded-l-2xl shadow-[-5px_0_20px_rgba(0,0,0,0.05)] border-y border-l border-white/50 backdrop-blur-md transition-all duration-500 ease-spring group ${showSidebar
                    ? 'translate-x-full opacity-0 pointer-events-none'
                    : 'translate-x-0 bg-white/80 hover:bg-white hover:pr-3'
                    }`}
                title="Open Control Panel"
            >
                <div className="flex flex-col items-center gap-1.5 text-zinc-400 group-hover:text-indigo-600 transition-colors">
                    <div className="w-1 h-1 rounded-full bg-current opacity-50"></div>
                    <div className="w-1 h-1 rounded-full bg-current opacity-70"></div>
                    <PanelRightOpen size={20} className="my-1" />
                    <div className="w-1 h-1 rounded-full bg-current opacity-70"></div>
                    <div className="w-1 h-1 rounded-full bg-current opacity-50"></div>
                </div>
            </button>

            {/* Premium Control Dock - Bottom Left */}
            <div className="fixed bottom-8 left-8 z-50 flex items-center gap-3">
                {/* Help Toggle */}
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border backdrop-blur-md ${showHelp
                        ? 'bg-zinc-900 border-zinc-800 text-white shadow-zinc-900/40 ring-4 ring-zinc-900/10 scale-110'
                        : 'bg-white/80 border-white/60 text-zinc-500 hover:text-zinc-900 hover:bg-white hover:border-white hover:scale-105 shadow-lg shadow-zinc-200/50'
                        }`}
                >
                    <span className="font-black text-xl leading-none font-serif italic">i</span>
                </button>
            </div>

            {/* HELP OVERLAY - REFACTORED: NO BACKGROUND, SIDE PANELS ONLY */}
            {showHelp && (
                <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
                    {/* Left Center: How to Mark (Premium Glass Card) */}
                    <div className="absolute top-1/2 left-8 -translate-y-1/2 w-80 animate-in slide-in-from-left-10 duration-700 ease-out pointer-events-auto">
                        <div className="bg-white/80 backdrop-blur-2xl border border-white/50 p-8 rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] ring-1 ring-white/60 relative overflow-hidden group">

                            {/* Subtle Gradient Glow */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-100/50 transition-colors duration-1000"></div>

                            <h2 className="text-3xl font-black text-zinc-900 mb-8 leading-none tracking-tighter relative z-10">
                                Attendance<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-200">Guide</span>
                            </h2>

                            <div className="space-y-8 relative z-10">
                                {/* Step 1 */}
                                <div className="flex gap-5 group/item">
                                    <div className="shrink-0 w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold shadow-lg shadow-zinc-900/20 group-hover/item:scale-110 group-hover/item:rotate-[-5deg] transition-all duration-300">
                                        1
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-widest mb-1.5">Scan QR</h3>
                                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                                            Use the student app to scan. Code refreshes every 10s.
                                        </p>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="relative flex items-center justify-center py-1 opacity-60">
                                    <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent"></div>
                                    <span className="bg-white/50 backdrop-blur-md px-3 text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em] relative z-10 rounded-full border border-white/50">OR</span>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-5 group/item">
                                    <div className="shrink-0 w-10 h-10 rounded-xl bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center font-bold shadow-sm group-hover/item:scale-110 group-hover/item:rotate-[5deg] transition-all duration-300">
                                        2
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-widest mb-1.5">Enter Code</h3>
                                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                                            Type the 6-digit rolling manual code below.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Security Warning (Premium Glass Card) */}
                    <div className="absolute top-1/2 right-12 -translate-y-1/2 w-80 animate-in slide-in-from-right-10 duration-700 ease-out delay-100 pointer-events-auto">
                        <div className="bg-red-50/90 backdrop-blur-xl border border-red-100/50 p-6 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(220,38,38,0.1)] relative overflow-hidden">
                            {/* Decorative background icon */}
                            <ShieldCheck className="absolute -right-4 -top-4 text-red-500/5 rotate-12" size={120} />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4 text-red-600">
                                    <div className="p-2 bg-red-100 rounded-lg animate-pulse">
                                        <ShieldAlert size={20} />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-xs">Anti-Proxy Active</span>
                                </div>
                                <p className="text-zinc-900 text-sm font-bold leading-relaxed mb-3">
                                    Device Fingerprinting Enabled
                                </p>
                                <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                                    Our system detects unauthorized devices instantly. Only mark your own attendance to avoid disciplinary action.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Minimal Header (Time Only) */}
            {!isFullscreen && (
                <header className="h-16 border-b border-zinc-100 flex items-center justify-end px-8 bg-white/90 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-4 py-2 rounded-lg border border-zinc-100">
                        <Clock size={16} className="text-zinc-900" />
                        <span className="text-zinc-900 tabular-nums">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </header>
            )}

            <div className="flex-1 flex overflow-hidden relative">
                {/* BACKGROUND ELEMENT - CLEAN WHITE */}
                <div className="absolute inset-0 bg-white pointer-events-none -z-10"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] pointer-events-none -z-10"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none -z-10"></div>

                {/* MAIN CONTENT - CENTERED & REDUCED SIZE */}
                <main className={`flex-1 flex flex-col items-center justify-center p-8 relative z-10 transition-all duration-500 ease-in-out ${showSidebar ? 'w-[70%]' : 'w-full'}`}>

                    {/* NEW: Top-Left Branding & Info Section */}
                    <div className="absolute top-10 left-12 z-30 flex flex-col gap-3 animate-in fade-in slide-in-from-left-4 duration-700">
                        {/* Logo | Event Name */}
                        <div className="flex items-center gap-6">
                            <img src="/mitadtlogo.png" alt="MIT Logo" className="h-14 w-auto object-contain drop-shadow-sm" />
                            <div className="h-10 w-px bg-zinc-200"></div>
                            <div>
                                <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight leading-none">
                                    {event.name}
                                </h1>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Live Session</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TOP CENTER: EVENT DISPLAY ID (Little Bigger) */}
                    <div className="relative flex flex-col items-center mb-8 animate-in slide-in-from-top-4 duration-700 fade-in">
                        {/* GUIDE ARROW 1: Event ID */}
                        {showHelp && (
                            <div className="absolute -left-48 top-1/2 -translate-y-1/2 flex items-center gap-4 animate-in slide-in-from-right-4 duration-500">
                                <div className="text-right">
                                    <div className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-wider mb-1">
                                        Session ID
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase w-20 ml-auto">Verify this</p>
                                </div>
                                <div className="text-indigo-500">
                                    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 10H35M35 10L25 1M35 10L25 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        )}

                        <span className="text-sm font-black text-zinc-400 uppercase tracking-[0.4em] mb-2">Event Session ID</span>
                        <div className="text-5xl font-black tracking-tighter text-zinc-900 drop-shadow-sm select-auto">
                            #{event.event_display_id ? event.event_display_id.toString().padStart(2, '0') : '01'}
                        </div>
                    </div>

                    {/* CENTER: QR CODE (Reduced) */}
                    <div className="relative group mb-10">
                        {/* Countdown Ring */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white px-5 py-2 rounded-full border border-zinc-100 flex items-center gap-3 shadow-lg z-20">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeLeft <= 3 ? 'bg-red-400' : 'bg-green-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${timeLeft <= 3 ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            </span>
                            <span className={`text-[10px] font-bold tracking-widest uppercase tabular-nums ${timeLeft <= 3 ? 'text-red-500' : 'text-zinc-500'}`}>
                                Refresh in 00:{timeLeft.toString().padStart(2, '0')}
                            </span>
                        </div>

                        {/* Shadow only, BORDER ADDED */}
                        <div className="relative bg-white p-3 rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.15)] border-4 border-zinc-900 flex items-center justify-center">
                            {qrData.token ? (
                                <div className="animate-in fade-in zoom-in-95 duration-500 bg-white rounded-[2rem] overflow-hidden relative">

                                    <QRCodeSVG
                                        value={qrPayload}
                                        size={isFullscreen ? 560 : 440}
                                        level="M"
                                        includeMargin={true}
                                        marginSize={4}
                                    />
                                    {/* Logo Removed from here */}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center bg-zinc-50 rounded-[2rem]" style={{ width: isFullscreen ? 480 : 380, height: isFullscreen ? 480 : 380 }}>
                                    <RefreshCw size={48} className="text-zinc-300 animate-spin mb-4" />
                                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Refreshing Key...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOTTOM: 6 DIGIT CODE (Reduced) */}
                    <div className="relative flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-700 fade-in delay-200">
                        {/* GUIDE ARROW 2: Manual Code */}
                        {showHelp && (
                            <div className="absolute -right-48 top-1/2 -translate-y-1/2 flex items-center gap-4 animate-in slide-in-from-left-4 duration-500">
                                <div className="text-pink-500 rotate-180">
                                    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 10H35M35 10L25 1M35 10L25 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <div className="bg-pink-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-wider mb-1">
                                        Manual Code
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase w-20">Type this in</p>
                                </div>
                            </div>
                        )}

                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-4">Manual Entry Code</span>
                        <div className="flex gap-2">
                            {qrData.code ? qrData.code.split('').map((char, i) => (
                                <div key={i} className="w-12 h-16 bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm relative group hover:border-zinc-900 transition-colors">
                                    <div
                                        className="transition-transform duration-500 ease-spring"
                                        style={{ transform: `translateY(-${parseInt(char) * 4}rem)` }}
                                    >
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                            <div key={num} className="h-16 flex items-center justify-center text-3xl font-black text-zinc-900">
                                                {num}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )) : (
                                [...Array(6)].map((_, i) => <div key={i} className="w-12 h-16 bg-zinc-50 border border-zinc-100 rounded-lg animate-pulse"></div>)
                            )}
                        </div>
                    </div>
                </main>

                {/* RIGHT SIDEBAR (30%) - TABS */}
                <aside
                    className={`
                        border-l border-zinc-100 bg-white/80 backdrop-blur-xl flex flex-col relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] transition-all duration-500 ease-in-out
                        ${showSidebar ? 'w-[30%] min-w-[320px] max-w-[400px] translate-x-0' : 'w-0 opacity-0 translate-x-full border-none'}
                    `}
                >
                    {/* SIDEBAR CONTROLS HEADER */}
                    <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10 transition-all">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleToggleFullscreen}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 hover:shadow-lg transition-all shadow-sm group"
                                title="Fullscreen"
                            >
                                <Maximize size={18} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowSidebar(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
                            title="Close Sidebar"
                        >
                            <PanelRightClose size={18} />
                        </button>
                    </div>

                    {/* Stats Header - REMOVED TOTAL COUNT */}
                    <div className="p-8 pb-4 border-b border-zinc-100 bg-white/50 whitespace-nowrap overflow-hidden">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h2 className="text-4xl font-black text-zinc-900 tracking-tight leading-none">{stats.present}</h2>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Checked In</p>
                            </div>
                            {/* Removed Total Counter /4 */}
                        </div>
                        {/* Progress Bar with just present indiction */}
                        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-4">
                            <div
                                className="h-full bg-zinc-900 transition-all duration-1000 ease-out"
                                style={{ width: `${stats.total > 0 ? (stats.present / stats.total) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* NEW TAB NAVIGATION */}
                    <div className="flex items-center px-4 pt-4 gap-2">
                        <button
                            onClick={() => setSidebarTab('live')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${sidebarTab === 'live' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Activity size={12} /> Live Feed
                            </span>
                        </button>
                        <button
                            onClick={() => setSidebarTab('security')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${sidebarTab === 'security' ? 'bg-red-50 text-red-600 border-red-100 shadow-sm' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <AlertTriangle size={12} /> Security {proxyAttempts.length > 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                            </span>
                        </button>
                    </div>

                    {/* TAB CONTENT */}
                    <div className="flex-1 overflow-hidden relative mt-2">

                        {/* LIVE FEED TAB */}
                        {sidebarTab === 'live' && (
                            <div className="absolute inset-0 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="px-6 py-2 flex items-center justify-between">
                                    <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Recent Scans</h3>
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full box-shadow-green animate-pulse"></div>
                                </div>
                                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-hide">
                                    {recentScans.map((scan, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-zinc-100 shadow-sm animate-in slide-in-from-top-2 duration-200 fill-mode-backwards" style={{ animationDelay: `${i * 50}ms` }}>
                                            <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-xs font-bold text-zinc-500 border border-zinc-100">
                                                {scan.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-zinc-900 truncate">{scan.name}</div>
                                                <div className="text-[10px] font-medium text-zinc-500 font-mono">{scan.enrollment_no}</div>
                                            </div>
                                            <div className="text-[10px] font-bold text-zinc-400">
                                                {new Date(scan.scan_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                    {recentScans.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-48 text-zinc-300 gap-2">
                                            <Users size={24} />
                                            <span className="text-xs font-medium">Waiting for check-ins...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {sidebarTab === 'security' && (
                            <div className="absolute inset-0 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="px-6 py-2 flex items-center justify-between">
                                    <h3 className="text-[10px] font-bold text-red-300 uppercase tracking-widest">Security Log</h3>
                                    {proxyAttempts.length > 0 && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>}
                                </div>
                                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-hide">
                                    {proxyAttempts.length > 0 ? proxyAttempts.map((attempt, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100 shadow-sm animate-in slide-in-from-top-2 duration-200">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-red-500 border border-red-100 shadow-sm">
                                                <ShieldClose size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-red-700 truncate">Unauthorized Device</div>
                                                <div className="text-[10px] font-medium text-red-500/80 font-mono">{attempt.name}</div>
                                            </div>
                                            <div className="text-[10px] font-bold text-red-300">
                                                {new Date(attempt.scan_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="flex flex-col items-center justify-center h-48 text-zinc-300 gap-2 opacity-60">
                                            <ShieldCheck size={24} className="text-emerald-500" />
                                            <span className="text-xs font-medium text-emerald-600">No Incidents Reported</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </aside>
            </div>
        </div>
    );
}
