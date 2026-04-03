import { useState, useEffect } from 'react';
import {
    Briefcase, Plus, X, AlertCircle, CheckCircle, Search,
    Trash2, Edit3, DollarSign, Tag, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const inputClass = "w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all";

const ServicesAdmin = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const formRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showForm) {
                setShowForm(false);
                setEditingId(null);
                setFormData(initialFormData);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showForm]);

    const initialFormData = { name: '', description: '', base_price: '', image: null, image_url: '' };
    const [formData, setFormData] = useState(initialFormData);
    const [imageMode, setImageMode] = useState('file'); // 'file' | 'url'

    const fetchServices = async () => {
        try {
            const res = await api.get('/services/');
            setServices(res.data);
        } catch (err) {
            console.error('Failed to fetch services:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleChange = (e) => {
        if (e.target.type === 'file') {
            setFormData({ ...formData, [e.target.name]: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleEdit = (service) => {
        const existingUrl = service.image_url || service.image || '';
        setFormData({
            name: service.name,
            description: service.description,
            base_price: service.base_price,
            image: null,
            image_url: existingUrl,
        });
        // Pre-select URL mode if there's an existing image URL
        setImageMode(existingUrl ? 'url' : 'file');
        setEditingId(service.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const uploadData = new FormData();
        uploadData.append('name', formData.name);
        uploadData.append('description', formData.description);
        uploadData.append('base_price', formData.base_price);
        if (imageMode === 'url') {
            uploadData.append('image_url', formData.image_url);
            // Clear out previous file if switching to URL mode
            uploadData.append('image', '');
        } else if (formData.image) {
            uploadData.append('image', formData.image);
            uploadData.append('image_url', '');
        }

        try {
            if (editingId) {
                await api.patch(`/services/${editingId}/`, uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                addToast('Service updated successfully!', 'success');
            } else {
                await api.post('/services/', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                addToast('Service created successfully!', 'success');
            }
            setFormData(initialFormData);
            setEditingId(null);
            setShowForm(false);
            fetchServices();
        } catch (err) {
            const d = err.response?.data;
            if (d) {
                const messages = Object.entries(d)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
                addToast(messages, 'error');
            } else {
                addToast('Failed to save service.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/services/${id}/`);
            addToast('Service deleted.', 'success');
            setDeleteConfirmId(null);
            fetchServices();
        } catch (err) {
            if (err.response?.status === 409 || err.response?.data?.detail?.includes('protect')) {
                addToast('Cannot delete: this service is used by existing quotes.', 'error');
            } else {
                addToast('Failed to delete service.', 'error');
            }
        }
    };

    const handleToggleVisibility = async (service) => {
        const updated = { show_on_website: !service.show_on_website };
        // Optimistic update
        setServices(prev => prev.map(s => s.id === service.id ? { ...s, ...updated } : s));
        try {
            await api.patch(`/services/${service.id}/`, updated);
            addToast(updated.show_on_website ? 'Service is now visible on website.' : 'Service hidden from website.', 'success');
        } catch {
            // Revert on failure
            setServices(prev => prev.map(s => s.id === service.id ? service : s));
            addToast('Failed to update visibility.', 'error');
        }
    };

    const filteredServices = services.filter(s => {
        if (!searchTerm) return true;
        return s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.description?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Services</h1>
                    <p className="text-gray-400 mt-1">Manage your service catalog and pricing</p>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData(initialFormData); }}
                    className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all font-bold"
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    <span>{showForm ? 'Cancel' : 'Add Service'}</span>
                </button>
            </div>

            {/* Add/Edit Form Modal */}
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
                            className="relative w-full max-w-2xl bg-[#080c10] border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Briefcase size={22} className="text-mustard-gold" />
                                    <span>{editingId ? 'Edit Service' : 'Add New Service'}</span>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Service Name *</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange}
                                            className={inputClass} placeholder="e.g. Wedding Planning" required />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Base Price (€) *</label>
                                        <input type="number" name="base_price" value={formData.base_price} onChange={handleChange}
                                            className={inputClass} placeholder="2500.00" step="0.01" min="0" required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Description *</label>
                                        <textarea name="description" value={formData.description} onChange={handleChange}
                                            rows="3" className={inputClass} placeholder="Describe the service offering..." required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Service Image</label>
                                        {/* Toggle */}
                                        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-3 w-fit">
                                            <button type="button"
                                                onClick={() => setImageMode('file')}
                                                className={`px-4 py-1.5 text-xs font-semibold transition-colors ${imageMode === 'file' ? 'bg-mustard-gold text-deep-teal' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                                                Upload File
                                            </button>
                                            <button type="button"
                                                onClick={() => setImageMode('url')}
                                                className={`px-4 py-1.5 text-xs font-semibold transition-colors ${imageMode === 'url' ? 'bg-mustard-gold text-deep-teal' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                                                Paste URL
                                            </button>
                                        </div>
                                        {imageMode === 'file' ? (
                                            <>
                                                <input type="file" name="image" accept="image/*" onChange={handleChange}
                                                    className={`${inputClass} !py-2`} />
                                                <p className="text-xs text-gray-500 mt-2">Optional. Replaces existing image if provided.</p>
                                            </>
                                        ) : (
                                            <input type="url" name="image_url" value={formData.image_url} onChange={handleChange}
                                                className={inputClass} placeholder="https://example.com/image.jpg" />
                                        )}
                                    </div>
                                </div>
                                <button type="submit" disabled={submitting}
                                    className="w-full bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {submitting ? 'Saving...' : editingId ? 'Update Service' : 'Add Service'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Search */}
            <div className="mb-8">
                <div className="relative w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search services..."
                        className="w-full bg-white/5 border border-white/10 text-white text-sm pl-9 pr-10 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 placeholder-gray-600 transition-all" />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Service Cards Grid */}
            {loading ? (
                <div className="text-center text-gray-500 py-12">Loading services...</div>
            ) : filteredServices.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                    {services.length === 0 ? 'No services yet. Add your first service!' : 'No services match your search.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredServices.map((service, index) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.04] transition-all group relative"
                        >
                            {/* Actions */}
                            <div className="absolute top-4 right-4 flex space-x-1">
                                {deleteConfirmId === service.id ? (
                                    <div className="flex items-center space-x-1.5 bg-[#071212]/90 rounded-lg px-2 py-1">
                                        <span className="text-xs text-red-400">Delete?</span>
                                        <button onClick={() => handleDelete(service.id)}
                                            className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors">Yes</button>
                                        <button onClick={() => setDeleteConfirmId(null)}
                                            className="px-1.5 py-0.5 text-xs bg-white/10 text-gray-400 rounded hover:bg-white/[0.08] transition-colors">No</button>
                                    </div>
                                ) : (
                                    <>
                                        <button onClick={() => handleEdit(service)}
                                            className="p-1.5 text-gray-400 hover:text-mustard-gold hover:bg-mustard-gold/10 rounded-lg transition-colors">
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => setDeleteConfirmId(service.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Icon */}
                            <div className="w-12 h-12 rounded-xl bg-mustard-gold/10 flex items-center justify-center text-mustard-gold mb-4 group-hover:bg-mustard-gold/20 transition-colors">
                                <Tag size={22} />
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-bold text-white mb-2">{service.name}</h3>
                            <p className="text-sm text-gray-400 mb-4 line-clamp-3">{service.description}</p>

                            {/* Price + visibility toggle */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <div className="flex items-center space-x-2">
                                    <DollarSign size={16} className="text-mustard-gold" />
                                    <span className="text-lg font-bold text-white">
                                        €{parseFloat(service.base_price).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-xs text-gray-500">base price</span>
                                </div>
                                <button
                                    onClick={() => handleToggleVisibility(service)}
                                    title={service.show_on_website ? 'Visible on website — click to hide' : 'Hidden from website — click to show'}
                                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                                        service.show_on_website
                                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                                            : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/[0.05] hover:text-gray-300'
                                    }`}
                                >
                                    {service.show_on_website
                                        ? <><Eye size={12} /> Visible</>
                                        : <><EyeOff size={12} /> Hidden</>
                                    }
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ServicesAdmin;
