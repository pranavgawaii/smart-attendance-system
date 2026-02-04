const attendanceModel = require('../models/attendance.model');
const qrModel = require('../models/qr.model');
const userModel = require('../models/user.model');
const eventModel = require('../models/event.model');
const { supabase } = require('../config/db');

// API Endpoint 1: Mark Attendance via QR Scan
const markAttendance = async (req, res) => {
    try {
        console.log('--- [DEBUG] Mark Attendance Request ---');
        console.log('Headers:', req.headers);
        console.log('Body:', JSON.stringify(req.body, null, 2));

        // Flexible Payload Handling (Backwards Compatibility)
        let qr_data = req.body.qr_data;
        let device_info = req.body.device_info;

        // If flattened payload (cached frontend), reconstruction:
        if (!qr_data && req.body.token) {
            console.log('⚠️ Detect FLATTENED payload (Legacy/Cached Frontend). adapting...');
            qr_data = {
                token: req.body.token,
                session_id: req.body.session_id || req.body.event_id, // flexible mapping
                event_id: req.body.event_id,
                code: req.body.code
            };
        }

        // Ensure device_info is an object with fingerprint
        if (!device_info || typeof device_info === 'string') {
            // Flattened payload: device_info is userAgent string, fingerprint is at top level
            device_info = {
                browser: device_info || req.headers['user-agent'] || 'UNKNOWN',
                fingerprint: req.body.fingerprint || 'UNKNOWN'
            };
        } else if (device_info && !device_info.fingerprint) {
            // If device_info is object but missing fingerprint, get it from body
            device_info.fingerprint = req.body.fingerprint || 'UNKNOWN';
        }
        const user_id = req.user.id; // From auth middleware

        if (!qr_data || !device_info) {
            console.error('[Error] Missing Payload Fields. qr_data:', !!qr_data, 'device_info:', !!device_info);
            return res.status(400).json({ error: 'Missing QR data or device info (Backend)' });
        }

        // 1. Validate QR token exists and is active
        // First try to find by full token (QR scan), then by 6-digit code (manual entry)
        let tokenData, tokenError;

        console.log('[DEBUG] Looking up token/code:', qr_data.token);

        // Try by token first (QR code contains full token)
        ({ data: tokenData, error: tokenError } = await supabase
            .from('qr_tokens')
            .select('*')
            .eq('token', qr_data.token)
            .eq('is_active', true)
            .single());

        console.log('[DEBUG] Token lookup result:', tokenData ? 'FOUND by token' : 'Not found by token');

        // If not found by token, try by 6-digit code (manual entry)
        if (tokenError || !tokenData) {
            console.log('[DEBUG] Trying 6-digit code lookup...');
            ({ data: tokenData, error: tokenError } = await supabase
                .from('qr_tokens')
                .select('*')
                .eq('code', qr_data.token) // Manual entry sends code in token field
                .eq('is_active', true)
                .maybeSingle()); // Use maybeSingle to handle no results gracefully

            console.log('[DEBUG] Code lookup result:', tokenData ? 'FOUND by code' : 'Not found by code', tokenError?.message || '');
        }

        if (tokenError || !tokenData) {
            console.log('[DEBUG] FAILED - No token/code found for:', qr_data.token);
            return res.status(400).json({
                error: 'Invalid or expired QR code. Please scan the latest code.'
            });
        }

        // 2. Check if token has expired (10 second window)
        const now = new Date();
        const expiresAt = new Date(tokenData.expires_at);
        const timeDiff = expiresAt - now;

        console.log(`[DEBUG] Token Check: Now string=${now.toISOString()}, Expires string=${expiresAt.toISOString()}, Diff=${timeDiff}ms`);

        if (now > expiresAt) {
            console.warn(`[DEBUG] Token Expired! Now=${now.toISOString()}, Expires=${expiresAt.toISOString()}`);
            return res.status(400).json({
                error: 'QR code expired. Please scan the new code on screen.'
            });
        }

        // 2b. Get session/event using the session_id from the validated token
        // Note: 'session_id' in qr_tokens refers to the 'events' table
        const { data: session, error: sessionError } = await supabase
            .from('events')
            .select('*')
            .eq('id', tokenData.session_id)
            .single();

        if (sessionError || !session) {
            console.error('[Error] Event not found for token:', tokenData.session_id, sessionError);
            return res.status(404).json({ error: 'Event not found. Please contact admin.' });
        }

        // 3. Get student profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user_id)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ error: 'Student profile not found' });
        }

        // 4. Check if student already marked attendance for this session
        console.log('[DEBUG] Checking existing attendance for session:', session.id, 'student:', user_id);
        const { data: existingAttendance, error: existingError } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('session_id', session.id) // Use resolved UUID from session object
            .eq('student_id', user_id)
            .maybeSingle();

        console.log('[DEBUG] Existing attendance result:', existingAttendance ? 'FOUND' : 'NOT FOUND', existingError ? existingError : '');

        if (existingAttendance) {
            // 5. Device fingerprint check (CRITICAL - PROXY DETECTION)
            if (existingAttendance.device_fingerprint !== device_info.fingerprint) {
                // PROXY ATTEMPT DETECTED!
                console.warn(`[Proxy Attempt] User: ${profile.email}, Original Device: ${existingAttendance.device_fingerprint}, New Device: ${device_info.fingerprint}`);

                await supabase.from('proxy_attempts').insert({
                    session_id: session.id,
                    student_id: user_id,
                    student_email: profile.email,
                    original_fingerprint: existingAttendance.device_fingerprint,
                    attempted_fingerprint: device_info.fingerprint,
                    original_device: existingAttendance.device_info,
                    attempted_device: device_info,
                    attempted_at: new Date()
                });

                return res.status(403).json({
                    error: 'Device mismatch detected! Attendance was already marked from a different device. Contact admin if you changed devices.',
                    code: 'PROXY_DETECTED'
                });
            }

            // Same device - already marked
            return res.status(200).json({
                message: 'Attendance already marked from this device',
                session: { event_name: qr_data.event_id },
                marked_at: existingAttendance.scanned_at
            });
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

        console.log('[SUCCESS] Attendance inserted with ID:', attendance?.id);

        // 7. Increment token usage count (analytics)
        await supabase
            .from('qr_tokens')
            .update({ used_count: (tokenData.used_count || 0) + 1 })
            .eq('id', tokenData.id);

        // 8. Success response
        return res.status(200).json({
            success: true,
            message: 'Attendance marked successfully!',
            session: {
                event_name: qr_data.event_id,
                session_id: qr_data.session_id
            },
            marked_at: attendance.scanned_at
        });

    } catch (error) {
        console.error('Mark attendance error:', error);
        return res.status(500).json({
            error: 'Failed to mark attendance. Please try again.'
        });
    }
};

