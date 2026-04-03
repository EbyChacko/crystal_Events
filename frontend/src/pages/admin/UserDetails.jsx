import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Save, Lock, AlertCircle, CheckCircle, MapPin, Pencil, X, ArrowLeft, Shield, ShieldCheck, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ImageCropper from '../../components/ImageCropper';

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const { user: currentUser } = useAuth();

    // Check if the super user is editing their own profile
    const isEditingSelf = currentUser && String(currentUser.id) === String(id);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone: '',
        address: '',
        designation: '',
        is_active: false,
        is_staff: false,
        is_superuser: false,
        can_view_financials: false,
    });

    const [passwordData, setPasswordData] = useState({
        password: '',
        confirmPassword: '',
    });

    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const { addToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    // Crop states
    const [cropImageSrc, setCropImageSrc] = useState(null);

    const fetchUser = async () => {
        try {
            const res = await api.get(`/auth/users/${id}/`);
            const u = res.data;
            setUser(u);
            setFormData({
                first_name: u.first_name || '',
                last_name: u.last_name || '',
                username: u.username || '',
                email: u.email || '',
                phone: u.phone || '',
                address: u.address || '',
                designation: u.designation || '',
                is_active: u.is_active || false,
                is_staff: u.is_staff || false,
                is_superuser: u.is_superuser || false,
                can_view_financials: u.can_view_financials || false,
            });
        } catch (err) {
            console.error('Failed to fetch user:', err);
            addToast('Failed to load user data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
        // eslint-disable-next-line
    }, [id]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showEditModal) {
                setShowEditModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showEditModal]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCropImageSrc(url);
        }
        if (e.target) e.target.value = null;
    };

    const handleCropComplete = (croppedFile) => {
        setProfilePicture(croppedFile);
        setPreviewUrl(URL.createObjectURL(croppedFile));
        setCropImageSrc(null);
    };

    const handleCropCancel = () => {
        setCropImageSrc(null);
    };

    const handleCancelEdit = () => {
        setShowEditModal(false);
        setProfilePicture(null);
        setPreviewUrl(null);
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                username: user.username || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                designation: user.designation || '',
                is_active: user.is_active || false,
                is_staff: user.is_staff || false,
                is_superuser: user.is_superuser || false,
                can_view_financials: user.can_view_financials || false,
            });
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = new FormData();
            data.append('first_name', formData.first_name);
            data.append('last_name', formData.last_name);
            data.append('username', formData.username);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('address', formData.address);
            data.append('designation', formData.designation);
            data.append('is_active', formData.is_active);
            data.append('is_staff', formData.is_staff);
            data.append('is_superuser', formData.is_superuser);
            data.append('can_view_financials', formData.can_view_financials);

            if (profilePicture) {
                data.append('profile_picture', profilePicture);
            }

            await api.patch(`/auth/users/${id}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            addToast('User updated successfully!', 'success');
            setProfilePicture(null);
            setPreviewUrl(null);
            setShowEditModal(false);
            await fetchUser();
        } catch (err) {
            const d = err.response?.data;
            if (d) {
                const messages = Object.entries(d)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
                addToast(messages, 'error');
            } else {
                addToast('Failed to update user.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.password !== passwordData.confirmPassword) {
            addToast('Passwords do not match.', 'error');
            return;
        }

        setSaving(true);
        try {
            await api.patch(`/auth/users/${id}/`, {
                password: passwordData.password,
            });
            addToast('User password changed successfully!', 'success');
            setPasswordData({ password: '', confirmPassword: '' });
            setChangingPassword(false);
        } catch (err) {
            addToast('Failed to change password.', 'error');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (isEditingSelf) return;
        try {
            await api.delete(`/auth/users/${id}/`);
            navigate('/admin/users');
        } catch (err) {
            const d = err.response?.data;
            addToast(d?.error || 'Failed to delete user.', 'error');
            console.error(err);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading user details...</div>;
    }

    if (!user) {
        return (
            <div className="text-center mt-10">
                <p className="text-red-400 mb-4">User not found</p>
                <button onClick={() => navigate('/admin/users')} className="text-mustard-gold hover:underline">
                    Back to Users
                </button>
            </div>
        );
    }

    const currentPicture = previewUrl || user.profile_picture || null;
    const inputBaseClass = "w-full transition-all";
    const editableClass = `${inputBaseClass} px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600`;
    const readOnlyClass = `${inputBaseClass} py-2 text-white text-base font-medium bg-transparent border-transparent cursor-default resize-none m-0 p-0 focus:outline-none`;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">User Details</h1>
                        <p className="text-gray-400 mt-1">Manage {user.first_name}'s account</p>
                    </div>
                </div>
            </div>

            {/* User Info Form */}
            <div className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 mb-6 relative">
                {/* Avatar & Edit Toggles */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-8 border-b border-white/10 gap-6">
                    <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-mustard-gold to-deep-teal flex items-center justify-center">
                            {currentPicture ? (
                                <img src={currentPicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-white">
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{user.first_name} {user.last_name}</h2>
                            <p className="text-gray-400">@{user.username}</p>
                            <div className="flex space-x-2 mt-2">
                                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium ${user.is_superuser ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                    {user.is_superuser ? <ShieldCheck size={14} /> : <Shield size={14} />}
                                    <span>{user.is_superuser ? 'Super Admin' : 'Staff'}</span>
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${user.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button type="button" onClick={() => { setShowEditModal(true); }}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 text-deep-teal font-medium bg-gradient-to-r from-mustard-gold to-yellow-500 px-5 py-3 sm:py-2.5 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all text-base sm:text-sm">
                        <Pencil size={18} />
                        <span>Edit User</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-5">
                        <h3 className="text-lg font-semibold text-white mb-4">Personal Info</h3>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">First Name</label>
                            <p className="text-white text-lg font-medium">{user.first_name}</p>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Last Name</label>
                            <p className="text-white text-lg font-medium">{user.last_name}</p>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Username</label>
                            <p className="text-white text-lg font-medium">{user.username}</p>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Email</label>
                            <p className="text-white text-lg font-medium">{user.email}</p>
                        </div>
                    </div>

                    {/* Contact & Permissions */}
                    <div className="space-y-5">
                        <h3 className="text-lg font-semibold text-white mb-4">Contact & Access</h3>
                        {user.phone && (
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-1">Phone</label>
                                <p className="text-white text-lg font-medium">{user.phone}</p>
                            </div>
                        )}
                        {user.designation && (
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-1">Designation</label>
                                <p className="text-white text-lg font-medium">{user.designation}</p>
                            </div>
                        )}
                        {user.address && (
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-1 flex items-center gap-1.5">
                                    <MapPin size={14} className="text-mustard-gold" /> Address
                                </label>
                                <p className="text-white text-lg font-medium whitespace-pre-wrap">{user.address}</p>
                            </div>
                        )}
                        {user.can_view_financials && (
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-1 flex items-center gap-1.5">
                                    <CheckCircle size={14} className="text-emerald-400" /> Access
                                </label>
                                <p className="text-emerald-400 text-base font-medium">Can View Financials</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit User Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={handleCancelEdit}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-3xl bg-[#080c10] border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Pencil size={22} className="text-mustard-gold" />
                                    <span>Edit User Details</span>
                                </div>
                                <button type="button" onClick={handleCancelEdit} className="text-gray-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </h2>

                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                {/* Profile Picture Edit */}
                                <div className="flex items-center space-x-6 pb-6 border-b border-white/10">
                                    <div className="relative group">
                                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-mustard-gold to-deep-teal flex items-center justify-center">
                                            {currentPicture ? (
                                                <img src={currentPicture} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-bold text-white">
                                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                                </span>
                                            )}
                                        </div>
                                        <button type="button" onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera size={20} className="text-white" />
                                        </button>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </div>
                                    <div className="text-sm text-gray-400 flex flex-col justify-center">
                                        <p className="font-medium text-white">Profile Photo</p>
                                        <p>Click the image block to upload a new one</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-5">
                                        <h3 className="text-lg font-semibold text-white mb-4">Personal Info</h3>
                                        <div>
                                            <label className="block text-gray-400 text-sm font-medium mb-2">First Name *</label>
                                            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm font-medium mb-2">Last Name *</label>
                                            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm font-medium mb-2">Username *</label>
                                            <input type="text" name="username" value={formData.username} onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm font-medium mb-2">Email *</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all" required />
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <h3 className="text-lg font-semibold text-white mb-4">Contact & Access</h3>
                                        <div>
                                            <label className="block text-gray-400 text-sm font-medium mb-2">Phone</label>
                                            <input type="text" name="phone" value={formData.phone} onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm font-medium mb-2">Designation</label>
                                            <input type="text" name="designation" value={formData.designation} onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center gap-1.5">
                                                <MapPin size={14} className="text-mustard-gold" /> Address
                                            </label>
                                            <textarea name="address" value={formData.address} onChange={handleChange} rows="3"
                                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all" />
                                        </div>

                                        <div className="mt-4 p-4 bg-black/20 rounded-xl space-y-4 border border-white/5">
                                            <label className={`flex items-center space-x-3 ${isEditingSelf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                                <input type="checkbox" name="is_active" checked={isEditingSelf ? true : formData.is_active} onChange={handleChange}
                                                    disabled={isEditingSelf}
                                                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold disabled:opacity-50 disabled:cursor-not-allowed" />
                                                <div>
                                                    <p className="text-white font-medium">Account Active</p>
                                                    <p className="text-xs text-gray-500">Enable/Disable login access completely</p>
                                                    {isEditingSelf && (
                                                        <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                                                            <AlertCircle size={12} />
                                                            You cannot deactivate your own account
                                                        </p>
                                                    )}
                                                </div>
                                            </label>
                                            <label className={`flex items-center space-x-3 ${isEditingSelf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                                <input type="checkbox" name="is_staff" checked={isEditingSelf ? true : formData.is_staff} onChange={handleChange}
                                                    disabled={isEditingSelf}
                                                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold disabled:opacity-50 disabled:cursor-not-allowed" />
                                                <div>
                                                    <p className="text-white font-medium">Admin Panel Access (Staff)</p>
                                                    <p className="text-xs text-gray-500">Allow user to log in to the admin dashboard</p>
                                                    {isEditingSelf && (
                                                        <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                                                            <AlertCircle size={12} />
                                                            You cannot remove your own admin access
                                                        </p>
                                                    )}
                                                </div>
                                            </label>
                                            <label className={`flex items-center space-x-3 cursor-pointer`}>
                                                <input type="checkbox" name="can_view_financials" checked={formData.can_view_financials} onChange={handleChange}
                                                    disabled={formData.is_superuser}
                                                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold disabled:opacity-50 disabled:cursor-not-allowed" />
                                                <div>
                                                    <p className="text-white font-medium text-emerald-400">Financials Access</p>
                                                    <p className="text-xs text-gray-500">Allow user to view the Income/Expenses system {formData.is_superuser ? '(Granted by Super Admin)' : ''}</p>
                                                </div>
                                            </label>
                                            <label className={`flex items-center space-x-3 ${isEditingSelf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                                <input type="checkbox" name="is_superuser" checked={isEditingSelf ? true : formData.is_superuser} onChange={handleChange}
                                                    disabled={isEditingSelf}
                                                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold disabled:opacity-50 disabled:cursor-not-allowed" />
                                                <div>
                                                    <p className="text-white font-medium text-purple-400">Super Admin Privileges</p>
                                                    <p className="text-xs text-gray-500">Full control over all users and settings</p>
                                                    {isEditingSelf && (
                                                        <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                                                            <AlertCircle size={12} />
                                                            You cannot remove your own Super Admin status
                                                        </p>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                    <button type="submit" disabled={saving}
                                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold px-6 py-3.5 sm:py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm">
                                        <Save size={18} />
                                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Set New Password functionality */}
            <div className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                            <Lock size={20} className="text-mustard-gold" />
                            <span>Reset Password</span>
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">Set a new password for this user directly.</p>
                    </div>
                    {!changingPassword && (
                        <button type="button" onClick={() => { setChangingPassword(true); }}
                            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/10 border border-white/10 text-white font-medium px-5 py-3 sm:py-2.5 rounded-xl hover:bg-white/15 transition-all text-base sm:text-sm">
                            <Lock size={16} />
                            <span>Set Password</span>
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {changingPassword && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <form onSubmit={handleChangePassword} className="mt-6 pt-6 border-t border-white/10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">New Password</label>
                                        <input type="password" value={passwordData.password}
                                            onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                            placeholder="Minimum 8 characters" minLength={8} required />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Confirm New Password</label>
                                        <input type="password" value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className={`w-full bg-white/5 border text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all ${passwordData.confirmPassword && passwordData.password !== passwordData.confirmPassword ? 'border-red-500/50' : 'border-white/10'}`}
                                            placeholder="Repeat new password" minLength={8} required />
                                        {passwordData.confirmPassword && passwordData.password !== passwordData.confirmPassword && (
                                            <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                    <button type="submit" disabled={saving || (passwordData.confirmPassword && passwordData.password !== passwordData.confirmPassword)}
                                        className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold px-6 py-3 sm:py-2.5 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm">
                                        <Lock size={18} />
                                        <span>{saving ? 'Updating...' : 'Set Password'}</span>
                                    </button>
                                    <button type="button" onClick={() => { setChangingPassword(false); setPasswordData({ password: '', confirmPassword: '' }); }}
                                        className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/10 border border-white/10 text-gray-300 font-medium px-6 py-3 sm:py-2.5 rounded-xl hover:bg-white/15 transition-all text-base sm:text-sm">
                                        <X size={18} />
                                        <span>Cancel</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Danger Zone — Remove User */}
            {!isEditingSelf && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 sm:p-6 md:p-8 mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-red-400 flex items-center space-x-2">
                                <Trash2 size={20} />
                                <span>Danger Zone</span>
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">Permanently remove this user account. This action cannot be undone.</p>
                        </div>
                        {!confirmingDelete ? (
                            <button
                                type="button"
                                onClick={() => setConfirmingDelete(true)}
                                className="w-full sm:w-auto flex items-center justify-center space-x-2 text-red-400 font-medium bg-red-500/20 border border-red-500/30 px-5 py-3 sm:py-2.5 rounded-xl hover:opacity-80 hover:bg-red-500/30 transition-all text-base sm:text-sm"
                            >
                                <Trash2 size={16} />
                                <span>Remove User</span>
                            </button>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={handleDeleteUser}
                                    className="w-full sm:w-auto flex items-center justify-center space-x-2 text-white font-medium bg-red-500 px-5 py-3 sm:py-2.5 rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 text-base sm:text-sm"
                                >
                                    <Trash2 size={16} />
                                    <span>Yes, Remove Completely</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmingDelete(false)}
                                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/10 border border-white/10 text-gray-300 font-medium px-5 py-3 sm:py-2.5 rounded-xl hover:bg-white/15 transition-all text-base sm:text-sm"
                                >
                                    <span>Cancel</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Cropper Modal */}
            {cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </div>
    );
};

export default UserDetails;
