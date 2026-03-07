import { useState, useEffect } from 'react';
import {
    Calendar, X, Plus, MinusCircle, Percent
} from 'lucide-react';
import { motion } from 'framer-motion';
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

const selectClass = "w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 transition-all appearance-none cursor-pointer";
const inputClass = "w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all";
const disabledInputClass = "w-full bg-white/[0.02] border border-white/5 text-gray-500 px-4 py-3 rounded-xl cursor-not-allowed";

const EventForm = ({ onClose, onSuccess }) => {
    const [staffList, setStaffList] = useState([]);
    const [services, setServices] = useState([]);
    const [travelRates, setTravelRates] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const { addToast } = useToast();

    const emptyItem = { service: '', minimum_amount: '', quoted_amount: '', comment: '' };
    const initialFormData = {
        event_name: '', event_type: 'other', description: '',
        client_name: '', client_email: '', client_phone: '', client_address: '',
        event_date: '', end_date: '', venue: '', venue_address: '', distance_from_ballinasloe: '',
        guest_count: '', budget: '', status: 'enquiry', assigned_to: '',
        discount_percentage: '0', notes: '', event_notes: '',
        items: [{ ...emptyItem }],
    };
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [staffRes, servicesRes, travelRatesRes] = await Promise.all([
                    api.get('/events/staff_list/'),
                    api.get('/services/'),
                    api.get('/travel_rates/')
                ]);
                setStaffList(staffRes.data);
                setServices(servicesRes.data);
                setTravelRates(travelRatesRes.data);
            } catch (err) {
                console.error('Failed to fetch form data:', err);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...formData.items];
        updated[index] = { ...updated[index], [field]: value };

        if (field === 'service' && value) {
            const svc = services.find(s => s.id === parseInt(value));
            if (svc) {
                updated[index].minimum_amount = svc.base_price;
                if (!updated[index].quoted_amount) {
                    updated[index].quoted_amount = svc.base_price;
                }
            }
        }
        setFormData({ ...formData, items: updated });
    };

    const addItem = () => {
        setFormData({ ...formData, items: [...formData.items, { ...emptyItem }] });
    };

    const removeItem = (index) => {
        if (formData.items.length <= 1) return;
        const updated = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: updated });
    };

    const getTravelCost = (distance) => {
        if (!distance || isNaN(distance)) return 0;
        const numDist = Number(distance);
        const sortedRates = [...travelRates].sort((a, b) => Number(a.distance_from) - Number(b.distance_from));

        for (const rate of sortedRates) {
            if (numDist >= Number(rate.distance_from) && numDist <= Number(rate.distance_to)) {
                return Number(rate.rate);
            }
        }
        return sortedRates.length > 0 && numDist > Number(sortedRates[sortedRates.length - 1].distance_to) ? Number(sortedRates[sortedRates.length - 1].rate) : 0;
    };

    const liveTravelCost = getTravelCost(formData.distance_from_ballinasloe);
    const liveSubtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.quoted_amount) || 0), 0) + liveTravelCost;
    const liveDiscountPct = parseFloat(formData.discount_percentage) || 0;
    const liveDiscountAmt = (liveSubtotal * liveDiscountPct / 100);
    const liveTotal = liveSubtotal - liveDiscountAmt;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validItems = formData.items.filter(item => item.service && item.quoted_amount);
        if (validItems.length === 0) {
            addToast('Please add at least one service with an amount for the quote.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const eventPayload = {
                event_name: formData.event_name,
                event_type: formData.event_type,
                description: formData.description,
                client_name: formData.client_name,
                client_email: formData.client_email,
                client_phone: formData.client_phone,
                client_address: formData.client_address,
                event_date: formData.event_date,
                venue: formData.venue,
                venue_address: formData.venue_address,
                distance_from_ballinasloe: formData.distance_from_ballinasloe ? parseFloat(formData.distance_from_ballinasloe) : null,
                status: formData.status,
                budget: formData.budget ? parseFloat(formData.budget) : null,
                notes: formData.event_notes,
            };

            if (formData.assigned_to) eventPayload.assigned_to = formData.assigned_to;
            if (formData.guest_count) eventPayload.guest_count = parseInt(formData.guest_count);
            if (formData.end_date) eventPayload.end_date = formData.end_date;

            const evRes = await api.post('/events/', eventPayload);
            const newEventId = evRes.data.id;

            const quotePayload = {
                event: newEventId,
                client_name: formData.client_name,
                client_email: formData.client_email,
                client_phone: formData.client_phone,
                client_address: formData.client_address,
                travel_cost: liveTravelCost,
                discount_percentage: parseFloat(formData.discount_percentage) || 0,
                status: formData.status === 'enquiry' ? 'draft' : 'sent',
                notes: formData.notes,
                items: validItems.map(item => ({
                    service: parseInt(item.service),
                    minimum_amount: parseFloat(item.minimum_amount),
                    quoted_amount: parseFloat(item.quoted_amount),
                    comment: item.comment,
                })),
            };

            await api.post('/quotes/', quotePayload);
            addToast(`Event "${formData.event_name}" and linked quote created successfully!`, 'success');
            onSuccess();
        } catch (err) {
            const d = err.response?.data;
            if (d) {
                const messages = Object.entries(d)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
                addToast(messages, 'error');
            } else {
                addToast('Failed to create event.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-5xl bg-[#0b1015] border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Calendar size={22} className="text-mustard-gold" />
                        <span>Create New Event</span>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </h2>
                <form onSubmit={handleSubmit}>
                    {/* Event Info */}
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Event Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                        <div className="lg:col-span-2">
                            <label className="block text-gray-400 text-sm font-medium mb-2">Event Name *</label>
                            <input type="text" name="event_name" value={formData.event_name} onChange={handleChange}
                                className={inputClass} placeholder="e.g. Smith-Johnson Wedding Reception" required />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Event Type</label>
                            <select name="event_type" value={formData.event_type} onChange={handleChange} className={selectClass}>
                                {EVENT_TYPES.map(t => <option key={t.value} value={t.value} className="bg-gray-900">{t.label}</option>)}
                            </select>
                        </div>
                        <div className="lg:col-span-3">
                            <label className="block text-gray-400 text-sm font-medium mb-2">Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="2"
                                className={inputClass} placeholder="Event details, notes..." />
                        </div>
                    </div>

                    {/* Client Info */}
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Client Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Client Name *</label>
                            <input type="text" name="client_name" value={formData.client_name} onChange={handleChange}
                                className={inputClass} placeholder="John Smith" required />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Client Email</label>
                            <input type="email" name="client_email" value={formData.client_email} onChange={handleChange}
                                className={inputClass} placeholder="john@example.com" />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Client Phone</label>
                            <input type="text" name="client_phone" value={formData.client_phone} onChange={handleChange}
                                className={inputClass} placeholder="+353 ..." />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-gray-400 text-sm font-medium mb-2">Client Address</label>
                            <input type="text" name="client_address" value={formData.client_address} onChange={handleChange}
                                className={inputClass} placeholder="123 Example St, City, Country" />
                        </div>
                    </div>

                    {/* Venue & Schedule */}
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Venue & Schedule</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Event Date & Time *</label>
                            <input type="datetime-local" name="event_date" value={formData.event_date} onChange={handleChange}
                                className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">End Date & Time</label>
                            <input type="datetime-local" name="end_date" value={formData.end_date} onChange={handleChange}
                                className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Venue *</label>
                            <input type="text" name="venue" value={formData.venue} onChange={handleChange}
                                className={inputClass} placeholder="Grand Ballroom" required />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Distance (km)</label>
                            <input type="number" name="distance_from_ballinasloe" value={formData.distance_from_ballinasloe} onChange={handleChange}
                                className={inputClass} placeholder="from Ballinasloe" min="0" step="0.1" />
                        </div>
                        <div className="lg:col-span-4">
                            <label className="block text-gray-400 text-sm font-medium mb-2">Venue Address</label>
                            <input type="text" name="venue_address" value={formData.venue_address} onChange={handleChange}
                                className={inputClass} placeholder="Full venue address..." />
                        </div>
                    </div>

                    {/* Logistics */}
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Logistics & Assignment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Guest Count</label>
                            <input type="number" name="guest_count" value={formData.guest_count} onChange={handleChange}
                                className={inputClass} placeholder="150" min="0" />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Customer Budget (€)</label>
                            <input type="number" name="budget" value={formData.budget} onChange={handleChange}
                                className={inputClass} placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className={selectClass}>
                                {STATUS_OPTIONS.filter(s => s.value !== 'finished').map(s => <option key={s.value} value={s.value} className="bg-gray-900">{s.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Assign To</label>
                            <select name="assigned_to" value={formData.assigned_to} onChange={handleChange} className={selectClass}>
                                <option value="" className="bg-gray-900">Unassigned</option>
                                {staffList.map(s => (
                                    <option key={s.id} value={s.id} className="bg-gray-900">
                                        {s.first_name} {s.last_name} ({s.username})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Event Notes */}
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-t border-white/10 pt-6 mt-6">Event Notes</h3>
                    <div className="mb-6">
                        <label className="block text-gray-400 text-sm font-medium mb-2">Internal General Notes</label>
                        <textarea name="event_notes" value={formData.event_notes} onChange={handleChange} rows="3"
                            className={inputClass} placeholder="Any specific requirements, thoughts, or internal notes purely for staff visibility..." />
                    </div>

                    {/* Quote & Services */}
                    <div className="border-t border-white/10 pt-6 mt-6 mb-4">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quote & Services</h3>

                        <div className="space-y-3 mb-6">
                            {formData.items.map((item, index) => (
                                <div key={index} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                        <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-5">
                                                <label className="block text-gray-400 text-xs font-medium mb-1.5">Service *</label>
                                                <select value={item.service}
                                                    onChange={(e) => handleItemChange(index, 'service', e.target.value)}
                                                    className={selectClass} required>
                                                    <option value="" className="bg-gray-900">Select a service</option>
                                                    {services.map(s => (
                                                        <option key={s.id} value={s.id} className="bg-gray-900">{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {(() => {
                                                const selectedService = services.find(s => s.id === parseInt(item.service)) || null;
                                                const isSpecialRequirement = selectedService && selectedService.name === 'Special Requirement';
                                                return isSpecialRequirement ? (
                                                    <>
                                                        <div className="md:col-span-12 mt-2">
                                                            <label className="block text-gray-400 text-xs font-medium mb-1.5">Description (Optional)</label>
                                                            <textarea value={item.comment}
                                                                onChange={(e) => handleItemChange(index, 'comment', e.target.value)}
                                                                className={inputClass} placeholder="Details for this special requirement..." rows="2" />
                                                        </div>
                                                        <div className="md:col-span-4 mt-2">
                                                            <label className="block text-gray-400 text-xs font-medium mb-1.5">Amount (€) *</label>
                                                            <input type="number" value={item.quoted_amount}
                                                                onChange={(e) => handleItemChange(index, 'quoted_amount', e.target.value)}
                                                                className={inputClass} placeholder="0.00" step="0.01" min={item.minimum_amount || 0} required />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="md:col-span-3">
                                                            <label className="block text-gray-400 text-xs font-medium mb-1.5">Min Amount (€)</label>
                                                            <input type="number" value={item.minimum_amount}
                                                                className={disabledInputClass} disabled readOnly
                                                                placeholder="Auto-filled" />
                                                        </div>
                                                        <div className="md:col-span-4">
                                                            <label className="block text-gray-400 text-xs font-medium mb-1.5">Quoted Amount (€) *</label>
                                                            <input type="number" value={item.quoted_amount}
                                                                onChange={(e) => handleItemChange(index, 'quoted_amount', e.target.value)}
                                                                className={inputClass} placeholder="0.00" step="0.01" min={item.minimum_amount || 0} required />
                                                        </div>
                                                        <div className="md:col-span-12 mt-2">
                                                            <input type="text" value={item.comment}
                                                                onChange={(e) => handleItemChange(index, 'comment', e.target.value)}
                                                                className={inputClass} placeholder="Add a comment or note for this specific service..." />
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <div className="md:col-span-1 flex flex-col justify-center items-center space-y-2 mt-6">
                                            {formData.items.length > 1 && (
                                                <button type="button" onClick={() => removeItem(index)}
                                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove Service">
                                                    <MinusCircle size={20} />
                                                </button>
                                            )}
                                            {index === formData.items.length - 1 && (
                                                <button type="button" onClick={addItem}
                                                    disabled={!item.service}
                                                    className="p-2 text-mustard-gold hover:text-yellow-400 hover:bg-mustard-gold/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-mustard-gold/5" title="Add another service">
                                                    <Plus size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {liveTravelCost > 0 && (
                                <div className="bg-white/[0.03] border border-mustard-gold/30 rounded-xl p-4 mt-3">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                        <div className="md:col-span-11">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-mustard-gold text-sm font-bold">Travel Expense</p>
                                                    <p className="text-xs text-gray-400 mt-1">Calculated based on {formData.distance_from_ballinasloe} km distance</p>
                                                </div>
                                                <p className="font-bold text-white">€{liveTravelCost.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2">
                                    <Percent size={14} className="inline mr-1" />Discount (%)
                                </label>
                                <input type="number" name="discount_percentage" value={formData.discount_percentage}
                                    onChange={handleChange}
                                    className={inputClass} placeholder="0" step="0.01" min="0" max="100" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2">Quote Notes</label>
                                <input type="text" name="notes" value={formData.notes} onChange={handleChange}
                                    className={inputClass} placeholder="Optional notes for the quote..." />
                            </div>
                        </div>

                        {/* Live Totals Preview */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 mb-6">
                            <div className="flex flex-col items-end space-y-2">
                                <div className="flex items-center space-x-8">
                                    <span className="text-sm text-gray-400">Subtotal:</span>
                                    <span className="text-sm font-medium text-white w-28 text-right">
                                        €{liveSubtotal.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {liveDiscountPct > 0 && (
                                    <div className="flex items-center space-x-8">
                                        <span className="text-sm text-gray-400">Discount ({liveDiscountPct}%):</span>
                                        <span className="text-sm font-medium text-red-400 w-28 text-right">
                                            -€{liveDiscountAmt.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center space-x-8 pt-2 border-t border-white/10">
                                    <span className="text-sm font-semibold text-mustard-gold">Total Target Budget:</span>
                                    <span className="text-lg font-bold text-white w-28 text-right">
                                        €{liveTotal.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={submitting}
                        className="w-full bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {submitting ? 'Creating Event...' : 'Create Event & Quote'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default EventForm;
