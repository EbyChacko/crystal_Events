import { useState, useEffect } from 'react';
import { Package, Plus, Edit3, Trash2, X, Save, DollarSign, TrendingDown, Layers, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/admin/Pagination';
import usePagination from '../../hooks/usePagination';

const CONDITION_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor'];

const CONDITION_COLORS = {
    Excellent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Good: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Fair: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Poor: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const StatCard = ({ icon, label, value, colorClass = '', delay = 0 }) => (
    <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay, duration: 0.4 }}
        className="bg-black/25 backdrop-blur-sm border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all"
    >
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-mustard-gold/10 transition-colors" />
        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{label}</p>
                <h3 className={`text-2xl font-bold tracking-tight ${colorClass || 'text-white'}`}>{value}</h3>
            </div>
            <div className={`p-3 rounded-xl border bg-mustard-gold/10 text-mustard-gold border-mustard-gold/20`}>
                {icon}
            </div>
        </div>
    </motion.div>
);

const emptyForm = {
    name: '',
    purchase_date: '',
    quantity: '1',
    value: '',
    current_value: '',
    depreciation_rate: '',
    condition: 'Good',
    notes: '',
};

const inputClass = "w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all";
const selectClass = `${inputClass} appearance-none`;

const Assets = () => {
    const { addToast } = useToast();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isOverviewOpen, setIsOverviewOpen] = useState(false);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/assets/');
            setAssets(res.data.results || res.data);
        } catch {
            addToast('Failed to load assets.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const openAddModal = () => {
        setEditingAsset(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (asset) => {
        setEditingAsset(asset);
        setFormData({
            name: asset.name || '',
            purchase_date: asset.purchase_date || '',
            quantity: String(asset.quantity ?? 1),
            value: String(asset.value ?? ''),
            current_value: asset.current_value != null ? String(asset.current_value) : '',
            depreciation_rate: asset.depreciation_rate != null ? String(asset.depreciation_rate) : '',
            condition: asset.condition || 'Good',
            notes: asset.notes || '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAsset(null);
        setFormData(emptyForm);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                purchase_date: formData.purchase_date,
                quantity: parseInt(formData.quantity) || 1,
                value: formData.value,
                current_value: formData.current_value || null,
                depreciation_rate: formData.depreciation_rate || '0',
                condition: formData.condition,
                notes: formData.notes,
            };

            if (editingAsset) {
                await api.patch(`/assets/${editingAsset.id}/`, payload);
                addToast('Asset updated successfully.', 'success');
            } else {
                await api.post('/assets/', payload);
                addToast('Asset added successfully.', 'success');
            }
            closeModal();
            fetchAssets();
        } catch (err) {
            const d = err.response?.data;
            if (d) {
                const msg = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
                addToast(msg, 'error');
            } else {
                addToast('Failed to save asset.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/assets/${id}/`);
            addToast('Asset deleted.', 'success');
            setConfirmDeleteId(null);
            fetchAssets();
        } catch {
            addToast('Failed to delete asset.', 'error');
        }
    };

    const totalPurchaseValue = assets.reduce((sum, a) => sum + parseFloat(a.value || 0), 0);
    const totalCurrentValue = assets.reduce((sum, a) => sum + parseFloat(a.current_value ?? a.value ?? 0), 0);
    const totalDepreciation = totalPurchaseValue - totalCurrentValue;

    const { currentPage, setCurrentPage, totalPages, pagedItems: pagedAssets } = usePagination(assets);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Asset Inventory</h1>
                    <p className="text-gray-400 mt-1">Manage and track all company assets</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setIsOverviewOpen(!isOverviewOpen)}
                        className="lg:hidden flex items-center justify-center space-x-2 bg-white/5 text-gray-300 border border-white/10 px-4 py-3 rounded-xl hover:bg-white/[0.05] hover:text-white transition-all font-medium"
                    >
                        {isOverviewOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        <span>{isOverviewOpen ? 'Hide Overview' : 'Show Overview'}</span>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center justify-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all"
                    >
                        <Plus size={18} />
                        <span>Add Asset</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className={`grid-cols-1 lg:grid-cols-3 gap-5 ${isOverviewOpen ? 'grid' : 'hidden lg:grid'}`}>
                <StatCard icon={<DollarSign size={22} />} label="Total Purchase Value" value={`€${totalPurchaseValue.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} delay={0} />
                <StatCard icon={<Layers size={22} />} label="Total Current Value" value={`€${totalCurrentValue.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-emerald-400" delay={0.1} />
                <StatCard icon={<TrendingDown size={22} />} label="Total Depreciation" value={`€${totalDepreciation.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass={totalDepreciation > 0 ? 'text-red-400' : 'text-white'} delay={0.2} />
            </div>

            {/* Assets Table */}
            <div className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Package size={18} className="text-mustard-gold" />
                        All Assets
                    </h2>
                    <span className="text-sm text-gray-400">{assets.length} item{assets.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading assets...</div>
                ) : assets.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package size={40} className="text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500 mb-1">No assets added yet.</p>
                        <p className="text-gray-600 text-sm">Click "Add Asset" to get started.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
                                        <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                                        <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Qty</th>
                                        <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Purchase Value</th>
                                        <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Current Value</th>
                                        <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Depreciation</th>
                                        <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Condition</th>
                                        <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {pagedAssets.map(asset => (
                                        <tr key={asset.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-white">{asset.name}</p>
                                                {asset.notes && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{asset.notes}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                                                {new Date(asset.purchase_date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300 text-center">{asset.quantity}</td>
                                            <td className="px-6 py-4 text-sm text-gray-300 text-right whitespace-nowrap">
                                                €{parseFloat(asset.value).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-mustard-gold text-right whitespace-nowrap">
                                                €{parseFloat(asset.current_value ?? asset.value).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400 text-center whitespace-nowrap">
                                                {parseFloat(asset.depreciation_rate) > 0 ? `${parseFloat(asset.depreciation_rate)}% / yr` : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${CONDITION_COLORS[asset.condition] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                                                    {asset.condition}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                {confirmDeleteId === asset.id ? (
                                                    <div className="flex justify-end items-center space-x-2 border border-red-500/30 p-1.5 rounded-xl bg-red-500/5">
                                                        <span className="text-xs text-red-400 font-medium">Delete?</span>
                                                        <button onClick={() => handleDelete(asset.id)} className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 font-bold">Yes</button>
                                                        <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 text-xs bg-white/10 text-gray-400 rounded-lg hover:bg-white/[0.08] font-bold">No</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end space-x-2">
                                                        <button onClick={() => openEditModal(asset)} className="p-2 text-gray-400 hover:text-mustard-gold bg-white/5 hover:bg-mustard-gold/10 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                        <button onClick={() => setConfirmDeleteId(asset.id)} className="p-2 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden divide-y divide-white/5">
                            {pagedAssets.map(asset => (
                                <div key={asset.id} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex justify-between items-start gap-3 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-white truncate">{asset.name}</h3>
                                            {asset.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{asset.notes}</p>}
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border flex-shrink-0 ${CONDITION_COLORS[asset.condition] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                                            {asset.condition}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Purchase Date</p>
                                            <p className="text-gray-300">{new Date(asset.purchase_date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
                                            <p className="text-gray-300">{asset.quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Purchase Value</p>
                                            <p className="text-gray-300">€{parseFloat(asset.value).toLocaleString('en-IE', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Current Value</p>
                                            <p className="text-mustard-gold font-bold">€{parseFloat(asset.current_value ?? asset.value).toLocaleString('en-IE', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        {parseFloat(asset.depreciation_rate) > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5">Depreciation</p>
                                                <p className="text-gray-300">{parseFloat(asset.depreciation_rate)}% / yr</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end items-center gap-2 pt-2 border-t border-white/5">
                                        {confirmDeleteId === asset.id ? (
                                            <div className="flex items-center space-x-1 border border-red-500/30 p-1 rounded-lg">
                                                <span className="text-xs text-red-400 font-medium px-1">Delete?</span>
                                                <button onClick={() => handleDelete(asset.id)} className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">Yes</button>
                                                <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-xs bg-white/10 text-gray-400 rounded hover:bg-white/[0.08]">No</button>
                                            </div>
                                        ) : (
                                            <>
                                                <button onClick={() => openEditModal(asset)} className="p-2 text-gray-400 hover:text-mustard-gold bg-white/5 hover:bg-mustard-gold/10 rounded-lg transition-colors"><Edit3 size={14} /></button>
                                                <button onClick={() => setConfirmDeleteId(asset.id)} className="p-2 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>

            {/* Add / Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-[#080c10] border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(0,160,150,0.14),0_25px_60px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Package size={20} className="text-mustard-gold" />
                                    {editingAsset ? 'Edit Asset' : 'Add New Asset'}
                                </h2>
                                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Name */}
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Asset Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={inputClass}
                                            placeholder="e.g. Stage Lighting Rig"
                                            required
                                        />
                                    </div>

                                    {/* Purchase Date */}
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Purchase Date *</label>
                                        <input
                                            type="date"
                                            name="purchase_date"
                                            value={formData.purchase_date}
                                            onChange={handleChange}
                                            className={inputClass}
                                            required
                                        />
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Quantity *</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            className={inputClass}
                                            placeholder="1"
                                            min="1"
                                            required
                                        />
                                    </div>

                                    {/* Purchase Value */}
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Purchase Value (€) *</label>
                                        <input
                                            type="number"
                                            name="value"
                                            value={formData.value}
                                            onChange={handleChange}
                                            className={inputClass}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                    </div>

                                    {/* Current Value */}
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Current Value (€)</label>
                                        <input
                                            type="number"
                                            name="current_value"
                                            value={formData.current_value}
                                            onChange={handleChange}
                                            className={inputClass}
                                            placeholder="Leave blank to use purchase value"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>

                                    {/* Depreciation Rate */}
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Annual Depreciation (%)</label>
                                        <input
                                            type="number"
                                            name="depreciation_rate"
                                            value={formData.depreciation_rate}
                                            onChange={handleChange}
                                            className={inputClass}
                                            placeholder="e.g. 10"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                        />
                                    </div>

                                    {/* Condition */}
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Condition *</label>
                                        <select
                                            name="condition"
                                            value={formData.condition}
                                            onChange={handleChange}
                                            className={selectClass}
                                            required
                                        >
                                            {CONDITION_OPTIONS.map(c => (
                                                <option key={c} value={c} className="bg-gray-900">{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Notes */}
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Notes</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            className={inputClass}
                                            placeholder="Optional — serial number, location, etc."
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <span>Saving...</span>
                                        ) : (
                                            <>
                                                <CheckCircle size={18} />
                                                <span>{editingAsset ? 'Update Asset' : 'Add Asset'}</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex items-center justify-center space-x-2 bg-white/10 border border-white/10 text-gray-300 font-medium px-6 py-3 rounded-xl hover:bg-white/[0.06] transition-all"
                                    >
                                        <X size={18} />
                                        <span>Cancel</span>
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

export default Assets;
