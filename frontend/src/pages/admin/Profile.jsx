import { useState, useRef } from 'react';
import { User, Camera, Save, Lock, AlertCircle, CheckCircle, MapPin, Pencil, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';
import ImageCropper from '../../components/ImageCropper';

const Profile = () => {
    const { user, fetchUser } = useAuth();
    const fileInputRef = useRef(null);

    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        username: user?.username || '',
        phone: user?.phone || '',
        address: user?.address || '',
        designation: user?.designation || '',
    });
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        password: '',
        confirmPassword: '',
    });
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const { addToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Crop states
    const [cropImageSrc, setCropImageSrc] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCropImageSrc(url);
        }
        // clear the input value so selecting the same file triggers onChange
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
        setEditing(false);
        setProfilePicture(null);
        setPreviewUrl(null);
        // Reset form to current user data
        setFormData({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            username: user?.username || '',
            phone: user?.phone || '',
            address: user?.address || '',
            designation: user?.designation || '',
        });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = new FormData();
            data.append('first_name', formData.first_name);
            data.append('last_name', formData.last_name);
            data.append('username', formData.username);
            data.append('phone', formData.phone);
            data.append('address', formData.address);
            data.append('designation', formData.designation);
            if (profilePicture) {
                data.append('profile_picture', profilePicture);
            }

            await api.patch('/auth/profile/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            addToast('Profile updated successfully!', 'success');
            setProfilePicture(null);
            setPreviewUrl(null);
            setEditing(false);
            await fetchUser();
        } catch (err) {
            const d = err.response?.data;
            if (d) {
                const messages = Object.entries(d)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
                addToast(messages, 'error');
            } else {
                addToast('Failed to update profile.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.password !== passwordData.confirmPassword) {
            addToast('New passwords do not match.', 'error');
            return;
        }

        if (!passwordData.oldPassword) {
            addToast('Current password is required.', 'error');
            return;
        }

        setSaving(true);
        try {
            await api.patch('/auth/profile/', {
                old_password: passwordData.oldPassword,
                password: passwordData.password,
            });
            addToast('Password changed successfully!', 'success');
            setPasswordData({ oldPassword: '', password: '', confirmPassword: '' });
            setChangingPassword(false);
        } catch (err) {
            const d = err.response?.data;
            if (d?.old_password) {
                addToast(Array.isArray(d.old_password) ? d.old_password.join(', ') : d.old_password, 'error');
            } else {
                addToast('Failed to change password.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const currentPicture = previewUrl || user?.profile_picture || null;

    const inputBaseClass = "w-full transition-all";
    const editableClass = `${inputBaseClass} px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600`;
    const readOnlyClass = `${inputBaseClass} py-2 text-white text-base font-medium bg-transparent border-transparent cursor-default resize-none m-0 p-0 focus:outline-none`;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">My Profile</h1>
                <p className="text-gray-400 mt-1">Manage your account information</p>
            </div>

            {/* Profile Info Card */}
            <div className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-8 mb-6">
                <form onSubmit={handleSaveProfile}>
                    {/* Avatar Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center space-x-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-mustard-gold to-deep-teal flex items-center justify-center">
                                    {currentPicture ? (
                                        <img src={currentPicture} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-white">
                                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                                        </span>
                                    )}
                                </div>
                                {editing && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <Camera size={24} className="text-white" />
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{user?.first_name} {user?.last_name}</h2>
                                <p className="text-gray-400">@{user?.username}</p>
                                <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
                            </div>
                        </div>

                        {/* Edit / Cancel button */}
                        {!editing && (
                            <button
                                type="button"
                                onClick={() => { setEditing(true); }}
                                className="flex items-center justify-center space-x-2 text-white font-medium bg-white/10 border border-white/10 px-5 py-3 md:py-2.5 rounded-xl hover:opacity-80 hover:bg-white/[0.06] transition-all w-full md:w-auto text-base md:text-sm"
                            >
                                <Pencil size={16} />
                                <span>Edit Profile</span>
                            </button>
                        )}
                    </div>

                    {/* Profile Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">First Name</label>
                            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                                className={editing ? editableClass : readOnlyClass}
                                readOnly={!editing} required />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Last Name</label>
                            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                                className={editing ? editableClass : readOnlyClass}
                                readOnly={!editing} required />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Username</label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange}
                                className={editing ? editableClass : readOnlyClass}
                                readOnly={!editing} required />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Phone</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange}
                                className={editing ? editableClass : readOnlyClass}
                                readOnly={!editing}
                                placeholder={editing ? "+353 ..." : ""} />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Email</label>
                            <input type="email" value={user?.email || ''} disabled
                                className="w-full bg-white/[0.02] border border-white/5 text-gray-500 px-4 py-3 rounded-xl cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Role</label>
                            <input type="text" value={user?.is_superuser ? 'Super Admin' : 'Staff'} disabled
                                className="w-full bg-white/[0.02] border border-white/5 text-gray-500 px-4 py-3 rounded-xl cursor-not-allowed" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-400 text-sm font-medium mb-2">Designation</label>
                            <input type="text" name="designation" value={formData.designation} onChange={handleChange}
                                className={editing ? editableClass : readOnlyClass}
                                readOnly={!editing}
                                placeholder={editing ? "e.g. Event Manager, Coordinator" : ""} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center gap-1.5">
                                <MapPin size={14} className="text-mustard-gold" />
                                Address
                            </label>
                            <textarea name="address" value={formData.address} onChange={handleChange}
                                rows="2"
                                className={editing ? editableClass : readOnlyClass}
                                readOnly={!editing}
                                placeholder={editing ? "Your address..." : ""} />
                        </div>
                    </div>

                    {/* Save / Cancel buttons — only visible in edit mode */}
                    {editing && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 flex items-center space-x-3"
                        >
                            <button type="submit" disabled={saving}
                                className="flex items-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                <Save size={18} />
                                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                            <button type="button" onClick={handleCancelEdit}
                                className="flex items-center space-x-2 bg-white/10 border border-white/10 text-gray-300 font-medium px-6 py-3 rounded-xl hover:bg-white/[0.06] transition-all">
                                <X size={18} />
                                <span>Cancel</span>
                            </button>
                        </motion.div>
                    )}
                </form>
            </div>

            {/* Change Password Card */}
            <div className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                        <Lock size={20} className="text-mustard-gold" />
                        <span>Change Password</span>
                    </h3>
                    {!changingPassword && (
                        <button
                            type="button"
                            onClick={() => { setChangingPassword(true); }}
                            className="flex items-center justify-center space-x-2 text-white font-medium bg-white/10 border border-white/10 px-5 py-3 md:py-2.5 rounded-xl hover:opacity-80 hover:bg-white/[0.06] transition-all w-full md:w-auto text-base md:text-sm"
                        >
                            <Lock size={16} />
                            <span>Change Password</span>
                        </button>
                    )}
                </div>
                <AnimatePresence>
                    {changingPassword && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <form onSubmit={handleChangePassword} className="space-y-5 mt-6">
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">Current Password</label>
                                    <input type="password" value={passwordData.oldPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                        placeholder="Enter your current password" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                            className={`w-full bg-white/5 border text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all ${passwordData.confirmPassword && passwordData.password !== passwordData.confirmPassword
                                                ? 'border-red-500/50'
                                                : 'border-white/10'
                                                }`}
                                            placeholder="Repeat new password" minLength={8} required />
                                        {passwordData.confirmPassword && passwordData.password !== passwordData.confirmPassword && (
                                            <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button type="submit" disabled={saving || (passwordData.confirmPassword && passwordData.password !== passwordData.confirmPassword)}
                                        className="flex items-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Lock size={18} />
                                        <span>{saving ? 'Updating...' : 'Update Password'}</span>
                                    </button>
                                    <button type="button" onClick={() => { setChangingPassword(false); setPasswordData({ oldPassword: '', password: '', confirmPassword: '' }); }}
                                        className="flex items-center space-x-2 bg-white/10 border border-white/10 text-gray-300 font-medium px-6 py-3 rounded-xl hover:bg-white/[0.06] transition-all">
                                        <X size={18} />
                                        <span>Cancel</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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

export default Profile;
