import { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon, Building2, Mail, Bell, Shield,
    Save, AlertCircle, Globe, Phone, MapPin, Clock, X, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const inputClass = "w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all";

const SettingsSection = ({ icon, title, description, children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6"
    >
        <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-mustard-gold/10 flex items-center justify-center text-mustard-gold">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </div>
        <div className="mt-5">
            {children}
        </div>
    </motion.div>
);

const ToggleSwitch = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
        <div>
            <p className="text-sm font-medium text-white">{label}</p>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-mustard-gold' : 'bg-white/10'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

const Settings = () => {
    const { user, fetchUser } = useAuth();
    const { addToast } = useToast();
    const [saving, setSaving] = useState(false);

    // 2FA State
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [setupQrUrl, setSetupQrUrl] = useState(null);
    const [setupSecret, setSetupSecret] = useState(null);
    const [verificationOtp, setVerificationOtp] = useState('');
    const [settingUp2FA, setSettingUp2FA] = useState(false);
    const [confirmDisable2FA, setConfirmDisable2FA] = useState(false);

    useEffect(() => {
        if (user) {
            if (user.two_factor_enabled !== undefined) {
                setTwoFactorEnabled(user.two_factor_enabled);
            }
            // Sync backend notification preferences to state
            const notifPatch = {};
            if (user.email_notifications !== undefined) notifPatch.newMessageNotification = user.email_notifications;
            if (user.notify_new_event !== undefined) notifPatch.newEventNotification = user.notify_new_event;
            if (user.notify_quote_accepted !== undefined) notifPatch.quoteAcceptedNotification = user.notify_quote_accepted;
            if (user.notify_weekly_report !== undefined) notifPatch.weeklyReportNotification = user.notify_weekly_report;
            if (user.notify_daily_summary !== undefined) notifPatch.dailySummaryNotification = user.notify_daily_summary;
            if (Object.keys(notifPatch).length > 0) {
                setSettings(prev => ({ ...prev, ...notifPatch }));
                setInitialSettings(prev => ({ ...prev, ...notifPatch }));
            }
        }
    }, [user]);

    // Load settings from localStorage
    const loadSettings = () => {
        const saved = localStorage.getItem('crystal_events_settings');
        if (saved) {
            try { return JSON.parse(saved); }
            catch { localStorage.removeItem('crystal_events_settings'); }
        }
        return {
            companyName: 'Crystal Events',
            companyEmail: 'info@crystaleventsie.com',
            companyPhone: '',
            companyAddress: 'Ballinasloe, Galway',
            website: 'crystaleventsie.com',
            timezone: 'Europe/Dublin',
            newMessageNotification: true,
            newEventNotification: true,
            quoteAcceptedNotification: true,
            weeklyReportNotification: false,
            dailySummaryNotification: false,
            sessionTimeout: '15',
            autoLogout: true,
        };
    };

    const [initialSettings, setInitialSettings] = useState(loadSettings());
    const [settings, setSettings] = useState(initialSettings);
    const [hasChanges, setHasChanges] = useState(false);

    const checkChanges = (newSettings) => {
        const isChanged = JSON.stringify(newSettings) !== JSON.stringify(initialSettings);
        setHasChanges(isChanged);
    };

    const handleChange = (field, value) => {
        const newSettings = { ...settings, [field]: value };
        setSettings(newSettings);
        checkChanges(newSettings);
    };

    const handleCancel = () => {
        setSettings(initialSettings);
        setHasChanges(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Save local preferences
            localStorage.setItem('crystal_events_settings', JSON.stringify(settings));
            
            // 2. Persist all notification preferences to backend
            await api.patch('/auth/profile/', {
                email_notifications: settings.newMessageNotification,
                notify_new_event: settings.newEventNotification,
                notify_quote_accepted: settings.quoteAcceptedNotification,
                notify_weekly_report: settings.weeklyReportNotification,
                notify_daily_summary: settings.dailySummaryNotification,
            });
            
            // 3. Update local state
            setInitialSettings(settings);
            setHasChanges(false);
            addToast('Settings saved successfully!', 'success');
            
            // 4. Refresh user context
            fetchUser();
        } catch (err) {
            console.error('Failed to save settings:', err);
            const detail = err.response?.data
                ? (typeof err.response.data === 'object'
                    ? JSON.stringify(err.response.data)
                    : String(err.response.data).slice(0, 120))
                : err.message;
            addToast(`Failed to save settings: ${detail}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Two-Factor Authentication Handlers ────────────────────────

    const handleInitiate2FASetup = async () => {
        try {
            const response = await api.get(`/auth/2fa/setup/?t=${Date.now()}`);
            setSetupQrUrl(response.data.qr_code);
            setSetupSecret(response.data.secret);
            setSettingUp2FA(true);
        } catch (err) {
            if (err.response?.data?.message === '2FA is already enabled.') {
                setTwoFactorEnabled(true);
                addToast('2FA is already enabled.', 'success');
            } else {
                addToast(err.response?.data?.error || 'Failed to initiate 2FA setup.', 'error');
            }
        }
    };

    const handleVerify2FASetup = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await api.post('/auth/2fa/verify-setup/', { otp: verificationOtp });
            addToast('Two-Factor Authentication has been enabled!', 'success');
            setTwoFactorEnabled(true);
            setSettingUp2FA(false);
            setSetupQrUrl(null);
            setSetupSecret(null);
            setVerificationOtp('');
            fetchUser(); // Refresh the user object to get the updated property
        } catch (err) {
            if (err.response?.data?.message === '2FA is already enabled.') {
                addToast('Two-Factor Authentication is already enabled!', 'success');
                setTwoFactorEnabled(true);
                setSettingUp2FA(false);
                setSetupQrUrl(null);
                setSetupSecret(null);
                setVerificationOtp('');
                fetchUser();
            } else {
                addToast(err.response?.data?.error || err.response?.data?.message || 'Invalid OTP. Please try again.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDisable2FA = async () => {
        setConfirmDisable2FA(false);
        setSaving(true);
        try {
            await api.post('/auth/2fa/disable/');
            addToast('Two-Factor Authentication disabled successfully.', 'success');
            setTwoFactorEnabled(false);
            setSettingUp2FA(false);
            fetchUser(); // Refresh the user object
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to disable 2FA.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                    <p className="text-gray-400 mt-1">Manage your company and application preferences</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => {
                            localStorage.removeItem('crystal_events_settings');
                            const defaultSettings = loadSettings();
                            setInitialSettings(defaultSettings);
                            setSettings(defaultSettings);
                            setHasChanges(false);
                            addToast('Settings reset to defaults.', 'success');
                        }}
                        className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl hover:bg-red-500/20 transition-all text-sm font-medium"
                    >
                        <RotateCcw size={15} />
                        <span>Reset</span>
                    </button>

                    <AnimatePresence>
                        {hasChanges && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-3 flex-1 md:flex-none"
                            >
                                <button
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 text-gray-400 border border-white/10 px-4 py-2.5 rounded-xl hover:bg-white/[0.05] hover:text-white transition-all font-bold disabled:opacity-50 text-sm"
                                >
                                    <X size={16} />
                                    <span>Cancel</span>
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all font-bold disabled:opacity-50 text-sm"
                                >
                                    <Save size={16} />
                                    <span>{saving ? 'Saving...' : 'Save'}</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div>
                    {/* Company Info */}
                    <SettingsSection icon={<Building2 size={20} />} title="Company Information" description="Your company details shown across the platform" delay={0}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2">Company Name</label>
                                <input type="text" value={settings.companyName}
                                    title="Company name cannot be changed."
                                    disabled
                                    className="w-full bg-white/[0.02] border border-white/5 text-gray-500 px-4 py-3 rounded-xl cursor-not-allowed flex-1" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">
                                        <Mail size={14} className="inline mr-1.5" />Email
                                    </label>
                                    <input type="email" value={settings.companyEmail}
                                        onChange={(e) => handleChange('companyEmail', e.target.value)}
                                        className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">
                                        <Phone size={14} className="inline mr-1.5" />Phone
                                    </label>
                                    <input type="tel" value={settings.companyPhone}
                                        placeholder={!settings.companyPhone ? "e.g. +353 1 234 5678" : ""}
                                        onChange={(e) => handleChange('companyPhone', e.target.value)}
                                        className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2">
                                    <MapPin size={14} className="inline mr-1.5" />Address
                                </label>
                                <input type="text" value={settings.companyAddress}
                                    onChange={(e) => handleChange('companyAddress', e.target.value)}
                                    className={inputClass} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">
                                        <Globe size={14} className="inline mr-1.5" />Website
                                    </label>
                                    <input type="text" value={settings.website}
                                        onChange={(e) => handleChange('website', e.target.value)}
                                        className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">
                                        <Clock size={14} className="inline mr-1.5" />Timezone
                                    </label>
                                    <input type="text" value={settings.timezone}
                                        onChange={(e) => handleChange('timezone', e.target.value)}
                                        className={inputClass} />
                                </div>
                            </div>
                        </div>
                    </SettingsSection>

                    {/* Security */}
                    <SettingsSection icon={<Shield size={20} />} title="Security" description="Configure authentication and access controls" delay={0.2}>
                        <div className="space-y-1">
                            <ToggleSwitch
                                label="Two-Factor Authentication"
                                description="Require 2FA for admin login"
                                checked={twoFactorEnabled}
                                onChange={(v) => {
                                    if (v && !settingUp2FA) {
                                        handleInitiate2FASetup();
                                    } else if (!v && twoFactorEnabled) {
                                        setConfirmDisable2FA(true);
                                    }
                                }}
                            />

                            <AnimatePresence>
                                {settingUp2FA && setupQrUrl && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-4 border border-white/10 bg-white/5 rounded-xl p-5 mb-4">
                                            <p className="text-white text-sm mb-4">
                                                1. Scan this QR code with your Authenticator app (like Google Authenticator or Authy).
                                            </p>
                                            <div className="bg-white p-4 rounded-xl inline-block mb-4">
                                                <img src={setupQrUrl} alt="2FA QR Code" className="w-40 h-40" />
                                            </div>

                                            <p className="text-white text-sm mb-4">
                                                2. Enter the 6-digit code generated by the app to verify and enable 2FA.
                                            </p>

                                            <form onSubmit={handleVerify2FASetup} className="flex items-end space-x-3 max-w-sm">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={verificationOtp}
                                                        onChange={(e) => setVerificationOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all tracking-widest text-center text-lg"
                                                        placeholder="000000"
                                                        maxLength={6}
                                                        required
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={saving || verificationOtp.length !== 6}
                                                    className="bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                    {saving ? 'Verifying...' : 'Verify'}
                                                </button>
                                            </form>

                                            <button
                                                type="button"
                                                onClick={() => { setSettingUp2FA(false); setSetupQrUrl(null); }}
                                                className="text-gray-400 hover:text-white text-sm mt-4 underline underline-offset-2">
                                                Cancel Setup
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <ToggleSwitch
                                label="Auto Logout on Inactivity"
                                description="Automatically log out inactive sessions"
                                checked={settings.autoLogout}
                                onChange={(v) => handleChange('autoLogout', v)}
                            />
                            <div className="pt-3">
                                <label className="block text-gray-400 text-sm font-medium mb-2">Session Timeout (minutes)</label>
                                <input type="number" value={settings.sessionTimeout}
                                    onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                                    className={inputClass} min="5" max="480" />
                            </div>
                        </div>
                    </SettingsSection>
                </div>

                {/* Right Column */}
                <div>
                    {/* Email Notifications */}
                    <SettingsSection icon={<Bell size={20} />} title="Email Notifications" description="Control which notifications you receive" delay={0.1}>
                        <div className="space-y-1">
                            <ToggleSwitch
                                label="New Contact Messages"
                                description="Get notified when a client sends a message"
                                checked={settings.newMessageNotification}
                                onChange={(v) => handleChange('newMessageNotification', v)}
                            />
                            <ToggleSwitch
                                label="New Event Created"
                                description="Alert when an event is created or updated"
                                checked={settings.newEventNotification}
                                onChange={(v) => handleChange('newEventNotification', v)}
                            />
                            <ToggleSwitch
                                label="Quote Accepted"
                                description="Notify when a client accepts a quote"
                                checked={settings.quoteAcceptedNotification}
                                onChange={(v) => handleChange('quoteAcceptedNotification', v)}
                            />
                            <ToggleSwitch
                                label="Weekly Report"
                                description="Receive a summary report every Monday"
                                checked={settings.weeklyReportNotification}
                                onChange={(v) => handleChange('weeklyReportNotification', v)}
                            />
                            <ToggleSwitch
                                label="Daily Summary"
                                description="Receive a daily overview email"
                                checked={settings.dailySummaryNotification}
                                onChange={(v) => handleChange('dailySummaryNotification', v)}
                            />
                        </div>
                    </SettingsSection>

                </div>
            </div>

            {/* Disable 2FA Modal */}
            <AnimatePresence>
                {confirmDisable2FA && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-[#071212] border border-white/10 rounded-2xl p-6 shadow-[0_0_80px_rgba(0,160,150,0.14),0_25px_60px_rgba(0,0,0,0.85)] max-w-sm w-full"
                        >
                            <div className="flex items-center space-x-3 mb-4 text-red-500">
                                <AlertCircle size={24} />
                                <h3 className="text-lg font-bold text-white">Disable 2FA?</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-6">
                                Are you sure you want to disable Two-Factor Authentication? This will make your admin portal less secure.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setConfirmDisable2FA(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/[0.05] text-white py-2.5 rounded-xl transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDisable2FA}
                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-xl transition-colors text-sm font-medium"
                                >
                                    Yes, Disable
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Settings;
