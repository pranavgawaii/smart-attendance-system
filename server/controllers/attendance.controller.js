const attendanceModel = require('../models/attendance.model');
const qrModel = require('../models/qr.model');
const qrService = require('../services/qr.service');
const { supabase } = require('../config/db');
const { sendApiError } = require('../utils/api-response');

const PROXY_DETECTED_ERROR = {
    error: 'Device mismatch detected! Attendance was already marked from a different device. Contact admin if you changed devices.',
    code: 'PROXY_DETECTED'
};

const DEVICE_ALREADY_USED_ERROR = {
    error: 'This device has already been used to mark attendance for another account in this session.',
    code: 'DEVICE_ALREADY_USED_FOR_SESSION'
};

const normalizeDeviceInfo = (deviceInfo, req) => {
    if (!deviceInfo || typeof deviceInfo === 'string') {
        return {
            browser: deviceInfo || req.headers['user-agent'] || 'UNKNOWN',
            fingerprint: req.body.fingerprint || 'UNKNOWN'
        };
    }

    if (!deviceInfo.fingerprint) {
        return {
            ...deviceInfo,
            fingerprint: req.body.fingerprint || 'UNKNOWN'
        };
    }

    return deviceInfo;
};

const logProxyAttemptSafe = async ({
    session,
    profile,
    userId,
    originalFingerprint,
    attemptedFingerprint,
    originalDevice,
    attemptedDevice
}) => {
    try {
        await attendanceModel.logProxyAttempt({
            session_id: session.id,
            student_id: userId,
            student_email: profile.email,
            original_fingerprint: originalFingerprint,
            attempted_fingerprint: attemptedFingerprint,
            original_device: originalDevice || null,
            attempted_device: attemptedDevice || null,
            attempted_at: new Date()
        });
    } catch (logError) {
        console.error('[SECURITY] Failed to log proxy attempt:', logError.message);
    }
};

const buildAlreadyMarkedPayload = ({ eventName, sessionId, markedAt }) => ({
    message: 'Attendance already marked from this device',
    session: { event_name: eventName, session_id: sessionId },
    session_id: sessionId,
    marked_at: markedAt
});

const getDeterministicMatchForSession = ({ session, submittedValue, allowCode = true }) => {
    if (!session?.id || !submittedValue) return null;

    const interval = qrService.resolveIntervalSeconds(session.qr_refresh_interval || 10);
    const tokenWindow = qrService.getTokenWindow(session.id, interval, Date.now(), 1);
    const normalizedValue = String(submittedValue).trim();

    const match = tokenWindow.find((slotToken) => {
        if (slotToken.token === normalizedValue) return true;
        if (allowCode && slotToken.code === normalizedValue) return true;
        return false;
    });

    if (!match) return null;

    return {
        id: null,
        session_id: session.id,
        token: match.token,
        code: match.code,
        generated_at: match.generated_at,
        expires_at: match.expires_at,
        used_count: 0,
        deterministic: true,
        slot: match.slot,
        matched_by_code: allowCode && match.code === normalizedValue
    };
};

const evaluateAttendanceLock = async ({ session, profile, userId, deviceInfo, eventName }) => {
    const existingByStudent = await attendanceModel.findBySessionAndStudent(session.id, userId);

    if (existingByStudent) {
        if (existingByStudent.device_fingerprint !== deviceInfo.fingerprint) {
            await logProxyAttemptSafe({
                session,
                profile,
                userId,
                originalFingerprint: existingByStudent.device_fingerprint,
                attemptedFingerprint: deviceInfo.fingerprint,
                originalDevice: existingByStudent.device_info,
                attemptedDevice: deviceInfo
            });

            return { status: 403, payload: PROXY_DETECTED_ERROR };
        }

        return {
            status: 200,
            payload: buildAlreadyMarkedPayload({
                eventName,
                sessionId: session.id,
                markedAt: existingByStudent.scanned_at
            })
        };
    }

    const existingByDevice = await attendanceModel.findBySessionAndDevice(session.id, deviceInfo.fingerprint);
    const deviceOwnerId = existingByDevice?.student_id || existingByDevice?.user_id || null;

    if (existingByDevice && deviceOwnerId && deviceOwnerId !== userId) {
        await logProxyAttemptSafe({
            session,
            profile,
            userId,
            originalFingerprint: existingByDevice.device_fingerprint || deviceInfo.fingerprint,
            attemptedFingerprint: deviceInfo.fingerprint,
            originalDevice: existingByDevice.device_info,
            attemptedDevice: deviceInfo
        });

        return { status: 403, payload: DEVICE_ALREADY_USED_ERROR };
    }

    return null;
};

