import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ixbitxgrqvlferwiuica.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Yml0eGdycXZsZmVyd2l1aWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjM0ODAsImV4cCI6MjA4NTQzOTQ4MH0.fUzgYMSFuuZl59dm1WC-bjPyhigXPna2cef1BUo0pjQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const AUTH_ENDPOINTS = ['/auth/login', '/auth/logout', '/auth/me'];
let supabaseBootstrapPromise = null;

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

const getStoredSession = () => {
    try {
        const rawSession = localStorage.getItem('session');
        if (!rawSession || rawSession === 'undefined') return null;

        const parsed = JSON.parse(rawSession);
        if (!parsed?.access_token || !parsed?.refresh_token) return null;
        return parsed;
    } catch (error) {
        console.warn('[API] Invalid stored session payload:', error);
        return null;
    }
};

const isAuthEndpoint = (url = '') => AUTH_ENDPOINTS.some((endpoint) => String(url).includes(endpoint));

const clearLocalAuthState = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    localStorage.removeItem('role');

    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.warn('[API] Supabase local signout failed:', error);
    } finally {
        supabaseBootstrapPromise = null;
    }
};

const bootstrapSupabaseSession = async (force = false) => {
    if (force) {
        supabaseBootstrapPromise = null;
    }

    if (supabaseBootstrapPromise) {
        return supabaseBootstrapPromise;
    }

    const bootstrapPromise = (async () => {
        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession?.access_token) {
                localStorage.setItem('token', currentSession.access_token);
                localStorage.setItem('session', JSON.stringify(currentSession));
                return currentSession;
            }

            const storedSession = getStoredSession();
            if (!storedSession) return null;

            const { data, error } = await supabase.auth.setSession({
                access_token: storedSession.access_token,
                refresh_token: storedSession.refresh_token
            });

            if (error || !data?.session) {
                console.warn('[API] Failed to restore Supabase session:', error);
                return null;
            }

            localStorage.setItem('token', data.session.access_token);
            localStorage.setItem('session', JSON.stringify(data.session));
            return data.session;
        } catch (error) {
            console.warn('[API] Supabase bootstrap failed:', error);
            return null;
        }
    })();

    supabaseBootstrapPromise = bootstrapPromise;
    const session = await bootstrapPromise;

    if (supabaseBootstrapPromise === bootstrapPromise) {
        supabaseBootstrapPromise = null;
    }

    return session;
};

// Request interceptor - attach token
api.interceptors.request.use(async (config) => {
    await bootstrapSupabaseSession();

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('session', JSON.stringify(session));
    } else {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config || {};
        const status = error.response?.status;

        // Only auth failures should trigger refresh flow.
        if (status === 401 && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
            originalRequest._retry = true;

            try {
                await bootstrapSupabaseSession();
                const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

                if (refreshError || !session?.access_token) {
                    throw new Error('Session refresh failed');
                }

                localStorage.setItem('token', session.access_token);
                localStorage.setItem('session', JSON.stringify(session));

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
                return api(originalRequest);

            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                await clearLocalAuthState();
                supabaseBootstrapPromise = null;

                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }

                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export { supabase };
export { bootstrapSupabaseSession };
export { clearLocalAuthState };
export default api;
