import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Plus, X, AlertCircle, CheckCircle, Search,
    Trash2, Edit3, TrendingUp, CheckCheck, Clock, Download,
    PlusCircle, MinusCircle, Percent, User as UserIcon, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api, { downloadPdf } from '../../utils/api';
import Pagination from '../../components/admin/Pagination';
import { QUOTE_STATUS_OPTIONS, getQuoteStatusStyle, getQuoteStatusLabel } from '../../utils/constants';
import { inputClass, selectClass, disabledInputClass } from '../../utils/classes';
import usePagination from '../../hooks/usePagination';
import EventForm from '../../components/admin/EventForm';

const StatCard = ({ icon, label, value, sub, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.04] transition-all group"
    >
        <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-mustard-gold/10 flex items-center justify-center text-mustard-gold group-hover:bg-mustard-gold/20 transition-colors">
                {icon}
            </div>
            {sub && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                    {sub}
                </span>
            )}
        </div>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </motion.div>
);

const Quotes = () => {
    const navigate = useNavigate();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();
    const { user } = useAuth();
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [isOverviewOpen, setIsOverviewOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showForm) {
                setShowForm(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showForm]);


    const fetchQuotes = async () => {
        try {
            const res = await api.get('/quotes/');
            setQuotes(res.data);
        } catch (err) {
            console.error('Failed to fetch quotes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    const handleEdit = (quote) => {
        if (quote.event) {
            navigate(`/admin/events/${quote.event}?action=edit-quote`);
        } else {
            addToast('Legacy quote editing is not supported in the unified view. Please create a new event-linked quote.', 'info');
        }
    };

    const handleDownloadPdf = (id) => {
        downloadPdf(`/quotes/${id}/pdf/`).catch(() => addToast('Failed to download PDF', 'error'));
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/quotes/${id}/`);
            setQuotes(prev => prev.filter(q => q.id !== id));
            setDeleteConfirmId(null);
            addToast('Quote deleted successfully.', 'success');
        } catch (err) {
            console.error('Failed to delete quote:', err);
            addToast('Failed to delete quote.', 'error');
        }
    };

    const filteredQuotes = quotes.filter(q => {
        const matchesFilter = activeFilter === 'all' || q.status === activeFilter;
        const matchesSearch = !searchTerm ||
            q.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.items?.some(i => i.service_name?.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesFilter && matchesSearch;
    });
    const { currentPage, setCurrentPage, totalPages, pagedItems: pagedQuotes } = usePagination(filteredQuotes);

    const totalQuoteValue = quotes.reduce((sum, q) => sum + parseFloat(q.total || 0), 0);
    const acceptedValue = quotes
        .filter(q => q.status === 'accepted')
        .reduce((sum, q) => sum + parseFloat(q.total || 0), 0);
    const pendingCount = quotes.filter(q => q.status === 'draft' || q.status === 'sent').length;
    const acceptedCount = quotes.filter(q => q.status === 'accepted').length;
    const conversionRate = quotes.length > 0 ? Math.round((acceptedCount / quotes.length) * 100) : 0;

    const statusCounts = {
        all: quotes.length,
        ...QUOTE_STATUS_OPTIONS.reduce((acc, s) => ({
            ...acc,
            [s.value]: quotes.filter(q => q.status === s.value).length,
        }), {}),
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Quotes</h1>
                    <p className="text-gray-400 mt-1">Create and manage multi-service client quotes</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all font-bold"
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    <span>{showForm ? 'Cancel' : 'Create Quote'}</span>
                </button>
            </div>

            {/* Mobile Overview Toggle */}
            <div className="md:hidden mb-4">
                <button
                    onClick={() => setIsOverviewOpen(!isOverviewOpen)}
                    className="w-full flex items-center justify-between bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none"
                >
                    <span className="font-semibold">Overview Statistics</span>
                    {isOverviewOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>
            </div>

            {/* Summary Cards */}
            <div className={`grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 ${isOverviewOpen ? 'grid' : 'hidden md:grid'}`}>
                <StatCard icon={<FileText size={22} />} label="Total Quotes" value={quotes.length} delay={0} />
                <StatCard icon={<CheckCheck size={22} />} label="Accepted Value" value={`€${acceptedValue.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub={`${acceptedCount} accepted`} delay={0.1} />
                <StatCard icon={<Clock size={22} />} label="Pending" value={pendingCount} delay={0.2} />
                <StatCard icon={<TrendingUp size={22} />} label="Conversion Rate" value={`${conversionRate}%`} delay={0.3} />
            </div>

            {/* Create Quote Form (Unified EventForm) */}
            <AnimatePresence>
                {showForm && (
                    <EventForm
                        onClose={() => setShowForm(false)}
                        onSuccess={() => {
                            setShowForm(false);
                            fetchQuotes();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Filters & Table */}
            <div className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                {/* Mobile Filter Toggle */}
                <div className="md:hidden border-b border-white/10">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="w-full flex items-center justify-between px-6 py-4 text-white hover:bg-white/5 transition-colors focus:outline-none"
                    >
                        <span className="font-semibold flex items-center space-x-2"><Search size={18} /> <span>Search & Filters</span></span>
                        {isFilterOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </button>
                </div>
                <div className={`px-6 py-4 border-b border-white/10 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {[{ value: 'all', label: 'All' }, ...QUOTE_STATUS_OPTIONS].map(tab => (
                                <button key={tab.value}
                                    onClick={() => setActiveFilter(tab.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${activeFilter === tab.value
                                        ? 'bg-mustard-gold/20 text-mustard-gold border-mustard-gold/30'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/[0.05] hover:text-white'}`}>
                                    {tab.label} <span className="ml-1 opacity-60">({statusCounts[tab.value] || 0})</span>
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by client or service..."
                                className="bg-white/5 border border-white/10 text-white text-sm pl-9 pr-10 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 placeholder-gray-600 w-full lg:w-64" />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} title="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-4 sm:p-6 md:p-8 text-center text-gray-500">Loading quotes...</div>
                ) : filteredQuotes.length === 0 ? (
                    <div className="p-4 sm:p-6 md:p-8 text-center text-gray-500">
                        {quotes.length === 0 ? 'No quotes yet. Create your first quote!' : 'No quotes match your filters.'}
                    </div>
                ) : (
                    <div className="w-full">
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {pagedQuotes.map((q) => (
                                        <tr key={q.id} onClick={() => q.event && navigate(`/admin/events/${q.event}`)} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <p className="text-sm font-medium text-white">{q.client_name}</p>
                                                    {q.client_email && <p className="text-xs text-gray-500">{q.client_email}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {q.event_name ? (
                                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/events/${q.event}`); }}
                                                        className="text-xs text-mustard-gold hover:text-yellow-300 transition-colors truncate max-w-[140px] block text-left">
                                                        {q.event_name}
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-sm font-semibold text-white">€{parseFloat(q.total).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {parseFloat(q.discount_percentage) > 0
                                                    ? <span className="text-xs font-medium text-amber-400">{q.discount_percentage}%</span>
                                                    : <span className="text-xs text-gray-600">—</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getQuoteStatusStyle(q.status)}`}>
                                                    {getQuoteStatusLabel(q.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {new Date(q.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {user?.is_superuser && deleteConfirmId === q.id ? (
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <span className="text-xs text-red-400">Delete?</span>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}
                                                            className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">Yes</button>
                                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                                            className="px-2 py-1 text-xs bg-white/10 text-gray-400 rounded-lg hover:bg-white/[0.08] transition-colors">No</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end space-x-1.5">
                                                        <button onClick={(e) => { e.stopPropagation(); handleDownloadPdf(q.id); }}
                                                            title="Download PDF"
                                                            className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                                                            <Download size={16} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(q); }}
                                                            title="Edit Quote"
                                                            className="p-1.5 text-gray-400 hover:text-mustard-gold hover:bg-mustard-gold/10 rounded-lg transition-colors">
                                                            <Edit3 size={16} />
                                                        </button>
                                                        {user?.is_superuser && (
                                                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(q.id); }}
                                                                title="Delete Quote"
                                                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                                <Trash2 size={16} />
                                                            </button>
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
                        <div className="lg:hidden divide-y divide-white/5">
                            {filteredQuotes.map((q) => (
                                <div key={q.id} onClick={() => q.event && navigate(`/admin/events/${q.event}`)} className="p-4 hover:bg-white/5 transition-colors group flex flex-col gap-2 relative cursor-pointer">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-white truncate">{q.client_name}</h3>
                                            {q.event_name && (
                                                <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/events/${q.event}`); }}
                                                    className="text-sm text-mustard-gold hover:text-yellow-300 transition-colors truncate block text-left">
                                                    {q.event_name}
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <span className="text-sm font-semibold text-white">€{parseFloat(q.total).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end gap-2 text-sm text-gray-400 mt-1">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span>{new Date(q.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}</span>
                                                {parseFloat(q.discount_percentage) > 0 && (
                                                    <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">-{q.discount_percentage}%</span>
                                                )}
                                            </div>
                                            <span className={`inline-block w-max px-2 py-0.5 rounded-md text-[10px] font-medium border ${getQuoteStatusStyle(q.status)}`}>
                                                {getQuoteStatusLabel(q.status)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {user?.is_superuser && deleteConfirmId === q.id ? (
                                                <div className="flex items-center space-x-1 border border-red-500/30 p-1 rounded-lg">
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }} className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">Yes</button>
                                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="px-2 py-1 text-xs bg-white/10 text-gray-400 rounded hover:bg-white/[0.08]">No</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDownloadPdf(q.id); }} title="Download PDF" className="p-2 text-gray-400 hover:text-emerald-400 bg-emerald-500/10 rounded-lg transition-colors"><Download size={14} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(q); }} title="Edit Quote" className="p-2 text-gray-400 hover:text-mustard-gold bg-mustard-gold/10 rounded-lg transition-colors"><Edit3 size={14} /></button>
                                                    {user?.is_superuser && (
                                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(q.id); }} title="Delete Quote" className="p-2 text-gray-400 hover:text-red-400 bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
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
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};

export default Quotes;
