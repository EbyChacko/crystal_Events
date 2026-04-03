import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { UsersRound, Plus, X, AlertCircle, CheckCircle, Save, GripVertical } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const TeamAdmin = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    const [orderChanged, setOrderChanged] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const formRef = useRef(null);

    const [formData, setFormData] = useState({
        user: '',
        description: ''
    });

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showForm) {
                setShowForm(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showForm]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teamRes, usersRes] = await Promise.all([
                api.get('/team-members/'),
                api.get('/auth/users/')
            ]);

            // Sort frontend by order just in case
            const sortedTeam = teamRes.data.sort((a, b) => a.order - b.order);
            setTeamMembers(sortedTeam);

            const existingUserIds = sortedTeam.map(tm => tm.user);
            // Show active staff/superusers who are NOT already on the team
            const eligibleUsers = usersRes.data.filter(u =>
                (u.is_staff || u.is_superuser)
                && !existingUserIds.includes(u.id)
            );

            setAvailableUsers(eligibleUsers);
        } catch (err) {
            console.error('Error fetching team data:', err);
            addToast('Failed to load team data. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReorder = (newOrder) => {
        setTeamMembers(newOrder);
        setOrderChanged(true);
    };

    const saveOrder = async () => {
        if (!orderChanged) return;
        setSavingOrder(true);

        try {
            const ordered_ids = teamMembers.map(tm => tm.id);
            await api.post('/team-members/reorder/', { ordered_ids });
            addToast('Team order saved successfully', 'success');
            setOrderChanged(false);
        } catch (err) {
            console.error('Error saving order:', err);
            addToast('Failed to save order', 'error');
        } finally {
            setSavingOrder(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.user) {
            addToast('Please select a user', 'error');
            return;
        }

        setSubmitting(true);
        try {
            // New user goes to end of list
            const newOrder = teamMembers.length;
            const dataToSubmit = {
                user: parseInt(formData.user),
                description: formData.description,
                order: newOrder
            };

            await api.post('/team-members/', dataToSubmit);
            addToast('Team member added successfully', 'success');
            setShowForm(false);
            setFormData({ user: '', description: '' });
            fetchData();
        } catch (err) {
            console.error('Submission error:', err);
            addToast(err.response?.data?.detail || 'Failed to add team member', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/team-members/${id}/`);
            addToast('Team member removed', 'success');
            setDeleteConfirmId(null);
            fetchData();
        } catch (err) {
            addToast('Failed to delete team member', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-12 h-12 border-4 border-mustard-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
                        <UsersRound className="mr-3 text-mustard-gold" size={32} />
                        Team Members
                    </h1>
                    <p className="text-gray-400 mt-1">Manage the "Meet Our Team" section</p>
                </div>
                <div className="flex gap-2">
                    {orderChanged && (
                        <button
                            onClick={saveOrder}
                            disabled={savingOrder}
                            className="bg-jungle-green hover:bg-jungle-green/80 text-mustard-gold px-4 py-2 border border-mustard-gold/30 rounded-xl font-medium transition-all flex items-center shadow-[0_0_10px_rgba(197,160,89,0.2)]"
                        >
                            {savingOrder ? (
                                <div className="w-5 h-5 border-2 border-mustard-gold border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : (
                                <Save size={18} className="mr-2" />
                            )}
                            Save Order
                        </button>
                    )}
                    <button
                        onClick={() => { setShowForm(!showForm); }}
                        className="bg-mustard-gold hover:bg-mustard-gold/90 text-deep-teal px-4 py-2 rounded-xl font-bold transition-all flex items-center shadow-lg"
                    >
                        {showForm ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
                        {showForm ? 'Cancel' : 'Add Member'}
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowForm(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-xl bg-[#080c10] border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl shadow-[0_0_80px_rgba(0,160,150,0.14),0_25px_60px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <UsersRound size={22} className="text-mustard-gold" />
                                    <span>Add to Team</span>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Select User *</label>
                                    <select
                                        value={formData.user}
                                        onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                                        className="w-full bg-[#071212] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-mustard-gold outline-none"
                                        required
                                    >
                                        <option value="">-- Choose a user --</option>
                                        {availableUsers.length === 0 && <option disabled>No eligible users available.</option>}
                                        {availableUsers.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.first_name} {user.last_name} ({user.designation || 'No designation'})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">Only staff/superusers are shown. Users without a profile picture will not be visible on the public site.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Public Biography / Quote</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-[#071212] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-mustard-gold outline-none h-24 resize-none"
                                        placeholder="Add a quote or short description to show on the About page..."
                                    />
                                </div>

                                <div className="flex justify-end pt-4 border-t border-white/10">
                                    <button
                                        type="submit"
                                        disabled={submitting || availableUsers.length === 0}
                                        className="bg-mustard-gold hover:bg-mustard-gold/90 text-deep-teal px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                                    >
                                        {submitting ? 'Adding...' : 'Add to Team'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* List */}
            {teamMembers.length === 0 ? (
                <div className="bg-black/25 border border-white/10 rounded-2xl p-12 text-center">
                    <UsersRound size={48} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No Team Members Found</h3>
                    <p className="text-gray-400">Add users to feature them on the public Meet Our Team section.</p>
                </div>
            ) : (
                <div className="bg-black/25 border border-white/10 rounded-2xl p-6">
                    <p className="text-sm text-gray-400 mb-4 flex items-center">
                        <GripVertical size={16} className="mr-2" />
                        Drag and drop items to reorder how they appear on the public site.
                    </p>

                    <Reorder.Group axis="y" onReorder={handleReorder} values={teamMembers} className="space-y-3">
                        {teamMembers.map((member) => (
                            <Reorder.Item
                                key={member.id}
                                value={member}
                                className="bg-[#071212] border border-white/10 rounded-xl p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing hover:border-mustard-gold/30 transition-colors"
                            >
                                <GripVertical className="text-gray-500 hidden sm:block" />

                                <img
                                    src={member.user_details.profile_picture}
                                    alt={member.user_details.first_name}
                                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                                />

                                <div className="flex-grow min-w-0">
                                    <p className="text-white font-medium truncate">
                                        {member.user_details.first_name} {member.user_details.last_name}
                                    </p>
                                    <p className="text-sm text-mustard-gold truncate">
                                        {member.user_details.designation}
                                    </p>
                                    {member.description && (
                                        <p className="text-xs text-gray-400 truncate mt-1">"{member.description}"</p>
                                    )}
                                </div>

                                <div>
                                    {deleteConfirmId === member.id ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDelete(member.id)}
                                                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 font-bold"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 font-bold"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(member.id); }}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                                            title="Remove from team"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </div>
            )}
        </div>
    );
};

export default TeamAdmin;