// API Endpoint 2: Mark Attendance via Manual Code
const markManualAttendance = async (req, res) => {
    try {
        const { event_id, code, device_info } = req.body;
        const user_id = req.user.id;

        if (!event_id || !code || !device_info) {
            return res.status(400).json({ error: 'Missing Event ID, Code, or Device Info' });
        }

        // 1. Find active session by event_id (Display ID or UUID? Logic assumes Event ID = event.name or event.event_display_id)
        // Adjust logic: The user wants "GOOGLE-PPT-2024" which is event.name or similar.
        // Let's assume passed event_id is either 'event_display_id' or 'name'.
        // However, event_id is best as UUID for uniqueness, but manual entry might use a human readable ID.
        // Based on user prompt: "Enter the Event ID... GOOGLE-PPT-2024". This looks like a string ID.
        // We will try to find the event/session first.

        let session;

        // Try finding by ID first (if UUID)
        if (event_id.length > 20) {
            const { data } = await supabase.from('sessions').select('*').eq('id', event_id).eq('session_state', 'ACTIVE').maybeSingle();
            session = data;
        }

        // If not found, try 'event_display_id' or Name
        if (!session) {
            let query = supabase.from('sessions').select('*').eq('session_state', 'ACTIVE').limit(1);

            // Check if input mimics a UUID (simple length check) to decide if we search ID
            // "CDK" is short, so we search name only.
            const isUUID = event_id.length > 30;

            if (isUUID) {
                query = query.or(`name.ilike.%${event_id}%,id.eq.${event_id}`);
            } else {
                // Safe text search only
                query = query.ilike('name', `%${event_id}%`);
            }

            const { data } = await query.maybeSingle();
            session = data;
        }

        if (!session) {
            return res.status(404).json({
                error: 'Session not found or not active. Check Event ID.'
            });
        }

        // 2. Validate code matches active token for this session
        const { data: tokenData, error: tokenError } = await supabase
            .from('qr_tokens')
            .select('*')
            .eq('session_id', session.id)
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (tokenError || !tokenData) {
            return res.status(400).json({
                error: 'Invalid code or code expired. Check the code on screen.'
            });
        }

        // 3. Check expiration (same 10 second window)
        const now = new Date();
        const expiresAt = new Date(tokenData.expires_at);

        if (now > expiresAt) {
            return res.status(400).json({
                error: 'Code expired. Use the new code shown on screen.'
            });
        }

        // --- Reusing Logic from Mark Attendance (Profile, Attendance Check, Fingerprint) ---
        // 3b. Get student profile
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user_id).single();
        if (!profile) return res.status(404).json({ error: 'Student profile not found' });

        // 4. Check Duplicate
        const { data: existingAttendance } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('session_id', session.id)
            .eq('student_id', user_id)
            .maybeSingle();

        if (existingAttendance) {
            if (existingAttendance.device_fingerprint !== device_info.fingerprint) {
                // Log Proxy
                await supabase.from('proxy_attempts').insert({
                    session_id: session.id,
                    student_id: user_id,
                    student_email: profile.email,
                    original_fingerprint: existingAttendance.device_fingerprint,
                    attempted_fingerprint: device_info.fingerprint,
                    original_device: existingAttendance.device_info,
                    attempted_device: device_info,
                    attempted_at: new Date()
                });
                return res.status(403).json({
                    error: 'Device mismatch detected! Proxy blocked.',
                    code: 'PROXY_DETECTED'
                });
            }
            return res.status(200).json({
                message: 'Attendance already marked from this device',
                session_id: session.id
            });
        }

        // 5. Mark
        const { data: attendance } = await supabase
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

        // 6. Update Usage
        await supabase.from('qr_tokens').update({ used_count: (tokenData.used_count || 0) + 1 }).eq('id', tokenData.id);

        return res.status(200).json({
            success: true,
            message: 'Attendance marked successfully!',
            session_id: session.id // Return session ID for redirection
        });

    } catch (error) {
        console.error('Manual attendance error:', error);
        return res.status(500).json({ error: 'Failed to mark attendance' });
    }
};

