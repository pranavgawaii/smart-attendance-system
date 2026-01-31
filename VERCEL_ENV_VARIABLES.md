# Vercel Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

## Frontend (client/.env variables)
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_API_URL=https://api.placepro.in

## Apply to:
- Production ✅
- Preview ✅
- Development ✅

## Notes:
- Never commit .env files to GitHub
- These values are safe to expose in frontend (anon key is public)
- Backend .env stays on Render deployment
