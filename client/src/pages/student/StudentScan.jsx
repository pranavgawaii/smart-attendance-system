import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function StudentScan() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!scanning || loading) return;

        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10, // Scan 10 times per second
                qrbox: { width: 250, height: 250 }, // Focus area
                aspectRatio: 1.0,
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                },
                rememberLastUsedCamera: true,
                showTorchButtonIfSupported: true
            },
            false
        );

        scanner.render(onScanSuccess, onScanError);

        async function onScanSuccess(decodedText, decodedResult) {
            console.log('=== QR SCAN DEBUG ===');
            console.log('Raw decoded text:', decodedText);
            console.log('Type:', typeof decodedText);
            console.log('Length:', decodedText?.length);
            console.log('====================');

            // Stop scanner immediately to prevent double scans
            scanner.clear();
            setScanning(false);

            // Parse QR data
            try {
                let qrData;
                // Try parsing as JSON
                try {
                    qrData = JSON.parse(decodedText);
                } catch (e) {
                    console.error('JSON Parse Failed:', e);
                    throw new Error('QR code is not in valid JSON format.');
                }

                // Validate schema
                if (!qrData.session_id || !qrData.token) {
                    console.error('Missing fields in QR data:', qrData);
                    throw new Error('QR code missing required session info.');
                }

                console.log('✅ Valid QR Data:', qrData);
                await markAttendance(qrData);

            } catch (err) {
                console.error('QR Validation Error:', err);
                setError(`Invalid QR Code: ${err.message}. Please scan the screen.`);
            }
        }

        function onScanError(error) {
            // Ignore common scanning errors
            if (typeof error === 'string' && error.includes("No MultiFormat Readers")) return;
            // console.warn('Scan error:', error);
        }

        return () => {
            try {
                scanner.clear();
            } catch (e) {
                // Ignore cleanup errors
            }
        };
    }, [scanning, loading]); // scanning added to dep array

    async function markAttendance(qrData) {
        setLoading(true);
        setError('');

        try {
            if (!user) {
                throw new Error('Please login first');
            }

            // 1. Get device fingerprint
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            const fingerprint = result.visitorId;

            // 2. Collect device info
            const deviceInfo = {
                fingerprint: fingerprint,
                browser: navigator.userAgent,
                screen: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                platform: navigator.platform
            };

            // 3. Call backend API
            const payload = {
                qr_data: qrData,
                device_info: deviceInfo
            };

            console.log('--- [DEBUG] Sending Payload ---');
            console.log(JSON.stringify(payload, null, 2));

            const response = await api.post('/attendance/mark', payload);

            const data = response.data;

            if (data.success) {
                // Fresh attendance marked successfully
                setResult({
                    success: true,
                    alreadyMarked: false,
                    message: data.message,
                    session: data.session || { event_name: 'Success' },
                    scanned_at: new Date(data.marked_at || Date.now())
                });
            } else if (data.marked_at) {
                // Attendance was already marked before - show info message
                setResult({
                    success: true,
                    alreadyMarked: true,
                    message: data.message || 'Attendance already marked',
                    session: data.session || { event_name: 'Already Marked' },
                    scanned_at: new Date(data.marked_at)
                });
            } else if (data.message) {
                // Generic success message
                setResult({
                    success: true,
                    alreadyMarked: false,
                    message: data.message,
                    session: { event_name: 'Success' },
                    scanned_at: new Date()
                });
            } else {
                throw new Error(data.error || 'Failed to mark attendance');
            }

        } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Failed to mark attendance';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    // Success screen
    if (result?.success) {
        const isAlreadyMarked = result.alreadyMarked;

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className={`w-20 h-20 ${isAlreadyMarked ? 'bg-blue-100' : 'bg-green-100'} rounded-full flex items-center justify-center mb-6 shadow-sm`}>
                    <span className="text-4xl">{isAlreadyMarked ? 'ℹ️' : '✅'}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {isAlreadyMarked ? 'Already Marked!' : 'Attendance Marked!'}
                </h2>
                {result.session && (
                    <p className="text-lg text-indigo-600 font-semibold mb-1">{result.session.event_name}</p>
                )}
                <p className="text-gray-500 mb-2">
                    {isAlreadyMarked ? 'Previously marked at:' : 'Scanned at:'} {result.scanned_at.toLocaleTimeString()}
                </p>

                {isAlreadyMarked ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-sm w-full">
                        <p className="text-sm text-blue-800 font-medium">
                            ℹ️ Your attendance was already recorded for this session.
                        </p>
                    </div>
                ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 max-w-sm w-full">
                        <p className="text-sm text-yellow-800 font-medium">
                            🔒 Your device has been registered.
                        </p>
                    </div>
                )}

                <button
                    onClick={() => navigate('/student/dashboard')}
                    className="w-full max-w-xs bg-gray-900 text-white py-3 px-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    // Error screen
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <span className="text-4xl">❌</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Attendance Failed</h2>
                <p className="text-red-500 font-medium mb-8 max-w-xs mx-auto">{error}</p>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                        onClick={() => {
                            setError('');
                            setScanning(true);
                            setResult(null);
                        }}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => navigate('/student/manual-entry')}
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md"
                    >
                        Enter Code Manually
                    </button>
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        className="w-full text-gray-400 font-medium text-sm hover:text-gray-600 mt-2"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Main Scanning UI
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-10">
                <h2 className="text-lg font-bold text-gray-900">Scan QR Code</h2>
                <button
                    onClick={() => navigate('/student/dashboard')}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                >
                    ✕
                </button>
            </div>

            <div className="p-4 flex flex-col items-center">
                {/* Scanner Container */}
                <div className="w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-xl mb-6 relative aspect-square">
                    {loading && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                            <div className="flex flex-col items-center text-white">
                                <div className="w-10 h-10 border-4 border-white/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                                <span className="font-bold tracking-wide">Verifying...</span>
                            </div>
                        </div>
                    )}
                    <div id="qr-reader" className="w-full h-full object-cover"></div>
                </div>

                {/* Tips */}
                <div className="w-full max-w-md bg-indigo-50 rounded-xl p-5 mb-6">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        💡 Scanning Tips
                    </h3>
                    <ul className="text-sm text-indigo-800 space-y-2 list-disc pl-4 marker:text-indigo-400">
                        <li>Hold phone steady</li>
                        <li>Works from any distance</li>
                        <li>Ensure good lighting</li>
                        <li>QR refreshes every 10s</li>
                    </ul>
                </div>

                {/* Manual Entry Link */}
                <button
                    className="w-full max-w-md py-4 text-center text-gray-600 font-semibold hover:text-indigo-600 transition-colors border-t border-gray-100"
                    onClick={() => navigate('/student/manual-entry')}
                >
                    Can't scan? <span className="underline decoration-2 decoration-indigo-200 underline-offset-4">Enter code manually</span>
                </button>
            </div>

            {/* Global Styles helper for the scanner library */}
            <style>{`
                #qr-reader video {
                    object-fit: cover;
                    border-radius: 1rem;
                }
                #qr-reader__scan_region {
                   background: transparent !important;
                }
                #qr-reader__dashboard_section_csr {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
