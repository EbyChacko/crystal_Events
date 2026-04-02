import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch current user profile using stored token
    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/auth/me/');
            setUser(res.data);
        } catch (err) {
            if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
                // Backend is cold-starting — token may still be valid, don't destroy it
                setUser(null);
            } else {
                // Genuine auth failure — clear tokens
                setUser(null);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (username, password) => {
        const res = await api.post('/auth/login/', {
            username,
            password,
        });

        // Check if 2FA is required before setting tokens
        if (res.data['2fa_required']) {
            return {
                requires2FA: true,
                userId: res.data.user_id
            };
        }

        const { access, refresh } = res.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        // Fetch user profile
        const userRes = await api.get('/auth/me/');
        setUser(userRes.data);
        return { requires2FA: false, user: userRes.data };
    };

    const verifyLogin2FA = async (userId, otp) => {
        const res = await api.post('/auth/2fa/login/', {
            user_id: userId,
            otp: otp
        });

        const { access, refresh } = res.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        // Fetch user profile
        const userRes = await api.get('/auth/me/');
        setUser(userRes.data);
        return userRes.data;
    };

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    }, []);

    // Auto-logout functionality based on inactivity
    useEffect(() => {
        if (!user) return;

        let lastActivity = Date.now();
        let intervalId;

        const updateActivity = () => {
            lastActivity = Date.now();
        };

        const checkInactivity = () => {
            // Only enforce session timeout when the user is in the admin panel
            if (!window.location.pathname.startsWith('/admin')) return;

            const settingsStr = localStorage.getItem('crystal_events_settings');
            let timeoutMinutes = 15;
            let autoLogoutEnabled = true;

            if (settingsStr) {
                try {
                    const settings = JSON.parse(settingsStr);
                    timeoutMinutes = parseInt(settings.sessionTimeout) || 15;
                    autoLogoutEnabled = settings.autoLogout !== false;
                } catch (e) {
                    // fallback to defaults
                }
            }

            if (autoLogoutEnabled && (Date.now() - lastActivity > timeoutMinutes * 60 * 1000)) {
                console.log("Session expired due to inactivity.");
                logout();
                window.location.href = '/admin/login';
            }
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

        // Add passive event listeners to update the last activity timestamp
        events.forEach(evt => document.addEventListener(evt, updateActivity, { passive: true }));

        // Check for inactivity every 30 seconds
        intervalId = setInterval(checkInactivity, 30000);

        return () => {
            events.forEach(evt => document.removeEventListener(evt, updateActivity));
            clearInterval(intervalId);
        };
    }, [user, logout]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, fetchUser, verifyLogin2FA }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
