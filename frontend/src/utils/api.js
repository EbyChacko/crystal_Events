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

            // Only attempt refresh/redirect if user was previously logged in
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
                    // Only redirect if on an admin page
                    if (window.location.pathname.startsWith('/admin')) {
                        window.location.href = '/admin/login';
                    }
                    return Promise.reject(refreshError);
                }
            } else if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
                // Only redirect to login from admin pages, not the login page itself
                window.location.href = '/admin/login';
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Download a PDF from an authenticated endpoint without leaking the JWT in the URL.
 * Opens the PDF in a new tab (inline) or triggers a download.
 */
export async function downloadPdf(path, filename) {
    try {
        const res = await api.get(path, { responseType: 'blob' });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Clean up after a delay to allow the tab to load
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
        console.error('PDF download failed:', err);
        throw err;
    }
}

export default api;
