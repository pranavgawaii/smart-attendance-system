# Release Checklist

## 1. Environment Validation
- Verify all required backend env vars are set (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `QR_HMAC_SECRET`).
- Verify `CORS_ALLOWED_ORIGINS` is production allowlist only.
- Verify rate limit env values are set for auth, attendance, and public forms.

## 2. Database / Migration Status
- Confirm schema is up to date in Supabase for current backend expectations.
- Confirm no pending manual SQL migrations are required for this release.

## 3. Health Checks
- `GET /api/health` returns `200` with `{ success: true }`.
- `GET /api/health/deep` returns `200` for super admin token and rejects unauthorized access.

## 4. Attendance Flow Verification
- QR attendance success for valid student/session.
- Manual code attendance success for valid student/session.
- Same-device different-account in same session blocked with `DEVICE_ALREADY_USED_FOR_SESSION`.
- Same-account different-device in same session blocked with `PROXY_DETECTED`.
- Business `403` denials do not trigger logout on frontend.

## 5. Quality Gates
- `npm test` passes.
- `npm --prefix client run lint` passes with zero warnings/errors.
- `npm --prefix client run build` passes.
- `npm --prefix client run check:bundle-budget` passes.

## 6. Rollback Path
- Redeploy previous stable release from CI artifacts/tag.
- Roll back frontend deployment first if UI-only regression.
- Roll back backend deployment if API contract/security regression.
- Restore previous environment variable snapshot if configuration regression is detected.
