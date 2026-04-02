import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, Plus, X, AlertCircle, CheckCircle, Search,
    MapPin, Users as UsersIcon, Clock, ChevronDown, ChevronUp, Percent, PlusCircle, MinusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const EVENT_TYPES = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'concert', label: 'Concert' },
    { value: 'conference', label: 'Conference' },
    { value: 'private_party', label: 'Private Party' },
    { value: 'charity', label: 'Charity / Fundraiser' },
    { value: 'festival', label: 'Festival' },
    { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
    { value: 'enquiry', label: 'Enquiry', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { value: 'finished', label: 'Finished', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { value: 'canceled', label: 'Canceled', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

const getStatusStyle = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
};

const getStatusLabel = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
};

const getTypeLabel = (type) => {
    return EVENT_TYPES.find(t => t.value === type)?.label || type;
};

const selectClass = "w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 transition-all appearance-none cursor-pointer";
const inputClass = "w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all";
const disabledInputClass = "w-full bg-white/[0.02] border border-white/5 text-gray-500 px-4 py-3 rounded-xl cursor-not-allowed";

import EventForm from '../../components/admin/EventForm';

const Events = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showForm) {
                setShowForm(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showForm]);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events/');
            setEvents(res.data);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(ev => {
        const matchesFilter = activeFilter === 'all' || ev.status === activeFilter;
        const matchesSearch = !searchTerm ||
            ev.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ev.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ev.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ev.event_uid?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const statusCounts = {
        all: events.length,
        ...STATUS_OPTIONS.reduce((acc, s) => ({
            ...acc,
            [s.value]: events.filter(ev => ev.status === s.value).length,
        }), {}),
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Events</h1>
                    <p className="text-gray-400 mt-1">Manage all your events and bookings</p>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); }}
                    className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all font-bold"
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    <span>{showForm ? 'Cancel' : 'Create Event'}</span>
                </button>
            </div>

            {/* Create Event Form */}
            <AnimatePresence>
                {showForm && (
                    <EventForm
                        onClose={() => setShowForm(false)}
                        onSuccess={() => {
                            setShowForm(false);
                            fetchEvents();
                        }}
                    />
                )}
            </AnimatePresence>


            {/* Filters & Search */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
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
                        {/* Status Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {[{ value: 'all', label: 'All' }, ...STATUS_OPTIONS].map(tab => (
                                <button key={tab.value}
                                    onClick={() => setActiveFilter(tab.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${activeFilter === tab.value
                                        ? 'bg-mustard-gold/20 text-mustard-gold border-mustard-gold/30'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}>
                                    {tab.label} <span className="ml-1 opacity-60">({statusCounts[tab.value] || 0})</span>
                                </button>
                            ))}
                        </div>
                        {/* Search */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search events..."
                                className="bg-white/5 border border-white/10 text-white text-sm pl-9 pr-10 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 placeholder-gray-600 w-full lg:w-64" />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Events Table */}
                {loading ? (
                    <div className="p-4 sm:p-6 md:p-8 text-center text-gray-500">Loading events...</div>
                ) : filteredEvents.length === 0 ? (
                    <div className="p-4 sm:p-6 md:p-8 text-center text-gray-500">
                        {events.length === 0 ? 'No events yet. Create your first event!' : 'No events match your filters.'}
                    </div>
                ) : (
                    <div className="w-full">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredEvents.map((ev) => (
                                        <tr key={ev.id}
                                            onClick={() => navigate(`/admin/events/${ev.id}`)}
                                            className="hover:bg-white/10 transition-colors cursor-pointer group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs font-mono font-semibold text-mustard-gold/80 bg-mustard-gold/10 px-2 py-1 rounded">
                                                    {ev.event_uid || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <p className="text-sm font-medium text-white">{ev.event_name}</p>
                                                    <p className="text-xs text-gray-500">{getTypeLabel(ev.event_type)}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm text-gray-300">{ev.client_name}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-1.5 text-sm text-gray-400">
                                                    <Clock size={14} className="text-mustard-gold/60" />
                                                    <span>{new Date(ev.event_date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-1.5 text-sm text-gray-400">
                                                    <MapPin size={14} className="text-mustard-gold/60" />
                                                    <span className="truncate max-w-[160px]">{ev.venue}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusStyle(ev.status)}`}>
                                                    {getStatusLabel(ev.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {ev.assigned_to_name || <span className="text-gray-600 italic">Unassigned</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View (WhatsApp Style) */}
                        <div className="md:hidden divide-y divide-white/5">
                            {filteredEvents.map((ev) => (
                                <div key={ev.id}
                                    onClick={() => navigate(`/admin/events/${ev.id}`)}
                                    className="p-4 hover:bg-white/5 transition-colors cursor-pointer active:bg-white/10 flex flex-col gap-2 relative">

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-white truncate">{ev.event_name}</h3>
                                            {ev.event_uid && (
                                                <span className="text-xs font-mono text-mustard-gold/70">{ev.event_uid}</span>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <span className="text-xs text-gray-400">
                                                {new Date(ev.event_date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end gap-2 text-sm text-gray-400">
                                        <div className="flex items-center gap-1.5 truncate min-w-0">
                                            <MapPin size={14} className="text-mustard-gold/60 flex-shrink-0" />
                                            <span className="truncate">{ev.venue}</span>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${getStatusStyle(ev.status).split(' ')[0]}`} title={getStatusLabel(ev.status)}></span>
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

export default Events;
