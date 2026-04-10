import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/api';

const ResetPassword = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/password-reset/confirm/`, {
                uid,
                token,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid or expired reset link. Please request a new one.');
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
                        {done ? (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                                className="text-center py-4"
                            >
                                <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                    Your password has been updated successfully.
                                </p>
                                <button
                                    onClick={() => navigate('/admin/login')}
                                    className="w-full bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all"
                                >
                                    Sign In
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                <h2 className="text-xl font-bold text-white mb-1">Set New Password</h2>
                                <p className="text-gray-500 text-sm mb-6">Choose a strong password for your account.</p>

                                {error && (
                                    <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showNew ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all pr-12"
                                                placeholder="Min. 8 characters"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNew(!showNew)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                            >
                                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirm ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all pr-12"
                                                placeholder="Re-enter your password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                            >
                                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;
