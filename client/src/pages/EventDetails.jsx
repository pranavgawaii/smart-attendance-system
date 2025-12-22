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

    // Poll for QR, Stats, and Recent Logs
    useEffect(() => {
        fetchCurrentQr();
        fetchStats();
        fetchRecentLogs();

        const interval = setInterval(() => {
            fetchCurrentQr();
            fetchStats();
            fetchRecentLogs();
        }, 2000); // 2s poll

        return () => clearInterval(interval);
    }, [id]);

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
        } catch (err) {
            console.error('Stats error');
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
            console.error('Recent logs error');
        }
    };

    const stopRotation = async () => {
        try {
            await api.post(`/events/${id}/stop-qr`);
            setMessage('Session Stopped');
            setToken(null);
        } catch (err) {
            setMessage('Failed to stop session');
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-grey)' }}>

            {/* Left Panel: QR & Controls */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRight: '1px solid var(--border-color)', position: 'relative' }}>

                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff' }}>
                    <Link to="/admin" style={{ textDecoration: 'none', color: 'var(--text-light)', fontSize: '1rem' }}>← Back</Link>
                    <div style={{ height: '20px', width: '1px', background: '#ddd' }}></div>
                    <img src="/mitadtlogo.png" alt="MIT" style={{ height: '40px' }} />
                    <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--mit-purple)' }}>Projector View</h2>
                    <div style={{ marginLeft: 'auto', fontSize: '1rem', color: 'var(--text-light)' }}>
                        Event ID: #{id}
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--mit-purple)' }}>Smart Attendance Session</h1>

                    {token ? (
                        <div style={{ padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                            <QRCodeSVG
                                value={JSON.stringify({ eventId: id, token: token })}
                                size={window.innerHeight * 0.4}
                            />
                            <div style={{ fontSize: '5rem', fontWeight: 'bold', fontFamily: 'monospace', marginTop: '1.5rem', letterSpacing: '0.25rem', color: 'var(--text-dark)' }}>
                                {token}
                            </div>
                        </div>
                    ) : (
                        <div style={{ width: '400px', height: '400px', background: 'var(--bg-grey)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '2px dashed #ddd' }}>
                            <p style={{ fontSize: '1.5rem', color: 'var(--text-light)' }}>Session Inactive</p>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
                    <button onClick={startRotation} className="mit-btn" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
                        {token ? 'Restart Rotation' : 'Start Session'}
                    </button>
                    {token && (
                        <button onClick={stopRotation} className="mit-btn" style={{ background: '#d32f2f', fontSize: '1.2rem', padding: '1rem 2rem' }}>
                            Stop Session
                        </button>
                    )}
                </div>

                {message && <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>{message}</p>}

                <div style={{ position: 'absolute', bottom: '20px', left: '20px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                    Total Present: <span style={{ color: 'var(--success-green)', fontSize: '1.5rem' }}>{stats.count}</span>
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

                <div style={{ padding: '1rem', textAlign: 'center', background: '#fff', borderBottom: '1px solid #ddd' }}>
                    <p style={{ margin: 0, color: 'var(--text-light)', fontStyle: 'italic' }}>
                        Names will appear here instantly.
                    </p>
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
            </div>
        </div>
    );
}
