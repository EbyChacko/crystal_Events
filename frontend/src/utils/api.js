import axios from 'axios';

const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
export const API_BASE_URL = isProd ? 'https://crystal-events-backend.onrender.com/api' : 'http://localhost:8000/api';
export const AUTH_BASE_URL = isProd ? 'https://crystal-events-backend.onrender.com/api/auth' : 'http://localhost:8000/api/auth';


const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60s — covers Render free tier cold-start time
});

// Attach JWT access token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auto-refresh expired access tokens using the refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const res = await axios.post(`${AUTH_BASE_URL}/refresh/`, {
                        refresh: refreshToken,
                    });
                    const { access, refresh } = res.data;
                    localStorage.setItem('access_token', access);
                    if (refresh) localStorage.setItem('refresh_token', refresh);
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/admin/login';
                    return Promise.reject(refreshError);
                }
            } else {
                window.location.href = '/admin/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
