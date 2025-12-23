import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // States
    const [view, setView] = useState('home'); // home | scanner | manual | success
    const [error, setError] = useState('');
    const [statusData, setStatusData] = useState(null); // For success screen
    const [manualEventId, setManualEventId] = useState('');
    const [manualToken, setManualToken] = useState('');
    const [history, setHistory] = useState([]); // Attendance History
    const scannerRef = useRef(null);

    // Profile Check
    useEffect(() => {
        if (user && user.role === 'student' && !user.enrollment_no) {
            navigate('/profile-setup');
        }
    }, [user, navigate]);

    // Check for Deep Link (Direct Scan)
    const [searchParams] = useSearchParams();
    useEffect(() => {
        const eventId = searchParams.get('event_id');
        const token = searchParams.get('token');
        if (eventId && token && view === 'home' && !statusData) {
            handleAttendanceSubmit(JSON.stringify({ eventId, token }), true);
        }
    }, [searchParams, view]);

    // Fetch History on Mount and after success
    useEffect(() => {
        fetchHistory();
    }, [user]);

    const fetchHistory = async () => {
        if (!user) return;
        try {
            const res = await api.get('/attendance/my-history');
            setHistory(res.data.history || res.data || []);
        } catch (err) {
            console.error('Failed to load history', err);
            setHistory([]);
        }
    };

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, []);

    const startScanner = () => {
        setView('scanner');
        setError('');

        // Slight delay to ensure DOM is ready
        setTimeout(() => {
            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            html5QrCode.start(
                { facingMode: "environment" },
                config,
                onScanSuccess,
                onScanFailure
            ).catch(err => {
                setError("Camera permission denied or not available.");
                setView('home');
            });
        }, 100);
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (e) {
                console.error(e);
            }
        }
        setView('home');
    };

    const onScanSuccess = (decodedText) => {
        // Stop scanning immediately
        if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
                scannerRef.current = null;
                handleAttendanceSubmit(decodedText);
            }).catch(e => console.error(e));
        }
    };

    const onScanFailure = (error) => {
        // console.warn(`Code scan error = ${error}`);
    };

    const handleAttendanceSubmit = async (qrData, isDirect = false) => {
        try {
            let payload = {};

            // Helper to extract params from URL or Object
            const extract = (data) => {
                if (typeof data === 'string' && data.includes('event_id=')) {
                    // It's a URL string
                    const url = new URL(data.startsWith('http') ? data : window.location.origin + data);
                    return {
                        eventId: url.searchParams.get('event_id'),
                        token: url.searchParams.get('token')
                    };
                }
                // Try JSON
                const parsed = JSON.parse(data);
                return parsed;
            };

            try {
                const data = extract(qrData);
                if (data.eventId && data.token) { // Ensure keys match EventDetails
                    payload = {
                        event_id: data.eventId,
                        token: data.token,
                        device_hash: 'browser-' + user.id
                    };
                } else {
                    throw new Error("Invalid QR Format");
                }
            } catch (e) {
                console.error(e);
                throw new Error("Invalid QR Code. Please use Manual Entry.");
            }

            const res = await api.post('/attendance', payload);

            setStatusData({
                name: user.name,
                enrollment_no: user.enrollment_no,
                time: new Date().toLocaleString(),
                message: res.data.message || 'Attendance Marked'
            });
            setView('success');
            fetchHistory(); // Refresh history

        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Attendance Failed');
            setView('home'); // Go back to home to show error
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/attendance', {
                event_id: manualEventId,
                token: manualToken,
                device_hash: 'browser-manual-' + user.id
            });
            setStatusData({
                name: user.name,
                enrollment_no: user.enrollment_no,
                time: new Date().toLocaleString()
            });
            setView('success');
            fetchHistory(); // Refresh history
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to mark attendance');
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-grey)' }}>

            {/* Header */}
            <div className="mit-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src="/mitadtlogo.png" alt="MIT ADT Logo" className="mit-logo" />
                    <div>
                        <h1 style={{ fontSize: '1.25rem', marginBottom: 0 }}>AttendEase</h1>
                        <small style={{ color: 'var(--text-light)' }}>MIT ADT University</small>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
                    <button
                        className="header-profile-btn"
                        onClick={() => navigate('/profile')}
                        title="My Profile"
                        style={{
                            background: '#fff',
                            border: '1px solid #ddd',
                            color: '#555',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            padding: 0
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#f5f5f5';
                            e.currentTarget.style.borderColor = '#bbb';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = '#fff';
                            e.currentTarget.style.borderColor = '#ddd';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </button>
                    <button
                        className="header-signout-btn"
                        onClick={logout}
                        title="Sign out"
                        style={{
                            background: 'var(--mit-purple)',
                            border: 'none',
                            color: 'white',
                            padding: '0.6rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            minHeight: '44px'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                        Sign out
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="mit-container" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {/* Greeting Card */}
                {view === 'home' && (
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-dark)' }}>Welcome, {user?.name}</h2>
                        <p style={{ color: 'var(--text-light)', marginTop: '0.25rem' }}>Enrollment: <strong>{user?.enrollment_no}</strong></p>
                    </div>
                )}

                {error && (
                    <div style={{ width: '100%', maxWidth: '400px', marginBottom: '1rem', padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '4px', textAlign: 'center', border: '1px solid #ffcdd2' }}>
                        {error}
                    </div>
                )}

                {view === 'home' && (
                    <>
                        <div className="mit-card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <p style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                Scan the QR code displayed on the screen to mark your attendance.
                            </p>

                            <button
                                onClick={startScanner}
                                style={{
                                    width: '100%',
                                    padding: '1.5rem',
                                    borderRadius: '8px',
                                    border: '2px dashed var(--mit-purple)',
                                    background: '#f3e5f5',
                                    color: 'var(--mit-purple)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    marginBottom: '1rem'
                                }}
                            >
                                <span style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Tap to Scan QR</span>
                            </button>

                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                                <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                                <span style={{ color: '#999', fontSize: '0.9rem' }}>OR</span>
                                <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                            </div>

                            <button
                                onClick={() => { setView('manual'); setError(''); }}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    background: 'white',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '0.95rem',
                                    color: 'var(--text-dark)',
                                }}
                            >
                                Enter Code Manually
                            </button>
                        </div>


                        {/* Recent Attendance History */}
                        {history.length > 0 && (
                            <div style={{ width: '100%', maxWidth: '400px', marginTop: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-light)', borderBottom: '2px solid var(--mit-purple)', display: 'inline-block', paddingBottom: '4px' }}>
                                    Past Marked Attendance
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {history.map((record, idx) => (
                                        <div key={idx} style={{ background: 'white', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--success-green)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <strong style={{ color: 'var(--mit-purple)', fontSize: '0.95rem' }}>{record.event_name}</strong>
                                                <span style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(record.scan_time).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-light)' }}>{record.venue || 'Main Hall'}</span>
                                                <span style={{ color: 'var(--success-green)', fontWeight: 'bold' }}>{record.status} • {new Date(record.scan_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {view === 'scanner' && (
                    <div className="mit-card" style={{ width: '100%', maxWidth: '500px', padding: '1rem' }}>
                        <div id="reader" style={{ width: '100%', borderRadius: '4px', overflow: 'hidden', background: '#000' }}></div>
                        <button
                            onClick={stopScanner}
                            className="mit-btn"
                            style={{ width: '100%', marginTop: '1rem', background: 'var(--text-light)' }}
                        >
                            Cancel Scanning
                        </button>
                    </div>
                )}

                {view === 'manual' && (
                    <div className="mit-card" style={{ width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Manual Entry</h3>
                        <form onSubmit={handleManualSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Event ID</label>
                                <input className="mit-input" type="number" required value={manualEventId} onChange={e => setManualEventId(e.target.value)} placeholder="Enter Event ID" />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>6-Digit Token</label>
                                <input className="mit-input" type="text" required value={manualToken} onChange={e => setManualToken(e.target.value)} placeholder="e.g. 123456" />
                            </div>
                            <button type="submit" className="mit-btn" style={{ width: '100%' }}>Submit Attendance</button>
                        </form>
                        <button onClick={() => setView('home')} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-light)', textDecoration: 'underline' }}>Cancel</button>
                    </div>
                )}

                {view === 'success' && statusData && (
                    <div className="mit-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', borderTop: '5px solid var(--success-green)' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'var(--success-green)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <span style={{ fontSize: '3rem', color: 'white' }}>✓</span>
                        </div>
                        <h2 style={{ color: 'var(--success-green)', marginBottom: '0.5rem' }}>{statusData.message}</h2>
                        <p style={{ color: 'var(--success-green)', fontWeight: 'bold', marginBottom: '0.25rem' }}>Successfully Marked</p>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: 0 }}>{statusData.time}</p>

                        <div style={{ marginTop: '2rem', background: 'var(--bg-grey)', padding: '1rem', borderRadius: '4px', textAlign: 'left' }}>
                            <p style={{ margin: '0.5rem 0' }}><small style={{ color: 'var(--text-light)' }}>NAME</small><br /><strong>{statusData.name}</strong></p>
                            <p style={{ margin: '0.5rem 0' }}><small style={{ color: 'var(--text-light)' }}>ENROLLMENT</small><br /><strong>{statusData.enrollment_no}</strong></p>
                        </div>

                        <button
                            onClick={() => setView('home')}
                            className="mit-btn"
                            style={{ width: '100%', marginTop: '1.5rem' }}
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
}
