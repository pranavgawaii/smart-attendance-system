/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { bootstrapSupabaseSession, clearLocalAuthState } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');
                const storedSession = localStorage.getItem('session');

                if (storedToken && storedToken !== 'undefined') {
                    setToken(storedToken);

                    if (storedUser && storedUser !== 'undefined') {
                        try {
                            setUser(JSON.parse(storedUser));
                        } catch (e) {
                            console.error("Failed to parse stored user", e);
                        }
                    }

                    if (storedSession && storedSession !== 'undefined') {
                        try {
                            setSession(JSON.parse(storedSession));
                        } catch (e) {
                            console.error("Failed to parse stored session", e);
                        }
                    }
                }

                const restoredSession = await bootstrapSupabaseSession();
                if (restoredSession?.access_token) {
                    setToken(restoredSession.access_token);
                    setSession(restoredSession);
                    localStorage.setItem('token', restoredSession.access_token);
                    localStorage.setItem('session', JSON.stringify(restoredSession));
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = (data) => {
        try {
            if (typeof data === 'string') {
                // Legacy support for login(token)
                localStorage.setItem('token', data);
                const decoded = jwtDecode(data);
                setUser(decoded);
                setToken(data);
            } else {
                // New support for login({ user, token, session })
                const { user: userData, token: sessionToken, session: sessionData } = data;

                setUser(userData);
                setToken(sessionToken);
                setSession(sessionData || null);

                localStorage.setItem('token', sessionToken);
                localStorage.setItem('user', JSON.stringify(userData));
                if (sessionData) {
                    localStorage.setItem('session', JSON.stringify(sessionData));

                    if (sessionData.access_token && sessionData.refresh_token) {
                        bootstrapSupabaseSession(true).catch((sessionError) => {
                            console.warn("Failed to initialize browser auth session", sessionError);
                        });
                    }
                }
            }
        } catch (e) {
            console.error("AuthContext Login Failed:", e);
            logout();
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            console.warn("AuthContext: Remote logout failed, performing local cleanup only");
        }

        await clearLocalAuthState();

        setUser(null);
        setToken(null);
        setSession(null);
    };

    const loginWithEmail = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.data && res.data.success) {
                login(res.data);
                return res.data;
            }
            throw new Error(res.data?.error || 'Invalid credentials');
        } catch (error) {
            console.error('[AuthContext] Login error details:', error.response?.data || error.message);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            session,
            login,
            logout,
            loading,
            loginWithEmail
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
