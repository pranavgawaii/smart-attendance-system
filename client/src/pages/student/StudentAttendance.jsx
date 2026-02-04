
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { QrCode, ArrowLeft, Home, X } from 'lucide-react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function StudentAttendance() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data State
    const [manualCode, setManualCode] = useState('');
    const [manualEventId, setManualEventId] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [activeEvent, setActiveEvent] = useState(null);

    // Scanner Refs
    const videoRef = useRef(null);
    const requestRef = useRef(null);
    const cleanupRef = useRef(null);
    const isSubmittingRef = useRef(false);

    // Load Fingerprint
    const fpPromise = FingerprintJS.load();

    const getFingerprint = async () => {
        const fp = await fpPromise;
        const result = await fp.get();
        return result.visitorId;
    };

    useEffect(() => {
        // Optional: Auto-fetch active event context if needed
        return () => stopScanner();
    }, []);

    const startScanner = async () => {
        setScanResult(null);
        setIsScanning(true);
        if (cleanupRef.current) cleanupRef.current();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            const readerDiv = document.getElementById("reader");
            if (!readerDiv) return;

            readerDiv.innerHTML = '';
            const video = document.createElement("video");

            // UI Styles
            Object.assign(video.style, {
                width: "100%", height: "100%", objectFit: "cover"
            });

            video.autoplay = true;
            video.playsInline = true;
            video.srcObject = stream;
            readerDiv.appendChild(video);
            videoRef.current = video;

            await new Promise(r => video.onloadedmetadata = () => video.play().then(r));

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: true });

            const scanLoop = async () => {
                if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                ctx.drawImage(videoRef.current, 0, 0);

                try {
                    if ("BarcodeDetector" in window) {
                        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
                        const barcodes = await detector.detect(canvas);
                        if (barcodes.length > 0) {
                            const raw = barcodes[0].rawValue;
                            stopScanner();
                            handleScan(raw);
                            return;
                        }
                    }
                } catch (e) { /* ignore */ }

                requestRef.current = requestAnimationFrame(scanLoop);
            };

            requestRef.current = requestAnimationFrame(scanLoop);

            cleanupRef.current = () => {
                if (requestRef.current) cancelAnimationFrame(requestRef.current);
                if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
            };

        } catch (err) {
            console.error(err);
            setIsScanning(false);
            alert("Camera access denied.");
        }
    };

    const stopScanner = () => {
        setIsScanning(false);
        if (cleanupRef.current) cleanupRef.current();
    };

    const handleScan = async (qrData) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            if (navigator.vibrate) navigator.vibrate(200);

            // Parse QR
            // Format 1: URL?event_id=X&token=Y
            // Format 2: JSON { event_id, token }
            let eventId, token;

            try {
                const urlObj = new URL(qrData);
                eventId = urlObj.searchParams.get('event_id');
                token = urlObj.searchParams.get('token');
            } catch (e) {
                // Not a URL, try JSON
                try {
                    const json = JSON.parse(qrData);
                    eventId = json.event_id || json.id; // handle variation
                    token = json.token;
                } catch (e2) {
                    // Try regex fallback
                    const m = qrData.match(/[?&]event_id=([^&]+)/);
                    eventId = m ? m[1] : null;
                    const m2 = qrData.match(/[?&]token=([^&]+)/);
                    token = m2 ? m2[1] : null;
                }
            }

            if (!eventId || !token) throw new Error("Invalid QR format");

            const fingerprint = await getFingerprint();

            const response = await api.post('/attendance', {
                event_id: eventId,
                token: token,
                fingerprint: fingerprint,
                device_info: navigator.userAgent
            });

            const data = response.data;

            // Check if already marked (has marked_at but no success: true)
            if (data.marked_at && !data.success) {
                setScanResult({
                    status: 'info',
                    title: 'Already Marked',
                    message: 'Your attendance was already recorded for this session.'
                });
            } else {
                setScanResult({
                    status: 'success',
                    title: 'Marked Present',
                    message: 'Attendance recorded successfully.'
                });
            }

        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.message;
            setScanResult({
                status: 'error',
                title: msg.includes('Proxy') ? 'Proxy Blocked' : 'Error',
                message: msg
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

            await api.post('/attendance', {
                event_id: manualEventId, // User must type event ID
                token: manualCode, // 6 digit code
                fingerprint: fingerprint,
                device_info: navigator.userAgent
            });

            setScanResult({ status: 'success', title: 'Marked Present', message: 'Manual entry accepted.' });
            setManualCode('');
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            setScanResult({
                status: 'error',
                title: 'Error',
                message: msg
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/student')} className="text-slate-500">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="font-bold text-slate-800 text-lg">Mark Attendance</h1>
                </div>
                <button onClick={() => navigate('/student')} className="text-slate-500">
                    <Home size={24} />
                </button>
            </div>

            <div className="max-w-md mx-auto p-6">

                {scanResult && (
                    <div className={`mb-6 p-4 rounded-xl border ${scanResult.status === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : scanResult.status === 'info'
                                ? 'bg-blue-50 border-blue-200 text-blue-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        <h3 className="font-bold text-lg">{scanResult.title}</h3>
                        <p className="text-sm mt-1">{scanResult.message}</p>
                        <button onClick={() => setScanResult(null)} className="mt-2 text-sm underline opacity-80">Dismiss</button>
                    </div>
                )}

                {isScanning ? (
                    <div className="bg-black rounded-2xl overflow-hidden relative h-[400px]">
                        <div id="reader" className="w-full h-full"></div>
                        <button onClick={stopScanner} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full text-white backdrop-blur-sm">
                            <X size={24} />
                        </button>
                        <div className="absolute bottom-6 left-0 right-0 text-center text-white/80 text-sm">
                            Point camera at the QR code
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <button
                            onClick={startScanner}
                            className="w-full py-10 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-200 flex flex-col items-center gap-4 active:scale-95 transition-transform"
                        >
                            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                                <QrCode size={48} />
                            </div>
                            <div className="text-center">
                                <span className="block text-xl font-bold">Scan QR Code</span>
                                <span className="text-white/80 text-sm">Tap to open camera</span>
                            </div>
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Or Enter Manually</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <form onSubmit={handleManualSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">EVENT ID</label>
                                    <input
                                        type="text"
                                        value={manualEventId}
                                        onChange={e => setManualEventId(e.target.value)}
                                        placeholder="e.g. 12"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono text-lg font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">CODE</label>
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={e => setManualCode(e.target.value)}
                                        placeholder="XXXXXX"
                                        maxLength={6}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono text-lg tracking-widest font-bold"
                                    />
                                </div>
                            </div>
                            <button
                                disabled={isSubmitting || !manualCode}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? 'Verifying...' : 'Submit Code'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
