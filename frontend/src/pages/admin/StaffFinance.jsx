import { useState, useEffect } from 'react';
import { Users, CheckCircle, ChevronDown, Wallet, ArrowLeft, TrendingDown, TrendingUp, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const fmt = (n) => `€${parseFloat(n || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const staffName = (s) => s ? (`${s.first_name} ${s.last_name}`.trim() || s.username) : '';
const firstName = (s) => staffName(s).split(' ')[0];

const StaffFinance = () => {
    const { addToast } = useToast();
    const [staffList, setStaffList] = useState([]);
    const [allExpenses, setAllExpenses] = useState([]);
    const [allIncomes, setAllIncomes] = useState([]);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStaff, setSelectedStaff] = useState(null); // staff object or null
    const [detailExpenses, setDetailExpenses] = useState([]);
    const [detailIncomes, setDetailIncomes] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedExpenseIds, setSelectedExpenseIds] = useState(new Set());
    const [markingBack, setMarkingBack] = useState(false);
    const [activeTab, setActiveTab] = useState('expense');

    // Load staff list + all paid_by expenses/incomes for summary
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

    // Load detail when staff selected
    useEffect(() => {
        if (!selectedStaff) return;
        setDetailLoading(true);
        setSelectedExpenseIds(new Set());
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

    // Build summary per staff
    const staffSummary = staffList.map(s => {
        const exps = allExpenses.filter(e => e.paid_by === s.id);
        const pending = exps.filter(e => !e.paid_back).reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const settled = exps.filter(e => e.paid_back).reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const incomes = allIncomes.filter(i => i.paid_by === s.id);
        return { staff: s, pending, settled, expCount: exps.length, incomeCount: incomes.length };
    }).filter(s => s.expCount > 0 || s.incomeCount > 0);

    const pendingDetailExpenses = detailExpenses.filter(e => !e.paid_back);
    const paidDetailExpenses = detailExpenses.filter(e => e.paid_back);
    const allPendingSelected = pendingDetailExpenses.length > 0 && pendingDetailExpenses.every(e => selectedExpenseIds.has(e.id));

    const toggleExpense = (id) => {
        setSelectedExpenseIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleBulkMark = async () => {
        const ids = [...selectedExpenseIds];
        if (!ids.length) return;
        setMarkingBack(true);
        try {
            await api.post('/expenses/bulk_mark_paid_back/', { ids });
            addToast(`${ids.length} expense(s) marked as paid back.`, 'success');
            setSelectedExpenseIds(new Set());
            await refreshDetail();
        } catch { addToast('Failed to update.', 'error'); }
        finally { setMarkingBack(false); }
    };

    const handleSingleMark = async (id) => {
        setMarkingBack(true);
        try {
            await api.patch(`/expenses/${id}/`, { paid_back: true });
            addToast('Marked as paid back.', 'success');
            await refreshDetail();
        } catch { addToast('Failed to update.', 'error'); }
        finally { setMarkingBack(false); }
    };

    // ── Summary list view ──────────────────────────────────────
    if (!selectedStaff) {
        return (
            <div>
                <div>
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Wallet className="text-mustard-gold" size={28} />
                            Staff Finance
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Overview of amounts owed to each staff member. Click to view details.</p>
                    </div>

                    {!summaryLoading && staffSummary.length > 0 && (
                        <div className="relative mb-6">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search staff name..."
                                className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                            />
                        </div>
                    )}

                    {summaryLoading ? (
                        <div className="text-center py-16 text-gray-500">Loading...</div>
                    ) : staffSummary.length === 0 ? (
                        <div className="text-center py-16">
                            <Users size={48} className="mx-auto text-gray-700 mb-4" />
                            <p className="text-gray-500">No expenses or incomes recorded by any staff member yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {staffSummary.filter(({ staff: s }) => staffName(s).toLowerCase().includes(search.toLowerCase())).map(({ staff: s, pending, settled, expCount }) => (
                                <button key={s.id} onClick={() => setSelectedStaff(s)}
                                    className="w-full text-left bg-white/5 border border-white/10 hover:border-mustard-gold/30 hover:bg-white/[0.07] rounded-2xl p-5 transition-all group">
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
                                            {pending > 0 ? (
                                                <>
                                                    <p className="text-amber-400 font-bold text-lg">{fmt(pending)}</p>
                                                    <p className="text-xs text-amber-500/70">pending reimbursement</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-emerald-400 font-bold text-lg">{fmt(settled)}</p>
                                                    <p className="text-xs text-emerald-500/70">all settled</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {pending > 0 && settled > 0 && (
                                        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                                            <span className="text-amber-500">{fmt(pending)} pending</span>
                                            <span>·</span>
                                            <span className="text-emerald-500">{fmt(settled)} settled</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Detail view ────────────────────────────────────────────
    const sName = staffName(selectedStaff);
    const totalPending = pendingDetailExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalSettled = paidDetailExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);

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
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown size={14} className="text-amber-400" />
                            <p className="text-xs text-amber-400/70 uppercase tracking-wider">Owe to {firstName(selectedStaff)}</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-400">{fmt(totalPending)}</p>
                        <p className="text-xs text-gray-500 mt-1">{pendingDetailExpenses.length} pending expense(s)</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={14} className="text-emerald-400" />
                            <p className="text-xs text-emerald-400/70 uppercase tracking-wider">Settled</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">{fmt(totalSettled)}</p>
                        <p className="text-xs text-gray-500 mt-1">{paidDetailExpenses.length} paid back</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="flex border-b border-white/10">
                        <button onClick={() => setActiveTab('expense')}
                            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${activeTab === 'expense' ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}>
                            Expenses Paid by {firstName(selectedStaff)}
                            {pendingDetailExpenses.length > 0 && <span className="ml-2 bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-md">{pendingDetailExpenses.length}</span>}
                        </button>
                        <button onClick={() => setActiveTab('income')}
                            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${activeTab === 'income' ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}>
                            Income Received by {firstName(selectedStaff)}
                        </button>
                    </div>

                    <div className="p-5">
                        {detailLoading ? (
                            <div className="text-center py-10 text-gray-500 text-sm">Loading...</div>
                        ) : activeTab === 'expense' ? (
                            <div>
                                {/* Bulk action */}
                                {pendingDetailExpenses.length > 0 && (
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={allPendingSelected}
                                                onChange={() => setSelectedExpenseIds(allPendingSelected ? new Set() : new Set(pendingDetailExpenses.map(e => e.id)))}
                                                className="w-4 h-4 rounded border border-white/20 bg-black/20 appearance-none cursor-pointer checked:bg-mustard-gold checked:border-mustard-gold transition-all" />
                                            <span className="text-sm text-gray-400">Select all pending</span>
                                        </label>
                                        {selectedExpenseIds.size > 0 && (
                                            <button onClick={handleBulkMark} disabled={markingBack}
                                                className="flex items-center gap-2 text-sm font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-500/30 transition-all disabled:opacity-50">
                                                <CheckCircle size={14} />
                                                Mark {selectedExpenseIds.size} as Paid Back
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Pending */}
                                {pendingDetailExpenses.length > 0 ? (
                                    <div className="space-y-2 mb-6">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                                            Pending — {fmt(totalPending)}
                                        </p>
                                        {pendingDetailExpenses.map(item => (
                                            <div key={item.id} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                                                <input type="checkbox" checked={selectedExpenseIds.has(item.id)} onChange={() => toggleExpense(item.id)}
                                                    className="w-4 h-4 rounded border border-white/20 bg-black/20 appearance-none cursor-pointer checked:bg-mustard-gold checked:border-mustard-gold transition-all flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{item.reason}</p>
                                                    <p className="text-xs text-gray-500">{fmtDate(item.date)} · {item.category}</p>
                                                    {item.event_name && <p className="text-xs text-gray-500">Event: {item.event_name}</p>}
                                                </div>
                                                <span className="text-sm font-bold text-amber-400 flex-shrink-0">{fmt(item.amount)}</span>
                                                <button onClick={() => handleSingleMark(item.id)} disabled={markingBack}
                                                    className="flex-shrink-0 text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-all disabled:opacity-50">
                                                    Paid Back
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-600 text-sm mb-4">No pending expenses.</div>
                                )}

                                {/* Settled */}
                                {paidDetailExpenses.length > 0 && (
                                    <details className="group">
                                        <summary className="cursor-pointer text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center gap-2 mb-2 hover:text-gray-400 transition-colors list-none">
                                            <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                                            Paid Back ({paidDetailExpenses.length}) — {fmt(totalSettled)}
                                        </summary>
                                        <div className="space-y-2 mt-2">
                                            {paidDetailExpenses.map(item => (
                                                <div key={item.id} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 opacity-60">
                                                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">{item.reason}</p>
                                                        <p className="text-xs text-gray-500">{fmtDate(item.date)} · {item.category}</p>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-400 flex-shrink-0">{fmt(item.amount)}</span>
                                                    <span className="text-xs text-emerald-500 flex-shrink-0">Settled</span>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </div>
                        ) : (
                            /* Income tab — no paid back button needed */
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
