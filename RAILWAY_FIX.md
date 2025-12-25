# Quick Fix: Add Student to Railway Database

The student `adt24socb0018@student.mitadt.edu` is showing "Access denied" because they don't exist in Railway's production database.

## Immediate Solution

### Option 1: Use Railway SQL Query (Fastest)

1. Go to Railway Dashboard
2. Click on your PostgreSQL database
3. Go to "Query" tab
4. Run this SQL:

```sql
INSERT INTO users (name, email, enrollment_no, branch, academic_year, role, user_status)
VALUES ('Student TY 18', 'adt24socb0018@student.mitadt.edu', 'ADT24SOCB0018', 'SOC', '2024', 'student', 'active')
ON CONFLICT (email) DO UPDATE SET role = 'student', user_status = 'active';
```

5. Click "Run Query"
6. ✅ Student will be added immediately

### Option 2: Test with Existing Student

Use a student that already exists in Railway:

- Email: `adt23socb0001@student.mitadt.edu`
- Or any from `adt23socb0001` to `adt23socb0100`

These 100 students already exist and will work immediately.

### Option 3: Use Admin UI

1. Log in as admin on your deployed site
2. Go to "User Management"  
3. Click "Add User"
4. Fill in:
   - Name: Student TY 18
   - Email: adt24socb0018@student.mitadt.edu
   - Enrollment: ADT24SOCB0018
   - Branch: SOC
   - Role: Student
5. Save

## Why This Happened

The `postinstall` script runs during `npm install`, but Railway might skip it or it might fail silently. The SQL query approach is more reliable for production.

## After Adding Student

Login with:
- Email: `adt24socb0018@student.mitadt.edu`
- OTP: (will be shown in alert after clicking "Send Verification Code")
- ✅ Should work immediately after adding to database
