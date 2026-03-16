import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, Plus, X, AlertCircle, Search, CheckCircle,
    Trash2, Edit3, Upload, TrendingUp, PieChart, Receipt, Calendar, ExternalLink, Download, Filter, ChevronDown, ChevronUp, RefreshCw, Link as LinkIcon, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const EXPENSE_CATEGORIES = [
    'Decor', 'Catering', 'Venue', 'Logistics', 'Entertainment', 'Staffing', 'Marketing', 'Other'
];
const INCOME_CATEGORIES = [
    'Investment', 'Sales', 'Other'
];

const inputClass = "w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all";
const selectClass = "w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 transition-all appearance-none cursor-pointer";

const StatCard = ({ icon, label, value, sub, delay, isPositive }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all group"
    >
        <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-mustard-gold/10 flex items-center justify-center text-mustard-gold group-hover:bg-mustard-gold/20 transition-colors">
                {icon}
            </div>
            {sub && (
                <span className={`text - xs font - medium px - 2.5 py - 1 rounded - full ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : isPositive === false ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'} `}>
                    {sub}
                </span>
            )}
        </div>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <p className={`text - 2xl font - bold mt - 1 ${isPositive ? 'text-emerald-400' : isPositive === false ? 'text-red-400' : 'text-white'} `}>{value}</p>
    </motion.div>
);

