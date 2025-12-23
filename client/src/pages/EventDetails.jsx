import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

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

    const downloadCsv = async () => {
        try {
            const response = await api.get(`/events/${id}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${id}.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Export failed');
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-grey)' }}>
            {/* Debug overlay if serious error */}
            {(!id) && <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, background: 'red', color: 'white', padding: '20px' }}>Error: No Event ID found in URL</div>}


            {/* Left Panel: QR & Controls */}
            {/* Left Panel: QR & Controls */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderRight: '1px solid var(--border-color)', position: 'relative' }}>

                <div style={{ width: '100%', padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', zIndex: 10 }}>
                    <Link to="/admin" style={{ textDecoration: 'none', color: 'var(--text-light)', fontSize: '1rem' }}>← Back</Link>
                    <div style={{ height: '20px', width: '1px', background: '#ddd' }}></div>
                    <img src="/mitadtlogo.png" alt="MIT" style={{ height: '40px' }} />
                    <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--mit-purple)' }}>Projector View</h2>
                    {sessionState !== 'NOT_STARTED' && (
                        <span style={{
                            fontSize: '0.9rem',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            background: sessionState === 'ACTIVE' ? '#e8f5e9' : '#ffebee',
                            color: sessionState === 'ACTIVE' ? '#2e7d32' : '#c62828',
                            fontWeight: 'bold',
                            border: `1px solid ${sessionState === 'ACTIVE' ? '#c8e6c9' : '#ffcdd2'}`
                        }}>
                            {sessionState.replace('_', ' ')}
                        </span>
                    )}
                    <div style={{ marginLeft: 'auto', fontSize: '1rem', color: 'var(--text-light)' }}>
                        Event ID: #{id}
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '100%', overflowY: 'auto', padding: '1rem 0' }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--mit-purple)' }}>Smart Attendance Session</h1>
                        {stats.name && (
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-light)', fontWeight: 'normal' }}>
                                {stats.name}
                            </h2>
                        )}



                        {sessionState === 'ACTIVE' && token ? (
                            <div style={{
                                width: '450px',
                                minHeight: '520px',
                                background: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {/* Add error boundary for QR */}
                                {token && (
                                    <QRCodeSVG
                                        value={`${window.location.origin}/scan?event_id=${id}&token=${token}`}
                                        size={300} // Fixed size safely
                                    />
                                )}
                                <div style={{ fontSize: '5rem', fontWeight: 'bold', fontFamily: 'monospace', marginTop: '1.5rem', letterSpacing: '0.25rem', color: 'var(--text-dark)', lineHeight: 1 }}>
                                    {token}
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                width: '450px',
                                minHeight: '520px',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                flexDirection: 'column',
                                border: '1px solid #eee'
                            }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem', filter: 'grayscale(100%)', opacity: 0.3 }}>
                                    {sessionState === 'STOPPED' ? '🛑' : (stats.count > 0 ? '⏸️' : '🏫')}
                                </div>
                                <h3 style={{ fontSize: '1.5rem', color: 'var(--mit-purple)', margin: '0 0 0.5rem 0' }}>
                                    {sessionState === 'STOPPED' ? 'Session Ended' : (stats.count > 0 ? 'Session Paused' : 'Ready to Start')}
                                </h3>
                                <p style={{ color: 'var(--text-light)', margin: 0 }}>
                                    {sessionState === 'STOPPED'
                                        ? 'Attendance has been closed.'
                                        : (stats.count > 0 ? 'Attendance is temporarily suspended.' : 'Please wait for the admin to begin.')}
                                </p>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexDirection: 'column', alignItems: 'center' }}>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {/* Controls */}
                            {/* START: Show if Not Started OR Stopped (Restart) */}
                            {(sessionState === 'NOT_STARTED' || sessionState === 'STOPPED') && (
                                <button
                                    onClick={() => handleSessionAction('start-session')}
                                    style={{ padding: '1rem 2rem', background: 'var(--mit-purple)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                                >
                                    {sessionState === 'STOPPED' ? 'RESTART SESSION' : 'START SESSION'}
                                </button>
                            )}

                            {/* PAUSE: Show if Active */}
                            {sessionState === 'ACTIVE' && (
                                <button
                                    onClick={() => handleSessionAction('pause-session')}
                                    style={{ padding: '1rem 2rem', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.2rem', cursor: 'pointer' }}
                                >
                                    PAUSE SESSION
                                </button>
                            )}

                            {/* STOP: Show unless already Stopped */}
                            {sessionState !== 'STOPPED' && (
                                <button
                                    onClick={() => handleSessionAction('stop-session')}
                                    style={{ padding: '1rem 2rem', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.2rem', cursor: 'pointer' }}
                                >
                                    STOP SESSION
                                </button>
                            )}
                        </div>
                    </div>

                    {message && <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>{message}</p>}
                </div>




            </div>

            {/* Right Panel: Live Feed */}
            <div style={{ flex: 1, backgroundColor: 'var(--bg-grey)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-color)' }}>
                <div style={{ padding: '1.5rem', background: 'var(--mit-purple)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'white' }}>Live Feed</h3>
                    <button onClick={downloadCsv} className="mit-btn" style={{ background: 'white', color: 'var(--mit-purple)', fontSize: '0.9rem', padding: '0.5rem 1rem', border: 'none' }}>
                        Export CSV
                    </button>
                </div>

                <div style={{ padding: '1.25rem', textAlign: 'center', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Attendees</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--mit-purple)', lineHeight: 1 }}>{stats.count}</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {recentLogs.map((log, i) => (
                        <div key={i} style={{
                            padding: '1.25rem',
                            marginBottom: '0.75rem',
                            background: (i === 0 && highlight) ? '#e8f5e9' : 'white',
                            borderLeft: (i === 0 && highlight) ? '5px solid var(--success-green)' : '5px solid var(--mit-purple)',
                            borderRadius: '4px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            transition: 'all 0.5s',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-dark)' }}>{log.name}</strong>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{log.enrollment_no}</span>
                            </div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', background: '#f5f5f5', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                {new Date(log.scan_time).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Floating Toast Container (Bottom Right of Screen or Panel) */}
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 9999, pointerEvents: 'none' }}>
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={toast.type === 'enter' ? 'alert-toast-enter' : 'alert-toast-exit'}
                            style={{
                                background: '#fff3e0',
                                borderLeft: '4px solid #ef6c00',
                                borderRadius: '8px',
                                padding: '1rem 1.5rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                minWidth: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>🚫</span>
                            <div>
                                <h4 style={{ margin: 0, color: '#e65100', fontSize: '1rem' }}>Security Alert Detected</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#f57c00' }}>
                                    Proxy Blocked • Device {toast.device_id.substring(0, 4)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
}
