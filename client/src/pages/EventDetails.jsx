
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { Maximize2, Minimize2, Users, Clock, ShieldAlert, Activity, PanelRightClose, PanelRightOpen, Pause, Play, Square } from 'lucide-react';

export default function EventDetails() {
    const { id } = useParams();
    const [token, setToken] = useState(null);
    const [stats, setStats] = useState({ count: 0 });
    const [recentLogs, setRecentLogs] = useState([]);
    const [message, setMessage] = useState('');
    const [highlight, setHighlight] = useState(false);
    const lastTopRef = useRef(null);
    const [auditAlerts, setAuditAlerts] = useState([]); // Raw data
    const [toasts, setToasts] = useState([]); // Visual toasts
    const seenAlertsRef = useRef(new Set()); // Dedup tracker
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleFullscreen = () => {
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

    // Poll for QR, Stats, Recent Logs, and Audit Alerts
    useEffect(() => {
        fetchCurrentQr();
        fetchStats();
        fetchRecentLogs();
        fetchAuditAlerts();

        const interval = setInterval(() => {
            fetchCurrentQr();
            fetchStats();
            fetchRecentLogs();
            fetchAuditAlerts();
        }, 3000); // 3s poll (aligned with requirements)

        return () => clearInterval(interval);
    }, [id]);

    const [sessionState, setSessionState] = useState('NOT_STARTED');

    const fetchAuditAlerts = async () => {
        try {
            const res = await api.get(`/events/${id}/audit-alerts`);
            const alerts = res.data;
            setAuditAlerts(alerts);

            // Check for new alerts to toast
            alerts.forEach(alert => {
                const uniqueKey = `${alert.device_id}-${new Date(alert.scan_time).getTime()}`;
                if (!seenAlertsRef.current.has(uniqueKey)) {
                    seenAlertsRef.current.add(uniqueKey);

                    // Add to Toasts
                    const newToast = { ...alert, id: uniqueKey, type: 'enter' };
                    setToasts(prev => [...prev, newToast]);

                    // Remove after 5 seconds
                    setTimeout(() => {
                        setToasts(prev => prev.map(t => t.id === uniqueKey ? { ...t, type: 'exit' } : t));
                        // Fully remove from DOM after exit animation (500ms)
                        setTimeout(() => {
                            setToasts(prev => prev.filter(t => t.id !== uniqueKey));
                        }, 500);
                    }, 5000);
                }
            });

        } catch (err) {
            console.error('Audit alerts error');
        }
    };

    const fetchCurrentQr = async () => {
        try {
            const res = await api.get(`/events/${id}/current-qr`);
            setToken(res.data.token);
        } catch (err) {
            if (err.response?.status === 404) {
                setToken(null);
            }
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get(`/events/${id}/stats`);
            setStats(res.data);
            if (res.data.session_state) {
                setSessionState(res.data.session_state);
                // Auto-sync token visibility with state
                if (res.data.session_state === 'ACTIVE' && !token) {
                    fetchCurrentQr();
                }
            }
        } catch (err) {
            console.error('Stats error', err);
            setMessage(`Error loading stats: ${err.message}`);
        }
    };

    const fetchRecentLogs = async () => {
        try {
            const res = await api.get(`/events/${id}/recent-attendance?limit=10`);
            const newLogs = res.data;
            if (newLogs.length > 0) {
                const topTime = newLogs[0].scan_time;
                if (lastTopRef.current && lastTopRef.current !== topTime) {
                    setHighlight(true);
                    setTimeout(() => setHighlight(false), 500);
                }
                lastTopRef.current = topTime;
            }
            setRecentLogs(newLogs);
        } catch (err) {
            console.error('Recent logs error', err);
        }
    };

    const handleSessionAction = async (action) => {
        try {
            await api.post(`/events/${id}/${action}`);
            setMessage(`Session Updated: ${action.replace('-session', '').toUpperCase()}`);

            // Optimistic Update
            if (action === 'start-session') {
                setSessionState('ACTIVE');
                // Ensure QR starts
                await api.post(`/events/${id}/start-qr`);
                fetchCurrentQr();
            }
            if (action === 'pause-session') {
                setSessionState('NOT_STARTED');
                setToken(null);
            }
            if (action === 'stop-session') {
                setSessionState('STOPPED');
                setToken(null);
                await api.post(`/events/${id}/stop-qr`);
            }

        } catch (err) {
            setMessage('Failed to update session');
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f0f9ff', fontFamily: 'Inter, sans-serif' }}>
            {/* Debug overlay if serious error */}
            {(!id) && <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, background: 'red', color: 'white', padding: '20px' }}>Error: No Event ID found in URL</div>}


            {/* Left Panel: Main Canvas (75%) */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: 'radial-gradient(circle at top right, #e0f2fe, #f0f9ff 60%)'
            }}>
                {/* Institutional Header (Top Left) */}
                <div style={{
                    position: 'absolute', top: '2rem', left: '2rem',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    opacity: 0.9, zIndex: 20
                }}>
                    <img src="/mitadtlogo.png" alt="MIT" style={{ height: '52px' }} />
                    <div style={{ height: '36px', width: '1px', background: '#cbd5e1' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', lineHeight: 1.2 }}>MIT Art, Design & Technology University</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#64748b' }}>Training & Placement Cell</span>
                    </div>
                </div>

                <div className="hide-scrollbar" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    maxWidth: '800px', width: '100%', zIndex: 10,
                    height: '100%', maxHeight: '90vh', overflowY: 'auto'
                }}>
                    {stats.name && (
                        <h1 style={{
                            fontSize: '3rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem',
                            letterSpacing: '-0.03em', lineHeight: '1.1', textAlign: 'center'
                        }}>
                            {stats.name}
                        </h1>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem', color: '#64748b' }}>
                        <span style={{ fontSize: '1.25rem' }}>Scan the QR code to mark attendance</span>
                        <span style={{ fontSize: '1rem', fontWeight: '600', padding: '6px 16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>Event ID: {id}</span>
                    </div>

                    {sessionState === 'ACTIVE' && token ? (
                        <div style={{
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(20px)',
                            padding: '1.5rem',
                            borderRadius: '32px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            transition: 'all 0.4s ease'
                        }}>
                            <div style={{
                                padding: '1rem', background: 'white', borderRadius: '20px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                marginBottom: '1rem'
                            }}>
                                <QRCodeSVG
                                    value={`${window.location.origin}/scan?event_id=${id}&token=${token}`}
                                    size={340}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Entry Code</span>
                                <div style={{
                                    fontSize: '3rem', fontWeight: '800', fontFamily: 'Monaco, monospace',
                                    color: '#0f172a', letterSpacing: '0.15em', lineHeight: 1
                                }}>
                                    {token}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            width: '400px', height: '350px',
                            background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)',
                            borderRadius: '32px', border: '2px dashed #cbd5e1',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            color: '#94a3b8'
                        }}>
                            {sessionState === 'STOPPED'
                                ? <ShieldAlert size={64} style={{ opacity: 0.6, marginBottom: '1rem', color: '#ef4444' }} />
                                : <Clock size={64} style={{ opacity: 0.6, marginBottom: '1rem', color: '#3b82f6' }} />
                            }
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#334155', margin: '0 0 0.5rem 0' }}>
                                {sessionState === 'STOPPED' ? 'Session Ended' : 'Waiting to Start'}
                            </h3>
                            <p style={{ fontSize: '1rem', textAlign: 'center', maxWidth: '80%' }}>
                                {sessionState === 'STOPPED' ? 'Attendance is closed.' : 'The QR code will appear here once the session begins.'}
                            </p>
                        </div>
                    )}

                    {/* Admin Controls Area - Moved to Main Canvas */}
                    <div style={{
                        marginTop: '2rem',
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        paddingBottom: '2rem' // Ensure space at bottom
                    }}>
                        {(sessionState === 'NOT_STARTED' || sessionState === 'STOPPED') && (
                            <button
                                onClick={() => handleSessionAction('start-session')}
                                style={{
                                    padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none',
                                    borderRadius: '12px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                    transition: 'transform 0.2s'
                                }}
                            >
                                <Play size={18} fill="white" /> {sessionState === 'STOPPED' ? 'Restart Session' : 'Start Session'}
                            </button>
                        )}
                        {sessionState === 'ACTIVE' && (
                            <button
                                onClick={() => handleSessionAction('pause-session')}
                                style={{
                                    padding: '0.75rem 1.5rem', background: '#f59e0b', color: 'white', border: 'none',
                                    borderRadius: '12px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                                }}
                            >
                                <Pause size={18} fill="white" /> Pause
                            </button>
                        )}
                        {sessionState === 'ACTIVE' && (
                            <button
                                onClick={() => handleSessionAction('stop-session')}
                                style={{
                                    padding: '0.75rem 1.5rem', background: '#ef4444', color: 'white', border: 'none',
                                    borderRadius: '12px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                                }}
                            >
                                <Square size={18} fill="white" /> Stop
                            </button>
                        )}
                    </div>
                </div>

                {/* Sidebar Toggle Handle (Visible when closed) */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        style={{
                            position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                            background: 'white', border: '1px solid #e2e8f0', borderRight: 'none',
                            borderRadius: '12px 0 0 12px', padding: '1rem 0.5rem',
                            boxShadow: '-4px 0 20px rgba(0,0,0,0.05)', cursor: 'pointer', color: '#64748b'
                        }}
                        title="Show Sidebar"
                    >
                        <PanelRightOpen size={24} />
                    </button>
                )}
            </div>

            {/* Right Panel: Sidebar (25%) */}
            <div style={{
                width: isSidebarOpen ? '420px' : '0px',
                flexShrink: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderLeft: '1px solid rgba(255,255,255,0.5)',
                display: 'flex', flexDirection: 'column',
                boxShadow: '-10px 0 40px rgba(0,0,0,0.03)',
                zIndex: 20,
                transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Sidebar Header */}
                <div style={{ padding: '2rem 1.5rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{
                            padding: '6px 12px', borderRadius: '20px',
                            background: sessionState === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                            color: sessionState === 'ACTIVE' ? '#166534' : '#64748b',
                            fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            <div style={{
                                width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor',
                                animation: sessionState === 'ACTIVE' ? 'pulse 2s infinite' : 'none'
                            }}></div>
                            {sessionState}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={toggleFullscreen}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b',
                                    background: 'white', cursor: 'pointer'
                                }}
                                title="Fullscreen"
                            >
                                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b',
                                    background: 'white', cursor: 'pointer'
                                }}
                                title="Hide Sidebar"
                            >
                                <PanelRightClose size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Students Present</span>
                        <div style={{ fontSize: '3rem', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{stats.count}</div>
                    </div>

                    {/* Admin Controls Area - REMOVED from Sidebar */}
                </div>

                {/* Feed List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem', background: '#f8fafc' }}>
                    <div style={{ padding: '1rem 0 0.5rem', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={14} color="#94a3b8" />
                        <h4 style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Recent Scans</h4>
                    </div>

                    {recentLogs.length === 0 ? (
                        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#cbd5e1' }}>
                            <p style={{ fontSize: '0.9rem' }}>Waiting for first scan...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '2rem' }}>
                            {recentLogs.map((log, i) => (
                                <div key={i} style={{
                                    padding: '1rem',
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                    border: (i === 0 && highlight) ? '1px solid #bbf7d0' : '1px solid #f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.5s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            background: '#f0f9ff', color: '#0ea5e9', fontWeight: '700',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'
                                        }}>
                                            {log.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>{log.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.enrollment_no}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                                        {new Date(log.scan_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Floating Toast Container */}
                <div style={{ position: 'fixed', bottom: '2rem', left: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 9999, pointerEvents: 'none' }}>
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={toast.type === 'enter' ? 'alert-toast-enter' : 'alert-toast-exit'}
                            style={{
                                background: '#fff',
                                borderLeft: '4px solid #ef4444',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                                minWidth: '320px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '1rem',
                                animation: 'slideInLeft 0.3s ease-out'
                            }}
                        >
                            <div style={{ padding: '8px', background: '#fee2e2', borderRadius: '50%', color: '#ef4444' }}>
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '0.95rem', fontWeight: '700' }}>Suspicious Activity Blocked</h4>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                    Proxy attempt prevented from Device {toast.device_id.substring(0, 4)}...
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
}
