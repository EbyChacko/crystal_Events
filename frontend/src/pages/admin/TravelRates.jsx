import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Map, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

const TravelRates = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [formData, setFormData] = useState({ distance_from: '', distance_to: '', rate: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rateToDelete, setRateToDelete] = useState(null);

    useEffect(() => {
        fetchRates();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFormOpen) {
                handleCloseForm();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFormOpen]);

    const fetchRates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/travel_rates/');
            setRates(response.data);
        } catch (err) {
            console.error('Error fetching travel rates:', err);
            addToast('Failed to load travel rates. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (rate = null) => {
        if (rate) {
            setEditingRate(rate);
            setFormData({
                distance_from: rate.distance_from,
                distance_to: rate.distance_to,
                rate: rate.rate,
            });
        } else {
            setEditingRate(null);
            setFormData({ distance_from: '', distance_to: '', rate: '' });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingRate(null);
        setFormData({ distance_from: '', distance_to: '', rate: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Number(formData.distance_from) < 0 || Number(formData.distance_to) <= 0 || Number(formData.rate) < 0) {
            addToast('Please enter valid positive numbers.', 'error');
            return;
        }

        if (Number(formData.distance_from) >= Number(formData.distance_to)) {
            addToast('Distance "To" must be greater than Distance "From".', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingRate) {
                await api.put(`/travel_rates/${editingRate.id}/`, formData);
            } else {
                await api.post('/travel_rates/', formData);
            }
            await fetchRates();
            handleCloseForm();
        } catch (err) {
            console.error('Error saving rate:', err);
            addToast(err.response?.data?.detail || 'Failed to save travel rate.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!rateToDelete) return;
        try {
            await api.delete(`/travel_rates/${rateToDelete}/`);
            await fetchRates();
            setRateToDelete(null);
        } catch (err) {
            console.error('Error deleting rate:', err);
            addToast('Failed to delete travel rate.', 'error');
            setRateToDelete(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Map className="text-mustard-gold" /> Travel Rates
                    </h1>
                    <p className="text-gray-400 mt-1">Configure distance-based travel expense tiers</p>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="flex items-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal px-4 py-2 rounded-xl font-bold hover:shadow-lg transition-all w-full sm:w-auto"
                >
                    <Plus size={20} />
                    <span>Add Travel Rate</span>
                </button>
            </div>

            {/* Travel Rates List */}
            <div className="bg-black/25 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                {loading ? (
                    <div className="flex justify-center items-center p-12 text-mustard-gold">
                        <RefreshCw className="animate-spin" size={32} />
                    </div>
                ) : rates.length === 0 ? (
                    <div className="text-center p-12">
                        <Map className="mx-auto h-12 w-12 text-gray-400 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-white mb-2">No Travel Rates Configured</h3>
                        <p className="text-gray-400 mb-6">Set up your first distance tier to automatically calculate travel expenses on quotes.</p>
                        <button
                            onClick={() => handleOpenForm()}
                            className="text-mustard-gold hover:text-white font-medium transition-colors"
                        >
                            + Add your first rate
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Distance Range (km)</th>
                                    <th className="px-6 py-4">Cost Rate (€)</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {rates.map((rate) => (
                                    <tr key={rate.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-white font-medium">{rate.distance_from} - {rate.distance_to}</span>
                                        </td>
                                        <td className="px-6 py-4 text-mustard-gold font-bold text-lg">
                                            €{Number(rate.rate).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <AnimatePresence mode="wait">
                                                {rateToDelete === rate.id ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        className="flex items-center justify-end space-x-2"
                                                    >
                                                        <span className="text-xs text-red-400 font-medium mr-2 hidden sm:inline">Delete?</span>
                                                        <button onClick={handleDelete} className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                                                            Yes
                                                        </button>
                                                        <button onClick={() => setRateToDelete(null)} className="text-xs bg-white/10 hover:bg-white/[0.08] text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                                                            No
                                                        </button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="flex justify-end space-x-3"
                                                    >
                                                        <button
                                                            onClick={() => handleOpenForm(rate)}
                                                            className="p-2 text-gray-400 hover:text-blue-400 bg-white/5 hover:bg-white/[0.05] rounded-lg transition-colors"
                                                            title="Edit Rate"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setRateToDelete(rate.id)}
                                                            className="p-2 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-white/[0.05] rounded-lg transition-colors"
                                                            title="Delete Rate"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            <AnimatePresence>
                {isFormOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={handleCloseForm}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md bg-[#080c10] border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(0,160,150,0.14),0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/10">
                                <h2 className="text-xl font-bold text-white">
                                    {editingRate ? 'Edit Travel Rate' : 'Add New Travel Rate'}
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Distance From (km)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.distance_from}
                                                onChange={(e) => setFormData({ ...formData, distance_from: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 transition-all font-mono"
                                                placeholder="e.g. 0"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">km</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Distance To (km)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={formData.distance_to}
                                                onChange={(e) => setFormData({ ...formData, distance_to: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 transition-all font-mono"
                                                placeholder="e.g. 50"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">km</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Events within this distance range will apply this rate.</p>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Travel Cost Rate (€)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={formData.rate}
                                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 transition-all font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseForm}
                                        className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/[0.05] text-white rounded-xl transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Rate'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default TravelRates;
