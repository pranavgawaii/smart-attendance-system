import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { QrCode, LogOut, MapPin, ClipboardList, Home, History, ScanLine, X } from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

export default function StudentDashboard() {
    const { user, logout } = useAuth();

    // Data State
    const [activeEvent, setActiveEvent] = useState(null);
    const [activeAssessment, setActiveAssessment] = useState(null);
    const [myAllocation, setMyAllocation] = useState(null);
    const [history, setHistory] = useState([]);

    // UI State
    const [activeTab, setActiveTab] = useState('HOME');
    const [loading, setLoading] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [manualEventId, setManualEventId] = useState('');
    // Scanner State & Refs
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [isDetected, setIsDetected] = useState(false); // Visual feedback for detection
    const [isSubmitting, setIsSubmitting] = useState(false); // Lock for API calls
    const videoRef = useRef(null);
    const requestRef = useRef(null);
    const lastCodeRef = useRef(null);
    const lastTimeRef = useRef(0);
    const stabilityTimerRef = useRef(null);
    const cleanupRef = useRef(null);
    const isSubmittingRef = useRef(false); // Sync lock


    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => {
            clearInterval(interval);
            if (cleanupRef.current) cleanupRef.current();
        };
    }, []);

    useEffect(() => {
        if (activeEvent) {
            setManualEventId(activeEvent.id);
        }
    }, [activeEvent]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const eventsRes = await api.get('/events?active=true');
            const now = new Date();
            const currentEvent = eventsRes.data.find(e => {
                const start = new Date(`${e.date}T${e.start_time}`);
                const end = new Date(`${e.date}T${e.end_time}`);
                return now >= start && now <= end;
            });
            setActiveEvent(currentEvent || null);

            const allocationRes = await api.get('/student/my-allocation');
            if (allocationRes.data.status !== 'NO_ACTIVE_ASSESSMENT') {
                setActiveAssessment({
                    title: allocationRes.data.assessment_name,
                    start_time: allocationRes.data.start_time || '00:00',
                    end_time: allocationRes.data.end_time || '23:59',
                    status: 'LIVE'
                });

                if (allocationRes.data.status === 'ALLOCATED') {
                    setMyAllocation({
                        lab_name: allocationRes.data.lab_name,
                        seat_number: allocationRes.data.seat_number
                    });
                } else {
                    setMyAllocation(null);
                }
            } else {
                setActiveAssessment(null);
                setMyAllocation(null);
            }

            const historyRes = await api.get('/attendance/my-history');
            setHistory(historyRes.data);

        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const startScanner = async () => {
        setScanResult(null);
        setIsScanning(true);
        setIsDetected(false);
        setIsScanning(true);
        setIsDetected(false);
        setActiveTab('HOME');

        // Cleanup any existing streams
        if (cleanupRef.current) cleanupRef.current();

        const constraints = {
            video: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Setup Video Element (Hidden or Visible depending on UI requirement - we hijack the reader div)
            const readerDiv = document.getElementById("reader");
            if (!readerDiv) return;

            readerDiv.innerHTML = ''; // Clear existing
            const video = document.createElement("video");
            video.style.width = "100%";
            video.style.height = "100%";
            video.style.objectFit = "cover";
            video.autoplay = true;
            video.playsInline = true;
            video.muted = true;
            readerDiv.appendChild(video);

            video.srcObject = stream;
            videoRef.current = video;

            // Wait for video to actually start playing to know dimensions
            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play().then(resolve);
                };
            });

            // Fallback scanner instance
            let html5QrCodeFallback = null;
            if (!("BarcodeDetector" in window)) {
                console.log("BarcodeDetector not supported, initializing fallback.");
                // Create a hidden container for the library if it doesn't exist
                if (!document.getElementById("reader-fallback")) {
                    const div = document.createElement("div");
                    div.id = "reader-fallback";
                    div.style.display = "none";
                    document.body.appendChild(div);
                }
                html5QrCodeFallback = new Html5Qrcode("reader-fallback");
            }

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: true });

            let frameCount = 0;

            const scanLoop = async () => {
                if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
                    return; // Stop loop if video stopped
                }

                frameCount++;

                // 1. Setup Crop & Scale
                // We want to crop the center ~25% and scale it up 3x
                const vWidth = videoRef.current.videoWidth;
                const vHeight = videoRef.current.videoHeight;

                // Crop dimensions (approx 1/3 of the screen)
                const cropWidth = Math.floor(vWidth * 0.35);
                const cropHeight = Math.floor(vHeight * 0.35);
                const startX = (vWidth - cropWidth) / 2;
                const startY = (vHeight - cropHeight) / 2;

                // Scale up (3x)
                const scaleFactor = 3;
                canvas.width = cropWidth * scaleFactor;
                canvas.height = cropHeight * scaleFactor;

                // Draw scaled crop to canvas
                ctx.drawImage(
                    videoRef.current,
                    startX, startY, cropWidth, cropHeight, // Source crop
                    0, 0, canvas.width, canvas.height // Dest scaled
                );

                // 2. Detect & Validate
                let detectedCode = null;
                let validationStatus = 'NONE'; // NONE, VALID, INVALID

                try {
                    if ("BarcodeDetector" in window) {
                        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
                        const barcodes = await barcodeDetector.detect(canvas);

                        if (barcodes.length > 0) {
                            const code = barcodes[0];
                            const corners = code.cornerPoints;

                            // Draw Dynamic Bounding Box
                            if (corners && corners.length === 4) {
                                ctx.beginPath();
                                ctx.moveTo(corners[0].x, corners[0].y);
                                ctx.lineTo(corners[1].x, corners[1].y);
                                ctx.lineTo(corners[2].x, corners[2].y);
                                ctx.lineTo(corners[3].x, corners[3].y);
                                ctx.closePath();

                                // Validation Logic
                                const dx = corners[1].x - corners[0].x; // Approx width
                                const dy = corners[2].y - corners[1].y; // Approx height
                                const area = Math.abs(dx * dy);
                                const frameArea = canvas.width * canvas.height;
                                const sizePercent = (area / frameArea) * 100;
                                const aspect = Math.abs(dx / dy);

                                const isGoodSize = sizePercent > 10; // >10% coverage
                                const isGoodAspect = aspect > 0.7 && aspect < 1.4; // Tolerant square

                                if (isGoodSize && isGoodAspect) {
                                    ctx.strokeStyle = '#4ade80'; // Green = Good
                                    ctx.lineWidth = 4;
                                    ctx.stroke();

                                    // Pulse effect for valid code
                                    ctx.fillStyle = 'rgba(74, 222, 128, 0.2)';
                                    ctx.fill();

                                    detectedCode = code.rawValue;
                                    validationStatus = 'VALID';
                                } else {
                                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red = Bad
                                    ctx.lineWidth = 3;
                                    ctx.stroke();
                                    validationStatus = 'INVALID';
                                    console.log(`[Scan] Ignored: Size=${sizePercent.toFixed(1)}%, Aspect=${aspect.toFixed(2)}`);
                                }
                            } else {
                                // Fallback if no corners (rare)
                                detectedCode = code.rawValue;
                                validationStatus = 'VALID';
                            }
                        }
                    } else if (html5QrCodeFallback && frameCount % 10 === 0) {
                        // Fallback logic remains simple (no sophisticated gfx)
                        try {
                            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
                            if (blob) {
                                const result = await html5QrCodeFallback.scanFileV2(blob, false);
                                if (result) {
                                    detectedCode = result;
                                    validationStatus = 'VALID';
                                }
                            }
                        } catch (err) { }
                    }
                } catch (e) {
                    console.error("Detection error:", e);
                }


                // 3. Stability Check (Debounce)
                if (validationStatus === 'VALID' && detectedCode) {
                    setIsDetected(true); // Visual feedback

                    const now = Date.now();

                    if (detectedCode === lastCodeRef.current) {
                        // Check if it's been stable for enough time
                        if (now - lastTimeRef.current > 400) { // 400ms stability
                            // STOP scanning immediately
                            stopScanner();
                            if (navigator.vibrate) navigator.vibrate([100]); // Success pulse
                            handleScan(detectedCode);
                            return; // Exit loop
                        }
                    } else {
                        // New code found, reset timer
                        lastCodeRef.current = detectedCode;
                        lastTimeRef.current = now;
                    }
                } else {
                    // Lost code or Invalid
                    setIsDetected(false);
                    if (Date.now() - lastTimeRef.current > 200) {
                        lastCodeRef.current = null;
                    }
                }

                requestRef.current = requestAnimationFrame(scanLoop);
            };

            requestRef.current = requestAnimationFrame(scanLoop);

            cleanupRef.current = () => {
                if (requestRef.current) cancelAnimationFrame(requestRef.current);
                if (video.srcObject) {
                    video.srcObject.getTracks().forEach(track => track.stop());
                }
                if (readerDiv) readerDiv.innerHTML = '';
            };

        } catch (err) {
            console.error("Camera Error", err);
            setIsScanning(false);
            alert("Could not start camera. Please ensure permissions are granted.");
        }
    };

    const stopScanner = () => {
        setIsScanning(false);

        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }
    };

    const handleScan = async (qrData) => {
        // PREVENT DOUBLE SUBMISSION
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            if (navigator.vibrate) navigator.vibrate(200);

            let eventId, token;

            // Strategy 1: Smart Regex (Works for URLs, deep links, and query strings)
            // Looks for event_id=... and token=... anywhere in the string
            const eventIdMatch = qrData.match(/[?&]event_id=([^&]+)/);
            const tokenMatch = qrData.match(/[?&]token=([^&]+)/);

            if (eventIdMatch && tokenMatch) {
                eventId = eventIdMatch[1];
                token = tokenMatch[1];
            }
            // Strategy 2: Legacy Format (EVENT:123:456)
            else if (qrData.startsWith('EVENT')) {
                const parts = qrData.split(':');
                if (parts.length === 3) {
                    eventId = parts[1];
                    token = parts[2];
                }
            }

            if (!eventId || !token) {
                throw new Error("Invalid QR Code format. Please scan a valid attendance QR code.");
            }

            await api.post('/attendance', { event_id: eventId, token });

            setScanResult({ status: 'success', title: 'Marked Present!', message: 'Your attendance has been recorded.' });
            fetchData();

        } catch (error) {
            const msg = error.response?.data?.error || error.message || 'Scan failed';

            // If it's a duplicate attendance error, show success instead of error (better UX)
            if (msg.includes('already marked')) {
                setScanResult({ status: 'success', title: 'Already Present', message: 'You have already marked attendance for this event.' });
            } else {
                setScanResult({ status: 'error', title: 'Attendance Failed', message: msg });
            }
        } finally {
            // Release lock after short delay to prevent bounce
            setTimeout(() => {
                isSubmittingRef.current = false;
                setIsSubmitting(false);
            }, 2000);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualCode || manualCode.length < 6) {
            alert('Please enter a valid 6-digit code');
            return;
        }

        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        const targetEventId = manualEventId || activeEvent?.id;

        if (!targetEventId) {
            alert("Please enter the Event ID.");
            // Release lock immediately if no event ID
            isSubmittingRef.current = false;
            setIsSubmitting(false);
            return;
        }

        try {
            if (navigator.vibrate) navigator.vibrate(200);
            await api.post('/attendance', { event_id: targetEventId, token: manualCode });
            setScanResult({ status: 'success', title: 'Marked Present!', message: 'Manual entry successful.' });
            setManualCode('');
            fetchData();
            // setShowManualFallback(false); // Hide manual fallback on success (removed)
        } catch (error) {
            const msg = error.response?.data?.error || error.message || 'Entry failed';
            alert(msg);
        } finally {
            setTimeout(() => {
                isSubmittingRef.current = false;
                setIsSubmitting(false);
            }, 1000);
        }
    };

    const isMarkedPresent = activeEvent && history.find(h => h.event_id === activeEvent.id);

    const renderHome = () => (
        <div style={{ padding: '1.5rem', paddingBottom: '7rem', maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Mark Attendance Card */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
                {isMarkedPresent ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{
                            width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%',
                            color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <ClipboardList size={40} />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#166534' }}>Attendance Marked</h3>
                        <p style={{ margin: '0.5rem 0 0', color: '#15803d', fontSize: '0.9rem' }}>
                            Recorded at {new Date(isMarkedPresent.scan_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                ) : isScanning ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>Scanning QR Code</h3>
                            <button
                                onClick={stopScanner}
                                style={{
                                    background: '#f1f5f9',
                                    border: 'none',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={20} color="#64748b" />
                            </button>
                        </div>

                        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '400px', background: '#000' }}>
                            <div id="reader" style={{ width: '100%', height: '100%' }}></div>

                            {/* Dark Overlay & Scan Box */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 5,
                                pointerEvents: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {/* Magnifier Removed */}

                                {/* Scan Box Area */}
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '70%',
                                    maxWidth: '300px',
                                    aspectRatio: '1/1',
                                    zIndex: 10
                                }}>
                                    {/* Dark Overlay (Outside Box) */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: -1000,
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        mask: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
                                        maskComposite: 'exclude',
                                        WebkitMask: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
                                        WebkitMaskComposite: 'xor',
                                        padding: '1px', // Border width hack for mask
                                        borderRadius: '24px',
                                        pointerEvents: 'none'
                                    }}></div>

                                    {/* Active Border & Laser */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        border: isDetected ? '4px solid #4ade80' : '2px solid rgba(255, 255, 255, 0.5)',
                                        borderRadius: '24px',
                                        boxShadow: isDetected ? '0 0 20px rgba(74, 222, 128, 0.6)' : 'none',
                                        transition: 'all 0.3s ease',
                                        overflow: 'hidden' // Clip laser
                                    }}>
                                        {/* Corner Markers (Visual flair) */}
                                        {!isDetected && (
                                            <>
                                                <div style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTop: '4px solid white', borderLeft: '4px solid white', borderRadius: '6px 0 0 0' }} />
                                                <div style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTop: '4px solid white', borderRight: '4px solid white', borderRadius: '0 6px 0 0' }} />
                                                <div style={{ position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottom: '4px solid white', borderLeft: '4px solid white', borderRadius: '0 0 0 6px' }} />
                                                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottom: '4px solid white', borderRight: '4px solid white', borderRadius: '0 0 6px 0' }} />
                                            </>
                                        )}

                                        {/* Scanner Laser Animation */}
                                        {!isDetected && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: '2px',
                                                background: 'linear-gradient(to right, transparent, #3b82f6, transparent)',
                                                boxShadow: '0 0 10px #3b82f6',
                                                animation: 'scanLaser 2s linear infinite',
                                                opacity: 0.8
                                            }} />
                                        )}
                                    </div>
                                </div>

                                {/* Instructions Pill */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '15%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 20,
                                    width: '100%',
                                    textAlign: 'center',
                                    pointerEvents: 'none'
                                }}>
                                    <div style={{
                                        display: 'inline-block',
                                        background: isDetected ? 'rgba(74, 222, 128, 0.2)' : 'rgba(0, 0, 0, 0.6)',
                                        backdropFilter: 'blur(8px)',
                                        padding: '0.6rem 1.25rem',
                                        borderRadius: '30px',
                                        border: isDetected ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            letterSpacing: '0.05em',
                                            color: isDetected ? '#4ade80' : 'white',
                                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                        }}>
                                            {isDetected ? "HOLD STEADY..." : "ALIGN QR INSIDE BOX"}
                                        </p>
                                    </div>
                                </div>

                                {/* CSS for Animations */}
                                <style>{`
                                    @keyframes scanLaser {
                                        0% { top: 0%; opacity: 0; }
                                        10% { opacity: 1; }
                                        90% { opacity: 1; }
                                        100% { top: 100%; opacity: 0; }
                                    }
                                `}</style>
                            </div>
                        </div>
                    </div>

                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Mark Attendance</h2>
                            {activeEvent && (
                                <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '700', background: '#dcfce7', padding: '6px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LIVE</span>
                            )}
                        </div>

                        {/* Primary Action: Scan QR Code */}
                        <button
                            onClick={startScanner}
                            style={{
                                width: '100%',
                                padding: '1.25rem',
                                borderRadius: '12px',
                                background: '#4c1d95',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(76, 29, 149, 0.3)',
                                border: 'none',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            <ScanLine size={24} /> Scan QR Code
                        </button>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ height: '1px', flex: 1, background: '#e2e8f0' }}></div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' }}>OR</span>
                            <div style={{ height: '1px', flex: 1, background: '#e2e8f0' }}></div>
                        </div>

                        {/* Manual Entry Section */}
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>MANUAL ENTRY</span>
                            </div>

                            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Side by side inputs */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>EVENT ID</label>
                                        <input
                                            type="text"
                                            value={manualEventId}
                                            onChange={(e) => setManualEventId(e.target.value)}
                                            placeholder="000"
                                            disabled={!!activeEvent}
                                            style={{
                                                width: '100%',
                                                padding: '0.875rem 1rem',
                                                borderRadius: '12px',
                                                border: 'none',
                                                fontSize: '1rem',
                                                outline: 'none',
                                                background: activeEvent ? '#e2e8f0' : 'white',
                                                color: '#0f172a',
                                                fontWeight: '600',
                                                textAlign: 'center'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>CODE</label>
                                        <input
                                            type="text"
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value)}
                                            placeholder="XXXXXX"
                                            maxLength={6}
                                            style={{
                                                width: '100%',
                                                padding: '0.875rem 1rem',
                                                borderRadius: '12px',
                                                border: 'none',
                                                fontSize: '1rem',
                                                outline: 'none',
                                                background: 'white',
                                                color: '#0f172a',
                                                textAlign: 'center',
                                                fontWeight: '700',
                                                letterSpacing: '0.15em',
                                                textTransform: 'uppercase'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={!manualCode.trim()}
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        borderRadius: '12px',
                                        background: manualCode.trim() ? '#0f172a' : '#e2e8f0',
                                        border: 'none',
                                        color: manualCode.trim() ? 'white' : '#94a3b8',
                                        fontWeight: '600',
                                        cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                                        fontSize: '0.95rem',
                                        transition: 'all 0.2s',
                                        opacity: manualCode.trim() ? 1 : 0.6
                                    }}
                                >
                                    Mark Attendance
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Today's Assessment Card */}
            {(activeAssessment || myAllocation) && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>Today's Assessment</h3>
                        {activeAssessment && (
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7e22ce', background: '#f3e8ff', padding: '6px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {activeAssessment.status}
                            </span>
                        )}
                    </div>

                    {activeAssessment && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <h4 style={{ margin: '0', fontSize: '1.1rem', fontWeight: '600', color: '#334155' }}>{activeAssessment.title}</h4>
                        </div>
                    )}

                    {myAllocation && (
                        <div style={{
                            background: '#f8fafc',
                            padding: '1.25rem',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <div style={{
                                background: '#dbeafe',
                                padding: '12px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <MapPin size={20} color="#2563eb" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '4px' }}>YOUR SEAT</div>
                                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
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
        <div style={{ padding: '1.5rem', paddingBottom: '7rem', maxWidth: '640px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.025em' }}>Attendance History</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                        <div style={{ background: '#f8fafc', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <History size={32} color="#94a3b8" />
                        </div>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '1.1rem', fontWeight: '600' }}>No Records Yet</h4>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                            Your past attendance will appear here.
                        </p>
                    </div>
                ) : (
                    history.map((h, i) => (
                        <div key={i} style={{
                            padding: '1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'white',
                            borderRadius: '16px',
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '12px', color: '#166534' }}>
                                    <ClipboardList size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '1rem' }}>{h.event_name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                                        {new Date(h.scan_time).toLocaleDateString()} • {new Date(h.scan_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                            <span style={{ color: '#15803d', fontWeight: '700', fontSize: '0.75rem', background: '#dcfce7', padding: '6px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

            {/* Header */}
            <div style={{
                background: 'white',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src="/mitadtlogo.png" alt="Logo" style={{ height: '36px' }} />
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Portal</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>{user.name}</div>
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#4c1d95',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(76, 29, 149, 0.2)'
                        }}
                    >
                        {user.name?.charAt(0)}
                    </button>

                    {showProfileMenu && (
                        <>
                            <div
                                style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                                onClick={() => setShowProfileMenu(false)}
                            />
                            <div style={{
                                position: 'absolute',
                                top: '120%',
                                right: 0,
                                width: '220px',
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '16px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                overflow: 'hidden',
                                zIndex: 100
                            }}>
                                <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <p style={{ margin: 0, fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>{user.name}</p>
                                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>{user.enrollment_no}</p>
                                </div>
                                <button
                                    onClick={logout}
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1.25rem',
                                        background: 'none',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        color: '#dc2626',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        textAlign: 'left',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <LogOut size={18} /> Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div style={{ minHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
                {activeTab === 'HOME' && renderHome()}
                {activeTab === 'HISTORY' && renderHistory()}

                {/* Result Overlay */}
                {scanResult && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 200,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem'
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '2.5rem',
                            borderRadius: '24px',
                            textAlign: 'center',
                            width: '100%',
                            maxWidth: '360px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                margin: '0 auto 1.5rem auto',
                                background: scanResult.status === 'success' ? '#dcfce7' : '#fee2e2',
                                color: scanResult.status === 'success' ? '#166534' : '#991b1b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {scanResult.status === 'success' ? <ClipboardList size={40} /> : <X size={40} />}
                            </div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#0f172a', fontWeight: '700' }}>{scanResult.title}</h3>
                            <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>{scanResult.message}</p>
                            <button
                                onClick={() => { setScanResult(null); setActiveTab('HOME'); }}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: '#4c1d95',
                                    color: 'white',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(76, 29, 149, 0.3)'
                                }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '68px',
                background: 'white',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                zIndex: 100,
                boxShadow: '0 -2px 10px rgba(0,0,0,0.03)'
            }}>
                <button
                    onClick={() => setActiveTab('HOME')}
                    style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        flex: 1,
                        padding: '8px 0',
                        color: activeTab === 'HOME' ? '#4c1d95' : '#94a3b8',
                        cursor: 'pointer'
                    }}
                >
                    <Home size={24} strokeWidth={activeTab === 'HOME' ? 2.5 : 2} />
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Home</span>
                </button>

                <button
                    onClick={() => {
                        setActiveTab('HOME');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        if (!isMarkedPresent) startScanner();
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        flex: 1,
                        padding: '8px 0',
                        transform: 'translateY(-16px)',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: '#4c1d95',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 10px 25px -5px rgba(76, 29, 149, 0.4)'
                    }}>
                        <QrCode size={32} />
                    </div>
                </button>

                <button
                    onClick={() => setActiveTab('HISTORY')}
                    style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        flex: 1,
                        padding: '8px 0',
                        color: activeTab === 'HISTORY' ? '#4c1d95' : '#94a3b8',
                        cursor: 'pointer'
                    }}
                >
                    <History size={24} strokeWidth={activeTab === 'HISTORY' ? 2.5 : 2} />
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>History</span>
                </button>
            </div>

        </div>
    );
}