const Financials = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formMode, setFormMode] = useState('none'); // 'none', 'expense', 'income'
    const [editingId, setEditingId] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statsTimeframe, setStatsTimeframe] = useState('month'); // 'month', 'year', 'all'
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Date Filters
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const { addToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [isOverviewOpen, setIsOverviewOpen] = useState(false);
    
    const formRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && formMode !== 'none') {
                setFormMode('none');
                setEditingId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [formMode]);

    const initialFormData = {
        date: '', amount: '', reason: '', category: '', payer_name: '', receipt_image: null, is_asset: false
    };
    const [formData, setFormData] = useState(initialFormData);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expensesRes, incomesRes, eventsRes] = await Promise.all([
                api.get('/expenses/'),
                api.get('/incomes/'),
                api.get('/events/')
            ]);

            const expenseData = (expensesRes.data.results || expensesRes.data).map(e => ({
                id: `exp_${e.id}`,
                originalId: e.id,
                type: 'expense',
                date: e.date,
                amount: parseFloat(e.amount),
                reason: e.reason,
                category: e.category,
                receipt_image: e.receipt_image,
                is_asset: e.is_asset || false,
                asset_current_value: e.asset_current_value ? parseFloat(e.asset_current_value) : parseFloat(e.amount),
                is_active_asset: e.is_active_asset !== false,
                isManual: true
            }));
            
            const incomeData = (incomesRes.data.results || incomesRes.data).map(i => ({
                id: `inc_manual_${i.id}`,
                originalId: i.id,
                type: 'income',
                date: i.date,
                amount: parseFloat(i.amount),
                payer_name: i.payer_name || '',
                reason: i.reason,
                category: i.category,
                receipt_image: i.receipt_image,
                isManual: true
            }));

            const eventData = [];
            (eventsRes.data.results || eventsRes.data).forEach(ev => {
                if (parseFloat(ev.received_amount || 0) > 0) {
                    if (ev.audit_log && ev.audit_log.length > 0) {
                        // Extract each individual payment
                        ev.audit_log.forEach((log, reversedIdx) => {
                            if (log.action === 'payment_received') {
                                // Note: frontend reverses index mapping when asking backend
                                const actualAmount = parseFloat(log.amount_received_now || 0);
                                if (actualAmount > 0) {
                                    eventData.push({
                                        id: `inc_${ev.id}_${reversedIdx}`,
                                        originalId: ev.id,
                                        logIdx: reversedIdx, // send to backend to fetch exact log
                                        type: 'income',
                                        date: log.timestamp || ev.updated_at || ev.created_at || ev.event_date,
                                        amount: actualAmount,
                                        reason: ev.event_name || 'Event Payment',
                                        category: ev.event_type || 'Event',
                                        receipt_image: null,
                                        isManual: false
                                    });
                                }
                            }
                        });
                    }

                    // Fallback if no payment logs but has received_amount (e.g. legacy events)
                    // We only do this if we didn't push any logs above
                    const pushedForThisEvent = eventData.filter(d => d.originalId === ev.id).length;
                    if (pushedForThisEvent === 0) {
                        eventData.push({
                            id: `inc_${ev.id}`,
                            originalId: ev.id,
                            logIdx: -1,
                            type: 'income',
                            date: ev.updated_at || ev.created_at || ev.event_date,
                            amount: parseFloat(ev.received_amount),
                            reason: ev.event_name || 'Event Payment',
                            category: ev.event_type || 'Event',
                            receipt_image: null,
                            isManual: false
                        });
                    }
                }
            });

            const combined = [...expenseData, ...incomeData, ...eventData].sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(combined);
        } catch (err) {
            console.error('Failed to fetch financial data:', err);
            addToast('Failed to load financial records.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            setFormData({ ...formData, [name]: files[0] || null });
        } else if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleEdit = (transaction) => {
        if (!transaction.isManual) return; // Only manual items can be edited here
        setFormData({
            date: transaction.date,
            amount: transaction.amount,
            reason: transaction.reason,
            payer_name: transaction.payer_name || '',
            category: transaction.category,
            receipt_image: null,
            is_asset: (transaction.is_asset && transaction.is_active_asset) || false
        });
        setEditingId(transaction.originalId);
        setFormMode(transaction.type);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const data = new FormData();
            data.append('date', formData.date);
            data.append('amount', formData.amount);
            data.append('reason', formData.reason);
            data.append('category', formData.category);
            if (formMode === 'income') {
                data.append('payer_name', formData.payer_name);
            }
            if (formMode === 'expense') {
                data.append('is_asset', formData.is_asset ? 'True' : 'False');
                data.append('is_active_asset', formData.is_asset ? 'True' : 'False');
            }
            if (formData.receipt_image) {
                data.append('receipt_image', formData.receipt_image);
            }

            const endpoint = formMode === 'expense' ? '/expenses/' : '/incomes/';
            const typeLabel = formMode === 'expense' ? 'Expense' : 'Income';

            if (editingId) {
                await api.patch(`${endpoint}${editingId}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                addToast(`${typeLabel} updated successfully!`, 'success');
            } else {
                await api.post(endpoint, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                addToast(`${typeLabel} added successfully!`, 'success');
            }
            setFormData(initialFormData);
            setEditingId(null);
            setFormMode('none');
            fetchData();
        } catch (err) {
            const d = err.response?.data;
            if (d) {
                const messages = Object.entries(d)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
                addToast(messages, 'error');
            } else {
                addToast(`Failed to save ${formMode}.`, 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (transaction) => {
        if (!transaction.isManual) return;
        const endpoint = transaction.type === 'expense' ? '/expenses/' : '/incomes/';
        const label = transaction.type === 'expense' ? 'Expense' : 'Income';
        try {
            await api.delete(`${endpoint}${transaction.originalId}/`);
            addToast(`${label} deleted.`, 'success');
            setDeleteConfirmId(null);
            fetchData();
        } catch {
            addToast(`Failed to delete ${label.toLowerCase()}.`, 'error');
        }
    };

    const handleExportCSV = () => {
        const headers = ['Date', 'Type', 'Reason', 'Category', 'Amount'];
        const rows = filteredTransactions.map(t => [
            new Date(t.date).toLocaleDateString('en-IE'),
            t.type.toUpperCase(),
            `"${t.reason.replace(/"/g, '""')}"`,
            t.category,
            t.amount
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `financial_report_${fromDate || 'start'}_to_${toDate || 'end'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filtering Logic
    const filteredTransactions = transactions.filter(t => {
        // Text Search
        const matchesSearch = !searchTerm ||
            t.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category?.toLowerCase().includes(searchTerm.toLowerCase());

        // Category / Type Filter
        let matchesCat = true;
        if (activeCategory === 'income') matchesCat = t.type === 'income';
        else if (activeCategory === 'expenses') matchesCat = t.type === 'expense';
        else if (activeCategory !== 'all') matchesCat = t.category === activeCategory;

        // Date Range Filter
        let matchesDate = true;
        const tDate = new Date(t.date).getTime();
        if (fromDate) {
            const fromTime = new Date(fromDate).getTime();
            if (tDate < fromTime) matchesDate = false;
        }
        if (toDate) {
            const toTime = new Date(toDate).getTime();
            if (tDate > toTime + 86400000) matchesDate = false; // Add 1 day to make 'toDate' inclusive
        }

        return matchesCat && matchesSearch && matchesDate;
    });

    // Aggregations based on FILTERED results
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpense;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Financial Report</h1>
                        <p className="text-gray-400 mt-1">Track comprehensive income and expenses</p>
                    </div>
                    
                    {/* Mobile 3-dot Menu Toggle */}
                    <div className="sm:hidden relative">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <MoreVertical size={24} />}
                        </button>
                        
                        {/* Mobile Dropdown */}
                        {isMobileMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1c23] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col p-2 space-y-1">
                                    <button
                                        onClick={() => { handleExportCSV(); setIsMobileMenuOpen(false); }}
                                        className="flex items-center space-x-3 text-gray-300 hover:bg-white/5 hover:text-white px-3 py-2.5 rounded-lg transition-colors w-full text-left text-sm"
                                    >
                                        <Download size={16} />
                                        <span>Export CSV</span>
                                    </button>
                                    <button
                                        onClick={() => { navigate('/admin/assets'); setIsMobileMenuOpen(false); }}
                                        className="flex items-center space-x-3 text-purple-400 hover:bg-purple-500/10 px-3 py-2.5 rounded-lg transition-colors w-full text-left text-sm"
                                    >
                                        <PieChart size={16} />
                                        <span>View Assets List</span>
                                    </button>
                                    <button
                                        onClick={() => { 
                                            if (formMode === 'income') { setFormMode('none'); } 
                                            else { setFormMode('income'); setEditingId(null); setFormData({ ...initialFormData, category: INCOME_CATEGORIES[0] }); } 
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center space-x-3 text-emerald-400 hover:bg-emerald-500/10 px-3 py-2.5 rounded-lg transition-colors w-full text-left text-sm"
                                    >
                                        <Plus size={16} />
                                        <span>Add Income</span>
                                    </button>
                                    <button
                                        onClick={() => { 
                                            if (formMode === 'expense') { setFormMode('none'); } 
                                            else { setFormMode('expense'); setEditingId(null); setFormData({ ...initialFormData, category: EXPENSE_CATEGORIES[0] }); } 
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center space-x-3 text-mustard-gold hover:bg-mustard-gold/10 px-3 py-2.5 rounded-lg transition-colors w-full text-left text-sm"
                                    >
                                        <Plus size={16} />
                                        <span>Add Expense</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Desktop Buttons */}
                <div className="hidden sm:flex flex-row items-center space-x-3 w-auto">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center justify-center space-x-2 bg-white/5 text-gray-300 border border-white/10 px-4 py-3 rounded-xl hover:bg-white/10 hover:text-white transition-all font-medium"
                    >
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/assets')}
                        className="flex items-center justify-center space-x-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-4 py-3 rounded-xl hover:bg-purple-500/20 transition-all font-bold"
                    >
                        <PieChart size={20} />
                        <span>View Assets List</span>
                    </button>
                    <button
                        onClick={() => { 
                            if (formMode === 'income') { setFormMode('none'); } 
                            else { setFormMode('income'); setEditingId(null); setFormData({ ...initialFormData, category: INCOME_CATEGORIES[0] }); } 
                        }}
                        className="flex items-center justify-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-3 rounded-xl hover:bg-emerald-500/20 transition-all font-bold"
                    >
                        {formMode === 'income' ? <X size={20} /> : <Plus size={20} />}
                        <span>Add Income</span>
                    </button>
                    <button
                        onClick={() => { 
                            if (formMode === 'expense') { setFormMode('none'); } 
                            else { setFormMode('expense'); setEditingId(null); setFormData({ ...initialFormData, category: EXPENSE_CATEGORIES[0] }); } 
                        }}
                        className="flex items-center justify-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all font-bold"
                    >
                        {formMode === 'expense' ? <X size={20} /> : <Plus size={20} />}
                        <span>Add Expense</span>
                    </button>
                </div>
            </div>

            {/* Date Filters */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center space-x-2 text-gray-400 w-full sm:w-auto">
                    <Calendar size={18} className="text-mustard-gold" />
                    <span className="font-medium text-sm">Date Range:</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex-1 flex items-center space-x-2 bg-black/20 rounded-xl px-2 sm:px-3 py-1.5 border border-white/5">
                        <span className="text-xs text-gray-500 hidden sm:inline">From</span>
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent text-white text-xs sm:text-sm focus:outline-none focus:ring-0 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert opacity-80 hover:opacity-100 transition-opacity w-full" />
                    </div>
                    <div className="flex-1 flex items-center space-x-2 bg-black/20 rounded-xl px-2 sm:px-3 py-1.5 border border-white/5">
                        <span className="text-xs text-gray-500 hidden sm:inline">To</span>
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent text-white text-xs sm:text-sm focus:outline-none focus:ring-0 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert opacity-80 hover:opacity-100 transition-opacity w-full" />
                    </div>
                </div>
                {(fromDate || toDate) && (
                    <button onClick={() => { setFromDate(''); setToDate(''); }} className="text-xs text-red-400 hover:text-red-300 sm:ml-auto focus:outline-none font-medium">Clear Range</button>
                )}
            </div>
            <AnimatePresence>
                {/* Mobile Overview Toggle */}
                <div className="md:hidden mb-4 mt-8">
                    <button
                        onClick={() => setIsOverviewOpen(!isOverviewOpen)}
                        className="w-full flex items-center justify-between bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none"
                    >
                        <span className="font-semibold">Financial Overview</span>
                        {isOverviewOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </button>
                </div>

                {/* Summary Cards */}
                <div className={`grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 md:mt-8 ${isOverviewOpen ? 'grid' : 'hidden md:grid'}`}>
                    <StatCard icon={<TrendingUp size={22} />} label="Net Balance" value={`€${netBalance.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} isPositive={netBalance >= 0} delay={0} />
                    <StatCard icon={<DollarSign size={22} />} label="Total Income" value={`€${totalIncome.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} isPositive={true} delay={0.1} />
                    <StatCard icon={<Receipt size={22} />} label="Total Expenses" value={`€${totalExpense.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} isPositive={false} delay={0.2} />
                    <StatCard icon={<PieChart size={22} />} label="Profit Margin" value={`${totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0}%`} isPositive={netBalance >= 0} delay={0.3} />
                </div>
            </AnimatePresence>

            {/* Add/Edit Form Modal */}
            <AnimatePresence>
                {formMode !== 'none' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setFormMode('none')}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-3xl bg-[#0b1015] border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    {formMode === 'expense' ? <DollarSign size={22} className="text-mustard-gold" /> : <Plus size={22} className="text-emerald-400" />}
                                    <span>{editingId ? `Edit ${formMode === 'expense' ? 'Expense' : 'Income'}` : `Add New ${formMode === 'expense' ? 'Expense' : 'Income'}`}</span>
                                </div>
                                <button type="button" onClick={() => setFormMode('none')} className="text-gray-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-gray-400 text-sm font-medium mb-2">Date *</label>
                                            <input type="date" name="date" value={formData.date} onChange={handleChange}
                                                className={inputClass} required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm font-medium mb-2">Amount (€) *</label>
                                            <input type="number" name="amount" value={formData.amount} onChange={handleChange}
                                                className={inputClass} placeholder="0.00" step="0.01" min="0" required />
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {formMode === 'income' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5"
                                            >
                                                <div>
                                                    <label className="block text-gray-400 text-sm font-medium mb-2">Received From (Payer Name)</label>
                                                    <input type="text" name="payer_name" value={formData.payer_name} onChange={handleChange}
                                                        className={inputClass} placeholder="e.g. John Doe, ABC Corp" />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-400 text-sm font-medium mb-2">Category</label>
                                                    <select name="category" value={formData.category} onChange={handleChange} className={selectClass}>
                                                        {INCOME_CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                                                    </select>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {formMode === 'expense' && (
                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                                            <div>
                                                <label className="block text-gray-400 text-sm font-medium mb-2">Category</label>
                                                <select name="category" value={formData.category} onChange={handleChange} className={selectClass}>
                                                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-center md:pt-6">
                                                <label className="flex items-center space-x-3 cursor-pointer group">
                                                    <div className="relative flex items-center justify-center">
                                                        <input type="checkbox" name="is_asset" checked={formData.is_asset} onChange={handleChange}
                                                            className="w-5 h-5 rounded border border-white/20 bg-black/20 appearance-none cursor-pointer checked:bg-mustard-gold checked:border-mustard-gold transition-all" />
                                                        <CheckCircle size={14} className={`absolute text-[#0b1015] pointer-events-none transition-opacity ${formData.is_asset ? 'opacity-100' : 'opacity-0'}`} />
                                                    </div>
                                                    <span className="text-white font-medium group-hover:text-mustard-gold transition-colors">Add to Assets List?</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Reason / Description *</label>
                                        <input type="text" name="reason" value={formData.reason} onChange={handleChange}
                                            className={inputClass} placeholder="e.g. Flowers for Smith wedding" required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Receipt Image</label>
                                        <div className="relative border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-mustard-gold/30 transition-colors cursor-pointer">
                                            <input type="file" name="receipt_image" onChange={handleChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" />
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <Upload size={20} className="mb-1" />
                                                <span className="text-xs">{formData.receipt_image ? formData.receipt_image.name : 'Click to upload'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" disabled={submitting}
                                    className={`w-full font-bold py-3.5 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${formMode === 'expense' ? 'bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal hover:shadow-mustard-gold/20' : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white hover:shadow-emerald-500/20'}`}>
                                    {submitting ? 'Saving...' : editingId ? `Update ${formMode === 'expense' ? 'Expense' : 'Income'}` : `Add ${formMode === 'expense' ? 'Expense' : 'Income'}`}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Filters & Table */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {[{ value: 'all', label: 'All' }, { value: 'income', label: 'Income' }, { value: 'expenses', label: 'Expenses' }].map(tab => (
                                <button key={tab.value}
                                    onClick={() => setActiveCategory(tab.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${activeCategory === tab.value
                                        ? 'bg-mustard-gold/20 text-mustard-gold border-mustard-gold/30'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full xl:w-64 shrink-0">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search transactions..."
                                className="bg-white/5 border border-white/10 text-white text-sm pl-9 pr-10 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 placeholder-gray-600 w-full" />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-4 sm:p-6 md:p-8 text-center text-gray-500">Loading financial records...</div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-4 sm:p-6 md:p-8 text-center text-gray-500">
                        {transactions.length === 0 ? 'No financial records found.' : 'No transactions match your filters.'}
                    </div>
                ) : (
                    <div className="w-full">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto overflow-y-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredTransactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {new Date(t.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                    {t.type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-white">{t.reason}</p>
                                                {t.type === 'income' && t.payer_name && (
                                                    <p className="text-xs text-gray-400 mt-0.5">From: {t.payer_name}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-400">
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                                                    {t.type === 'income' ? '+' : '-'}€{t.amount.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {deleteConfirmId === t.id ? (
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <span className="text-xs text-red-400">Delete?</span>
                                                        <button onClick={() => handleDelete(t)}
                                                            className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">Yes</button>
                                                        <button onClick={() => setDeleteConfirmId(null)}
                                                            className="px-2 py-1 text-xs bg-white/10 text-gray-400 rounded-lg hover:bg-white/20 transition-colors">No</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {t.receipt_image && (
                                                            <a href={t.receipt_image} target="_blank" rel="noopener noreferrer"
                                                                className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                                title="View Receipt">
                                                                <ExternalLink size={16} />
                                                            </a>
                                                        )}
                                                        {t.isManual && (
                                                            <>
                                                                <button onClick={() => handleEdit(t)}
                                                                    className="p-1.5 text-gray-400 hover:text-mustard-gold hover:bg-mustard-gold/10 rounded-lg transition-colors">
                                                                    <Edit3 size={16} />
                                                                </button>
                                                                <button onClick={() => setDeleteConfirmId(t.id)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                        {t.type === 'income' && !t.isManual && (
                                                            <>
                                                                <button onClick={() => navigate(`/admin/events/${t.originalId}`)}
                                                                    className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                                    title="View Event">
                                                                    <ExternalLink size={16} />
                                                                </button>
                                                                <button onClick={() => {
                                                                    const token = localStorage.getItem('access_token');
                                                                    const url = `http://localhost:8000/api/events/${t.originalId}/invoice/pdf/?token=${token}${t.logIdx !== undefined ? `&logIdx=${t.logIdx}` : ''}`;
                                                                    window.open(url, '_blank');
                                                                }}
                                                                    className="p-1.5 text-gray-400 hover:text-mustard-gold hover:bg-mustard-gold/10 rounded-lg transition-colors"
                                                                    title="Download Invoice">
                                                                    <Download size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View (WhatsApp Style) */}
                        <div className="md:hidden divide-y divide-white/5">
                            {filteredTransactions.map((t) => (
                                <div key={t.id} className="p-4 hover:bg-white/5 transition-colors group flex flex-col gap-2 relative">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-white truncate">{t.reason}</h3>
                                            {t.type === 'income' && t.payer_name && (
                                                <span className="text-xs text-gray-400 truncate block mt-0.5">From: {t.payer_name}</span>
                                            )}
                                            <span className="text-sm text-gray-400 truncate block text-left mt-0.5">
                                                {t.category}
                                            </span>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                                                {t.type === 'income' ? '+' : '-'}€{t.amount.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end gap-2 text-sm text-gray-400 mt-1">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span>{new Date(t.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                            <span className={`inline-block w-max px-2 py-0.5 rounded text-[10px] font-medium border ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {t.type.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {deleteConfirmId === t.id ? (
                                                <div className="flex items-center space-x-1 border border-red-500/30 p-1 rounded-lg">
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(t); }} className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">Yes</button>
                                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="px-2 py-1 text-xs bg-white/10 text-gray-400 rounded hover:bg-white/20">No</button>
                                                </div>
                                            ) : (
                                                <>
                                                    {t.receipt_image && (
                                                        <a href={t.receipt_image} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-emerald-400 bg-emerald-500/10 rounded-lg transition-colors"><ExternalLink size={14} /></a>
                                                    )}
                                                    {t.isManual && (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(t); }} className="p-2 text-gray-400 hover:text-mustard-gold bg-mustard-gold/10 rounded-lg transition-colors"><Edit3 size={14} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(t.id); }} className="p-2 text-gray-400 hover:text-red-400 bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                        </>
                                                    )}
                                                    {t.type === 'income' && !t.isManual && (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/events/${t.originalId}`); }} className="p-2 text-gray-400 hover:text-emerald-400 bg-emerald-500/10 rounded-lg transition-colors"><ExternalLink size={14} /></button>
                                                            <button onClick={(e) => {
                                                                e.stopPropagation();
                                                                const token = localStorage.getItem('access_token');
                                                                const url = `http://localhost:8000/api/events/${t.originalId}/invoice/pdf/?token=${token}${t.logIdx !== undefined ? `&logIdx=${t.logIdx}` : ''}`;
                                                                window.open(url, '_blank');
                                                            }} className="p-2 text-gray-400 hover:text-mustard-gold bg-mustard-gold/10 rounded-lg transition-colors"><Download size={14} /></button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Financials;
