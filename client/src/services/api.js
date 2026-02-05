import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ixbitxgrqvlferwiuica.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Yml0eGdycXZsZmVyd2l1aWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjM0ODAsImV4cCI6MjA4NTQzOTQ4MH0.fUzgYMSFuuZl59dm1WC-bjPyhigXPna2cef1BUo0pjQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Request interceptor - attach token
api.interceptors.request.use(async (config) => {
    // Try to get fresh session from Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        // Use Supabase token if available
        config.headers.Authorization = `Bearer ${session.access_token}`;
        // Also update localStorage for consistency
        localStorage.setItem('token', session.access_token);
    } else {
        // Fallback to localStorage token
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
        const originalRequest = error.config;

        // If 401/403 and we haven't retried yet
        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh the session
                const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

                if (refreshError || !session) {
                    throw new Error('Session refresh failed');
                }

                // Update token in localStorage
                localStorage.setItem('token', session.access_token);

                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
                return api(originalRequest);

            } catch (refreshError) {
                // Refresh failed - logout user
                console.error('Token refresh failed:', refreshError);

                // Clear all auth data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('session');
                localStorage.removeItem('role');

                // Sign out from Supabase
                await supabase.auth.signOut();

                // Redirect to login
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
