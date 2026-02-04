import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

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

                    // Optional: Check expiration if jwtDecode is available and token is JWT
                    try {
                        const decoded = jwtDecode(storedToken);
                        if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
                            console.warn("Token expired, logging out");
                            logout();
                        }
                    } catch (e) {
                        // Not a JWT or decode failed, ignore
                    }
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
        } catch (e) {
            console.warn("AuthContext: Remote logout failed, performing local cleanup only");
        }

        // Local cleanup
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('session');
        localStorage.removeItem('role'); // Cleanup legacy role key if it exists

        setUser(null);
        setToken(null);
        setSession(null);
    };

    const loginWithEmail = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.data && res.data.success) {
            login(res.data);
            return res.data;
        }
        throw new Error(res.data?.error || 'Login failed');
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
