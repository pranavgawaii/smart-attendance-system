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
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedSession = localStorage.getItem('session');

        if (storedToken) {
            try {
                // Decode token to check expiration if it's a standard JWT
                const decoded = jwtDecode(storedToken);
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setToken(storedToken);
                    if (storedUser) setUser(JSON.parse(storedUser));
                    if (storedSession) setSession(JSON.parse(storedSession));
                }
            } catch (e) {
                // If decoding fails (might be a different token format), we still keep state if user data exists
                setToken(storedToken);
                if (storedUser) setUser(JSON.parse(storedUser));
                if (storedSession) setSession(JSON.parse(storedSession));
            }
        }
        setLoading(false);
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

    const requestOTP = async (email) => {
        return await api.post('/auth/request-otp', { email });
    };

    const verifyOTP = async (email, otp) => {
        const res = await api.post('/auth/verify-otp', { email, otp });
        if (res.data) {
            login(res.data);
        }
        return res.data;
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            session,
            login,
            logout,
            loading,
            requestOTP,
            verifyOTP
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
