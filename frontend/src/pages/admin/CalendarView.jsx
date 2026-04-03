import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users as UsersIcon, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const STATUS_COLORS = {
    enquiry: 'bg-blue-500',
    confirmed: 'bg-emerald-500',
    in_progress: 'bg-amber-500',
    finished: 'bg-purple-500',
    canceled: 'bg-red-500',
};

const STATUS_LABELS = {
    enquiry: 'Enquiry',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    finished: 'Finished',
    canceled: 'Canceled',
};

const STATUS_STYLES = {
    enquiry: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    finished: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    canceled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CalendarView = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);

    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [evRes] = await Promise.all([
                    api.get('/events/'),
                ]);
                setEvents(evRes.data);
            } catch (err) {
                console.error('Failed to fetch calendar data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // Shift so Monday=0 ... Sunday=6
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDate(now.getDate());
    };

    const eventsByDate = useMemo(() => {
        const map = {};
        events.forEach(ev => {
            const date = new Date(ev.event_date);
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            if (!map[key]) map[key] = [];
            map[key].push(ev);
        });
        return map;
    }, [events]);

    const getEventsForDay = (day) => {
        const key = `${year}-${month}-${day}`;
        return eventsByDate[key] || [];
    };



    const today = new Date();
    const isToday = (day) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

    const monthName = currentDate.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' });

    // Count events this month
    const monthEventCount = events.filter(ev => {
        const d = new Date(ev.event_date);
        return d.getMonth() === month && d.getFullYear() === year;
    }).length;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Calendar</h1>
                    <p className="text-gray-400 mt-1">View your events schedule at a glance</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={goToToday}
                        className="px-4 py-2 text-sm font-medium text-mustard-gold border border-mustard-gold/30 rounded-xl hover:bg-mustard-gold/10 transition-all">
                        Today
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
                    >
                        {/* Month Navigation */}
                        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                            <button onClick={prevMonth}
                                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all">
                                <ChevronLeft size={20} />
                            </button>
                            <div className="text-center">
                                <h2 className="text-lg font-bold text-white">{monthName}</h2>
                                <p className="text-xs text-gray-500">{monthEventCount} event{monthEventCount !== 1 ? 's' : ''} this month</p>
                            </div>
                            <button onClick={nextMonth}
                                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 border-b border-white/10">
                            {WEEKDAYS.map(day => (
                                <div key={day} className="py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        {loading ? (
                            <div className="p-12 text-center text-gray-500">Loading calendar...</div>
                        ) : (
                            <div className="grid grid-cols-7">
                                {/* Empty cells before first day */}
                                {Array.from({ length: startDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-white/5 bg-white/[0.01]" />
                                ))}

                                {/* Day cells */}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dayEvents = getEventsForDay(day);
                                    const isSelected = selectedDate === day;

                                    return (
                                        <div
                                            key={day}
                                            onClick={() => setSelectedDate(isSelected ? null : day)}
                                            className={`min-h-[90px] border-b border-r border-white/5 p-2 cursor-pointer transition-all hover:bg-white/5 ${isSelected ? 'bg-mustard-gold/10 border-mustard-gold/20' : ''
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-medium ${isToday(day)
                                                    ? 'w-7 h-7 rounded-full bg-mustard-gold text-deep-teal flex items-center justify-center font-bold'
                                                    : 'text-gray-300'
                                                    }`}>
                                                    {day}
                                                </span>
                                            </div>
                                            {/* Event dots */}
                                            <div className="space-y-1">
                                                {dayEvents.slice(0, 3).map(ev => (
                                                    <div key={ev.id}
                                                        className="flex items-center space-x-1.5 group/ev"
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/events/${ev.id}`); }}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLORS[ev.status] || 'bg-gray-500'}`} />
                                                        <span className="text-[10px] text-gray-400 truncate group-hover/ev:text-mustard-gold transition-colors">
                                                            {ev.event_name}
                                                        </span>
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <span className="text-[10px] text-gray-600 pl-3">+{dayEvents.length - 3} more</span>
                                                )}

                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Empty trailing cells */}
                                {Array.from({ length: (7 - (startDay + daysInMonth) % 7) % 7 }).map((_, i) => (
                                    <div key={`trail-${i}`} className="min-h-[90px] border-b border-r border-white/5 bg-white/[0.01]" />
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Legend */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 flex flex-wrap gap-4 px-2"
                    >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <div key={key} className="flex items-center space-x-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[key]}`} />
                                <span className="text-xs text-gray-500">{label}</span>
                            </div>
                        ))}

                    </motion.div>
                </div>

                {/* Sidebar — Selected Day's Events */}
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sticky top-24"
                    >
                        <div className="flex items-center space-x-2 mb-4">
                            <Calendar size={20} className="text-mustard-gold" />
                            <h3 className="text-lg font-bold text-white">
                                {selectedDate
                                    ? new Date(year, month, selectedDate).toLocaleDateString('en-IE', {
                                        weekday: 'long', day: 'numeric', month: 'long'
                                    })
                                    : 'Select a Date'
                                }
                            </h3>
                        </div>

                        {!selectedDate ? (
                            <p className="text-gray-500 text-sm">Click on a day in the calendar to see its events.</p>
                        ) : selectedEvents.length === 0 ? (
                            <p className="text-gray-500 text-sm">No events on this day.</p>
                        ) : (
                            <div className="space-y-3">
                                {selectedEvents.map(ev => (
                                    <div
                                        key={ev.id}
                                        onClick={() => navigate(`/admin/events/${ev.id}`)}
                                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.05] transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="text-sm font-semibold text-white group-hover:text-mustard-gold transition-colors">
                                                {ev.event_name}
                                            </h4>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${STATUS_STYLES[ev.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                                {STATUS_LABELS[ev.status] || ev.status}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                                                <Clock size={12} className="text-mustard-gold/60" />
                                                <span>
                                                    {new Date(ev.event_date).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                                                <MapPin size={12} className="text-mustard-gold/60" />
                                                <span className="truncate">{ev.venue}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                                                <UsersIcon size={12} className="text-mustard-gold/60" />
                                                <span>{ev.client_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            </div>
                        )}

                        {/* Upcoming Events */}
                        {!selectedDate && (
                            <div className="mt-6">
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming Events</h4>
                                {events
                                    .filter(ev => new Date(ev.event_date) >= new Date() && ev.status !== 'canceled')
                                    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
                                    .slice(0, 5)
                                    .map(ev => (
                                        <div
                                            key={ev.id}
                                            onClick={() => navigate(`/admin/events/${ev.id}`)}
                                            className="flex items-center space-x-3 py-2.5 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 -mx-2 px-2 rounded-lg transition-all group"
                                        >
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[ev.status] || 'bg-gray-500'}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-white truncate group-hover:text-mustard-gold transition-colors">
                                                    {ev.event_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(ev.event_date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}
                                                    {' · '}{ev.venue}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                }
                                {events.filter(ev => new Date(ev.event_date) >= new Date() && ev.status !== 'canceled').length === 0 && (
                                    <p className="text-gray-600 text-sm">No upcoming events.</p>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
