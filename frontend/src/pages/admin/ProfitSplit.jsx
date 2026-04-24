import { useState, useEffect, useCallback } from 'react';
import {
    PartyPopper, RefreshCw, AlertCircle, CheckCircle, X,
    Users, Wallet, TrendingDown, Calendar, Hash, Trash2, RotateCcw, BadgeCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const fmtEur = (n) =>
    `€${parseFloat(n || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const inputClass =
    'w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all';

// ── Inline confirm helper ─────────────────────────────────────────
const ConfirmButtons = ({ onConfirm, onCancel, busy, label = 'Delete', danger = true }) => (
    <span className="inline-flex items-center gap-1.5">
        <button onClick={onCancel} disabled={busy}
            className="text-xs px-2 py-1 rounded-lg border border-white/15 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40">
            Cancel
        </button>
        <button onClick={onConfirm} disabled={busy}
            className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors disabled:opacity-40 ${danger ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30'}`}>
            {busy ? '...' : label}
        </button>
    </span>
);

// ── Distribute Tips Modal ─────────────────────────────────────────
const TipSplitModal = ({ tipData, onClose, onDone }) => {
    const { addToast } = useToast();
    const [mode, setMode] = useState('split');
    const [amount, setAmount] = useState('');
    const [markAsPaid, setMarkAsPaid] = useState(false);
    const [splitting, setSplitting] = useState(false);
    const staff = tipData?.staff || [];
    const [selectedIds, setSelectedIds] = useState(() => new Set(staff.map(s => s.id)));

    const allSelected = selectedIds.size === staff.length && staff.length > 0;
    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(staff.map(s => s.id)));
    };
    const toggleStaff = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleSplit = async () => {
        setSplitting(true);
        try {
            const payload = { amount: parseFloat(amount), mode, mark_as_paid: markAsPaid };
            if (mode === 'split') payload.selected_staff_ids = [...selectedIds];
            await api.post('/financials/split-tip/', payload);
            addToast(mode === 'party' ? 'Staff party fund recorded!' : 'Tips distributed to staff!', 'success');
            onDone();
            onClose();
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to distribute tips.', 'error');
        } finally {
            setSplitting(false);
        }
    };

    const available = tipData?.available_balance || 0;
    const amtVal = parseFloat(amount) || 0;
    const selectedCount = selectedIds.size;
    const invalid = amtVal <= 0 || amtVal > available || (mode === 'split' && selectedCount === 0);
    const perHead = selectedCount > 0 && amtVal > 0 ? (amtVal / selectedCount).toFixed(2) : '0.00';

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
                        <span className="text-sm text-gray-400">Available Balance</span>
                        <span className="text-xl font-bold text-mustard-gold">{fmtEur(available)}</span>
                    </div>

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

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Amount *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
                            <input type="number" min="0.01" step="0.01" max={available} value={amount}
                                onChange={e => setAmount(e.target.value)} placeholder="0.00"
                                className={`${inputClass} pl-8`} />
                        </div>
                        {amtVal > available && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12} /> Exceeds available balance</p>}
                    </div>

                    {mode === 'split' && staff.length > 0 && (
                        <div className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                                    {amtVal > 0 && selectedCount > 0 ? `Staff — ${fmtEur(perHead)} each` : 'Select Staff to Include'}
                                </p>
                                <button type="button" onClick={toggleSelectAll}
                                    className="text-xs font-semibold text-mustard-gold hover:text-yellow-300 transition-colors">
                                    {allSelected ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                                {staff.map(s => {
                                    const checked = selectedIds.has(s.id);
                                    return (
                                        <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/[0.03] transition-colors">
                                            <div className="relative flex items-center justify-center flex-shrink-0">
                                                <input type="checkbox" checked={checked} onChange={() => toggleStaff(s.id)}
                                                    className="w-4 h-4 rounded border border-white/20 bg-black/20 appearance-none cursor-pointer checked:bg-mustard-gold checked:border-mustard-gold transition-all" />
                                                <CheckCircle size={11} className={`absolute text-[#080c10] pointer-events-none transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`} />
                                            </div>
                                            <p className={`text-sm font-medium flex-1 ${checked ? 'text-white' : 'text-gray-500'}`}>{s.name}</p>
                                            {amtVal > 0 && checked && (
                                                <span className="text-sm font-bold text-mustard-gold">{fmtEur(perHead)}</span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                            {selectedCount === 0 && (
                                <p className="text-xs text-red-400 px-4 py-2 border-t border-white/10 flex items-center gap-1">
                                    <AlertCircle size={12} /> Select at least one staff member
                                </p>
                            )}
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
    const { addToast } = useToast();
    const [tipData, setTipData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTipModal, setShowTipModal] = useState(false);
    const [activeTab, setActiveTab] = useState('collected');

    // confirmId tracks which row is in "are you sure?" state
    // shape: { id, action } where action = 'delete-event' | 'delete-expense' | 'revert-expense'
    const [confirm, setConfirm] = useState(null);
    const [actionBusy, setActionBusy] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/financials/tip-distribution/');
            setTipData(res.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDeleteEventTip = async (eventId) => {
        setActionBusy(true);
        try {
            await api.delete(`/financials/event-tip/${eventId}/clear/`);
            addToast('Tip entry removed.', 'success');
            setConfirm(null);
            fetchData();
        } catch {
            addToast('Failed to remove tip entry.', 'error');
        } finally {
            setActionBusy(false);
        }
    };

    const handleDeleteExpense = async (expId) => {
        setActionBusy(true);
        try {
            await api.delete(`/financials/tip-expense/${expId}/`);
            addToast('Distribution entry deleted.', 'success');
            setConfirm(null);
            fetchData();
        } catch {
            addToast('Failed to delete entry.', 'error');
        } finally {
            setActionBusy(false);
        }
    };

    const handleMarkAsPaid = async (expId) => {
        setActionBusy(true);
        try {
            await api.patch(`/financials/tip-expense/${expId}/`, { action: 'mark_paid' });
            addToast('Marked as paid.', 'success');
            setConfirm(null);
            fetchData();
        } catch {
            addToast('Failed to mark as paid.', 'error');
        } finally {
            setActionBusy(false);
        }
    };

    const handleRevertPaid = async (expId) => {
        setActionBusy(true);
        try {
            await api.patch(`/financials/tip-expense/${expId}/`, { action: 'revert' });
            addToast('Payment status reverted to pending.', 'success');
            setConfirm(null);
            fetchData();
        } catch {
            addToast('Failed to revert payment.', 'error');
        } finally {
            setActionBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-mustard-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const totalTips = tipData?.total_tips || 0;
    const distributedTotal = tipData?.distributed_total || 0;
    const availableBalance = tipData?.available_balance || 0;
    const tipEntries = tipData?.tip_entries || [];
    const distributionEntries = tipData?.distribution_entries || [];
    const isSuperuser = user?.is_superuser || user?.can_view_financials;

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <PartyPopper size={26} className="text-mustard-gold" />
                        Staff Tips
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Track tips collected from events and distribute to staff</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-300 transition-colors" title="Refresh">
                        <RefreshCw size={18} />
                    </button>
                    {isSuperuser && availableBalance > 0 && (
                        <button onClick={() => setShowTipModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-mustard-gold to-yellow-400 text-deep-teal font-bold text-sm hover:shadow-lg hover:shadow-mustard-gold/20 transition-all whitespace-nowrap">
                            <PartyPopper size={15} /> Distribute Tips
                        </button>
                    )}
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-mustard-gold/15 rounded-xl"><Wallet size={22} className="text-mustard-gold" /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Collected</p>
                        <p className="text-2xl font-bold text-mustard-gold mt-0.5">{fmtEur(totalTips)}</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/15 rounded-xl"><TrendingDown size={22} className="text-blue-400" /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Distributed</p>
                        <p className="text-2xl font-bold text-blue-400 mt-0.5">{fmtEur(distributedTotal)}</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className={`bg-black/25 backdrop-blur-sm border rounded-2xl p-5 flex items-center gap-4 ${availableBalance > 0 ? 'border-emerald-500/20' : 'border-white/10'}`}>
                    <div className={`p-3 rounded-xl ${availableBalance > 0 ? 'bg-emerald-500/15' : 'bg-white/5'}`}>
                        <CheckCircle size={22} className={availableBalance > 0 ? 'text-emerald-400' : 'text-gray-500'} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Available Balance</p>
                        <p className={`text-2xl font-bold mt-0.5 ${availableBalance > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>{fmtEur(availableBalance)}</p>
                    </div>
                </motion.div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex p-1 bg-white/5 rounded-xl w-fit">
                <button onClick={() => setActiveTab('collected')}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'collected' ? 'bg-mustard-gold text-deep-teal shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                    Tips Collected ({tipEntries.length})
                </button>
                <button onClick={() => setActiveTab('history')}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'history' ? 'bg-mustard-gold text-deep-teal shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                    Distribution History ({distributionEntries.length})
                </button>
            </div>

            {/* ── Tips Collected Tab ── */}
            {activeTab === 'collected' && (
                <motion.div key="collected" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                    {tipEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                            <PartyPopper size={36} className="text-gray-700 mb-3" />
                            <p className="text-gray-500 font-medium">No tips collected yet</p>
                            <p className="text-sm text-gray-600 mt-1">Tips are recorded when receiving event payments</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/10 bg-white/[0.02]">
                                <div className="col-span-1 flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <Hash size={11} /> Event ID
                                </div>
                                <div className="col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</div>
                                <div className="col-span-3 flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <Calendar size={11} /> Tip Received
                                </div>
                                <div className={`${isSuperuser ? 'col-span-2' : 'col-span-4'} text-right text-xs font-semibold text-gray-500 uppercase tracking-wider`}>Amount</div>
                                {isSuperuser && <div className="col-span-2" />}
                            </div>

                            <div className="divide-y divide-white/5">
                                {tipEntries.map((entry, idx) => {
                                    const isConfirming = confirm?.id === entry.event_id && confirm?.action === 'delete-event';
                                    return (
                                        <motion.div key={entry.event_id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                                            className="grid grid-cols-12 gap-3 px-5 py-4 hover:bg-white/[0.03] transition-colors items-center">
                                            <div className="col-span-1">
                                                <span className="text-xs font-mono font-semibold text-mustard-gold/80 bg-mustard-gold/10 px-2 py-0.5 rounded">{entry.event_uid}</span>
                                            </div>
                                            <div className="col-span-4">
                                                <p className="text-sm font-medium text-white truncate">{entry.event_name}</p>
                                            </div>
                                            <div className="col-span-3">
                                                <p className="text-sm text-gray-400">{entry.tip_date}</p>
                                            </div>
                                            <div className={`${isSuperuser ? 'col-span-2' : 'col-span-4'} text-right`}>
                                                <span className="text-sm font-bold text-mustard-gold">{fmtEur(entry.tip_amount)}</span>
                                            </div>
                                            {isSuperuser && (
                                                <div className="col-span-2 flex justify-end">
                                                    {isConfirming ? (
                                                        <ConfirmButtons
                                                            onConfirm={() => handleDeleteEventTip(entry.event_id)}
                                                            onCancel={() => setConfirm(null)}
                                                            busy={actionBusy}
                                                            label="Remove"
                                                        />
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirm({ id: entry.event_id, action: 'delete-event' })}
                                                            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                            title="Remove tip entry">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center px-5 py-3 border-t border-white/10 bg-white/[0.02]">
                                <span className="text-xs text-gray-500">{tipEntries.length} event{tipEntries.length !== 1 ? 's' : ''}</span>
                                <span className="text-sm font-bold text-mustard-gold">{fmtEur(totalTips)} total</span>
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {/* ── Distribution History Tab ── */}
            {activeTab === 'history' && (
                <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                    {distributionEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                            <Users size={36} className="text-gray-700 mb-3" />
                            <p className="text-gray-500 font-medium">No distributions yet</p>
                            <p className="text-sm text-gray-600 mt-1">Click "Distribute Tips" to split tips among staff</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/10 bg-white/[0.02]">
                                <div className="col-span-2 flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <Calendar size={11} /> Date
                                </div>
                                <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</div>
                                <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid To</div>
                                <div className="col-span-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</div>
                                <div className="col-span-1 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</div>
                                {isSuperuser && <div className="col-span-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</div>}
                            </div>

                            <div className="divide-y divide-white/5">
                                {distributionEntries.map((entry, idx) => {
                                    const isConfirmingDelete = confirm?.id === entry.id && confirm?.action === 'delete-expense';
                                    const isConfirmingRevert = confirm?.id === entry.id && confirm?.action === 'revert-expense';
                                    const isConfirmingPaid = confirm?.id === entry.id && confirm?.action === 'mark-paid';
                                    return (
                                        <motion.div key={entry.id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                                            className="grid grid-cols-12 gap-3 px-5 py-4 hover:bg-white/[0.03] transition-colors items-center">
                                            <div className="col-span-2">
                                                <p className="text-sm text-gray-400">{entry.date}</p>
                                            </div>
                                            <div className="col-span-3">
                                                <p className="text-sm font-medium text-white leading-tight">{entry.reason}</p>
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full mt-0.5 inline-block font-medium ${
                                                    entry.category === 'Tip Payout'
                                                        ? 'bg-mustard-gold/10 text-mustard-gold border border-mustard-gold/20'
                                                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                }`}>{entry.category}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-gray-300 truncate">{entry.paid_to || '—'}</p>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <span className="text-sm font-bold text-blue-400">{fmtEur(entry.amount)}</span>
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <span className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                                    entry.paid_back
                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                        : 'bg-orange-500/10 text-orange-400'
                                                }`}>
                                                    {entry.paid_back ? 'Paid' : 'Pending'}
                                                </span>
                                            </div>
                                            {isSuperuser && (
                                                <div className="col-span-2 flex items-center justify-end gap-1.5">
                                                    {isConfirmingDelete ? (
                                                        <ConfirmButtons
                                                            onConfirm={() => handleDeleteExpense(entry.id)}
                                                            onCancel={() => setConfirm(null)}
                                                            busy={actionBusy}
                                                            label="Delete"
                                                        />
                                                    ) : isConfirmingRevert ? (
                                                        <ConfirmButtons
                                                            onConfirm={() => handleRevertPaid(entry.id)}
                                                            onCancel={() => setConfirm(null)}
                                                            busy={actionBusy}
                                                            label="Revert"
                                                            danger={false}
                                                        />
                                                    ) : isConfirmingPaid ? (
                                                        <ConfirmButtons
                                                            onConfirm={() => handleMarkAsPaid(entry.id)}
                                                            onCancel={() => setConfirm(null)}
                                                            busy={actionBusy}
                                                            label="Confirm"
                                                            danger={false}
                                                        />
                                                    ) : (
                                                        <>
                                                            {!entry.paid_back && (
                                                                <button
                                                                    onClick={() => setConfirm({ id: entry.id, action: 'mark-paid' })}
                                                                    className="p-1.5 rounded-lg text-gray-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                                                    title="Mark as paid">
                                                                    <BadgeCheck size={14} />
                                                                </button>
                                                            )}
                                                            {entry.paid_back && (
                                                                <button
                                                                    onClick={() => setConfirm({ id: entry.id, action: 'revert-expense' })}
                                                                    className="p-1.5 rounded-lg text-gray-600 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                                                                    title="Revert paid status">
                                                                    <RotateCcw size={14} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setConfirm({ id: entry.id, action: 'delete-expense' })}
                                                                className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                                title="Delete entry">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center px-5 py-3 border-t border-white/10 bg-white/[0.02]">
                                <span className="text-xs text-gray-500">{distributionEntries.length} record{distributionEntries.length !== 1 ? 's' : ''}</span>
                                <span className="text-sm font-bold text-blue-400">{fmtEur(distributedTotal)} distributed</span>
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showTipModal && (
                    <TipSplitModal tipData={tipData} onClose={() => setShowTipModal(false)} onDone={fetchData} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfitSplit;
