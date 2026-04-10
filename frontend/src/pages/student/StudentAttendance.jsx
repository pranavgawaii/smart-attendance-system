
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { QrCode, ArrowLeft, Home, X, CheckCircle2, AlertCircle, Info, Keyboard, ScanLine, Shield } from 'lucide-react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Html5Qrcode } from 'html5-qrcode';

export default function StudentAttendance({ initialTab = 'scan' }) {
    const navigate = useNavigate();

    // Data State
    const [manualCode, setManualCode] = useState('');
    const [manualEventId, setManualEventId] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState(initialTab === 'manual' ? 'manual' : 'scan'); // 'scan' or 'manual'

    // Scanner Refs
    const html5QrCodeRef = useRef(null);
    const isSubmittingRef = useRef(false);

    // Load Fingerprint once
    const fpPromiseRef = useRef(FingerprintJS.load());

    const getFingerprint = async () => {
        const fp = await fpPromiseRef.current;
        const result = await fp.get();
        return result.visitorId;
    };

    const teardownScanner = async () => {
        const scanner = html5QrCodeRef.current;
        if (!scanner) return;

        try {
            await scanner.stop();
        } catch {
            // Ignore stop errors when scanner is already stopped/not running.
        }

        try {
            await scanner.clear();
        } catch {
            // Ignore clear errors.
        }

        html5QrCodeRef.current = null;
    };

    useEffect(() => {
        return () => {
            void teardownScanner();
        };
    }, []);

    useEffect(() => {
        setActiveTab(initialTab === 'manual' ? 'manual' : 'scan');
    }, [initialTab]);

    const startScanner = async () => {
        setScanResult(null);
        setIsScanning(true);

        // Ensure scanner container is mounted before initializing camera.
        await new Promise(resolve => setTimeout(resolve, 0));
        await teardownScanner();

        try {
            const readerElement = document.getElementById('reader');
            if (!readerElement) {
                throw new Error('Scanner container unavailable');
            }

            const scanner = new Html5Qrcode('reader', { verbose: false });
            html5QrCodeRef.current = scanner;

            const scannerConfig = {
                fps: 12,
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0,
                disableFlip: false
            };

            const onScanSuccess = (decodedText) => {
                if (isSubmittingRef.current) return;
                stopScanner();
                void handleScan(decodedText);
            };

            const onScanError = () => {
                // Ignore noisy scan misses; keep scanning.
            };

            try {
                await scanner.start({ facingMode: { exact: 'environment' } }, scannerConfig, onScanSuccess, onScanError);
            } catch {
                await scanner.start({ facingMode: 'environment' }, scannerConfig, onScanSuccess, onScanError);
            }

        } catch (err) {
            console.error(err);
            setIsScanning(false);
            setScanResult({
                status: 'error',
                title: 'Camera Error',
                message: 'Camera access denied. Please enable camera permissions.'
            });
            await teardownScanner();
        }
    };

    const stopScanner = () => {
        setIsScanning(false);
        void teardownScanner();
    };

    const processAttendanceResponse = (data, isManual = false) => {
        // Check if already marked (has marked_at but no success: true)
        if (data.marked_at && !data.success) {
            setScanResult({
                status: 'info',
                title: 'Already Marked',
                message: 'Your attendance was already recorded for this session.',
                time: new Date(data.marked_at).toLocaleTimeString()
            });
        } else {
            setScanResult({
                status: 'success',
                title: 'Marked Present',
                message: isManual ? 'Manual entry accepted.' : 'Attendance recorded successfully.',
                time: new Date().toLocaleTimeString()
            });
        }
    };

    const parseAttendanceError = (error) => {
        const code = error.response?.data?.code;
        const message = error.response?.data?.error || error.message || 'Failed to mark attendance';

        if (code === 'PROXY_DETECTED') {
            return { title: 'Proxy Blocked', message };
        }

        if (code === 'DEVICE_ALREADY_USED_FOR_SESSION') {
            return { title: 'Device Already Used', message };
        }

        if (code === 'AUTH_TOKEN_EXPIRED' || code === 'AUTH_TOKEN_INVALID' || code === 'AUTH_TOKEN_MISSING') {
            return { title: 'Session Expired', message: 'Your login session expired. Please login again.' };
        }

        return { title: 'Error', message };
    };

    const handleScan = async (qrData) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            if (navigator.vibrate) navigator.vibrate(200);

            const rawData = typeof qrData === 'string' ? qrData.trim() : '';
            let sessionId = null;
            let eventId = null;
            let token = null;

            try {
                const urlObj = new URL(rawData);
                sessionId = urlObj.searchParams.get('session_id');
                eventId = urlObj.searchParams.get('event_id');
                token = urlObj.searchParams.get('token');
            } catch {
                try {
                    const json = JSON.parse(rawData);
                    sessionId = json.session_id || json.sessionId || null;
                    eventId = json.event_id || json.eventId || json.id || null;
                    token = json.token;
                } catch {
                    const sessionMatch = rawData.match(/[?&]session_id=([^&]+)/);
                    sessionId = sessionMatch ? decodeURIComponent(sessionMatch[1]) : null;

                    const eventMatch = rawData.match(/[?&]event_id=([^&]+)/);
                    eventId = eventMatch ? decodeURIComponent(eventMatch[1]) : null;

                    const tokenMatch = rawData.match(/[?&]token=([^&]+)/);
                    token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
                }
            }

            if (!token) throw new Error('Invalid QR format');

            const fingerprint = await getFingerprint();

            const payload = {
                token: token,
                fingerprint: fingerprint,
                device_info: navigator.userAgent
            };

            if (sessionId) payload.session_id = sessionId;
            if (eventId) payload.event_id = eventId;

            const response = await api.post('/attendance', payload);

            processAttendanceResponse(response.data, false);

        } catch (error) {
            console.error(error);
            const parsedError = parseAttendanceError(error);
            setScanResult({
                status: 'error',
                title: parsedError.title,
                message: parsedError.message
            });
        } finally {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualCode || !manualEventId) return;

        setIsSubmitting(true);
        try {
            const fingerprint = await getFingerprint();

            const response = await api.post('/attendance', {
                event_id: manualEventId,
                token: manualCode,
                fingerprint: fingerprint,
                device_info: navigator.userAgent
            });

            processAttendanceResponse(response.data, true);
            setManualCode('');
            setManualEventId('');
        } catch (error) {
            const parsedError = parseAttendanceError(error);
            setScanResult({
                status: 'error',
                title: parsedError.title,
                message: parsedError.message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const ResultIcon = ({ status }) => {
        if (status === 'success') return <CheckCircle2 className="w-16 h-16 text-emerald-500" strokeWidth={1.5} />;
        if (status === 'info') return <Info className="w-16 h-16 text-blue-500" strokeWidth={1.5} />;
        return <AlertCircle className="w-16 h-16 text-red-500" strokeWidth={1.5} />;
    };

    const getResultColors = (status) => {
        if (status === 'success') return 'from-emerald-500 to-teal-600';
        if (status === 'info') return 'from-blue-500 to-indigo-600';
        return 'from-red-500 to-rose-600';
    };

    const getResultBg = (status) => {
        if (status === 'success') return 'bg-emerald-50 border-emerald-200';
        if (status === 'info') return 'bg-blue-50 border-blue-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Premium Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
                <div className="max-w-lg mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/student')}
                                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 group"
                            >
                                <ArrowLeft size={20} className="text-slate-600 group-hover:text-slate-900" />
                            </button>
                            <div>
                                <h1 className="text-lg font-semibold text-slate-900">Mark Attendance</h1>
                                <p className="text-xs text-slate-500">Scan QR or enter code</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/student')}
                            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200"
                        >
                            <Home size={20} className="text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-6 py-8">
                {/* Result Display */}
                {scanResult && (
                    <div className={`mb-8 rounded-2xl border-2 overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${getResultBg(scanResult.status)}`}>
                        <div className={`px-6 py-8 text-center bg-gradient-to-r ${getResultColors(scanResult.status)}`}>
                            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <ResultIcon status={scanResult.status} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{scanResult.title}</h3>
                            <p className="text-white/90 text-sm">{scanResult.message}</p>
                            {scanResult.time && (
                                <p className="text-white/70 text-xs mt-2">Recorded at {scanResult.time}</p>
                            )}
                        </div>
                        <div className="p-4 bg-white/50">
                            <button
                                onClick={() => setScanResult(null)}
                                className="w-full py-3 rounded-xl bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
                            >
                                Scan Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Tab Switcher */}
                {!scanResult && (
                    <div className="bg-slate-100 p-1 rounded-2xl mb-8 flex">
                        <button
                            onClick={() => { setActiveTab('scan'); stopScanner(); }}
                            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'scan'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <ScanLine size={18} />
                            Scan QR
                        </button>
                        <button
                            onClick={() => { setActiveTab('manual'); stopScanner(); }}
                            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'manual'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Keyboard size={18} />
                            Enter Code
                        </button>
                    </div>
                )}

                {/* QR Scanner Tab */}
                {!scanResult && activeTab === 'scan' && (
                    <div className="space-y-6">
                        {isScanning ? (
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black aspect-square">
                                <div id="reader" className="w-full h-full"></div>

                                {/* Scanner Overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-0 border-[3px] border-white/30 rounded-3xl"></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg"></div>
                                    </div>
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={stopScanner}
                                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                {/* Hint Text */}
                                <div className="absolute bottom-6 left-0 right-0 text-center">
                                    <p className="text-white/80 text-sm font-medium px-4 py-2 bg-black/30 backdrop-blur-sm rounded-full inline-block">
                                        Position QR code within the frame
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={startScanner}
                                disabled={isSubmitting}
                                className="w-full group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-8 text-white shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 active:scale-[0.98]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <QrCode size={40} strokeWidth={1.5} />
                                    </div>
                                    <span className="text-2xl font-bold mb-2">Scan QR Code</span>
                                    <span className="text-white/70 text-sm">Tap to open camera and scan</span>
                                </div>
                            </button>
                        )}

                        {/* Security Badge */}
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                            <Shield size={14} />
                            <span className="text-xs">Secured with device fingerprinting</span>
                        </div>
                    </div>
                )}

                {/* Manual Entry Tab */}
                {!scanResult && activeTab === 'manual' && (
                    <form onSubmit={handleManualSubmit} className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Event ID
                                    </label>
                                    <input
                                        type="text"
                                        value={manualEventId}
                                        onChange={e => setManualEventId(e.target.value)}
                                        placeholder="e.g. CDK"
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        6-Digit Code
                                    </label>
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={e => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-3xl tracking-[0.5em] font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !manualCode || !manualEventId || manualCode.length < 6}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold text-lg shadow-xl shadow-slate-900/20 hover:from-slate-800 hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Verifying...
                                </span>
                            ) : (
                                'Submit Code'
                            )}
                        </button>

                        {/* Info Note */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-xs text-amber-800 text-center">
                                <strong>Note:</strong> The 6-digit code refreshes every 10 seconds. Enter quickly after seeing the code.
                            </p>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                            <Shield size={14} />
                            <span className="text-xs">Secured with device fingerprinting</span>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
