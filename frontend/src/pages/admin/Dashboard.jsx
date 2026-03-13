import { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, DollarSign, FileText, Mail, TrendingUp, Users, ArrowRight, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears, isWithinInterval } from 'date-fns';
import api from '../../utils/api';

const StatCard = ({ icon, label, value, change, changeType, delay, linkTo }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
    >
        <Link to={linkTo} className="block w-full h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-mustard-gold/30 hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-mustard-gold/10 flex items-center justify-center text-mustard-gold group-hover:bg-mustard-gold/20 group-hover:scale-110 transition-all duration-300">
                    {icon}
                </div>
                {change && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${changeType === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {change}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-400 font-medium">{label}</p>
            <div className="flex items-end justify-between mt-1">
                <p className="text-2xl sm:text-3xl font-bold text-white group-hover:text-mustard-gold transition-colors">{value}</p>
                <ArrowRight size={18} className="text-gray-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
        </Link>
    </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#111] border border-white/10 shadow-xl rounded-xl p-4">
                <p className="text-white font-medium mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm mb-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-400 capitalize">{entry.name}:</span>
                        <span className="text-white font-bold ml-auto">
                            €{parseFloat(entry.value).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const getDateInterval = (range) => {
    const now = new Date();
    switch (range) {
        case 'this_week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
        case 'this_month': return { start: startOfMonth(now), end: endOfMonth(now) };
        case 'last_month': {
            const lastMnth = subMonths(now, 1);
            return { start: startOfMonth(lastMnth), end: endOfMonth(lastMnth) };
        }
        case 'this_year': return { start: startOfYear(now), end: endOfYear(now) };
        case 'last_year': {
            const lastYr = subYears(now, 1);
            return { start: startOfYear(lastYr), end: endOfYear(lastYr) };
        }
        case 'all_time':
        default:
            return { start: new Date(0), end: new Date(8640000000000000) };
    }
};

const Dashboard = () => {
    const [rawEvents, setRawEvents] = useState([]);
    const [rawExpenses, setRawExpenses] = useState([]);
    const [rawMessages, setRawMessages] = useState([]);
    const [rawQuotes, setRawQuotes] = useState([]);
    const [dateRange, setDateRange] = useState('all_time');

    const [stats, setStats] = useState({
        events: 0,
        messages: 0,
        quotes: 0,
        revenue: 0,
    });
    const [chartData, setChartData] = useState([]);
    const [chartInterval, setChartInterval] = useState('auto');

    // Fetch once
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [evRes, msgRes, qtRes, expRes] = await Promise.all([
                    api.get('/events/'),
                    api.get('/messages/'),
                    api.get('/quotes/'),
                    api.get('/expenses/')
                ]);
                setRawEvents(evRes.data);
                setRawMessages(msgRes.data);
                setRawQuotes(qtRes.data);
                setRawExpenses(expRes.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            }
        };
        fetchAll();
    }, []);

    // Filter and Aggregate when data, dateRange, or chartInterval changes
    useEffect(() => {
        const interval = getDateInterval(dateRange);

        // Filter valid items correctly within date range
        const fEvts = rawEvents.filter(ev => isWithinInterval(new Date(ev.updated_at || ev.created_at || ev.event_date), interval));
        const fExps = rawExpenses.filter(ex => isWithinInterval(new Date(ex.date), interval));
        const fMsgs = rawMessages.filter(msg => isWithinInterval(new Date(msg.created_at || new Date()), interval));
        const fQts = rawQuotes.filter(qt => isWithinInterval(new Date(qt.created_at || new Date()), interval));

        // Stats
        const totalRevenue = fEvts.reduce((sum, ev) => sum + parseFloat(ev.received_amount || 0), 0);
        setStats({
            events: fEvts.length,
            messages: fMsgs.length,
            quotes: fQts.length,
            revenue: totalRevenue,
        });

        // Chart Aggregation Helper
        const getFormatAndStamp = (d) => {
            let actualInterval = chartInterval;
            if (actualInterval === 'auto') {
                actualInterval = ['this_week', 'this_month', 'last_month'].includes(dateRange) ? 'day' : 'month';
            }

            switch (actualInterval) {
                case 'day': return { key: format(d, 'dd MMM yyyy'), ts: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() };
                case 'week': {
                    const start = startOfWeek(d, { weekStartsOn: 1 });
                    return { key: `Week of ${format(start, 'dd MMM')}`, ts: start.getTime() };
                }
                case 'year': return { key: format(d, 'yyyy'), ts: new Date(d.getFullYear(), 0, 1).getTime() };
                case 'month':
                default:
                    return { key: format(d, 'MMM yyyy'), ts: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
            }
        };

        const aggregated = {};

        fEvts.forEach(ev => {
            const amount = parseFloat(ev.received_amount || 0);
            if (amount > 0) {
                const d = new Date(ev.updated_at || ev.created_at || ev.event_date);
                const { key, ts } = getFormatAndStamp(d);
                if (!aggregated[key]) aggregated[key] = { name: key, income: 0, expense: 0, timestamp: ts };
                aggregated[key].income += amount;
            }
        });

        fExps.forEach(ex => {
            const amount = parseFloat(ex.amount || 0);
            if (amount > 0) {
                const d = new Date(ex.date);
                const { key, ts } = getFormatAndStamp(d);
                if (!aggregated[key]) aggregated[key] = { name: key, income: 0, expense: 0, timestamp: ts };
                aggregated[key].expense += amount;
            }
        });

        const sortedChartData = Object.values(aggregated).sort((a, b) => a.timestamp - b.timestamp);

        if (sortedChartData.length === 0) {
            const { key } = getFormatAndStamp(new Date());
            setChartData([{ name: key, income: 0, expense: 0 }]);
        } else {
            setChartData(sortedChartData);
        }

    }, [rawEvents, rawExpenses, rawMessages, rawQuotes, dateRange, chartInterval]);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 mt-1">Overview of your business activity and cash flow</p>
                </div>

                {/* Global Date Filter */}
                <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10 transition-colors">
                    <Filter size={18} className="text-mustard-gold" />
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-transparent border-none text-white text-sm font-medium focus:outline-none focus:ring-0 cursor-pointer appearance-none pr-4"
                    >
                        <option value="this_week" className="bg-gray-900">This Week</option>
                        <option value="this_month" className="bg-gray-900">This Month</option>
                        <option value="last_month" className="bg-gray-900">Last Month</option>
                        <option value="this_year" className="bg-gray-900">This Year</option>
                        <option value="last_year" className="bg-gray-900">Last Year</option>
                        <option value="all_time" className="bg-gray-900">All Time / Total</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard
                    linkTo="/admin/events"
                    icon={<Calendar size={22} />}
                    label="Total Events"
                    value={stats.events}
                    change="View Details"
                    changeType="up"
                    delay={0}
                />
                <StatCard
                    linkTo="/admin/messages"
                    icon={<Mail size={22} />}
                    label="Messages"
                    value={stats.messages}
                    change="Inbox"
                    changeType="up"
                    delay={0.1}
                />
                <StatCard
                    linkTo="/admin/quotes"
                    icon={<FileText size={22} />}
                    label="Quotes"
                    value={stats.quotes}
                    change="Active"
                    changeType="up"
                    delay={0.2}
                />
                <StatCard
                    linkTo="/admin/financials"
                    icon={<DollarSign size={22} />}
                    label="Income Generated"
                    value={`€${parseFloat(stats.revenue).toLocaleString('en-IE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    change="Verified"
                    changeType="up"
                    delay={0.3}
                />
            </div>

            {/* Income vs Expenses Flowchart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 mt-8"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 mb-8 border-b border-white/5 pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-mustard-gold to-yellow-500 rounded-lg text-deep-teal shadow-lg shadow-mustard-gold/20">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Cash Flow Analytics</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Tracking Income vs Expenses over time</p>
                        </div>
                    </div>
                    {/* Chart Interval Filter */}
                    <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors">
                        <select
                            value={chartInterval}
                            onChange={(e) => setChartInterval(e.target.value)}
                            className="bg-transparent border-none text-white text-xs font-medium focus:outline-none focus:ring-0 cursor-pointer appearance-none pr-3"
                        >
                            <option value="auto" className="bg-gray-900">Auto Split</option>
                            <option value="day" className="bg-gray-900">By Days</option>
                            <option value="week" className="bg-gray-900">By Week</option>
                            <option value="month" className="bg-gray-900">By Month</option>
                            <option value="year" className="bg-gray-900">By Year</option>
                        </select>
                    </div>
                </div>

                <div className="h-80 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="rgba(255,255,255,0.3)"
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.3)"
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                tickFormatter={(val) => `€${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                                axisLine={false}
                                tickLine={false}
                                dx={-10}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                            <Line
                                type="monotone"
                                dataKey="income"
                                name="Income"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="expense"
                                name="Expenses"
                                stroke="#ef4444"
                                strokeWidth={3}
                                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
