import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, CheckCircle, ArrowLeft, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../utils/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [requires2FA, setRequires2FA] = useState(false);
    const [userId, setUserId] = useState(null);
    const [otp, setOtp] = useState('');
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    // 'idle' | 'waking' | 'ready'
    const [serverStatus, setServerStatus] = useState('idle');
    const [showReadyBanner, setShowReadyBanner] = useState(false);
    const wentThroughWaking = useRef(false);
    const navigate = useNavigate();
    const { login, verifyLogin2FA, user } = useAuth();

    // If already logged in, redirect
    useEffect(() => {
        if (user) {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [user, navigate]);

    // Ping health endpoint on mount to wake the backend (production only)
    useEffect(() => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) return; // no banner needed locally

        let wakingTimer = null;
        let readyTimer = null;
        let cancelled = false;

        const pingHealth = async () => {
            // Show "waking" banner only if server hasn't responded after 3s
            wakingTimer = setTimeout(() => {
                if (!cancelled) {
                    wentThroughWaking.current = true;
                    setServerStatus('waking');
                }
            }, 3000);

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);
                const response = await fetch(
                    `${API_BASE_URL.replace('/api', '')}/api/health/`,
                    { signal: controller.signal }
                );
                clearTimeout(timeoutId);
                if (!cancelled && response.ok) {
                    clearTimeout(wakingTimer);
                    setServerStatus('ready');
                    // Only show "active" banner if we previously showed the "waking" banner
                    if (wentThroughWaking.current) {
                        setShowReadyBanner(true);
                        readyTimer = setTimeout(() => {
                            if (!cancelled) setShowReadyBanner(false);
                        }, 4000);
                    }
                }
            } catch {
                // Server unreachable — keep waking banner if it's already showing
            }
        };

        pingHealth();
        return () => {
            cancelled = true;
            clearTimeout(wakingTimer);
            clearTimeout(readyTimer);
        };
    }, []);

    if (user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (requires2FA) {
                await verifyLogin2FA(userId, otp);
                navigate('/admin/dashboard');
            } else {
                const result = await login(username, password);
                if (result.requires2FA) {
                    setRequires2FA(true);
                    setUserId(result.userId);
                } else {
                    navigate('/admin/dashboard');
                }
            }
        } catch (err) {
            if (err.code === 'ECONNABORTED') {
                addToast('Connection timed out. The server may still be starting up. Please try again.', 'error');
            } else if (err.response?.status === 401) {
                addToast('Invalid credentials or OTP.', 'error');
            } else if (err.response?.data?.error) {
                addToast(err.response.data.error, 'error');
            } else if (err.response?.data?.non_field_errors) {
                addToast(err.response.data.non_field_errors[0], 'error');
            } else {
                addToast('Something went wrong. Please try again.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a1a] via-[#0d2424] to-[#0a1a1a] px-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mustard-gold/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-deep-teal/20 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                {/* Back + Home buttons */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm">Go Back</span>
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                    >
                        <Home size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm">Home</span>
                    </button>
                </div>

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl text-white tracking-tight uppercase" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                        Crystal <span className="text-mustard-gold">Events</span>
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm uppercase tracking-widest">Admin Portal</p>
                </div>

                {/* Server status banners — only shown when needed */}
                <AnimatePresence>
                    {serverStatus === 'waking' && !showReadyBanner && (
                        <motion.div
                            key="waking"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            className="mb-4 flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-xl px-4 py-3 text-sm"
                        >
                            <div className="mt-0.5 w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Server is inactive</p>
                                <p className="text-yellow-400/70 text-xs mt-0.5">Waking up after inactivity — usually takes up to 30 seconds.</p>
                            </div>
                        </motion.div>
                    )}
                    {showReadyBanner && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            className="mb-4 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-3 text-sm"
                        >
                            <CheckCircle size={16} className="flex-shrink-0" />
                            <p><span className="font-semibold">Server is active.</span> You can sign in now.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Login Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-1">Welcome Back</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        {requires2FA ? 'Enter your 2FA code to continue' : 'Sign in to your admin account'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!requires2FA ? (
                            <>
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                        placeholder="Enter your username"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all pr-12"
                                            placeholder="Enter your password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2">Authentication Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all tracking-widest text-center text-lg"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || serverStatus === 'waking'}
                            className="w-full bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            <LogIn size={18} />
                            <span>{serverStatus === 'waking' ? 'Server starting...' : loading ? 'Signing in...' : 'Sign In'}</span>
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    Crystal Events © {new Date().getFullYear()}
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
