import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/password-reset/`, { email });
            setSent(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071212] via-[#091818] to-[#071212] px-4">
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
                <button
                    onClick={() => navigate('/admin/login')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-6"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm">Back to Login</span>
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl text-white tracking-tight uppercase" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                        Crystal <span className="text-mustard-gold">Events</span>
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm uppercase tracking-widest">Admin Portal</p>
                </div>

                <div className="bg-black/35 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_0_80px_rgba(0,160,150,0.14),0_25px_60px_rgba(0,0,0,0.85)]">
                    <AnimatePresence mode="wait">
                        {sent ? (
                            <motion.div
                                key="sent"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                                className="text-center py-4"
                            >
                                <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    If <span className="text-mustard-gold">{email}</span> is registered, you'll receive a password reset link shortly.
                                </p>
                                <p className="text-gray-600 text-xs mt-4">
                                    The link expires in 1 hour. Check your spam folder if you don't see it.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                <h2 className="text-xl font-bold text-white mb-1">Forgot Password</h2>
                                <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

                                {error && (
                                    <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Email Address</label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                                placeholder="your@email.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    Crystal Events © {new Date().getFullYear()}
                </p>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