const resolveActiveEventByInput = async (eventInput) => {
    const rawInput = String(eventInput || '').trim();
    if (!rawInput) return null;

    const { data: directEvent, error: directError } = await supabase
        .from('events')
        .select('*')
        .eq('id', rawInput)
        .eq('session_state', 'ACTIVE')
        .maybeSingle();

    if (directError) throw directError;
    if (directEvent) return directEvent;

    const { data: activeEvents, error: activeError } = await supabase
        .from('events')
        .select('*')
        .eq('session_state', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(200);

    if (activeError) throw activeError;
    if (!activeEvents || activeEvents.length === 0) return null;

    const normalizedInput = rawInput.toLowerCase();
    const exactMatches = activeEvents.filter((event) => {
        const name = String(event.name || '').trim().toLowerCase();
        const displayId = String(event.event_display_id || '').trim().toLowerCase();
        const paddedDisplayId = displayId ? displayId.padStart(2, '0') : '';
        return name === normalizedInput || displayId === normalizedInput || paddedDisplayId === normalizedInput;
    });

    if (exactMatches.length === 1) return exactMatches[0];
    if (exactMatches.length > 1) return null;

    const partialNameMatches = activeEvents.filter((event) =>
        String(event.name || '').toLowerCase().includes(normalizedInput)
    );
    if (partialNameMatches.length === 1) return partialNameMatches[0];

    return null;
};

// API Endpoint 1: Mark Attendance via QR Scan
const markAttendance = async (req, res) => {
    try {
        // Flexible Payload Handling (Backwards Compatibility)
        let qr_data = req.body.qr_data;
        let device_info = req.body.device_info;

        // If flattened payload (cached frontend), reconstruction:
        if (!qr_data && req.body.token) {
            qr_data = {
                token: req.body.token,
                session_id: req.body.session_id || req.body.event_id, // flexible mapping
                event_id: req.body.event_id,
                code: req.body.code
            };
        }

        // Ensure device_info is an object with fingerprint
        device_info = normalizeDeviceInfo(device_info, req);
        const user_id = req.user.id; // From auth middleware

        if (!qr_data || !device_info) {
            console.error('[Error] Missing Payload Fields. qr_data:', !!qr_data, 'device_info:', !!device_info);
            return sendApiError(res, 400, 'ATTENDANCE_PAYLOAD_INVALID', 'Missing QR data or device info');
        }

        // 1. Validate QR token exists and is active
        // First try in current session window (if session_id provided), then token lookup, then code lookup.
        let tokenData = null;
        let tokenError = null;
        let matchedByCode = false;

        const submittedToken = String(qr_data.token || '').trim();
        const submittedSessionId = qr_data.session_id ? String(qr_data.session_id).trim() : null;

        if (!submittedToken) {
            return sendApiError(res, 400, 'QR_TOKEN_MISSING', 'Missing token in QR payload');
        }

        let session = null;
        if (submittedSessionId) {
            const { data: sessionById } = await supabase
                .from('events')
                .select('*')
                .eq('id', submittedSessionId)
                .maybeSingle();

            session = sessionById || await resolveActiveEventByInput(submittedSessionId);

            if (session) {
                const deterministicToken = getDeterministicMatchForSession({
                    session,
                    submittedValue: submittedToken,
                    allowCode: true
                });

                if (deterministicToken) {
                    tokenData = deterministicToken;
                    matchedByCode = deterministicToken.matched_by_code;
                }
            }
        }

        // Best case: match only against current + previous token for this session.
        if (!tokenData && submittedSessionId) {
            try {
                const recentSessionTokens = await qrModel.getLatestTokensForSession(submittedSessionId, 2);
                tokenData = recentSessionTokens.find(t => t.token === submittedToken) || null;
            } catch (windowLookupError) {
                console.warn('[Attendance] Session window lookup failed:', windowLookupError.message);
            }
        }

        // Legacy fallback: lookup by token directly.
        if (!tokenData) {
            ({ data: tokenData, error: tokenError } = await supabase
                .from('qr_tokens')
                .select('*')
                .eq('token', submittedToken)
                .eq('is_active', true)
                .maybeSingle());

        }

        // If not found by token, try by 6-digit code (manual entry)
        if (!tokenData) {
            ({ data: tokenData, error: tokenError } = await supabase
                .from('qr_tokens')
                .select('*')
                .eq('code', submittedToken) // Manual entry sends code in token field
                .eq('is_active', true)
                .order('generated_at', { ascending: false })
                .limit(1)
                .maybeSingle());
            matchedByCode = !!tokenData;
        }

        if (tokenError || !tokenData) {
            return res.status(400).json({
                error: 'Invalid or expired QR code. Please scan the latest code.'
            });
        }

        if (!session) {
            const { data: resolvedSession, error: sessionError } = await supabase
                .from('events')
                .select('*')
                .eq('id', tokenData.session_id)
                .single();

            if (sessionError || !resolvedSession) {
                return sendApiError(res, 404, 'EVENT_NOT_FOUND', 'Event not found. Please contact admin.');
            }

            session = resolvedSession;
        }

        // 2c. Token window validation with rotation-boundary tolerance.
        // Accept current token and immediately previous token, with hard max age guard.
        const now = new Date();
        const nowMs = now.getTime();
        const expiresAt = new Date(tokenData.expires_at);
        const expiresAtMs = expiresAt.getTime();
        const intervalSeconds = Math.max(Number(session.qr_refresh_interval) || 10, 1);
        const intervalMs = intervalSeconds * 1000;
        const hardMaxAgeMs = (intervalMs * 2) + 5000;

        const fallbackGeneratedAtMs = Number.isFinite(expiresAtMs)
            ? expiresAtMs - intervalMs - 5000
            : NaN;
        const generatedAtMs = tokenData.generated_at
            ? new Date(tokenData.generated_at).getTime()
            : fallbackGeneratedAtMs;

        let isTokenWithinAllowedWindow = tokenData.deterministic ? true : nowMs <= expiresAtMs;

        if (!isTokenWithinAllowedWindow && !matchedByCode && !tokenData.deterministic) {
            try {
                const latestSessionTokens = await qrModel.getLatestTokensForSession(session.id, 2);
                const isCurrentOrPrevious = latestSessionTokens.some(t => t.token === tokenData.token);
                const tokenAgeMs = Number.isFinite(generatedAtMs) ? (nowMs - generatedAtMs) : Number.POSITIVE_INFINITY;

                if (isCurrentOrPrevious && tokenAgeMs <= hardMaxAgeMs) {
                    isTokenWithinAllowedWindow = true;
                }
            } catch (rotationWindowError) {
                console.warn('[Attendance] Rotation boundary check failed:', rotationWindowError.message);
            }
        }

        if (!isTokenWithinAllowedWindow) {
            return res.status(400).json({
                error: 'QR code expired. Please scan the new code on screen.'
            });
        }

        const resolvedEventName = qr_data.event_id || session.name || session.event_display_id || 'Session';

        // 3. Get student profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user_id)
            .single();

        if (profileError || !profile) {
            return sendApiError(res, 404, 'STUDENT_PROFILE_NOT_FOUND', 'Student profile not found');
        }

        // 4. Evaluate device lock and duplicate rules.
        const lockDecision = await evaluateAttendanceLock({
            session,
            profile,
            userId: user_id,
            deviceInfo: device_info,
            eventName: resolvedEventName
        });

        if (lockDecision) {
            return res.status(lockDecision.status).json(lockDecision.payload);
        }

        // 6. Mark attendance (First time for this session)
        const { data: attendance, error: attendanceError } = await supabase
            .from('attendance_logs')
            .insert({
                session_id: session.id,
                student_id: user_id,
                student_email: profile.email,
                student_name: profile.name,
                enrollment_no: profile.enrollment_no,
                device_fingerprint: device_info.fingerprint,
                device_info: device_info,
                scan_method: 'qr',
                scanned_at: new Date(),
                is_locked: true // Lock device to this session
            })
            .select()
            .single();

        if (attendanceError) {
            console.error('[ERROR] Failed to insert attendance:', attendanceError);
            // Check for duplicate key race condition
            if (attendanceError.code === '23505') {
                return res.status(200).json({ message: 'Attendance processed' });
            }
            throw attendanceError;
        }

        // 7. Increment token usage count (analytics)
        if (tokenData?.id) {
            await supabase
                .from('qr_tokens')
                .update({ used_count: (tokenData.used_count || 0) + 1 })
                .eq('id', tokenData.id);
        }

        // 8. Success response
        return res.status(200).json({
            success: true,
            message: 'Attendance marked successfully!',
            session: {
                event_name: resolvedEventName,
                session_id: session.id
            },
            marked_at: attendance.scanned_at
        });

    } catch (error) {
        console.error('Mark attendance error:', error);
        return sendApiError(res, 500, 'ATTENDANCE_MARK_FAILED', 'Failed to mark attendance. Please try again.');
    }
};

// API Endpoint 2: Mark Attendance via Manual Code
const markManualAttendance = async (req, res) => {
    try {
        const { event_id } = req.body;
        const code = String(req.body.code || '').trim();
        const device_info = normalizeDeviceInfo(req.body.device_info, req);
        const user_id = req.user.id;

        if (!event_id || !code || !device_info) {
            return sendApiError(res, 400, 'MANUAL_ATTENDANCE_PAYLOAD_INVALID', 'Missing event ID, code, or device info');
        }

        // 1. Find active event/session by event_id input (UUID, display ID, or name)
        const session = await resolveActiveEventByInput(event_id);

        if (!session) {
            return res.status(404).json({
                error: 'Session not found or not active. Check Event ID.'
            });
        }

        // 2. Validate code against deterministic window first, then legacy persisted tokens.
        let tokenData = getDeterministicMatchForSession({
            session,
            submittedValue: code,
            allowCode: true
        });
        let tokenError = null;

        if (!tokenData) {
            ({ data: tokenData, error: tokenError } = await supabase
                .from('qr_tokens')
                .select('*')
                .eq('session_id', session.id)
                .eq('code', code)
                .eq('is_active', true)
                .order('generated_at', { ascending: false })
                .limit(1)
                .maybeSingle());
        }

        if (tokenError || !tokenData) {
            return res.status(400).json({
                error: 'Invalid code or code expired. Check the code on screen.'
            });
        }

        // 3. Check expiration (same 10 second window)
        const now = new Date();
        const expiresAt = new Date(tokenData.expires_at);

        if (!tokenData.deterministic && now > expiresAt) {
            return res.status(400).json({
                error: 'Code expired. Use the new code shown on screen.'
            });
        }

        // 3b. Get student profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user_id)
            .single();

        if (profileError || !profile) {
            return sendApiError(res, 404, 'STUDENT_PROFILE_NOT_FOUND', 'Student profile not found');
        }

        const resolvedEventName = session.name || session.event_display_id || String(event_id);
        const lockDecision = await evaluateAttendanceLock({
            session,
            profile,
            userId: user_id,
            deviceInfo: device_info,
            eventName: resolvedEventName
        });

        if (lockDecision) {
            return res.status(lockDecision.status).json(lockDecision.payload);
        }

        // 4. Mark
        const { data: attendance, error: attendanceError } = await supabase
            .from('attendance_logs')
            .insert({
                session_id: session.id,
                student_id: user_id,
                student_email: profile.email,
                student_name: profile.name,
                enrollment_no: profile.enrollment_no,
                device_fingerprint: device_info.fingerprint,
                device_info: device_info,
                scan_method: 'manual',
                scanned_at: new Date(),
                is_locked: true
            })
            .select()
            .single();

        if (attendanceError) {
            console.error('[ERROR] Failed to insert manual attendance:', attendanceError);
            if (attendanceError.code === '23505') {
                return res.status(200).json({ message: 'Attendance processed' });
            }
            throw attendanceError;
        }

        // 5. Update Usage
        if (tokenData?.id) {
            await supabase
                .from('qr_tokens')
                .update({ used_count: (tokenData.used_count || 0) + 1 })
                .eq('id', tokenData.id);
        }

        return res.status(200).json({
            success: true,
            message: 'Attendance marked successfully!',
            session: {
                event_name: resolvedEventName,
                session_id: session.id
            },
            session_id: session.id,
            marked_at: attendance.scanned_at
        });

    } catch (error) {
        console.error('Manual attendance error:', error);
        return sendApiError(res, 500, 'ATTENDANCE_MARK_MANUAL_FAILED', 'Failed to mark attendance');
    }
};

const getMyHistory = async (req, res) => {
    try {
        const user_id = req.user.id;

        const { data: logs, error: logsError } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('student_id', user_id)
            .order('scanned_at', { ascending: false });

        if (logsError) {
            return sendApiError(res, 500, 'ATTENDANCE_HISTORY_FETCH_FAILED', 'Failed to fetch attendance history');
        }

        const sessionIds = [...new Set((logs || []).map((log) => log.session_id).filter(Boolean))];
        let eventMap = {};

        if (sessionIds.length > 0) {
            const { data: events } = await supabase
                .from('events')
                .select('id, name, venue')
                .in('id', sessionIds);

            eventMap = (events || []).reduce((acc, event) => {
                acc[event.id] = event;
                return acc;
            }, {});
        }

        const enrichedLogs = (logs || []).map((log) => {
            const event = eventMap[log.session_id];
            return {
                ...log,
                event_name: event?.name || 'Unknown Event',
                venue: event?.venue || 'Unknown Venue',
                scan_time: log.scanned_at
            };
        });

        res.status(200).json(enrichedLogs);
    } catch (error) {
        console.error('[History] Error:', error);
        return sendApiError(res, 500, 'ATTENDANCE_INTERNAL_ERROR', 'Internal Server Error');
    }
};

module.exports = {
    markAttendance,
    markManualAttendance,
    getMyHistory,
    logAttendance: markAttendance // Alias for backward compatibility if needed, but preferable to switch routes
};
