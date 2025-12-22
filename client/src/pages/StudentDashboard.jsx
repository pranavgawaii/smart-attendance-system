import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // States
    const [view, setView] = useState('home'); // home | scanner | manual | success
    const [error, setError] = useState('');
    const [statusData, setStatusData] = useState(null); // For success screen
    const [manualEventId, setManualEventId] = useState('');
    const [manualToken, setManualToken] = useState('');
    const scannerRef = useRef(null);

    // Profile Check
    useEffect(() => {
        if (user && user.role === 'student' && !user.enrollment_no) {
            navigate('/profile-setup');
        }
    }, [user, navigate]);

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

    const handleAttendanceSubmit = async (qrData) => {
        try {
            let payload = {};

            // Try parsing JSON (New Format)
            try {
                const data = JSON.parse(qrData);
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
                throw new Error("Invalid QR Code. Please use Manual Entry.");
            }

            await api.post('/attendance', payload);

            setStatusData({
                name: user.name,
                enrollment_no: user.enrollment_no,
                time: new Date().toLocaleString()
            });
            setView('success');

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
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to mark attendance');
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-grey)' }}>

            {/* Header */}
            <div className="mit-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src="/mitadtlogo.png" alt="MIT ADT Logo" className="mit-logo" />
                    <div>
                        <h1 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Smart Attendance</h1>
                        <small style={{ color: 'var(--text-light)' }}>MIT ADT University</small>
                    </div>
                </div>
                <button onClick={logout} style={{ background: 'none', border: '1px solid var(--mit-purple)', color: 'var(--mit-purple)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                    Logout
                </button>
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
                        <h2 style={{ color: 'var(--success-green)', marginBottom: '0.5rem' }}>Attendance Marked</h2>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{statusData.time}</p>

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
        </div>
    );
}
