import { useState, useEffect } from 'react';
import {
    CheckCircle, ChevronDown, TrendingDown, Clock, Banknote,
    Receipt, CalendarCheck, ExternalLink, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';
import { fmtDec, fmtDate, fmtDateTime, receiptViewUrl } from '../../utils/formatters';

const isEventPay = (e) => e.category === 'Staffing' && e.event_name;

const MyFinance = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('payments');

    useEffect(() => {
        if (!user?.id) return;
        setLoading(true);
        Promise.allSettled([
            api.get(`/expenses/?paid_by=${user.id}`),
            api.get(`/incomes/?paid_by=${user.id}`),
        ]).then(([expRes, incRes]) => {
            if (expRes.status === 'fulfilled') setExpenses(expRes.value.data.results || expRes.value.data);
            if (incRes.status === 'fulfilled') setIncomes(incRes.value.data.results || incRes.value.data);
            if (expRes.status === 'rejected' || incRes.status === 'rejected') addToast('Failed to load some records.', 'error');
        }).finally(() => setLoading(false));
    }, [user?.id]);

    const allPending = expenses.filter(e => !e.paid_back);
    const allSettled = expenses.filter(e => e.paid_back);
    const pendingEventPay = allPending.filter(isEventPay);
    const pendingReimb = allPending.filter(e => !isEventPay(e));

    const totalPendingEventPay = pendingEventPay.reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalPendingReimb = pendingReimb.reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalPending = totalPendingEventPay + totalPendingReimb;
    const totalSettled = allSettled.reduce((s, e) => s + parseFloat(e.amount), 0);

    const firstName = user?.first_name || user?.username || 'You';

    if (loading) {
        return <div className="text-center py-20 text-gray-500">Loading your finances...</div>;
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">My Finance</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Your pending payments and financial records, {firstName}.
                    </p>
                </div>
                {totalPending > 0 && (
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 text-amber-400 text-sm font-semibold">
                        <AlertCircle size={15} />
                        {fmtDec(totalPending)} pending
                    </div>
                )}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={13} className="text-blue-400" />
                        <p className="text-xs text-blue-400/70 uppercase tracking-wider">Event Pay</p>
                    </div>
                    <p className="text-xl font-bold text-blue-400">{fmtDec(totalPendingEventPay)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pendingEventPay.length} pending</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Receipt size={13} className="text-amber-400" />
                        <p className="text-xs text-amber-400/70 uppercase tracking-wider">Reimbursements</p>
                    </div>
                    <p className="text-xl font-bold text-amber-400">{fmtDec(totalPendingReimb)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pendingReimb.length} pending</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                        <TrendingDown size={13} className="text-rose-400" />
                        <p className="text-xs text-rose-400/70 uppercase tracking-wider">Total Owed</p>
                    </div>
                    <p className="text-xl font-bold text-rose-400">{fmtDec(totalPending)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{allPending.length} item(s)</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle size={13} className="text-emerald-400" />
                        <p className="text-xs text-emerald-400/70 uppercase tracking-wider">Settled</p>
                    </div>
                    <p className="text-xl font-bold text-emerald-400">{fmtDec(totalSettled)}</p>
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
                            {allPending.length > 0 && (
                                <span className="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-md">
                                    {allPending.length}
                                </span>
                            )}
                        </span>
                    </button>
                    <button onClick={() => setActiveTab('income')}
                        className={`flex-1 py-3.5 px-3 text-sm font-semibold transition-colors ${activeTab === 'income' ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}>
                        <span className="flex items-center justify-center gap-1.5">
                            <Banknote size={13} />
                            Income
                            {incomes.length > 0 && (
                                <span className="bg-indigo-500/20 text-indigo-400 text-xs px-1.5 py-0.5 rounded-md">
                                    {incomes.length}
                                </span>
                            )}
                        </span>
                    </button>
                </div>

                <div className="p-5">
                    {activeTab === 'payments' ? (
                        <div>
                            {/* Pending items */}
                            {allPending.length > 0 ? (
                                <div className="space-y-2 mb-6">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
                                        Pending — {fmtDec(totalPending)}
                                    </p>
                                    {allPending.map(item => {
                                        const eventPay = isEventPay(item);
                                        return (
                                            <div key={item.id}
                                                className={`flex items-start gap-3 rounded-xl px-4 py-3 ${eventPay ? 'bg-blue-500/5 border border-blue-500/20' : 'bg-amber-500/5 border border-amber-500/20'}`}>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${eventPay ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                            {eventPay ? 'Event Pay' : 'Reimbursement'}
                                                        </span>
                                                        {item.event_name && (
                                                            <span className="text-xs text-gray-500 truncate">
                                                                {item.event_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-white">{item.reason}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Recorded: {fmtDate(item.date)}
                                                        {!eventPay && item.category && ` · ${item.category}`}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <span className={`text-sm font-bold ${eventPay ? 'text-blue-400' : 'text-amber-400'}`}>
                                                        {fmtDec(item.amount)}
                                                    </span>
                                                    {item.receipt_url && (
                                                        <a href={receiptViewUrl(item.receipt_url)} target="_blank" rel="noopener noreferrer"
                                                            title="View Receipt"
                                                            className="text-xs flex items-center gap-1 text-gray-500 hover:text-emerald-400 transition-colors">
                                                            <ExternalLink size={12} /> Receipt
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <CheckCircle size={36} className="mx-auto text-emerald-700 mb-3" />
                                    <p className="text-gray-400 font-medium">All settled up!</p>
                                    <p className="text-gray-600 text-sm mt-1">No pending payments for you right now.</p>
                                </div>
                            )}

                            {/* Settled / paid history */}
                            {allSettled.length > 0 && (
                                <details className="group">
                                    <summary className="cursor-pointer text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center gap-2 mb-2 hover:text-gray-400 transition-colors list-none">
                                        <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                                        Payment History ({allSettled.length}) — {fmtDec(totalSettled)}
                                    </summary>
                                    <div className="space-y-2 mt-3">
                                        {[...allSettled]
                                            .sort((a, b) => new Date(b.paid_back_at || 0) - new Date(a.paid_back_at || 0))
                                            .map(item => {
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
                                                            <p className="text-xs text-gray-600 mt-0.5">Recorded: {fmtDate(item.date)}</p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                            <span className="text-sm font-bold text-gray-500">{fmtDec(item.amount)}</span>
                                                            {item.paid_back_at && (
                                                                <span className="text-xs text-emerald-600 flex items-center gap-1">
                                                                    <CalendarCheck size={10} />
                                                                    {fmtDateTime(item.paid_back_at)}
                                                                </span>
                                                            )}
                                                            {item.receipt_url && (
                                                                <a href={receiptViewUrl(item.receipt_url)} target="_blank" rel="noopener noreferrer"
                                                                    title="View Receipt"
                                                                    className="text-xs flex items-center gap-1 text-gray-600 hover:text-emerald-400 transition-colors">
                                                                    <ExternalLink size={11} /> Receipt
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </details>
                            )}

                            {expenses.length === 0 && (
                                <div className="text-center py-10 text-gray-600 text-sm">
                                    No expense records assigned to you yet.
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Income Tab */
                        <div>
                            {incomes.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                                        {incomes.length} income record(s) — {fmtDec(incomes.reduce((s, i) => s + parseFloat(i.amount), 0))}
                                    </p>
                                    {incomes.map(item => (
                                        <div key={item.id} className="flex items-center gap-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-4 py-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{item.reason}</p>
                                                <p className="text-xs text-gray-500">{fmtDate(item.date)} · {item.category}</p>
                                                {item.payer_name && (
                                                    <p className="text-xs text-gray-500">From: {item.payer_name}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                <span className="text-sm font-bold text-indigo-400">{fmtDec(item.amount)}</span>
                                                {item.receipt_url && (
                                                    <a href={receiptViewUrl(item.receipt_url)} target="_blank" rel="noopener noreferrer"
                                                        title="View Receipt"
                                                        className="text-xs flex items-center gap-1 text-gray-500 hover:text-emerald-400 transition-colors">
                                                        <ExternalLink size={11} /> Receipt
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-600 text-sm">
                                    No income records assigned to you yet.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyFinance;
