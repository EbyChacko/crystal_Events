import { useState, useEffect, useMemo } from 'react';
import {
    Calendar, DollarSign, FileText, Mail, TrendingUp, TrendingDown,
    Filter, ArrowRight, CheckCircle, Clock, AlertCircle, Users,
    BarChart2, PieChart as PieIcon, Activity, Wallet, Target, Star,
    ChevronRight, MessageSquare, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    AreaChart, Area, LineChart, Line, BarChart, Bar,
    PieChart, Pie, Cell, RadialBarChart, RadialBar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    startOfYear, endOfYear, subMonths, subYears, isWithinInterval, isFuture, isPast
} from 'date-fns';
import api from '../../utils/api';

// ── Helpers ────────────────────────────────────────────────────────
const fmt = (n) => `€${parseFloat(n || 0).toLocaleString('en-IE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDec = (n) => `€${parseFloat(n || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n) => `${parseFloat(n || 0).toFixed(1)}%`;

const EVENT_STATUS_COLORS = {
    enquiry: '#3b82f6',
    confirmed: '#10b981',
    in_progress: '#f59e0b',
    finished: '#8b5cf6',
    canceled: '#ef4444',
};
const EVENT_STATUS_LABELS = {
    enquiry: 'Enquiry', confirmed: 'Confirmed', in_progress: 'In Progress',
    finished: 'Finished', canceled: 'Canceled',
};

const EXPENSE_CATEGORY_COLORS = [
    '#c5a059', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444',
    '#f59e0b', '#06b6d4', '#ec4899', '#84cc16', '#f97316',
];

const getDateInterval = (range) => {
    const now = new Date();
    switch (range) {
        case 'this_week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
        case 'this_month': return { start: startOfMonth(now), end: endOfMonth(now) };
        case 'last_month': { const lm = subMonths(now, 1); return { start: startOfMonth(lm), end: endOfMonth(lm) }; }
        case 'this_year': return { start: startOfYear(now), end: endOfYear(now) };
        case 'last_year': { const ly = subYears(now, 1); return { start: startOfYear(ly), end: endOfYear(ly) }; }
        default: return { start: new Date(0), end: new Date(8640000000000000) };
    }
};

// ── Sub-components ─────────────────────────────────────────────────

const KpiCard = ({ icon, label, value, sub, color = 'gold', trend, trendLabel, linkTo, delay = 0 }) => {
    const colorMap = {
        gold: 'from-mustard-gold/20 to-mustard-gold/5 border-mustard-gold/30 text-mustard-gold',
        emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
        red: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
        blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
        purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
        amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
    };
    const cls = colorMap[color] || colorMap.gold;
    const Wrapper = linkTo ? Link : 'div';
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
            <Wrapper to={linkTo}
                className={`block bg-gradient-to-br ${cls} border backdrop-blur-sm rounded-2xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group h-full`}>
                <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        {icon}
                    </div>
                    {trend !== undefined && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${trend >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {trendLabel}
                        </span>
                    )}
                </div>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
                {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
            </Wrapper>
        </motion.div>
    );
};

const SectionHeader = ({ icon, title, sub, action }) => (
    <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-mustard-gold/10 rounded-lg text-mustard-gold">{icon}</div>
            <div>
                <h3 className="text-base font-bold text-white">{title}</h3>
                {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
            </div>
        </div>
        {action}
    </div>
);

const CashFlowTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0d1f1f] border border-white/10 shadow-2xl rounded-xl p-4 min-w-[180px]">
            <p className="text-white text-sm font-semibold mb-3 border-b border-white/10 pb-2">{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center justify-between gap-4 text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-400">{entry.name}</span>
                    </div>
                    <span className="text-white font-bold">{fmtDec(entry.value)}</span>
                </div>
            ))}
        </div>
    );
};

const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0d1f1f] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-2xl">
            <p className="text-white font-bold">{payload[0].name}</p>
            <p className="text-gray-400 mt-0.5">{payload[0].value} events · {pct(payload[0].payload.percent * 100)}</p>
        </div>
    );
};

