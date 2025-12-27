-- Migration 003: Fix Device Fingerprint Constraint
-- Purpose: Ensure device uniqueness is enforced PER EVENT, not globally.

DO $$ 
BEGIN
    -- 1. First, remove any potential global unique constraints on device_hash if they exist
    -- (Defensive: User reported "global" behavior, this ensures we strip it)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_logs_device_hash_key') THEN
        ALTER TABLE attendance_logs DROP CONSTRAINT attendance_logs_device_hash_key;
    END IF;

    -- 2. Clean up duplicates to prepare for the new constraint
    -- Keep the earliest scan for any (event_id, device_hash) tuple
    DELETE FROM attendance_logs a USING attendance_logs b
    WHERE a.id > b.id 
    AND a.event_id = b.event_id 
    AND a.device_hash = b.device_hash
    AND a.device_hash IS NOT NULL; -- Don't touch nulls if any

    -- 3. Add the correct constraint: UNIQUE (event_id, device_hash)
    -- This allows the same device to be used for DIFFERENT events, 
    -- but prevents reuse within the SAME event.
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_device_per_event') THEN
        ALTER TABLE attendance_logs 
        ADD CONSTRAINT unique_device_per_event UNIQUE (event_id, device_hash);
    END IF;

END $$;
