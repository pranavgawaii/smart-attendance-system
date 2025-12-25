# CRITICAL: Railway vs Local Database Issue

## Problem Identified

You're seeing "Access denied" because:

1. **Local database** (localhost) HAS the students ✅
2. **Railway database** (production) might NOT have the students ❌

When you test on your deployed Vercel site, it connects to Railway's database, not your local one.

## Solution: Add Students to Railway Database

### Method 1: Railway SQL Query (Recommended - 2 minutes)

1. Go to **Railway Dashboard**
2. Click your **PostgreSQL** service
3. Click **"Query"** tab
4. Paste and run this SQL:

```sql
-- Add the specific student
INSERT INTO users (name, email, enrollment_no, branch, academic_year, role, user_status)
VALUES ('Student LY 30', 'adt23socb0030@student.mitadt.edu', 'ADT23SOCB0030', 'SOCB', 4, 'student', 'active')
ON CONFLICT (email) DO UPDATE SET role = 'student', user_status = 'active';

-- Verify it was added
SELECT * FROM users WHERE email = 'adt23socb0030@student.mitadt.edu';
```

### Method 2: Check if Students Already Exist

Run this query in Railway to see what's in the database:

```sql
SELECT COUNT(*) as total_students FROM users WHERE role = 'student';
SELECT email FROM users WHERE role = 'student' LIMIT 10;
```

If you see 0 students or different emails, that confirms Railway database is empty/different.

### Method 3: Bulk Import to Railway

If Railway database is empty, you need to import all 100 students. Use Railway's import feature or run the seed script directly on Railway.

## How to Test

**After adding student to Railway:**

1. Go to your **Vercel deployed site** (not localhost)
2. Email: `adt23socb0030@student.mitadt.edu`
3. Get OTP
4. Should work ✅

**To test locally:**
- Use `http://localhost:5173` (Vite) or `http://localhost:3000`
- Will use local database (already has students)

## Key Takeaway

- **Localhost** = Local PostgreSQL database
- **Vercel/Railway deployment** = Railway PostgreSQL database

These are TWO DIFFERENT databases! You need to add students to BOTH.
