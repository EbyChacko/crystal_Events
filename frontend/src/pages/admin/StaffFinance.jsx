import { useState, useEffect } from 'react';
import { Users, CheckCircle, ChevronDown, ArrowLeft, TrendingDown, Search, X, Clock, Banknote, Receipt, CalendarCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const fmt = (n) => `€${parseFloat(n || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const staffName = (s) => s ? (`${s.first_name} ${s.last_name}`.trim() || s.username) : '';
const firstName = (s) => staffName(s).split(' ')[0];

// Detect event pay: Staffing category with an event linked
const isEventPay = (e) => e.category === 'Staffing' && e.event_name;

const StaffFinance = () => {
    const { addToast } = useToast();
    const [staffList, setStaffList] = useState([]);
    const [allExpenses, setAllExpenses] = useState([]);
    const [allIncomes, setAllIncomes] = useState([]);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [detailExpenses, setDetailExpenses] = useState([]);
    const [detailIncomes, setDetailIncomes] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedExpenseIds, setSelectedExpenseIds] = useState(new Set());
    const [markingBack, setMarkingBack] = useState(false);
    const [activeTab, setActiveTab] = useState('payments');
    const [confirmingId, setConfirmingId] = useState(null);   // item id for single-pay confirm
    const [confirmAction, setConfirmAction] = useState(null); // 'selected' | 'all' for bulk confirm

    useEffect(() => {
        setSummaryLoading(true);
        Promise.all([
            api.get('/auth/users/'),
            api.get('/expenses/'),
            api.get('/incomes/'),
        ]).then(([usersRes, expRes, incRes]) => {
            setStaffList(usersRes.data.results || usersRes.data);
            setAllExpenses(expRes.data.results || expRes.data);
            setAllIncomes(incRes.data.results || incRes.data);
        }).catch(() => {})
          .finally(() => setSummaryLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedStaff) return;
        setDetailLoading(true);
        setSelectedExpenseIds(new Set());
        setActiveTab('payments');
        Promise.all([
            api.get(`/expenses/?paid_by=${selectedStaff.id}`),
            api.get(`/incomes/?paid_by=${selectedStaff.id}`),
        ]).then(([expRes, incRes]) => {
            setDetailExpenses(expRes.data.results || expRes.data);
            setDetailIncomes(incRes.data.results || incRes.data);
        }).catch(() => addToast('Failed to load records.', 'error'))
          .finally(() => setDetailLoading(false));
    }, [selectedStaff]);

    const refreshDetail = async () => {
        const [expRes, incRes] = await Promise.all([
            api.get(`/expenses/?paid_by=${selectedStaff.id}`),
            api.get(`/incomes/?paid_by=${selectedStaff.id}`),
            api.get('/expenses/').then(r => setAllExpenses(r.data.results || r.data)),
        ]);
        setDetailExpenses(expRes.data.results || expRes.data);
        setDetailIncomes(incRes.data.results || incRes.data);
    };

    // ── Summary calculations ──
    const staffSummary = staffList.map(s => {
        const exps = allExpenses.filter(e => e.paid_by === s.id);
        const pendingEventPay = exps.filter(e => isEventPay(e) && !e.paid_back).reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const pendingReimb = exps.filter(e => !isEventPay(e) && !e.paid_back).reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const settled = exps.filter(e => e.paid_back).reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const incomes = allIncomes.filter(i => i.paid_by === s.id);
        return { staff: s, pendingEventPay, pendingReimb, settled, expCount: exps.length, incomeCount: incomes.length };
    }).filter(s => s.expCount > 0 || s.incomeCount > 0);

    // ── Detail separations ──
    const allPending = detailExpenses.filter(e => !e.paid_back);
    const allSettled = detailExpenses.filter(e => e.paid_back);
    const pendingEventPay = allPending.filter(isEventPay);
    const pendingReimb = allPending.filter(e => !isEventPay(e));

    const allPendingSelected = allPending.length > 0 && allPending.every(e => selectedExpenseIds.has(e.id));

    const toggleExpense = (id) => {
        setConfirmingId(null);
        setSelectedExpenseIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleMarkAll = async () => {
        if (!allPending.length) return;
        setMarkingBack(true);
        setConfirmAction(null);
        try {
            await api.post('/expenses/bulk_mark_paid_back/', { ids: allPending.map(e => e.id) });
            addToast(`${allPending.length} item(s) marked as paid.`, 'success');
            setSelectedExpenseIds(new Set());
            await refreshDetail();
        } catch { addToast('Failed to update.', 'error'); }
        finally { setMarkingBack(false); }
    };

    const handleBulkMark = async () => {
        const ids = [...selectedExpenseIds];
        if (!ids.length) return;
        setMarkingBack(true);
        setConfirmAction(null);
        try {
            await api.post('/expenses/bulk_mark_paid_back/', { ids });
            addToast(`${ids.length} item(s) marked as paid.`, 'success');
            setSelectedExpenseIds(new Set());
            await refreshDetail();
        } catch { addToast('Failed to update.', 'error'); }
        finally { setMarkingBack(false); }
    };

    const handleSingleMark = async (id) => {
        setMarkingBack(true);
        setConfirmingId(null);
        try {
            await api.patch(`/expenses/${id}/`, { paid_back: true });
            addToast('Marked as paid.', 'success');
            await refreshDetail();
        } catch { addToast('Failed to update.', 'error'); }
        finally { setMarkingBack(false); }
    };

    // ── Summary list view ──────────────────────────────────────
    if (!selectedStaff) {
        return (
            <div>
                <div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Staff Finance</h1>
                            <p className="text-gray-400 text-sm mt-1">Overview of amounts owed to each staff member. Click to view details.</p>
                        </div>
                        {!summaryLoading && staffSummary.length > 0 && (
                            <div className="relative w-full md:w-72">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search staff name..."
                                    className="w-full bg-white/5 border border-white/10 text-white text-sm pl-9 pr-10 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all" />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {summaryLoading ? (
                        <div className="text-center py-16 text-gray-500">Loading...</div>
                    ) : staffSummary.length === 0 ? (
                        <div className="text-center py-16">
                            <Users size={48} className="mx-auto text-gray-700 mb-4" />
                            <p className="text-gray-500">No expenses or incomes recorded by any staff member yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {staffSummary
                                .filter(({ staff: s }) => staffName(s).toLowerCase().includes(search.toLowerCase()))
                                .map(({ staff: s, pendingEventPay, pendingReimb, settled, expCount }) => {
                                    const totalPending = pendingEventPay + pendingReimb;
                                    return (
                                        <button key={s.id} onClick={() => setSelectedStaff(s)}
                                            className="w-full text-left bg-black/25 border border-white/10 hover:border-mustard-gold/30 hover:bg-white/[0.04] rounded-2xl p-5 transition-all group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-mustard-gold/20 border border-mustard-gold/30 flex items-center justify-center text-mustard-gold font-bold text-sm">
                                                        {staffName(s).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-semibold group-hover:text-mustard-gold transition-colors">{staffName(s)}</p>
                                                        <p className="text-xs text-gray-500">{expCount} expense record(s)</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {totalPending > 0 ? (
                                                        <>
                                                            <p className="text-amber-400 font-bold text-lg">{fmt(totalPending)}</p>
                                                            <p className="text-xs text-amber-500/70">pending payment</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-emerald-400 font-bold text-lg">{fmt(settled)}</p>
                                                            <p className="text-xs text-emerald-500/70">all settled</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {(pendingEventPay > 0 || pendingReimb > 0) && (
                                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                                                    {pendingEventPay > 0 && (
                                                        <span className="flex items-center gap-1 text-blue-400">
                                                            <Clock size={10} /> {fmt(pendingEventPay)} event pay
                                                        </span>
                                                    )}
                                                    {pendingEventPay > 0 && pendingReimb > 0 && <span className="text-gray-600">·</span>}
                                                    {pendingReimb > 0 && (
                                                        <span className="flex items-center gap-1 text-amber-400">
                                                            <Receipt size={10} /> {fmt(pendingReimb)} reimbursements
                                                        </span>
                                                    )}
                                                    {settled > 0 && totalPending > 0 && (
                                                        <>
                                                            <span className="text-gray-600">·</span>
                                                            <span className="text-emerald-500">{fmt(settled)} settled</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Detail view ────────────────────────────────────────────
    const sName = staffName(selectedStaff);
    const totalPendingEventPay = pendingEventPay.reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalPendingReimb = pendingReimb.reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalPending = totalPendingEventPay + totalPendingReimb;
    const totalSettled = allSettled.reduce((s, e) => s + parseFloat(e.amount), 0);

    return (
        <div>
            <div>
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setSelectedStaff(null)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-mustard-gold/20 border border-mustard-gold/30 flex items-center justify-center text-mustard-gold font-bold">
                            {sName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">{sName}</h1>
                            <p className="text-xs text-gray-500">Staff Finance Detail</p>
                        </div>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Clock size={13} className="text-blue-400" />
                            <p className="text-xs text-blue-400/70 uppercase tracking-wider">Event Pay</p>
                        </div>
                        <p className="text-xl font-bold text-blue-400">{fmt(totalPendingEventPay)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{pendingEventPay.length} pending</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Receipt size={13} className="text-amber-400" />
                            <p className="text-xs text-amber-400/70 uppercase tracking-wider">Reimbursements</p>
                        </div>
                        <p className="text-xl font-bold text-amber-400">{fmt(totalPendingReimb)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{pendingReimb.length} pending</p>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                            <TrendingDown size={13} className="text-rose-400" />
                            <p className="text-xs text-rose-400/70 uppercase tracking-wider">Total Owed</p>
                        </div>
                        <p className="text-xl font-bold text-rose-400">{fmt(totalPending)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{allPending.length} item(s)</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle size={13} className="text-emerald-400" />
                            <p className="text-xs text-emerald-400/70 uppercase tracking-wider">Settled</p>
                        </div>
                        <p className="text-xl font-bold text-emerald-400">{fmt(totalSettled)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{allSettled.length} paid</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-black/25 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="flex border-b border-white/10">
                        <button onClick={() => setActiveTab('payments')}
                            className={`flex-1 py-3.5 px-3 text-sm font-semibold transition-colors ${activeTab === 'payments' ? 'bg-white/5 text-white border-b-2 border-mustard-gold' : 'text-gray-500 hover:text-gray-300'}`}>
                            <span className="flex items-center justify-center gap-1.5">
                                <Receipt size={13} />
                                Payments
                                {allPending.length > 0 && <span className="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-md">{allPending.length}</span>}
                            </span>
                        </button>
                        <button onClick={() => setActiveTab('income')}
                            className={`flex-1 py-3.5 px-3 text-sm font-semibold transition-colors ${activeTab === 'income' ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}>
                            <span className="flex items-center justify-center gap-1.5">
                                <Banknote size={13} />
                                Income
                            </span>
                        </button>
                    </div>

                    <div className="p-5">
                        {detailLoading ? (
                            <div className="text-center py-10 text-gray-500 text-sm">Loading...</div>
                        ) : activeTab === 'payments' ? (
                            /* ── Payments Tab (Event Pay + Reimbursements combined) ── */
                            <div>
                                {allPending.length > 0 && (
                                    <div className="mb-4 pb-4 border-b border-white/10">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={allPendingSelected}
                                                    onChange={() => { setSelectedExpenseIds(allPendingSelected ? new Set() : new Set(allPending.map(e => e.id))); setConfirmAction(null); }}
                                                    className="w-4 h-4 rounded border border-white/20 bg-black/20 appearance-none cursor-pointer checked:bg-mustard-gold checked:border-mustard-gold transition-all" />
                                                <span className="text-sm text-gray-400">Select all pending ({allPending.length})</span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                {selectedExpenseIds.size > 0 && (
                                                    <button onClick={() => setConfirmAction(confirmAction === 'selected' ? null : 'selected')}
                                                        disabled={markingBack}
                                                        className={`flex items-center gap-1.5 text-xs font-semibold border px-3 py-2 rounded-xl transition-all disabled:opacity-50 ${confirmAction === 'selected' ? 'bg-emerald-500/30 border-emerald-500/50 text-emerald-300' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'}`}>
                                                        <CheckCircle size={13} />
                                                        Pay selected ({selectedExpenseIds.size})
                                                    </button>
                                                )}
                                                <button onClick={() => setConfirmAction(confirmAction === 'all' ? null : 'all')}
                                                    disabled={markingBack}
                                                    className={`flex items-center gap-1.5 text-xs font-semibold border px-3 py-2 rounded-xl transition-all disabled:opacity-50 ${confirmAction === 'all' ? 'bg-mustard-gold/30 border-mustard-gold/50 text-mustard-gold' : 'bg-mustard-gold/20 border-mustard-gold/30 text-mustard-gold hover:bg-mustard-gold/30'}`}>
                                                    <CheckCircle size={13} />
                                                    Pay all — {fmt(totalPending)}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inline confirmation strip for bulk actions */}
                                        {confirmAction && (
                                            <div className="mt-3 flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                                <p className="text-sm text-gray-300">
                                                    {confirmAction === 'all'
                                                        ? <>Mark <span className="text-white font-semibold">all {allPending.length} item(s)</span> as paid? Total: <span className="text-mustard-gold font-semibold">{fmt(totalPending)}</span></>
                                                        : <>Mark <span className="text-white font-semibold">{selectedExpenseIds.size} selected item(s)</span> as paid?</>
                                                    }
                                                </p>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button onClick={() => setConfirmAction(null)}
                                                        className="text-xs text-gray-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition-all">
                                                        Cancel
                                                    </button>
                                                    <button onClick={confirmAction === 'all' ? handleMarkAll : handleBulkMark}
                                                        disabled={markingBack}
                                                        className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-all disabled:opacity-50">
                                                        {markingBack ? 'Processing…' : 'Yes, mark as paid'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Pending items */}
                                {allPending.length > 0 ? (
                                    <div className="space-y-2 mb-6">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
                                            Pending — {fmt(totalPending)}
                                        </p>
                                        {allPending.map(item => {
                                            const eventPay = isEventPay(item);
                                            return (
                                                <div key={item.id} className={`flex items-start gap-3 rounded-xl px-4 py-3 ${eventPay ? 'bg-blue-500/5 border border-blue-500/20' : 'bg-amber-500/5 border border-amber-500/20'}`}>
                                                    <input type="checkbox" checked={selectedExpenseIds.has(item.id)} onChange={() => toggleExpense(item.id)}
                                                        className="w-4 h-4 mt-0.5 rounded border border-white/20 bg-black/20 appearance-none cursor-pointer checked:bg-mustard-gold checked:border-mustard-gold transition-all flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${eventPay ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                                {eventPay ? 'Event Pay' : 'Reimbursement'}
                                                            </span>
                                                            {item.event_name && (
                                                                <span className="text-xs text-gray-500 truncate">{item.event_name}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-medium text-white">{item.reason}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            Recorded: {fmtDate(item.date)}
                                                            {!eventPay && item.category && ` · ${item.category}`}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                        <span className={`text-sm font-bold ${eventPay ? 'text-blue-400' : 'text-amber-400'}`}>{fmt(item.amount)}</span>
                                                        {confirmingId === item.id ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <button onClick={() => setConfirmingId(null)}
                                                                    className="text-xs text-gray-400 hover:text-white bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg transition-all">
                                                                    Cancel
                                                                </button>
                                                                <button onClick={() => handleSingleMark(item.id)}
                                                                    disabled={markingBack}
                                                                    className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-all disabled:opacity-50">
                                                                    {markingBack ? '…' : 'Confirm'}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => { setConfirmingId(item.id); setConfirmAction(null); }}
                                                                disabled={markingBack}
                                                                className="text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-all disabled:opacity-50">
                                                                Mark Paid
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-600 text-sm">
                                        <CheckCircle size={32} className="mx-auto text-emerald-700 mb-3" />
                                        All payments settled for {firstName(selectedStaff)}.
                                    </div>
                                )}

                                {/* Settled / paid history */}
                                {allSettled.length > 0 && (
                                    <details className="group">
                                        <summary className="cursor-pointer text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center gap-2 mb-2 hover:text-gray-400 transition-colors list-none">
                                            <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                                            Payment History ({allSettled.length}) — {fmt(totalSettled)}
                                        </summary>
                                        <div className="space-y-2 mt-3">
                                            {[...allSettled].sort((a, b) => new Date(b.paid_back_at || 0) - new Date(a.paid_back_at || 0)).map(item => {
                                                const eventPay = isEventPay(item);
                                                return (
                                                    <div key={item.id} className="flex items-start gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3">
                                                        <CheckCircle size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded opacity-60 ${eventPay ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                                    {eventPay ? 'Event Pay' : 'Reimbursement'}
                                                                </span>
                                                                {item.event_name && (
                                                                    <span className="text-xs text-gray-600 truncate">{item.event_name}</span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-400">{item.reason}</p>
                                                            <p className="text-xs text-gray-600 mt-0.5">
                                                                Recorded: {fmtDate(item.date)}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                                            <span className="text-sm font-bold text-gray-500">{fmt(item.amount)}</span>
                                                            {item.paid_back_at && (
                                                                <span className="text-xs text-emerald-600 flex items-center gap-1">
                                                                    <CalendarCheck size={10} />
                                                                    {fmtDateTime(item.paid_back_at)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </details>
                                )}
                            </div>
                        ) : (
                            /* ── Income Tab ── */
                            <div>
                                {detailIncomes.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                                            {detailIncomes.length} income record(s) — {fmt(detailIncomes.reduce((s, i) => s + parseFloat(i.amount), 0))}
                                        </p>
                                        {detailIncomes.map(item => (
                                            <div key={item.id} className="flex items-center gap-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-4 py-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{item.reason}</p>
                                                    <p className="text-xs text-gray-500">{fmtDate(item.date)} · {item.category}</p>
                                                    {item.payer_name && <p className="text-xs text-gray-500">From: {item.payer_name}</p>}
                                                </div>
                                                <span className="text-sm font-bold text-indigo-400 flex-shrink-0">{fmt(item.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-gray-600 text-sm">No income records for {firstName(selectedStaff)}.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffFinance;