const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0d1f1f] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-2xl">
            <p className="text-gray-400 mb-1">{label}</p>
            <p className="text-white font-bold">{fmtDec(payload[0].value)}</p>
        </div>
    );
};

// ── Main Dashboard ─────────────────────────────────────────────────
const Dashboard = () => {
    const [rawEvents, setRawEvents] = useState([]);
    const [rawExpenses, setRawExpenses] = useState([]);
    const [rawIncomes, setRawIncomes] = useState([]);
    const [rawMessages, setRawMessages] = useState([]);
    const [rawQuotes, setRawQuotes] = useState([]);
    const [dateRange, setDateRange] = useState('this_year');
    const [chartInterval, setChartInterval] = useState('auto');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [evRes, msgRes, qtRes, expRes, incRes] = await Promise.all([
                    api.get('/events/'),
                    api.get('/messages/'),
                    api.get('/quotes/'),
                    api.get('/expenses/'),
                    api.get('/incomes/'),
                ]);
                setRawEvents(evRes.data);
                setRawMessages(msgRes.data);
                setRawQuotes(qtRes.data);
                setRawExpenses(expRes.data);
                setRawIncomes(incRes.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // ── Filtered data ────────────────────────────────────────────
    const interval = useMemo(() => getDateInterval(dateRange), [dateRange]);

    const fEvts = useMemo(() =>
        rawEvents.filter(ev => isWithinInterval(new Date(ev.event_date), interval)), [rawEvents, interval]);
    const fExps = useMemo(() =>
        rawExpenses.filter(ex => isWithinInterval(new Date(ex.date), interval)), [rawExpenses, interval]);
    const fIncs = useMemo(() =>
        rawIncomes.filter(inc => isWithinInterval(new Date(inc.date), interval)), [rawIncomes, interval]);
    const fMsgs = useMemo(() =>
        rawMessages.filter(msg => isWithinInterval(new Date(msg.created_at), interval)), [rawMessages, interval]);
    const fQts = useMemo(() =>
        rawQuotes.filter(qt => isWithinInterval(new Date(qt.created_at), interval)), [rawQuotes, interval]);

    // ── KPI Calculations ─────────────────────────────────────────
    const totalRevenue = useMemo(() => fEvts.reduce((s, ev) => s + parseFloat(ev.received_amount || 0), 0), [fEvts]);
    const extraIncome = useMemo(() => fIncs.reduce((s, inc) => s + parseFloat(inc.amount || 0), 0), [fIncs]);
    const totalIncome = totalRevenue + extraIncome;
    const totalExpenses = useMemo(() => fExps.reduce((s, ex) => s + parseFloat(ex.amount || 0), 0), [fExps]);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    const confirmedEvts = fEvts.filter(ev => ev.status === 'confirmed' || ev.status === 'in_progress');
    const upcomingEvts = rawEvents.filter(ev => isFuture(new Date(ev.event_date)) && ev.status !== 'canceled').slice(0, 5);
    const unreadMsgs = rawMessages.filter(m => m.status === 'unread');
    const acceptedQuotes = fQts.filter(q => q.status === 'accepted');
    const quoteConversion = fQts.length > 0 ? (acceptedQuotes.length / fQts.length) * 100 : 0;
    const avgEventValue = fEvts.length > 0 ? totalRevenue / fEvts.filter(ev => parseFloat(ev.received_amount || 0) > 0).length || 0 : 0;

    // ── Event status breakdown ───────────────────────────────────
    const eventStatusData = useMemo(() => {
        const counts = {};
        fEvts.forEach(ev => { counts[ev.status] = (counts[ev.status] || 0) + 1; });
        return Object.entries(counts).map(([status, count]) => ({
            name: EVENT_STATUS_LABELS[status] || status,
            value: count,
            color: EVENT_STATUS_COLORS[status] || '#888',
        }));
    }, [fEvts]);

    // ── Expense by category ──────────────────────────────────────
    const expenseCategoryData = useMemo(() => {
        const cats = {};
        fExps.forEach(ex => { cats[ex.category] = (cats[ex.category] || 0) + parseFloat(ex.amount || 0); });
        return Object.entries(cats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, amount], i) => ({ name, amount, fill: EXPENSE_CATEGORY_COLORS[i % EXPENSE_CATEGORY_COLORS.length] }));
    }, [fExps]);

    // ── Quote status breakdown ───────────────────────────────────
    const quoteStatusData = useMemo(() => {
        const map = { draft: 0, sent: 0, accepted: 0, rejected: 0 };
        fQts.forEach(q => { if (map[q.status] !== undefined) map[q.status]++; });
        return [
            { name: 'Draft', value: map.draft, fill: '#6b7280' },
            { name: 'Sent', value: map.sent, fill: '#3b82f6' },
            { name: 'Accepted', value: map.accepted, fill: '#10b981' },
            { name: 'Rejected', value: map.rejected, fill: '#ef4444' },
        ].filter(d => d.value > 0);
    }, [fQts]);

    // ── Event type revenue ───────────────────────────────────────
    const eventTypeRevenue = useMemo(() => {
        const map = {};
        fEvts.forEach(ev => {
            const label = ev.event_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            map[label] = (map[label] || 0) + parseFloat(ev.received_amount || 0);
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, revenue]) => ({ name, revenue }));
    }, [fEvts]);

    // ── Cash flow chart data ─────────────────────────────────────
    const chartData = useMemo(() => {
        const getKey = (d) => {
            let iv = chartInterval;
            if (iv === 'auto') iv = ['this_week', 'this_month', 'last_month'].includes(dateRange) ? 'day' : 'month';
            switch (iv) {
                case 'day': return { key: format(d, 'dd MMM'), ts: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() };
                case 'week': { const s = startOfWeek(d, { weekStartsOn: 1 }); return { key: `W${format(s, 'wo')} ${format(s, 'MMM')}`, ts: s.getTime() }; }
                case 'year': return { key: format(d, 'yyyy'), ts: new Date(d.getFullYear(), 0, 1).getTime() };
                default: return { key: format(d, 'MMM yy'), ts: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
            }
        };
        const agg = {};
        fEvts.forEach(ev => {
            const amt = parseFloat(ev.received_amount || 0);
            if (amt > 0) {
                const { key, ts } = getKey(new Date(ev.event_date));
                if (!agg[key]) agg[key] = { name: key, income: 0, expenses: 0, net: 0, ts };
                agg[key].income += amt;
            }
        });
        fIncs.forEach(inc => {
            const amt = parseFloat(inc.amount || 0);
            if (amt > 0) {
                const { key, ts } = getKey(new Date(inc.date));
                if (!agg[key]) agg[key] = { name: key, income: 0, expenses: 0, net: 0, ts };
                agg[key].income += amt;
            }
        });
        fExps.forEach(ex => {
            const amt = parseFloat(ex.amount || 0);
            if (amt > 0) {
                const { key, ts } = getKey(new Date(ex.date));
                if (!agg[key]) agg[key] = { name: key, income: 0, expenses: 0, net: 0, ts };
                agg[key].expenses += amt;
            }
        });
        return Object.values(agg)
            .sort((a, b) => a.ts - b.ts)
            .map(d => ({ ...d, net: parseFloat((d.income - d.expenses).toFixed(2)) }));
    }, [fEvts, fExps, fIncs, dateRange, chartInterval]);

    // ── Top events by revenue ────────────────────────────────────
    const topEvents = useMemo(() =>
        [...fEvts]
            .filter(ev => parseFloat(ev.received_amount || 0) > 0)
            .sort((a, b) => parseFloat(b.received_amount) - parseFloat(a.received_amount))
            .slice(0, 5),
        [fEvts]);

    const RANGE_LABELS = {
        this_week: 'This Week', this_month: 'This Month', last_month: 'Last Month',
        this_year: 'This Year', last_year: 'Last Year', all_time: 'All Time',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-mustard-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Business Dashboard</h1>
                    <p className="text-gray-400 mt-1 text-sm">Analytics · Cash Flow · Performance — {RANGE_LABELS[dateRange]}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10 transition-colors">
                        <Filter size={15} className="text-mustard-gold" />
                        <select value={dateRange} onChange={e => setDateRange(e.target.value)}
                            className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer appearance-none">
                            {Object.entries(RANGE_LABELS).map(([v, l]) => <option key={v} value={v} className="bg-gray-900">{l}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Row 1: Primary KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard delay={0} color={netProfit >= 0 ? 'emerald' : 'red'}
                    icon={<DollarSign size={20} className={netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} />}
                    label="Net Profit" value={fmt(Math.abs(netProfit))}
                    sub={netProfit < 0 ? 'Net loss for period' : `${pct(profitMargin)} margin`}
                    linkTo="/admin/financials"
                />
                <KpiCard delay={0.05} color="gold"
                    icon={<TrendingUp size={20} className="text-mustard-gold" />}
                    label="Total Income" value={fmt(totalIncome)}
                    sub={`Events: ${fmt(totalRevenue)} · Other: ${fmt(extraIncome)}`}
                    linkTo="/admin/financials"
                />
                <KpiCard delay={0.1} color="red"
                    icon={<TrendingDown size={20} className="text-red-400" />}
                    label="Total Expenses" value={fmt(totalExpenses)}
                    sub={`${fExps.length} transactions`}
                    linkTo="/admin/financials"
                />
                <KpiCard delay={0.15} color="purple"
                    icon={<Activity size={20} className="text-purple-400" />}
                    label="Profit Margin" value={pct(profitMargin)}
                    sub={profitMargin >= 30 ? '🟢 Healthy margin' : profitMargin >= 0 ? '🟡 Tight margin' : '🔴 Operating at loss'}
                />
            </div>

            {/* ── Row 2: Secondary KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard delay={0.2} color="blue"
                    icon={<Calendar size={20} className="text-blue-400" />}
                    label="Events" value={fEvts.length}
                    sub={`${confirmedEvts.length} active · ${upcomingEvts.length} upcoming`}
                    linkTo="/admin/events"
                />
                <KpiCard delay={0.25} color="gold"
                    icon={<Target size={20} className="text-mustard-gold" />}
                    label="Quote Conversion" value={pct(quoteConversion)}
                    sub={`${acceptedQuotes.length} accepted of ${fQts.length} quotes`}
                    linkTo="/admin/quotes"
                />
                <KpiCard delay={0.3} color={unreadMsgs.length > 0 ? 'amber' : 'emerald'}
                    icon={<MessageSquare size={20} className={unreadMsgs.length > 0 ? 'text-amber-400' : 'text-emerald-400'} />}
                    label="Unread Messages" value={unreadMsgs.length}
                    sub={unreadMsgs.length > 0 ? 'Needs attention' : 'All caught up'}
                    linkTo="/admin/messages"
                />
                <KpiCard delay={0.35} color="purple"
                    icon={<Wallet size={20} className="text-purple-400" />}
                    label="Avg Event Value" value={fmt(avgEventValue)}
                    sub={`across ${fEvts.filter(ev => parseFloat(ev.received_amount || 0) > 0).length} paid events`}
                />
            </div>

            {/* ── Row 3: Cash Flow + Event Status ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Cash Flow Area Chart */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="xl:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <SectionHeader
                            icon={<TrendingUp size={18} />}
                            title="Cash Flow"
                            sub="Income vs Expenses over time"
                        />
                        <select value={chartInterval} onChange={e => setChartInterval(e.target.value)}
                            className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer self-start sm:self-auto">
                            <option value="auto" className="bg-gray-900">Auto</option>
                            <option value="day" className="bg-gray-900">Daily</option>
                            <option value="week" className="bg-gray-900">Weekly</option>
                            <option value="month" className="bg-gray-900">Monthly</option>
                            <option value="year" className="bg-gray-900">Yearly</option>
                        </select>
                    </div>

                    {/* Summary row */}
                    <div className="flex gap-4 mb-4 flex-wrap">
                        {[
                            { label: 'Income', value: fmt(totalIncome), color: '#10b981' },
                            { label: 'Expenses', value: fmt(totalExpenses), color: '#ef4444' },
                            { label: 'Net', value: fmt(Math.abs(netProfit)), color: netProfit >= 0 ? '#10b981' : '#ef4444' },
                        ].map(s => (
                            <div key={s.label} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                <span className="text-xs text-gray-400">{s.label}:</span>
                                <span className="text-xs font-bold text-white">{s.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickLine={false} dy={8} />
                                <YAxis stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickLine={false}
                                    tickFormatter={v => `€${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} dx={-4} />
                                <Tooltip content={<CashFlowTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5}
                                    fill="url(#incomeGrad)" dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2.5}
                                    fill="url(#expenseGrad)" dot={{ fill: '#ef4444', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Event Status Donut */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                    <SectionHeader icon={<PieIcon size={18} />} title="Event Status" sub={`${fEvts.length} total events`} />
                    {eventStatusData.length > 0 ? (
                        <>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={eventStatusData} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                                            dataKey="value" paddingAngle={3}>
                                            {eventStatusData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-2">
                                {eventStatusData.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                            <span className="text-gray-400">{d.name}</span>
                                        </div>
                                        <span className="text-white font-semibold">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-44 flex items-center justify-center text-gray-500 text-sm">No events in this period</div>
                    )}
                </motion.div>
            </div>

            {/* ── Row 4: Expense Categories + Quote Status + Event Type Revenue ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Expense by Category */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                    <SectionHeader icon={<BarChart2 size={18} />} title="Expenses by Category" sub={`${fmt(totalExpenses)} total`} />
                    {expenseCategoryData.length > 0 ? (
                        <div className="space-y-2.5">
                            {expenseCategoryData.map((cat, i) => {
                                const pctVal = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-300 truncate max-w-[140px]">{cat.name}</span>
                                            <span className="text-white font-semibold ml-2 flex-shrink-0">{fmt(cat.amount)}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${pctVal}%`, backgroundColor: cat.fill }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-gray-500 text-sm">No expenses in this period</div>
                    )}
                </motion.div>

                {/* Quote Pipeline */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                    <SectionHeader icon={<FileText size={18} />} title="Quote Pipeline"
                        sub={`${pct(quoteConversion)} conversion`}
                        action={
                            <Link to="/admin/quotes" className="text-xs text-mustard-gold hover:underline flex items-center gap-1">
                                View all <ChevronRight size={13} />
                            </Link>
                        }
                    />
                    {quoteStatusData.length > 0 ? (
                        <>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={quoteStatusData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                                            dataKey="value" paddingAngle={3}>
                                            {quoteStatusData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                {quoteStatusData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                                        <span className="text-gray-400">{d.name}</span>
                                        <span className="text-white font-semibold ml-auto">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-44 text-gray-500 text-sm">No quotes in this period</div>
                    )}
                </motion.div>

                {/* Revenue by Event Type */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                    <SectionHeader icon={<Zap size={18} />} title="Revenue by Event Type" sub="Breakdown by category" />
                    {eventTypeRevenue.length > 0 ? (
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={eventTypeRevenue} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                                    <XAxis type="number" stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                        tickLine={false} tickFormatter={v => `€${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                                    <YAxis type="category" dataKey="name" stroke="transparent"
                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} tickLine={false} width={72} />
                                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={18}>
                                        {eventTypeRevenue.map((_, i) => (
                                            <Cell key={i} fill={EXPENSE_CATEGORY_COLORS[i % EXPENSE_CATEGORY_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-52 text-gray-500 text-sm">No revenue data in this period</div>
                    )}
                </motion.div>
            </div>

            {/* ── Row 5: Top Events + Upcoming Events + Recent Messages ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Top Events by Revenue */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                    <SectionHeader icon={<Star size={18} />} title="Top Events by Revenue"
                        sub="Highest earning events"
                        action={
                            <Link to="/admin/events" className="text-xs text-mustard-gold hover:underline flex items-center gap-1">
                                All events <ChevronRight size={13} />
                            </Link>
                        }
                    />
                    {topEvents.length > 0 ? (
                        <div className="space-y-3">
                            {topEvents.map((ev, i) => (
                                <Link key={ev.id} to={`/admin/events/${ev.id}`}
                                    className="flex items-center gap-3 group hover:bg-white/5 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-mustard-gold/10 flex items-center justify-center text-mustard-gold text-xs font-bold flex-shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-medium truncate group-hover:text-mustard-gold transition-colors">{ev.event_name}</p>
                                        <p className="text-xs text-gray-500">{ev.client_name} · {format(new Date(ev.event_date), 'dd MMM yyyy')}</p>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-400 flex-shrink-0">{fmt(ev.received_amount)}</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-gray-500 text-sm">No revenue recorded yet</div>
                    )}
                </motion.div>

                {/* Upcoming Events */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                    <SectionHeader icon={<Clock size={18} />} title="Upcoming Events"
                        sub="Next scheduled events"
                        action={
                            <Link to="/admin/events" className="text-xs text-mustard-gold hover:underline flex items-center gap-1">
                                View all <ChevronRight size={13} />
                            </Link>
                        }
                    />
                    {upcomingEvts.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingEvts.map(ev => {
                                const daysAway = Math.ceil((new Date(ev.event_date) - new Date()) / (1000 * 60 * 60 * 24));
                                return (
                                    <Link key={ev.id} to={`/admin/events/${ev.id}`}
                                        className="flex items-center gap-3 group hover:bg-white/5 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center flex-shrink-0">
                                            <span className="text-blue-400 font-bold text-sm leading-none">{format(new Date(ev.event_date), 'dd')}</span>
                                            <span className="text-blue-400/60 text-[9px] uppercase">{format(new Date(ev.event_date), 'MMM')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-medium truncate group-hover:text-mustard-gold transition-colors">{ev.event_name}</p>
                                            <p className="text-xs text-gray-500 truncate">{ev.venue}</p>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${daysAway <= 7 ? 'bg-red-500/15 text-red-400' : daysAway <= 30 ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                                            {daysAway}d
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-gray-500 text-sm">No upcoming events</div>
                    )}
                </motion.div>

                {/* Recent Messages */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                    <SectionHeader icon={<Mail size={18} />} title="Recent Messages"
                        sub={unreadMsgs.length > 0 ? `${unreadMsgs.length} unread` : 'All read'}
                        action={
                            <Link to="/admin/messages" className="text-xs text-mustard-gold hover:underline flex items-center gap-1">
                                Inbox <ChevronRight size={13} />
                            </Link>
                        }
                    />
                    {rawMessages.length > 0 ? (
                        <div className="space-y-3">
                            {rawMessages.slice(0, 5).map(msg => (
                                <Link key={msg.id} to="/admin/messages"
                                    className="flex items-start gap-3 group hover:bg-white/5 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${msg.status === 'unread' ? 'bg-amber-400' : msg.status === 'replied' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-sm font-medium truncate group-hover:text-mustard-gold transition-colors ${msg.status === 'unread' ? 'text-white' : 'text-gray-300'}`}>
                                                {msg.name}
                                            </p>
                                            <span className="text-[10px] text-gray-600 flex-shrink-0">{format(new Date(msg.created_at), 'dd MMM')}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{msg.message}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-gray-500 text-sm">No messages yet</div>
                    )}
                </motion.div>
            </div>

        </div>
    );
};

export default Dashboard;
