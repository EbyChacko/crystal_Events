import { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const fmt = (n) => `€${parseFloat(n || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const StaffFinance = () => {
    const { addToast } = useToast();
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState({ expense: new Set(), income: new Set() });
    const [markingBack, setMarkingBack] = useState(false);
    const [activeTab, setActiveTab] = useState('expense'); // 'expense' | 'income'

    useEffect(() => {
        api.get('/auth/users/').then(res => setStaffList(res.data.results || res.data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (!selectedStaff) { setExpenses([]); setIncomes([]); return; }
        setLoading(true);
        setSelectedIds({ expense: new Set(), income: new Set() });
        Promise.all([
            api.get(`/expenses/?paid_by=${selectedStaff}`),
            api.get(`/incomes/?paid_by=${selectedStaff}`),
        ]).then(([expRes, incRes]) => {
            setExpenses(expRes.data.results || expRes.data);
            setIncomes(incRes.data.results || incRes.data);
        }).catch(() => addToast('Failed to load records.', 'error'))
          .finally(() => setLoading(false));
    }, [selectedStaff]);

    const staff = staffList.find(s => String(s.id) === String(selectedStaff));
    const staffName = staff ? (`${staff.first_name} ${staff.last_name}`.trim() || staff.username) : '';

    const pendingExpenses = expenses.filter(e => !e.paid_back);
    const paidExpenses = expenses.filter(e => e.paid_back);
    const pendingIncomes = incomes.filter(i => !i.paid_back);
    const paidIncomes = incomes.filter(i => i.paid_back);

    const totalPendingExpense = pendingExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalPendingIncome = pendingIncomes.reduce((s, i) => s + parseFloat(i.amount), 0);

    const toggleSelect = (type, id) => {
        setSelectedIds(prev => {
            const next = new Set(prev[type]);
            next.has(id) ? next.delete(id) : next.add(id);
            return { ...prev, [type]: next };
        });
    };

    const toggleSelectAll = (type, items) => {
        const pending = items.filter(i => !i.paid_back);
        const allSelected = pending.every(i => selectedIds[type].has(i.id));
        setSelectedIds(prev => ({
            ...prev,
            [type]: allSelected ? new Set() : new Set(pending.map(i => i.id))
        }));
    };

    const handleMarkPaidBack = async (type) => {
        const ids = [...selectedIds[type]];
        if (!ids.length) return;
        setMarkingBack(true);
        try {
            const endpoint = type === 'expense' ? '/expenses/bulk_mark_paid_back/' : '/incomes/bulk_mark_paid_back/';
            await api.post(endpoint, { ids });
            addToast(`${ids.length} record(s) marked as paid back.`, 'success');
            // Refresh
            const [expRes, incRes] = await Promise.all([
                api.get(`/expenses/?paid_by=${selectedStaff}`),
                api.get(`/incomes/?paid_by=${selectedStaff}`),
            ]);
            setExpenses(expRes.data.results || expRes.data);
            setIncomes(incRes.data.results || incRes.data);
            setSelectedIds(prev => ({ ...prev, [type]: new Set() }));
        } catch {
            addToast('Failed to update records.', 'error');
        } finally {
            setMarkingBack(false);
        }
    };

    const handleMarkSingle = async (type, id) => {
        setMarkingBack(true);
        try {
            const endpoint = type === 'expense' ? `/expenses/${id}/` : `/incomes/${id}/`;
            await api.patch(endpoint, { paid_back: true });
            addToast('Marked as paid back.', 'success');
            const [expRes, incRes] = await Promise.all([
                api.get(`/expenses/?paid_by=${selectedStaff}`),
                api.get(`/incomes/?paid_by=${selectedStaff}`),
            ]);
            setExpenses(expRes.data.results || expRes.data);
            setIncomes(incRes.data.results || incRes.data);
        } catch {
            addToast('Failed to update.', 'error');
        } finally {
            setMarkingBack(false);
        }
    };

    const renderTable = (type, items) => {
        const pending = items.filter(i => !i.paid_back);
        const paid = items.filter(i => i.paid_back);
        const sel = selectedIds[type];
        const allPendingSelected = pending.length > 0 && pending.every(i => sel.has(i.id));
        const label = type === 'expense' ? 'Expense' : 'Income';
        const color = type === 'expense' ? 'amber' : 'emerald';

        return (
            <div>
                {/* Bulk action bar */}
                {pending.length > 0 && (
                    <div className="flex items-center justify-between mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={allPendingSelected} onChange={() => toggleSelectAll(type, items)}
                                className="w-4 h-4 rounded border border-white/20 bg-black/20 appearance-none cursor-pointer checked:bg-mustard-gold checked:border-mustard-gold transition-all" />
                            <span className="text-sm text-gray-400">Select all pending</span>
                        </label>
                        {sel.size > 0 && (
                            <button onClick={() => handleMarkPaidBack(type)} disabled={markingBack}
                                className="flex items-center gap-2 text-sm font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-500/30 transition-all disabled:opacity-50">
                                <CheckCircle size={15} />
                                Mark {sel.size} as Paid Back
                            </button>
                        )}
                    </div>
                )}

                {/* Pending records */}
                {pending.length > 0 ? (
                    <div className="space-y-2 mb-6">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Pending — {fmt(pending.reduce((s, i) => s + parseFloat(i.amount), 0))}</p>
                        {pending.map(item => (
                            <div key={item.id} className={`flex items-center gap-3 bg-${color}-500/5 border border-${color}-500/20 rounded-xl px-4 py-3`}>
                                <input type="checkbox" checked={sel.has(item.id)} onChange={() => toggleSelect(type, item.id)}
                                    className="w-4 h-4 rounded border border-white/20 bg-black/20 appearance-none cursor-pointer checked:bg-mustard-gold checked:border-mustard-gold transition-all flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{item.reason}</p>
                                    <p className="text-xs text-gray-500">{fmtDate(item.date)} · {item.category}</p>
                                    {item.event_name && <p className="text-xs text-gray-500">Event: {item.event_name}</p>}
                                </div>
                                <span className={`text-sm font-bold text-${color}-400 flex-shrink-0`}>{fmt(item.amount)}</span>
                                <button onClick={() => handleMarkSingle(type, item.id)} disabled={markingBack}
                                    className="flex-shrink-0 text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-all disabled:opacity-50">
                                    Paid Back
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-gray-600 text-sm mb-4">No pending {label.toLowerCase()} records.</div>
                )}

                {/* Paid records */}
                {paid.length > 0 && (
                    <details className="group">
                        <summary className="cursor-pointer text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center gap-2 mb-2 hover:text-gray-400 transition-colors">
                            <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                            Paid Back ({paid.length}) — {fmt(paid.reduce((s, i) => s + parseFloat(i.amount), 0))}
                        </summary>
                        <div className="space-y-2 mt-2">
                            {paid.map(item => (
                                <div key={item.id} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 opacity-60">
                                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{item.reason}</p>
                                        <p className="text-xs text-gray-500">{fmtDate(item.date)} · {item.category}</p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-400 flex-shrink-0">{fmt(item.amount)}</span>
                                    <span className="text-xs text-emerald-500 flex-shrink-0">Paid back</span>
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a1a1a] via-[#0d2424] to-[#0a1a1a] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Wallet className="text-mustard-gold" size={28} />
                        Staff Finance
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Track expenses and income paid or received by each staff member.</p>
                </div>

                {/* Staff selector */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                    <label className="block text-gray-400 text-sm font-medium mb-2">Select Staff Member</label>
                    <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 appearance-none cursor-pointer">
                        <option value="" className="bg-gray-900">— Choose a staff member —</option>
                        {staffList.map(s => (
                            <option key={s.id} value={s.id} className="bg-gray-900">
                                {`${s.first_name} ${s.last_name}`.trim() || s.username}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedStaff && !loading && (
                    <>
                        {/* Summary cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                                <p className="text-xs text-amber-400/70 uppercase tracking-wider mb-1">Owe to {staffName.split(' ')[0]}</p>
                                <p className="text-xl font-bold text-amber-400">{fmt(totalPendingExpense)}</p>
                                <p className="text-xs text-gray-500 mt-1">{pendingExpenses.length} expense(s)</p>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                                <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-1">Expenses Settled</p>
                                <p className="text-xl font-bold text-emerald-400">{fmt(paidExpenses.reduce((s, e) => s + parseFloat(e.amount), 0))}</p>
                                <p className="text-xs text-gray-500 mt-1">{paidExpenses.length} record(s)</p>
                            </div>
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
                                <p className="text-xs text-indigo-400/70 uppercase tracking-wider mb-1">{staffName.split(' ')[0]} Owes Company</p>
                                <p className="text-xl font-bold text-indigo-400">{fmt(totalPendingIncome)}</p>
                                <p className="text-xs text-gray-500 mt-1">{pendingIncomes.length} income(s)</p>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                                <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-1">Income Handed Over</p>
                                <p className="text-xl font-bold text-emerald-400">{fmt(paidIncomes.reduce((s, i) => s + parseFloat(i.amount), 0))}</p>
                                <p className="text-xs text-gray-500 mt-1">{paidIncomes.length} record(s)</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <div className="flex border-b border-white/10">
                                <button onClick={() => setActiveTab('expense')}
                                    className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${activeTab === 'expense' ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}>
                                    Expenses Paid by {staffName.split(' ')[0]}
                                    {pendingExpenses.length > 0 && <span className="ml-2 bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-md">{pendingExpenses.length}</span>}
                                </button>
                                <button onClick={() => setActiveTab('income')}
                                    className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${activeTab === 'income' ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}>
                                    Income Received by {staffName.split(' ')[0]}
                                    {pendingIncomes.length > 0 && <span className="ml-2 bg-indigo-500/20 text-indigo-400 text-xs px-1.5 py-0.5 rounded-md">{pendingIncomes.length}</span>}
                                </button>
                            </div>
                            <div className="p-5">
                                {activeTab === 'expense' ? renderTable('expense', expenses) : renderTable('income', incomes)}
                            </div>
                        </div>
                    </>
                )}

                {loading && (
                    <div className="text-center py-16 text-gray-500">Loading records...</div>
                )}

                {!selectedStaff && (
                    <div className="text-center py-16">
                        <Users size={48} className="mx-auto text-gray-700 mb-4" />
                        <p className="text-gray-500">Select a staff member to view their finance records.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffFinance;