const getMyHistory = async (req, res) => {
    try {
        const user_id = req.user.id;
        console.log('[History] Fetching attendance history for user:', user_id);

        // First get attendance logs
        const { data: logs, error: logsError } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('student_id', user_id)
            .order('scanned_at', { ascending: false });

        if (logsError) {
            console.error('[History] Error fetching logs:', logsError);
            return res.status(500).json({ error: 'Failed to fetch attendance history' });
        }

        // Get event details for each log
        const enrichedLogs = await Promise.all((logs || []).map(async (log) => {
            const { data: event } = await supabase
                .from('events')
                .select('name, venue')
                .eq('id', log.session_id)
                .single();

            return {
                ...log,
                event_name: event?.name || 'Unknown Event',
                venue: event?.venue || 'Unknown Venue',
                scan_time: log.scanned_at // Alias for frontend compatibility
            };
        }));

        console.log('[History] Found', enrichedLogs.length, 'attendance records');
        res.status(200).json(enrichedLogs);
    } catch (error) {
        console.error('[History] Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateStatus = async (req, res) => { res.json({}); };
const getAllAttendance = async (req, res) => { res.json([]); };

module.exports = {
    markAttendance,
    markManualAttendance,
    getMyHistory,
    updateStatus,
    getAllAttendance,
    logAttendance: markAttendance // Alias for backward compatibility if needed, but preferable to switch routes
};
