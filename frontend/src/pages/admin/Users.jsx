import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users as UsersIcon, Shield, ShieldCheck, Camera, X, Crown, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';
import Pagination from '../../components/admin/Pagination';
import usePagination from '../../hooks/usePagination';
import { validateFile } from '../../utils/validation';
import ImageCropper from '../../components/ImageCropper';

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
        designation: '',
        is_active: true,
        is_staff: true,
        is_superuser: false,
        can_view_financials: false,
        can_manage_assets: false,
        can_add_asset: false,
        is_owner: false,
        profit_percentage: '',
    });
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const { addToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const { currentPage, setCurrentPage, totalPages, pagedItems: pagedUsers } = usePagination(users);

    // Crop states
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const fileInputRef = useRef(null);
    const formRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showForm) {
                setShowForm(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showForm]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users/');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const err = validateFile(file);
            if (err) { addToast(err, 'error'); e.target.value = ''; return; }
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

    const clearImage = () => {
        setProfilePicture(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            addToast('Passwords do not match.', 'error');
            return;
        }

        setSubmitting(true);

        try {
            const data = new FormData();
            data.append('first_name', formData.first_name);
            data.append('last_name', formData.last_name);
            data.append('username', formData.username);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('address', formData.address);
            data.append('password', formData.password);
            data.append('designation', formData.designation);
            data.append('is_active', formData.is_active);
            data.append('is_staff', formData.is_staff);
            data.append('is_superuser', formData.is_superuser);
            data.append('can_view_financials', formData.can_view_financials);
            data.append('can_manage_assets', formData.can_manage_assets);
            data.append('can_add_asset', formData.can_add_asset);
            data.append('is_owner', formData.is_owner);
            if (formData.is_owner && formData.profit_percentage !== '') {
                data.append('profit_percentage', formData.profit_percentage);
            }
            if (profilePicture) {
                data.append('profile_picture', profilePicture);
            }

            await api.post('/auth/users/create/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            addToast(`User "${formData.username}" created successfully!`, 'success');
            setFormData({ first_name: '', last_name: '', username: '', email: '', phone: '', address: '', password: '', confirmPassword: '', designation: '', is_active: true, is_staff: true, is_superuser: false, can_view_financials: false, can_manage_assets: false, can_add_asset: false, is_owner: false, profit_percentage: '' });
            clearImage();
            setShowForm(false);
            fetchUsers();
        } catch (err) {
            const d = err.response?.data;
            if (d) {
                const messages = Object.entries(d)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
                addToast(messages, 'error');
            } else {
                addToast('Failed to create user. Please try again.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-gray-400 mt-1">Manage employee access to the admin panel</p>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); }}
                    className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all font-bold"
                >
                    {showForm ? <X size={20} /> : <UserPlus size={20} />}
                    <span>{showForm ? 'Cancel' : 'Add User'}</span>
                </button>
            </div>

            {/* Add User Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-3xl bg-[#080c10] border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl shadow-[0_0_80px_rgba(0,160,150,0.14),0_25px_60px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <UserPlus size={22} className="text-mustard-gold" />
                                    <span>Add New Employee</span>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </h2>
                            <form onSubmit={handleSubmit}>
                                {/* Profile Picture Upload */}
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="relative group">
                                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-mustard-gold to-deep-teal flex items-center justify-center">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera size={28} className="text-white/60" />
                                            )}
                                        </div>
                                        <button type="button" onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera size={20} className="text-white" />
                                        </button>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-300 font-medium">Profile Picture</p>
                                        <p className="text-xs text-gray-500">Optional — click to upload</p>
                                        {previewUrl && (
                                            <button type="button" onClick={clearImage} className="text-xs text-red-400 hover:text-red-300 mt-1">Remove</button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">First Name</label>
                                        <input type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                            placeholder="John" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Last Name</label>
                                        <input type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                            placeholder="Doe" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Username *</label>
                                        <input type="text" name="username" value={formData.username} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                            placeholder="john.doe" required />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Email *</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                            placeholder="john@crystalevents.ie" required />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Password *</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                            placeholder="Minimum 8 characters" minLength={8} required />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Confirm Password *</label>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                                            className={`w-full bg-white/5 border text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all ${formData.confirmPassword && formData.password !== formData.confirmPassword
                                                ? 'border-red-500/50'
                                                : 'border-white/10'
                                                }`}
                                            placeholder="Repeat password" minLength={8} required />
                                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                            <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Phone</label>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                            placeholder="+353 87 000 0000" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Designation</label>
                                        <input type="text" name="designation" value={formData.designation} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                            placeholder="e.g. Event Manager, Coordinator" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center gap-1.5">
                                            <MapPin size={14} className="text-mustard-gold" /> Address
                                        </label>
                                        <textarea name="address" value={formData.address} onChange={handleChange} rows="2"
                                            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                            placeholder="Optional address..." />
                                    </div>
                                    <div className="md:col-span-2 mt-4 p-4 bg-black/20 rounded-xl space-y-4 border border-white/5">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange}
                                                className="w-5 h-5 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold" />
                                            <div>
                                                <p className="text-white font-medium">Account Active</p>
                                                <p className="text-xs text-gray-500">Enable/Disable login access completely</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="checkbox" name="is_staff" checked={formData.is_staff} onChange={handleChange}
                                                className="w-5 h-5 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold" />
                                            <div>
                                                <p className="text-white font-medium">Admin Panel Access (Staff)</p>
                                                <p className="text-xs text-gray-500">Allow user to log in to the admin dashboard</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="checkbox" name="can_view_financials" checked={formData.is_superuser ? true : formData.can_view_financials} onChange={handleChange}
                                                disabled={formData.is_superuser}
                                                className="w-5 h-5 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold disabled:opacity-50 disabled:cursor-not-allowed" />
                                            <div>
                                                <p className="text-white font-medium text-emerald-400">Financials Access</p>
                                                <p className="text-xs text-gray-500">Allow user to view the Income/Expenses system{formData.is_superuser ? ' (Granted by Super Admin)' : ''}</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="checkbox" name="can_manage_assets" checked={formData.is_superuser ? true : formData.can_manage_assets} onChange={handleChange}
                                                disabled={formData.is_superuser}
                                                className="w-5 h-5 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold disabled:opacity-50 disabled:cursor-not-allowed" />
                                            <div>
                                                <p className="text-white font-medium text-amber-400">Asset View Access</p>
                                                <p className="text-xs text-gray-500">Allow user to view the asset inventory{formData.is_superuser ? ' (Granted by Super Admin)' : ''}</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="checkbox" name="can_add_asset" checked={formData.is_superuser ? true : formData.can_add_asset} onChange={handleChange}
                                                disabled={formData.is_superuser}
                                                className="w-5 h-5 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold disabled:opacity-50 disabled:cursor-not-allowed" />
                                            <div>
                                                <p className="text-white font-medium text-orange-400">Asset Add / Edit Access</p>
                                                <p className="text-xs text-gray-500">Allow user to add, edit, and delete assets{formData.is_superuser ? ' (Granted by Super Admin)' : ''}</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="checkbox" name="is_superuser" checked={formData.is_superuser} onChange={handleChange}
                                                className="w-5 h-5 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold" />
                                            <div>
                                                <p className="text-white font-medium text-purple-400">Super Admin Privileges</p>
                                                <p className="text-xs text-gray-500">Full control over all users and settings</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="checkbox" name="is_owner" checked={formData.is_owner} onChange={handleChange}
                                                className="w-5 h-5 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold" />
                                            <div>
                                                <p className="text-white font-medium flex items-center gap-1.5"><Crown size={14} className="text-yellow-400" /> Company Owner</p>
                                                <p className="text-xs text-gray-500">Include in profit distribution calculations</p>
                                            </div>
                                        </label>
                                        <AnimatePresence>
                                            {formData.is_owner && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <label className="block text-gray-400 text-sm font-medium mb-2">Profit Share (%)</label>
                                                    <input type="number" name="profit_percentage" value={formData.profit_percentage} onChange={handleChange}
                                                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                                                        placeholder="e.g. 50" min="0" max="100" step="0.01" />
                                                    <p className="text-xs text-gray-500 mt-1">Percentage of net profit allocated to this owner</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="md:col-span-2">
                                        <button type="submit" disabled={submitting || (formData.confirmPassword && formData.password !== formData.confirmPassword)}
                                            className="w-full bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            {submitting ? 'Creating User...' : 'Create Employee Account'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Users Table */}
            <div className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                        <UsersIcon size={20} className="text-mustard-gold" />
                        <span>Employee Accounts</span>
                        <span className="text-sm font-normal text-gray-500 ml-2">({users.length})</span>
                    </h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No employee accounts found.</div>
                ) : (
                    <div className="w-full">
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {pagedUsers.map((u) => (
                                        <tr
                                            key={u.id}
                                            onClick={() => navigate(`/admin/users/${u.id}`)}
                                            className="hover:bg-white/[0.05] transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-mustard-gold/30 to-deep-teal/30 flex items-center justify-center flex-shrink-0">
                                                        {u.profile_picture ? (
                                                            <img src={u.profile_picture} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-bold text-mustard-gold">
                                                                {u.first_name?.[0]}{u.last_name?.[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-white">{u.first_name} {u.last_name}</p>
                                                        <p className="text-xs text-gray-500">{u.designation || `@${u.username}`}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{u.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium ${u.is_superuser
                                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    }`}>
                                                    {u.is_superuser ? <ShieldCheck size={14} /> : <Shield size={14} />}
                                                    <span>{u.is_superuser ? 'Super Admin' : 'Staff'}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${u.is_active
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}>
                                                    {u.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(u.date_joined).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View (WhatsApp Style) */}
                        <div className="lg:hidden divide-y divide-white/5">
                            {users.map((u) => (
                                <div key={u.id}
                                    onClick={() => navigate(`/admin/users/${u.id}`)}
                                    className="p-4 hover:bg-white/5 transition-colors cursor-pointer group flex flex-col gap-3 relative"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-mustard-gold/30 to-deep-teal/30 flex items-center justify-center flex-shrink-0 border border-mustard-gold/20">
                                            {u.profile_picture ? (
                                                <img src={u.profile_picture} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-base font-bold text-mustard-gold">
                                                    {u.first_name?.[0]}{u.last_name?.[0]}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex justify-between items-start gap-2">
                                            <div>
                                                <h3 className="text-base font-bold text-white truncate">{u.first_name} {u.last_name}</h3>
                                                <p className="text-sm text-mustard-gold truncate">{u.designation || `@${u.username}`}</p>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{u.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-1 border-t border-white/5 pt-3">
                                        <div className="flex gap-2">
                                            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${u.is_superuser
                                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                {u.is_superuser ? <ShieldCheck size={12} /> : <Shield size={12} />}
                                                <span>{u.is_superuser ? 'Super Admin' : 'Staff'}</span>
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${u.is_active
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {u.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Joined {new Date(u.date_joined).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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

export default Users;
