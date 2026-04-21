import { useState, useEffect, useCallback } from 'react';
import { GitBranch, Crown, Users, PartyPopper, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const fmtEur = (n) =>
    `€${parseFloat(n || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const inputClass =
    'w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all';

// ── Profit Split Modal ────────────────────────────────────────────
const ProfitSplitModal = ({ profitData, onClose, onDone }) => {
    const { addToast } = useToast();
    const [amount, setAmount] = useState('');
    const [markAsPaid, setMarkAsPaid] = useState(false);
    const [splitting, setSplitting] = useState(false);

    const handleSplit = async () => {
        setSplitting(true);
        try {
            await api.post('/financials/split-profit/', { amount: parseFloat(amount), mark_as_paid: markAsPaid });
            addToast('Profit split successfully!', 'success');
            onDone();
            onClose();
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to split profit.', 'error');
        } finally {
            setSplitting(false);
        }
    };

    const net = profitData?.net_profit || 0;
    const dist = profitData?.distribution || [];
    const amtVal = parseFloat(amount) || 0;
    const invalid = amtVal <= 0 || amtVal > net;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => { if (!splitting) onClose(); }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="bg-[#091818] border border-white/10 rounded-2xl w-full max-w-md shadow-[0_0_60px_rgba(0,160,150,0.12),0_25px_60px_rgba(0,0,0,0.8)]"
            >
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-xl"><GitBranch size={20} className="text-yellow-400" /></div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Split Profit</h2>
                            <p className="text-xs text-gray-500">Distribute profit to owners</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <span className="text-sm text-gray-400">Available Net Profit</span>
                        <span className={`text-xl font-bold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtEur(net)}</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Amount to Split *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
                            <input type="number" min="0.01" step="0.01" max={net} value={amount}
                                onChange={e => setAmount(e.target.value)} placeholder="0.00"
                                className={`${inputClass} pl-8`} />
                        </div>
                        {amtVal > net && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12} /> Exceeds net profit</p>}
                    </div>

                    {amtVal > 0 && !isNaN(amtVal) && dist.length > 0 && (
                        <div className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium px-4 py-2.5 border-b border-white/10">Distribution Preview</p>
                            <div className="divide-y divide-white/5">
                                {dist.map(owner => (
                                    <div key={owner.id} className="flex justify-between items-center px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium text-white">{owner.name}</p>
                                            <p className="text-xs text-gray-500">{owner.profit_percentage}% share</p>
                                        </div>
                                        <span className="text-sm font-bold text-mustard-gold">{fmtEur((amtVal * owner.profit_percentage / 100).toFixed(2))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                            <input type="checkbox" checked={markAsPaid} onChange={e => setMarkAsPaid(e.target.checked)}
                                className="w-5 h-5 rounded border border-white/20 bg-black/20 appearance-none cursor-pointer checked:bg-mustard-gold checked:border-mustard-gold transition-all" />
                            <CheckCircle size={14} className={`absolute text-[#080c10] pointer-events-none transition-opacity ${markAsPaid ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white group-hover:text-mustard-gold transition-colors">Mark as Paid</p>
                            <p className="text-xs text-gray-500">Entries will be marked as paid in each owner's finance page</p>
                        </div>
                    </label>

                    <div className="flex gap-3 pt-1">
                        <button onClick={onClose} disabled={splitting}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-medium hover:bg-white/5 transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button onClick={handleSplit} disabled={splitting || invalid}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-mustard-gold text-deep-teal font-bold hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {splitting ? 'Processing...' : <><GitBranch size={16} /> Confirm Split</>}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// ── Tip Split Modal ───────────────────────────────────────────────
const TipSplitModal = ({ tipData, onClose, onDone }) => {
    const { addToast } = useToast();
    const [mode, setMode] = useState('split');   // 'split' | 'party'
    const [amount, setAmount] = useState('');
    const [markAsPaid, setMarkAsPaid] = useState(false);
    const [splitting, setSplitting] = useState(false);

    const handleSplit = async () => {
        setSplitting(true);
        try {
            await api.post('/financials/split-tip/', { amount: parseFloat(amount), mode, mark_as_paid: markAsPaid });
            addToast(mode === 'party' ? 'Staff party fund recorded!' : 'Tips split among staff!', 'success');
            onDone();
            onClose();
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to split tips.', 'error');
        } finally {
            setSplitting(false);
        }
    };

    const total = tipData?.total_tips || 0;
    const staff = tipData?.staff || [];
    const amtVal = parseFloat(amount) || 0;
    const invalid = amtVal <= 0 || amtVal > total;
    const perHead = staff.length > 0 && amtVal > 0 ? (amtVal / staff.length).toFixed(2) : '0.00';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => { if (!splitting) onClose(); }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="bg-[#091818] border border-white/10 rounded-2xl w-full max-w-md shadow-[0_0_60px_rgba(0,160,150,0.12),0_25px_60px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-mustard-gold/20 rounded-xl"><PartyPopper size={20} className="text-mustard-gold" /></div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Distribute Tips</h2>
                            <p className="text-xs text-gray-500">Split equally or fund a staff party</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="flex justify-between items-center p-4 rounded-xl bg-mustard-gold/5 border border-mustard-gold/20">
                        <span className="text-sm text-gray-400">Total Tips Collected</span>
                        <span className="text-xl font-bold text-mustard-gold">{fmtEur(total)}</span>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-white/5 rounded-xl">
                        <button type="button" onClick={() => setMode('split')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${mode === 'split' ? 'bg-mustard-gold text-deep-teal shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            <Users size={14} /> Split Among Staff
                        </button>
                        <button type="button" onClick={() => setMode('party')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${mode === 'party' ? 'bg-mustard-gold text-deep-teal shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            <PartyPopper size={14} /> Staff Party Fund
                        </button>
                    </div>

                    <p className="text-xs text-gray-500">
                        {mode === 'split'
                            ? `Will be split equally among ${tipData?.staff_count || 0} active staff members.`
                            : 'Full amount recorded as a single Staff Party expense.'}
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Amount *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
                            <input type="number" min="0.01" step="0.01" max={total} value={amount}
                                onChange={e => setAmount(e.target.value)} placeholder="0.00"
                                className={`${inputClass} pl-8`} />
                        </div>
                        {amtVal > total && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12} /> Exceeds total tips</p>}
                    </div>

                    {mode === 'split' && amtVal > 0 && !isNaN(amtVal) && staff.length > 0 && (
                        <div className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium px-4 py-2.5 border-b border-white/10">
                                Staff Share Preview — {fmtEur(perHead)} each
                            </p>
                            <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                                {staff.map(s => (
                                    <div key={s.id} className="flex justify-between items-center px-4 py-2.5">
                                        <p className="text-sm font-medium text-white">{s.name}</p>
                                        <span className="text-sm font-bold text-mustard-gold">{fmtEur(perHead)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {mode === 'party' && amtVal > 0 && (
                        <div className="p-4 rounded-xl bg-mustard-gold/5 border border-mustard-gold/20">
                            <p className="text-sm text-gray-300">A single <span className="text-mustard-gold font-semibold">Staff Party</span> expense of <span className="text-white font-bold">{fmtEur(amtVal)}</span> will be recorded.</p>
                        </div>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                            <input type="checkbox" checked={markAsPaid} onChange={e => setMarkAsPaid(e.target.checked)}
                                className="w-5 h-5 rounded border border-white/20 bg-black/20 appearance-none cursor-pointer checked:bg-mustard-gold checked:border-mustard-gold transition-all" />
                            <CheckCircle size={14} className={`absolute text-[#080c10] pointer-events-none transition-opacity ${markAsPaid ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white group-hover:text-mustard-gold transition-colors">Mark as Paid</p>
                            <p className="text-xs text-gray-500">Entries will be marked as paid immediately</p>
                        </div>
                    </label>

                    <div className="flex gap-3 pt-1">
                        <button onClick={onClose} disabled={splitting}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-medium hover:bg-white/5 transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button onClick={handleSplit} disabled={splitting || invalid}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-mustard-gold to-yellow-400 text-deep-teal font-bold hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {splitting ? 'Processing...' : <><PartyPopper size={16} /> Confirm</>}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────
const ProfitSplit = () => {
    const { user } = useAuth();
    const [profitData, setProfitData] = useState(null);
    const [tipData, setTipData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfitModal, setShowProfitModal] = useState(false);
    const [showTipModal, setShowTipModal] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [profitRes, tipRes] = await Promise.allSettled([
                api.get('/financials/profit-distribution/'),
                api.get('/financials/tip-distribution/'),
            ]);
            if (profitRes.status === 'fulfilled') setProfitData(profitRes.value.data);
            if (tipRes.status === 'fulfilled') setTipData(tipRes.value.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-mustard-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const net = profitData?.net_profit || 0;
    const totalTips = tipData?.total_tips || 0;

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <GitBranch size={26} className="text-mustard-gold" />
                        Profit &amp; Tip Distribution
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Split net profit among owners and distribute staff tips</p>
                </div>
                <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-300 transition-colors" title="Refresh">
                    <RefreshCw size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── Profit Card ── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                        <div className="p-2 bg-yellow-500/20 rounded-xl"><Crown size={20} className="text-yellow-400" /></div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Net Profit</h2>
                            <p className="text-xs text-gray-500">Owner profit distribution</p>
                        </div>
                    </div>

                    <div className={`flex justify-between items-center p-4 rounded-xl border ${net >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <span className="text-sm text-gray-400">Total Net Profit</span>
                        <span className={`text-2xl font-bold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtEur(net)}</span>
                    </div>

                    {profitData?.distribution?.length > 0 ? (
                        <div className="space-y-3">
                            {profitData.distribution.map((owner, idx) => (
                                <div key={owner.id ?? idx} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-sm font-medium text-white">{owner.name}</span>
                                        <span className="text-xs font-semibold text-mustard-gold bg-mustard-gold/10 border border-mustard-gold/20 px-2 py-0.5 rounded-full">{owner.profit_percentage}%</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-1.5 mb-1.5">
                                        <div className="bg-gradient-to-r from-mustard-gold to-yellow-400 h-1.5 rounded-full"
                                            style={{ width: `${Math.min(owner.profit_percentage, 100)}%` }} />
                                    </div>
                                    <p className={`text-sm font-bold ${owner.share >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtEur(owner.share)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No owners configured yet. Set owner profiles in User Settings.</p>
                    )}

                    {user?.is_superuser && net > 0 && profitData?.distribution?.length > 0 && (
                        <button onClick={() => setShowProfitModal(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-mustard-gold text-deep-teal font-bold hover:shadow-lg hover:shadow-mustard-gold/20 transition-all">
                            <GitBranch size={18} /> Split Profit
                        </button>
                    )}
                </motion.div>

                {/* ── Tips Card ── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                        <div className="p-2 bg-mustard-gold/20 rounded-xl"><PartyPopper size={20} className="text-mustard-gold" /></div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Staff Tips</h2>
                            <p className="text-xs text-gray-500">Tips collected from events</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-4 rounded-xl bg-mustard-gold/5 border border-mustard-gold/20">
                        <span className="text-sm text-gray-400">Total Tips Collected</span>
                        <span className="text-2xl font-bold text-mustard-gold">{fmtEur(totalTips)}</span>
                    </div>

                    {tipData?.staff_count > 0 && totalTips > 0 && (
                        <>
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Equal Split Preview</p>
                                <p className="text-sm text-gray-300">
                                    {fmtEur(totalTips)} ÷ {tipData.staff_count} staff =
                                    <span className="text-mustard-gold font-bold ml-1">{fmtEur((totalTips / tipData.staff_count).toFixed(2))} per person</span>
                                </p>
                            </div>

                            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                {tipData.staff.map(s => (
                                    <div key={s.id} className="flex justify-between items-center py-1.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                                        <span className="text-sm text-gray-300">{s.name}</span>
                                        <span className="text-xs font-semibold text-mustard-gold">{fmtEur(s.share)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {totalTips === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No tips collected yet. Tips are added when receiving event payments.</p>
                    )}

                    {user?.is_superuser && totalTips > 0 && (
                        <div className="space-y-2 pt-2">
                            <button onClick={() => setShowTipModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-mustard-gold to-yellow-400 text-deep-teal font-bold hover:shadow-lg hover:shadow-mustard-gold/20 transition-all">
                                <PartyPopper size={18} /> Distribute Tips
                            </button>
                            <p className="text-center text-xs text-gray-600">Split equally among staff or use as a party fund</p>
                        </div>
                    )}
                </motion.div>

            </div>

            {/* Modals */}
            <AnimatePresence>
                {showProfitModal && (
                    <ProfitSplitModal profitData={profitData} onClose={() => setShowProfitModal(false)} onDone={fetchData} />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showTipModal && (
                    <TipSplitModal tipData={tipData} onClose={() => setShowTipModal(false)} onDone={fetchData} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfitSplit;
