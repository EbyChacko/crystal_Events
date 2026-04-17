import { useState, useEffect } from 'react';
import { PieChart, TrendingDown, Edit3, Trash2, CheckCircle, X, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/admin/Pagination';
import usePagination from '../../hooks/usePagination';

const StatCard = ({ icon, label, value, isPositive = null, delay = 0 }) => (
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
                <h3 className={`text-2xl font-bold tracking-tight ${isPositive === true ? 'text-emerald-400' : isPositive === false ? 'text-red-400' : 'text-white'}`}>
                    {value}
                </h3>
            </div>
            <div className={`p-3 rounded-xl border ${isPositive === true ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : isPositive === false ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-mustard-gold/10 text-mustard-gold border-mustard-gold/20'}`}>
                {icon}
            </div>
        </div>
    </motion.div>
);

const Assets = () => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const canManageFinancials = user?.is_superuser || user?.can_view_financials;
    const [assetsList, setAssetsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingAssetId, setEditingAssetId] = useState(null);
    const [assetCurrentValue, setAssetCurrentValue] = useState('');
    const [confirmRemoveAssetId, setConfirmRemoveAssetId] = useState(null);
    const [isOverviewOpen, setIsOverviewOpen] = useState(false);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/expenses/');
            const filtered = (res.data.results || res.data)
                .filter(e => e.is_asset && e.is_active_asset)
                .map(e => ({
                    id: `exp_${e.id}`,
                    originalId: e.id,
                    type: 'expense',
                    date: e.date,
                    amount: parseFloat(e.amount),
                    reason: e.reason,
                    category: e.category,
                    asset_current_value: e.asset_current_value ? parseFloat(e.asset_current_value) : parseFloat(e.amount),
                }));
            setAssetsList(filtered);
        } catch (error) {
            addToast('Failed to load assets.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const saveAssetValue = async (asset) => {
        try {
            const data = new FormData();
            data.append('asset_current_value', assetCurrentValue);
            await api.patch(`/expenses/${asset.originalId}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            addToast('Asset value updated.', 'success');
            setEditingAssetId(null);
            fetchAssets();
        } catch (err) {
            addToast('Failed to update asset value.', 'error');
        }
    };

    const removeAsset = async (asset) => {
        try {
            const data = new FormData();
            data.append('is_active_asset', 'False');
            await api.patch(`/expenses/${asset.originalId}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            addToast('Asset removed from active list.', 'success');
            setConfirmRemoveAssetId(null);
            fetchAssets();
        } catch (err) {
            addToast('Failed to remove asset.', 'error');
        }
    };

    const totalPurchaseValue = assetsList.reduce((sum, a) => sum + a.amount, 0);
    const totalCurrentValue = assetsList.reduce((sum, a) => sum + a.asset_current_value, 0);
    const totalDepreciation = totalPurchaseValue - totalCurrentValue;
    const { currentPage, setCurrentPage, totalPages, pagedItems: pagedAssets } = usePagination(assetsList);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Company Assets</h1>
                    <p className="text-gray-400 mt-1">Overview and tracking of active depreciating assets</p>
                </div>
                
                {/* Mobile Overview Toggle */}
                <button
                    onClick={() => setIsOverviewOpen(!isOverviewOpen)}
                    className="md:hidden flex items-center justify-center space-x-2 bg-white/5 text-gray-300 border border-white/10 px-4 py-3 rounded-xl hover:bg-white/[0.05] hover:text-white transition-all font-medium w-full"
                >
                    {isOverviewOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    <span>{isOverviewOpen ? 'Hide Overview' : 'Show Overview'}</span>
                </button>
            </div>

            {/* Overview Stats */}
            <div className={`grid-cols-1 md:grid-cols-3 gap-5 mb-8 ${isOverviewOpen ? 'grid' : 'hidden md:grid'}`}>
                <StatCard icon={<DollarSign size={22} />} label="Total Purchase Value" value={`€${totalPurchaseValue.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} isPositive={null} delay={0} />
                <StatCard icon={<PieChart size={22} />} label="Total Current Value" value={`€${totalCurrentValue.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} isPositive={true} delay={0.1} />
                <StatCard icon={<TrendingDown size={22} />} label="Total Depreciation" value={`€${totalDepreciation.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} isPositive={totalDepreciation > 0 ? false : null} delay={0.2} />
            </div>

            {/* Assets Table */}
            <div className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <PieChart size={18} className="text-purple-400" />
                        Active Tracked Assets
                    </h2>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading assets...</div>
                ) : assetsList.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No active assets tracked. Add expenses and mark them as assets.</div>
                ) : (
                    <>
                        <div className="overflow-x-auto hidden lg:block">
                            <table className="w-full text-left min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
                                        <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Purchase Value</th>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                                        {canManageFinancials && <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {pagedAssets.map(a => (
                                        <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-white">{a.reason}</p>
                                                <span className="text-xs text-gray-400 mt-0.5 block">{a.category}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {new Date(a.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">
                                                €{a.amount.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-mustard-gold">
                                                {canManageFinancials && editingAssetId === a.originalId ? (
                                                    <div className="flex justify-end items-center space-x-2">
                                                        <input
                                                            type="number"
                                                            value={assetCurrentValue}
                                                            onChange={(e) => setAssetCurrentValue(e.target.value)}
                                                            className="w-24 bg-black/40 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-mustard-gold"
                                                            step="0.01"
                                                            min="0"
                                                        />
                                                        <button onClick={() => saveAssetValue(a)} className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 p-1.5 rounded-lg transition-colors"><CheckCircle size={16} /></button>
                                                        <button onClick={() => setEditingAssetId(null)} className="text-red-400 hover:text-red-300 bg-red-500/10 p-1.5 rounded-lg transition-colors"><X size={16} /></button>
                                                    </div>
                                                ) : (
                                                    <span>€{a.asset_current_value.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                )}
                                            </td>
                                            {canManageFinancials && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {confirmRemoveAssetId === a.originalId ? (
                                                    <div className="flex justify-end items-center space-x-2 border border-red-500/30 p-1.5 rounded-xl bg-red-500/5">
                                                        <span className="text-xs text-red-400 font-medium">Remove?</span>
                                                        <button onClick={() => removeAsset(a)} className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 font-bold transition-colors">Yes</button>
                                                        <button onClick={() => setConfirmRemoveAssetId(null)} className="px-3 py-1 text-xs bg-white/10 text-gray-400 rounded-lg hover:bg-white/[0.08] font-bold transition-colors">No</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end space-x-2 transition-opacity">
                                                        {editingAssetId !== a.originalId && (
                                                            <button onClick={() => { setEditingAssetId(a.originalId); setAssetCurrentValue(a.asset_current_value); }} className="p-2 text-gray-400 hover:text-mustard-gold bg-white/5 hover:bg-mustard-gold/10 rounded-lg transition-colors" title="Edit Current Value"><Edit3 size={16} /></button>
                                                        )}
                                                        <button onClick={() => setConfirmRemoveAssetId(a.originalId)} className="p-2 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove Asset"><Trash2 size={16} /></button>
                                                    </div>
                                                )}
                                            </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="lg:hidden divide-y divide-white/5">
                            {pagedAssets.map((a) => (
                                <div key={a.id} className="p-4 hover:bg-white/5 transition-colors group flex flex-col gap-2 relative">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-white truncate">{a.reason}</h3>
                                            <span className="text-sm text-gray-400 truncate block mt-0.5">{a.category}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Purchase Value</p>
                                            <p className="text-sm font-medium text-white">€{a.amount.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Current Value</p>
                                            {canManageFinancials && editingAssetId === a.originalId ? (
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="number"
                                                        value={assetCurrentValue}
                                                        onChange={(e) => setAssetCurrentValue(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-mustard-gold"
                                                        step="0.01" min="0"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-sm font-bold text-mustard-gold">€{a.asset_current_value.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-end gap-2 text-sm text-gray-400 mt-2 pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <span>{new Date(a.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        {canManageFinancials && (
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {confirmRemoveAssetId === a.originalId ? (
                                                <div className="flex items-center space-x-1 border border-red-500/30 p-1 rounded-lg">
                                                    <button onClick={() => removeAsset(a)} className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">Yes</button>
                                                    <button onClick={() => setConfirmRemoveAssetId(null)} className="px-2 py-1 text-xs bg-white/10 text-gray-400 rounded hover:bg-white/[0.08]">No</button>
                                                </div>
                                            ) : editingAssetId === a.originalId ? (
                                                <div className="flex space-x-1">
                                                    <button onClick={() => saveAssetValue(a)} className="p-2 text-emerald-400 bg-emerald-500/10 rounded-lg transition-colors"><CheckCircle size={14} /></button>
                                                    <button onClick={() => setEditingAssetId(null)} className="p-2 text-red-400 bg-red-500/10 rounded-lg transition-colors"><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button onClick={() => { setEditingAssetId(a.originalId); setAssetCurrentValue(a.asset_current_value); }} className="p-2 text-gray-400 hover:text-mustard-gold bg-white/5 hover:bg-mustard-gold/10 rounded-lg transition-colors"><Edit3 size={14} /></button>
                                                    <button onClick={() => setConfirmRemoveAssetId(a.originalId)} className="p-2 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};

export default Assets;
