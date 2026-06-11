import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Plus, X, Pencil, MessageSquareQuote } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const EMPTY_FORM = { name: '', place: '', review: '', rating: 5, date: '' };

const StarPicker = ({ value, onChange }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                className="focus:outline-none transition-transform hover:scale-110"
            >
                <Star
                    size={28}
                    className={star <= value ? 'text-mustard-gold fill-mustard-gold' : 'text-gray-600'}
                    strokeWidth={1.5}
                />
            </button>
        ))}
    </div>
);

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const { addToast } = useToast();

    useEffect(() => {
        fetchReviews();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showForm) closeForm();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showForm]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await api.get('/reviews/');
            setReviews(res.data);
        } catch {
            addToast('Failed to load reviews.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setEditingReview(null);
        setFormData(EMPTY_FORM);
        setShowForm(true);
    };

    const openEdit = (review) => {
        setEditingReview(review);
        setFormData({
            name: review.name,
            place: review.place,
            review: review.review,
            rating: review.rating,
            date: review.date,
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingReview(null);
        setFormData(EMPTY_FORM);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.review.trim() || !formData.date) {
            addToast('Please fill in all required fields.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            if (editingReview) {
                await api.put(`/reviews/${editingReview.id}/`, formData);
                addToast('Review updated successfully.', 'success');
            } else {
                await api.post('/reviews/', formData);
                addToast('Review added successfully.', 'success');
            }
            closeForm();
            fetchReviews();
        } catch (err) {
            const data = err.response?.data;
            const msg = data?.detail
                || (data && Object.entries(data).map(([k, v]) => `${k}: ${[].concat(v).join(', ')}`).join(' | '))
                || 'Failed to save review.';
            addToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/reviews/${id}/`);
            addToast('Review deleted.', 'success');
            setDeleteConfirmId(null);
            fetchReviews();
        } catch {
            addToast('Failed to delete review.', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-12 h-12 border-4 border-mustard-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
                        <MessageSquareQuote className="mr-3 text-mustard-gold" size={32} />
                        Client Reviews
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Manage reviews shown in the &quot;Client Voices&quot; section — only 5-star reviews appear publicly.
                    </p>
                </div>
                <button
                    onClick={openAdd}
                    className="bg-mustard-gold hover:bg-mustard-gold/90 text-deep-teal px-4 py-2 rounded-xl font-bold transition-all flex items-center shadow-lg"
                >
                    <Plus size={18} className="mr-2" />
                    Add Review
                </button>
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
                            onClick={closeForm}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-xl bg-[#080c10] border border-white/10 p-6 md:p-8 rounded-2xl shadow-[0_0_80px_rgba(0,160,150,0.14),0_25px_60px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <MessageSquareQuote size={22} className="text-mustard-gold" />
                                    <span>{editingReview ? 'Edit Review' : 'Add Review'}</span>
                                </div>
                                <button type="button" onClick={closeForm} className="text-gray-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Rating */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Rating *</label>
                                    <StarPicker value={formData.rating} onChange={(v) => setFormData({ ...formData, rating: v })} />
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Reviewer Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Sarah & John"
                                        className="w-full bg-[#071212] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-mustard-gold outline-none"
                                        required
                                    />
                                </div>

                                {/* Place */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Location / Place</label>
                                    <input
                                        type="text"
                                        value={formData.place}
                                        onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                                        placeholder="e.g. Dublin, Ireland"
                                        className="w-full bg-[#071212] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-mustard-gold outline-none"
                                    />
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Review Date *</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-[#071212] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-mustard-gold outline-none"
                                        required
                                    />
                                </div>

                                {/* Review Text */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Review *</label>
                                    <textarea
                                        value={formData.review}
                                        onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                                        placeholder="Paste the review text here..."
                                        rows={4}
                                        className="w-full bg-[#071212] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-mustard-gold outline-none resize-none"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end pt-4 border-t border-white/10">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-mustard-gold hover:bg-mustard-gold/90 text-deep-teal px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : editingReview ? 'Save Changes' : 'Add Review'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {reviews.length === 0 ? (
                <div className="bg-black/25 border border-white/10 rounded-2xl p-12 text-center">
                    <MessageSquareQuote size={48} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No Reviews Yet</h3>
                    <p className="text-gray-400">Add your first review to display it in the Client Voices section.</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {reviews.map((review) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-black/25 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-mustard-gold/20 transition-colors"
                        >
                            {/* Stars + badge */}
                            <div className="flex items-center justify-between">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={16}
                                            className={s <= review.rating ? 'text-mustard-gold fill-mustard-gold' : 'text-gray-600'}
                                            strokeWidth={1.5}
                                        />
                                    ))}
                                </div>
                                {review.rating === 5 && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-mustard-gold bg-mustard-gold/10 border border-mustard-gold/20 px-2 py-0.5 rounded-full">
                                        Shown publicly
                                    </span>
                                )}
                            </div>

                            {/* Review text */}
                            <p className="text-gray-300 text-sm leading-relaxed italic flex-1 line-clamp-4">
                                &ldquo;{review.review}&rdquo;
                            </p>

                            {/* Name + place + date */}
                            <div className="border-t border-white/10 pt-3">
                                <p className="text-white font-semibold text-sm">{review.name}</p>
                                <div className="flex items-center justify-between mt-0.5">
                                    <p className="text-gray-500 text-xs">{review.place}</p>
                                    <p className="text-gray-500 text-xs">
                                        {new Date(review.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    onClick={() => openEdit(review)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-xs font-medium transition-colors"
                                >
                                    <Pencil size={13} />
                                    Edit
                                </button>
                                {deleteConfirmId === review.id ? (
                                    <div className="flex items-center gap-1.5 flex-1">
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="flex-1 py-2 bg-red-500 text-white text-xs rounded-xl font-bold hover:bg-red-600 transition-colors"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(null)}
                                            className="flex-1 py-2 bg-gray-700 text-white text-xs rounded-xl font-bold hover:bg-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setDeleteConfirmId(review.id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30 text-xs font-medium transition-colors"
                                    >
                                        <X size={13} />
                                        Delete
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reviews;
