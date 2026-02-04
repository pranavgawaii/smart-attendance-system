import axios from 'axios';

const api = axios.create({
    // Use window.location.origin for same-origin requests (Vercel/Vite Proxy)
    // Fallback to localhost:3000 only if explicitly needed during local debugging
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only logout on actual authentication failures (401 with specific messages)
        // Don't logout on permission errors (403) or other API failures
        if (error.response && error.response.status === 401) {
            const errorMessage = error.response.data?.error || '';

            // Only logout if it's a token-related error
            if (errorMessage.includes('token') ||
                errorMessage.includes('expired') ||
                errorMessage.includes('invalid') ||
                errorMessage.includes('unauthorized')) {

                // Token expired or invalid - thorough cleanup
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('session');
                localStorage.removeItem('role');

                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
