import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ManualEntry() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [eventId, setEventId] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    const handleCodeChange = (index, value) => {
        // Only allow digits
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Backspace: go to previous input
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        if (pastedData.length > 0) {
            const newCode = [...code];
            pastedData.forEach((char, i) => {
                if (i < 6 && /^\d$/.test(char)) newCode[i] = char;
            });
            setCode(newCode);
            // Focus last filled or first empty
            const lastIndex = Math.min(pastedData.length, 5);
            inputRefs[lastIndex]?.current?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const fullCode = code.join('');

        if (fullCode.length !== 6) {
            setError('Please enter all 6 digits');
            setLoading(false);
            return;
        }

        if (!eventId.trim()) {
            setError('Please enter the Event ID');
            setLoading(false);
            return;
        }

        try {
            // Get device fingerprint
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            const fingerprint = result.visitorId;

            const deviceInfo = {
                fingerprint: fingerprint,
                browser: navigator.userAgent,
                screen: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            // Call backend API
            const response = await api.post('/attendance/mark-manual', {
                event_id: eventId.trim().toUpperCase(),
                code: fullCode,
                device_info: deviceInfo
            });

            const data = response.data;

            if (data.success || data.message) {
                // Format success data to match Scan Page result structure if reusing
                // But here we might just redirect with query params or show state
                navigate('/student/attendance', {
                    state: {
                        success: true,
                        message: data.message,
                        session_id: data.session_id
                    }
                });
            } else {
                throw new Error(data.error || 'Invalid code');
            }

        } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Failed to mark attendance';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-6 animate-in slide-in-from-right-8 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 shadow-sm transition-all"
                >
                    ←
                </button>
                <h1 className="text-xl font-bold text-gray-900">Manual Entry</h1>
            </div>

            <div className="flex-1 max-w-md mx-auto w-full">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                    <p className="text-gray-500 text-sm mb-6">
                        Enter the Event ID and 6-digit Code exactly as shown on the projector screen.
                    </p>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm font-medium p-4 rounded-xl mb-6 flex items-start gap-3">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Event ID
                            </label>
                            <input
                                type="text"
                                value={eventId}
                                onChange={(e) => setEventId(e.target.value)}
                                placeholder="E.g. GOOGLE-PPT-2024"
                                className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-0 outline-none font-bold text-gray-900 placeholder:text-gray-300 transition-all uppercase"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                6-Digit Code
                            </label>
                            <div className="flex gap-2 justify-between" onPaste={handlePaste}>
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={inputRefs[index]}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-full h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:bg-white focus:shadow-lg focus:-translate-y-1 transition-all outline-none"
                                        inputMode="numeric"
                                        pattern="\d*"
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
                                }`}
                        >
                            {loading ? 'Verifying...' : 'Mark Attendance'}
                        </button>
                    </form>
                </div>

                <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                    <div className="h-px bg-gray-200 w-full"></div>
                    <span>OR</span>
                    <div className="h-px bg-gray-200 w-full"></div>
                </div>

                <button
                    onClick={() => navigate('/student/scan')}
                    className="w-full mt-6 py-4 flex items-center justify-center gap-2 text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
                >
                    <span>📷</span> Scan QR Code
                </button>
            </div>
        </div>
    );
}
