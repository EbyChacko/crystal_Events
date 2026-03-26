import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon, Save, AlertCircle, CheckCircle, MapPin, Pencil, X, ArrowLeft,
    Trash2, Clock, Users as UsersIcon, FileText, BookOpen, ChevronDown, ChevronUp,
    PlusCircle, MinusCircle, Download, Percent, Plus, Image as ImageIcon, Link as LinkIcon, Upload,
    Send, Check, DollarSign, Link2, RefreshCw, Briefcase, Info, Edit2, Printer, Utensils, SlidersHorizontal
} from 'lucide-react';
import api, { API_BASE_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import FoodMenuForm from '../../components/events/FoodMenuForm';

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

const getStatusStyle = (status) => STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
const getStatusLabel = (status) => STATUS_OPTIONS.find(s => s.value === status)?.label || status;
const getTypeLabel = (type) => EVENT_TYPES.find(t => t.value === type)?.label || type;

const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IE', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const formatDateTimeInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    // Use UTC methods so the displayed value matches the stored UTC time exactly,
    // preventing a timezone-offset shift on every save.
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

const selectClass = "w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 transition-all appearance-none cursor-pointer";

const QUOTE_STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
    { value: 'sent', label: 'Sent', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { value: 'accepted', label: 'Accepted', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

const getQuoteStatusStyle = (status) => QUOTE_STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
const getQuoteStatusLabel = (status) => QUOTE_STATUS_OPTIONS.find(s => s.value === status)?.label || status;

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [event, setEvent] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [services, setServices] = useState([]);
    const [travelRates, setTravelRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLogbook, setShowLogbook] = useState(false);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const originalFormData = React.useRef({});
    const [showNotes, setShowNotes] = useState(true);
    const notesRef = useRef(null);

    const handlePrintNotes = () => {
        const token = localStorage.getItem('access_token');
        window.open(`${API_BASE_URL}/events/${event?.id}/notes/pdf/?token=${token}`, '_blank');
    };

    // Quote state
    const [eventQuote, setEventQuote] = useState(null);
    const [showQuoteForm, setShowQuoteForm] = useState(false);
    const [editingQuote, setEditingQuote] = useState(false);
    const [quoteSubmitting, setQuoteSubmitting] = useState(false);
    const emptyQuoteItem = { service: '', minimum_amount: '', quoted_amount: '', comment: '' };
    const [quoteFormData, setQuoteFormData] = useState({
        discount_percentage: '0', status: 'draft', notes: '', catering_cost: '0',
        items: [{ ...emptyQuoteItem }],
    });
    const [isQuoteDirty, setIsQuoteDirty] = useState(false);
    const originalQuoteData = useRef(null);

    // Food Menu state
    const [eventFoodMenu, setEventFoodMenu] = useState(null);
    const [showFoodMenuForm, setShowFoodMenuForm] = useState(false);

    // Payment state
    const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseFormData, setExpenseFormData] = useState({ date: new Date().toISOString().split('T')[0], amount: '', category: 'Catering', reason: '', approved_by: '', receipt_image_url: '' });
    const [expenseSubmitting, setExpenseSubmitting] = useState(false);
    const [eventExpenses, setEventExpenses] = useState([]);
    const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [showLogbookModal, setShowLogbookModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState({ type: 'full', discount: '0', received: '' });
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);

    // Refund state
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [refundSubmitting, setRefundSubmitting] = useState(false);

    const [confirmingFinish, setConfirmingFinish] = useState(false);

    // Gallery state
    const [showImageForm, setShowImageForm] = useState(false);
    const [imageUploadType, setImageUploadType] = useState('url');
    const [urlItems, setUrlItems] = useState([{ url: '', description: '' }]);
    const [fileItems, setFileItems] = useState([]);
    const [imageSubmitting, setImageSubmitting] = useState(false);

    const fetchEvent = async () => {
        try {
            const res = await api.get(`/events/${id}/`);
            const ev = res.data;
            setEvent(ev);
            setFormData({
                event_name: ev.event_name || '',
                event_type: ev.event_type || 'other',
                description: ev.description || '',
                client_name: ev.client_name || '',
                client_email: ev.client_email || '',
                client_phone: ev.client_phone || '',
                client_address: ev.client_address || '',
                event_date: formatDateTimeInput(ev.event_date),
                end_date: formatDateTimeInput(ev.end_date),
                hall_available_from: formatDateTimeInput(ev.hall_available_from),
                venue: ev.venue || '',
                venue_address: ev.venue_address || '',
                distance_from_ballinasloe: ev.distance_from_ballinasloe || '',
                guest_count: ev.guest_count ?? '',
                budget: ev.budget ?? '',
                status: ev.status || 'enquiry',
                assigned_to: ev.assigned_to ?? '',
            });
        } catch (err) {
            console.error('Failed to fetch event:', err);
            addToast('Failed to load event.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await api.get('/events/staff_list/');
            setStaffList(res.data);
        } catch (err) {
            console.error('Failed to fetch staff:', err);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/services/');
            setServices(res.data);
        } catch (err) {
            console.error('Failed to fetch services:', err);
        }
    };

    const fetchTravelRates = async () => {
        try {
            const res = await api.get('/travel_rates/');
            setTravelRates(res.data);
        } catch (err) {
            console.error('Failed to fetch travel rates:', err);
        }
    };

    const fetchEventQuote = async () => {
        try {
            const res = await api.get('/quotes/');
            const linked = res.data.find(q => q.event === parseInt(id));
            setEventQuote(linked || null);
        } catch (err) {
            console.error('Failed to fetch quotes:', err);
        }
    };

    const fetchFoodMenu = async () => {
        try {
            const res = await api.get('/food-menus/');
            const linked = res.data.find(m => m.event === parseInt(id));
            setEventFoodMenu(linked || null);
        } catch (err) {
            console.error('Failed to fetch food menus:', err);
        }
    };

    const fetchEventExpenses = async () => {
        try {
            const res = await api.get(`/expenses/?event=${id}`);
            setEventExpenses(res.data);
        } catch (err) {
            console.error('Failed to fetch event expenses:', err);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        setExpenseSubmitting(true);
        try {
            const payload = {
                date: expenseFormData.date,
                amount: expenseFormData.amount,
                category: expenseFormData.category,
                reason: expenseFormData.reason,
                event: parseInt(id),
                ...(expenseFormData.approved_by && { approved_by: expenseFormData.approved_by }),
                ...(expenseFormData.receipt_image_url && { receipt_image_url: expenseFormData.receipt_image_url }),
            };
            await api.post('/expenses/', payload);
            addToast('Expense recorded successfully!', 'success');
            setShowExpenseModal(false);
            setExpenseFormData({ date: new Date().toISOString().split('T')[0], amount: '', category: 'Catering', reason: '', approved_by: '', receipt_image_url: '' });
            fetchEventExpenses();
        } catch (err) {
            addToast('Failed to record expense.', 'error');
        } finally {
            setExpenseSubmitting(false);
        }
    };

    useEffect(() => {
        fetchEvent();
        fetchStaff();
        fetchServices();
        fetchTravelRates();
        fetchEventQuote();
        fetchFoodMenu();
        fetchEventExpenses();
        // eslint-disable-next-line
    }, [id]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowEditModal(false);
                setShowPaymentModal(false);
                setShowRefundModal(false);
                setShowExpenseModal(false);
                setShowPaymentHistoryModal(false);
                setShowGalleryModal(false);
                setShowLogbookModal(false);
                setSidebarOpen(false);
                setShowQuoteForm(false);
                setShowFoodMenuForm(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Check if we navigated here specifically to edit the quote
    useEffect(() => {
        if (eventQuote && location.search.includes('action=edit-quote')) {
            openEditQuote();
            // Clear the query parameter so it doesn't reopen on refresh
            navigate(location.pathname, { replace: true });
        }
    }, [eventQuote, location.search, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOpenEditModal = () => {
        if (event) {
            setFormData({
                event_name: event.event_name || '',
                event_type: event.event_type || 'other',
                description: event.description || '',
                client_name: event.client_name || '',
                client_email: event.client_email || '',
                client_phone: event.client_phone || '',
                client_address: event.client_address || '',
                event_date: formatDateTimeInput(event.event_date),
                end_date: formatDateTimeInput(event.end_date),
                hall_available_from: formatDateTimeInput(event.hall_available_from),
                venue: event.venue || '',
                venue_address: event.venue_address || '',
                distance_from_ballinasloe: event.distance_from_ballinasloe || '',
                guest_count: event.guest_count ?? '',
                budget: event.budget ?? '',
                status: event.status || 'enquiry',
                assigned_to: event.assigned_to ?? '',
                notes: event.notes || '',
            });
        }
        setShowEditModal(true);
        // Capture baseline so we can compare for dirty-state detection
        originalFormData.current = {
            event_name: event.event_name || '',
            event_type: event.event_type || 'other',
            description: event.description || '',
            client_name: event.client_name || '',
            client_email: event.client_email || '',
            client_phone: event.client_phone || '',
            client_address: event.client_address || '',
            event_date: formatDateTimeInput(event.event_date),
            end_date: formatDateTimeInput(event.end_date),
            hall_available_from: formatDateTimeInput(event.hall_available_from),
            venue: event.venue || '',
            venue_address: event.venue_address || '',
            distance_from_ballinasloe: event.distance_from_ballinasloe || '',
            guest_count: event.guest_count ?? '',
            budget: event.budget ?? '',
            status: event.status || 'enquiry',
            assigned_to: event.assigned_to ?? '',
            notes: event.notes || '',
        };
    };

    const handleCancelEdit = () => {
        setShowEditModal(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = { ...formData };
            if (!payload.assigned_to) payload.assigned_to = null;
            if (!payload.guest_count && payload.guest_count !== 0) payload.guest_count = null;
            else payload.guest_count = parseInt(payload.guest_count);
            if (!payload.budget) payload.budget = null;

            // Append Z so Django always gets an unambiguous UTC datetime string.
            // datetime-local inputs yield "YYYY-MM-DDTHH:mm" with no timezone info,
            // which could be misinterpreted by Django if TIME_ZONE != 'UTC'.
            const toUtc = (v) => v ? `${v}:00Z` : null;
            payload.event_date = toUtc(payload.event_date);
            payload.end_date = toUtc(payload.end_date);
            payload.hall_available_from = toUtc(payload.hall_available_from);

            if (payload.distance_from_ballinasloe === '') payload.distance_from_ballinasloe = null;
            else if (payload.distance_from_ballinasloe) payload.distance_from_ballinasloe = parseFloat(payload.distance_from_ballinasloe);

            await api.patch(`/events/${id}/`, payload);

            // Auto-update quote travel cost if distance changes
            if (eventQuote && payload.distance_from_ballinasloe !== event.distance_from_ballinasloe) {
                const newTravelCost = getTravelCost(payload.distance_from_ballinasloe);
                if (newTravelCost !== Number(eventQuote.travel_cost)) {
                    await api.patch(`/quotes/${eventQuote.id}/`, { travel_cost: newTravelCost });
                    await fetchEventQuote();
                }
            }

            addToast('Event updated successfully!', 'success');
            setShowEditModal(false);
            await fetchEvent();
        } catch (err) {
            const d = err.response?.data;
            if (d) {
                const messages = Object.entries(d)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
                addToast(messages, 'error');
            } else {
                addToast('Failed to update event.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/events/${id}/`);
            navigate('/admin/events');
        } catch (err) {
            addToast('Failed to delete event.', 'error');
            setConfirmingDelete(false);
        }
    };

    // ── Payment Handlers ─────────────────────────────────────────────
    const handleOpenPayment = () => {
        const totalAmount = parseFloat(event?.budget || eventQuote?.total || 0);
        const prevReceived = parseFloat(event?.received_amount || 0);
        const prevDiscount = parseFloat(event?.payment_discount || 0);
        const balance = totalAmount - prevReceived - prevDiscount;
        setPaymentData({
            type: 'full',
            discount: '0',
            received: balance > 0 ? balance.toFixed(2) : '0'
        });
        setShowPaymentModal(true);
    };

    const handleReceivePayment = async (e) => {
        e.preventDefault();
        setPaymentSubmitting(true);
        try {
            const currentReceived = parseFloat(event?.received_amount || 0);
            const newReceived = parseFloat(paymentData.received) || 0;
            const currentDiscount = parseFloat(event?.payment_discount || 0);
            const newDiscount = parseFloat(paymentData.discount) || 0;

            const totalReceived = currentReceived + newReceived;
            const totalDiscount = currentDiscount + newDiscount;

            const payload = {
                received_amount: totalReceived,
                payment_discount: totalDiscount
            };
            await api.patch(`/events/${id}/`, payload);
            addToast('Payment recorded successfully!', 'success');
            setShowPaymentModal(false);
            fetchEvent();
        } catch (err) {
            addToast('Failed to process payment.', 'error');
        } finally {
            setPaymentSubmitting(false);
        }
    };

    const handleReceiveRefund = async (e) => {
        e.preventDefault();
        setRefundSubmitting(true);
        try {
            const currentReceived = parseFloat(event?.received_amount || 0);
            const amtToRefund = parseFloat(refundAmount) || 0;

            if (amtToRefund <= 0) {
                addToast('Refund amount must be greater than zero.', 'error');
                setRefundSubmitting(false);
                return;
            }

            if (amtToRefund > currentReceived) {
                addToast(`Refund amount cannot exceed total amount paid (€${currentReceived.toFixed(2)}).`, 'error');
                setRefundSubmitting(false);
                return;
            }

            await api.post(`/events/${id}/refund/`, { amount: amtToRefund, reason: refundReason });
            addToast('Refund recorded successfully!', 'success');
            setShowRefundModal(false);
            setRefundAmount('');
            setRefundReason('');
            fetchEvent();
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to process refund.';
            addToast(msg, 'error');
        } finally {
            setRefundSubmitting(false);
        }
    };

    // ── Finish Event Handler ─────────────────────────────────────────
    const isEventOver = () => {
        if (!event) return false;
        const targetDate = event.end_date || event.event_date;
        if (!targetDate) return false;
        return new Date() > new Date(targetDate);
    };

    const [finishingEvent, setFinishingEvent] = useState(false);
    const handleFinishEvent = async () => {
        setFinishingEvent(true);
        try {
            await api.patch(`/events/${id}/`, { status: 'finished' });
            addToast('Event marked as finished successfully!', 'success');
            fetchEvent();
        } catch (err) {
            addToast('Failed to finish event.', 'error');
        } finally {
            setFinishingEvent(false);
        }
    };

    // ── Quote Handlers ───────────────────────────────────────────────
    const openCreateQuote = () => {
        const initialData = {
            discount_percentage: '0', status: 'draft', notes: '', catering_cost: '0',
            items: [{ ...emptyQuoteItem }],
        };
        setQuoteFormData(initialData);
        originalQuoteData.current = initialData;
        setIsQuoteDirty(false);
        setEditingQuote(false);
        setShowQuoteForm(true);
    };

    const openEditQuote = () => {
        if (!eventQuote) return;
        const initialData = {
            discount_percentage: eventQuote.discount_percentage || '0',
            status: eventQuote.status,
            notes: eventQuote.notes || '',
            catering_cost: eventQuote.catering_cost || '0',
            items: eventQuote.items.map(item => ({
                service: item.service,
                minimum_amount: item.minimum_amount,
                quoted_amount: item.quoted_amount,
                comment: item.comment || '',
            })),
        };
        setQuoteFormData(initialData);
        originalQuoteData.current = initialData;
        setIsQuoteDirty(false);
        setEditingQuote(true);
        setShowQuoteForm(true);
    };

    // Deep compare quote data for change detection
    useEffect(() => {
        if (showQuoteForm && editingQuote && originalQuoteData.current) {
            const isDirty = JSON.stringify(quoteFormData) !== JSON.stringify(originalQuoteData.current);
            setIsQuoteDirty(isDirty);
        }
    }, [quoteFormData, showQuoteForm, editingQuote]);

    const handleQuoteItemChange = (index, field, value) => {
        const updated = [...quoteFormData.items];
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'service' && value) {
            const svc = services.find(s => s.id === parseInt(value));
            if (svc) {
                updated[index].minimum_amount = svc.base_price;
                if (!updated[index].quoted_amount) updated[index].quoted_amount = svc.base_price;
            }
        }
        setQuoteFormData({ ...quoteFormData, items: updated });
    };

    const addQuoteItem = () => {
        setQuoteFormData({ ...quoteFormData, items: [...quoteFormData.items, { ...emptyQuoteItem }] });
    };

    const removeQuoteItem = (index) => {
        if (quoteFormData.items.length <= 1) return;
        setQuoteFormData({ ...quoteFormData, items: quoteFormData.items.filter((_, i) => i !== index) });
    };

    const handleQuoteSubmit = async (e) => {
        e.preventDefault();
        setQuoteSubmitting(true);

        const validItems = quoteFormData.items.filter(item => item.service && item.quoted_amount);
        if (validItems.length === 0) {
            addToast('Please add at least one service with an amount.', 'error');
            setQuoteSubmitting(false);
            return;
        }

        try {
            // Recalculate travel cost based on event distance to include in payload
            const currentDist = event.distance_from_ballinasloe;
            let travelCost = 0;
            if (currentDist && !isNaN(currentDist)) {
                const numDist = Number(currentDist);
                const sortedRates = [...travelRates].sort((a, b) => Number(a.distance_from) - Number(b.distance_from));
                for (const rate of sortedRates) {
                    if (numDist >= Number(rate.distance_from) && numDist <= Number(rate.distance_to)) {
                        travelCost = Number(rate.rate);
                        break;
                    }
                }
                if (travelCost === 0 && sortedRates.length > 0 && numDist > Number(sortedRates[sortedRates.length - 1].distance_to)) {
                    travelCost = Number(sortedRates[sortedRates.length - 1].rate);
                }
            }

            const payload = {
                event: parseInt(id),
                client_name: event.client_name,
                client_email: event.client_email || '',
                client_phone: event.client_phone || '',
                travel_cost: travelCost,
                catering_cost: parseFloat(quoteFormData.catering_cost) || 0,
                discount_percentage: parseFloat(quoteFormData.discount_percentage) || 0,
                status: quoteFormData.status,
                notes: quoteFormData.notes,
                items: validItems.map(item => ({
                    service: parseInt(item.service),
                    minimum_amount: parseFloat(item.minimum_amount),
                    quoted_amount: parseFloat(item.quoted_amount),
                    comment: item.comment,
                })),
            };

            if (editingQuote && eventQuote) {
                await api.patch(`/quotes/${eventQuote.id}/`, payload);
                addToast('Quote updated successfully!', 'success');
            } else {
                await api.post('/quotes/', payload);
                addToast('Quote created successfully!', 'success');
            }
            setShowQuoteForm(false);
            fetchEventQuote();
            fetchEvent(); // refresh audit log
        } catch (err) {
            const d = err.response?.data;
            addToast(d ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : 'Failed to save quote.', 'error');
        } finally {
            setQuoteSubmitting(false);
        }
    };

    const handleDownloadPdf = (quoteId) => {
        const token = localStorage.getItem('access_token');
        window.open(`${API_BASE_URL}/quotes/${quoteId}/pdf/?token=${token}`, '_blank');
    };

    const handleImageSubmit = async (e) => {
        e.preventDefault();
        setImageSubmitting(true);

        try {
            if (imageUploadType === 'url') {
                const validUrls = urlItems.filter(item => item.url.trim() !== '');
                if (validUrls.length === 0) {
                    addToast('Please provide at least one image URL.', 'error');
                    setImageSubmitting(false);
                    return;
                }
                await Promise.all(validUrls.map(item => {
                    const formDataObj = new FormData();
                    formDataObj.append('event', id);
                    formDataObj.append('image_url', item.url);
                    formDataObj.append('description', item.description);
                    return api.post('/event-images/', formDataObj, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }));
            } else {
                if (fileItems.length === 0) {
                    addToast('Please select at least one file.', 'error');
                    setImageSubmitting(false);
                    return;
                }
                await Promise.all(fileItems.map(item => {
                    const formDataObj = new FormData();
                    formDataObj.append('event', id);
                    formDataObj.append('image', item.file);
                    formDataObj.append('description', item.description);
                    return api.post('/event-images/', formDataObj, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }));
            }

            addToast('Images added successfully!', 'success');
            setShowImageForm(false);
            setUrlItems([{ url: '', description: '' }]);
            setFileItems([]);
            fetchEvent(); // Refresh event to get new images
        } catch (err) {
            addToast('Failed to add images.', 'error');
        } finally {
            setImageSubmitting(false);
        }
    };

    const handleAddUrlRow = () => setUrlItems([...urlItems, { url: '', description: '' }]);
    const handleRemoveUrlRow = (index) => setUrlItems(urlItems.filter((_, i) => i !== index));
    const handleUrlChange = (index, field, value) => {
        const newItems = [...urlItems];
        newItems[index][field] = value;
        setUrlItems(newItems);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const newFileItems = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            description: ''
        }));
        setFileItems([...fileItems, ...newFileItems]);
        e.target.value = '';
    };

    const handleRemoveFile = (index) => setFileItems(fileItems.filter((_, i) => i !== index));
    const handleFileDescChange = (index, value) => {
        const newItems = [...fileItems];
        newItems[index].description = value;
        setFileItems(newItems);
    };

    const handleDeleteImage = async (imageId) => {
        if (!window.confirm("Are you sure you want to delete this image?")) return;
        try {
            await api.delete(`/event-images/${imageId}/`);
            addToast('Image deleted successfully!', 'success');
            fetchEvent();
        } catch (err) {
            addToast('Failed to delete image.', 'error');
        }
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

    const quoteTravelCost = getTravelCost(event?.distance_from_ballinasloe);

    // True when the user has made at least one change in the edit modal
    const isDirty = JSON.stringify(formData) !== JSON.stringify(originalFormData.current);

    const quoteSubtotal = quoteFormData.items.reduce((sum, item) => sum + (parseFloat(item.quoted_amount) || 0), 0) + quoteTravelCost + (parseFloat(quoteFormData.catering_cost) || 0);
    const quoteDiscountPct = parseFloat(quoteFormData.discount_percentage) || 0;
    const quoteDiscountAmt = quoteSubtotal * quoteDiscountPct / 100;
    const quoteTotal = quoteSubtotal - quoteDiscountAmt;

    // Construct Timeline Nodes exactly chronologically
    const timelineNodes = useMemo(() => {
        if (!event) return [];
        const nodes = [];
        const baseBudget = parseFloat(event?.budget || eventQuote?.total || 0);
        let currentBalance = baseBudget;
        let previousDiscount = 0;

        const chronologicalLogs = [...(event.audit_log || [])]; 
        
        chronologicalLogs.forEach((entry, idx) => {
            if (entry.action === 'payment_received') {
                const currentDiscount = parseFloat(entry.discount || 0);
                const discountDelta = currentDiscount - previousDiscount;
                
                if (discountDelta !== 0) {
                    currentBalance -= discountDelta;
                    nodes.push({
                        id: `discount-${idx}`,
                        type: 'discount',
                        title: discountDelta > 0 ? 'Discount Applied' : 'Discount Reduced',
                        description: `by ${entry.user || 'System'}`,
                        amount: Math.abs(discountDelta),
                        isIncrease: discountDelta < 0,
                        balance: currentBalance,
                        timestamp: entry.timestamp,
                        icon: 'DollarSign',
                        colorTheme: discountDelta > 0 ? 'blue' : 'gray'
                    });
                    previousDiscount = currentDiscount;
                }

                const receivedNow = parseFloat(entry.amount_received_now || 0);
                if (receivedNow > 0) {
                    currentBalance -= receivedNow;
                    nodes.push({
                        id: `payment-${idx}`,
                        type: 'payment',
                        title: 'Payment Received',
                        description: `by ${entry.user || 'System'}`,
                        amount: receivedNow,
                        isIncrease: false,
                        balance: currentBalance,
                        timestamp: entry.timestamp,
                        icon: 'CheckCircle',
                        colorTheme: 'emerald'
                    });
                }
            } else if (entry.action === 'refund_made') {
                const refundAmt = parseFloat(entry.amount_refunded || 0);
                if (refundAmt > 0) {
                    currentBalance += refundAmt;
                    nodes.push({
                        id: `refund-${idx}`,
                        type: 'refund',
                        title: 'Refund Processed',
                        description: `by ${entry.user || 'System'}`,
                        reason: entry.reason || '',
                        amount: refundAmt,
                        isIncrease: true,
                        balance: currentBalance,
                        timestamp: entry.timestamp,
                        icon: 'RefreshCw',
                        colorTheme: 'rose'
                    });
                }
            }
        });

        nodes.unshift({
            id: 'genesis',
            type: 'quote',
            title: 'Base Quote Established',
            description: 'Initial starting budget for the event.',
            amount: baseBudget,
            isIncrease: false,
            balance: baseBudget,
            timestamp: event.created_at || new Date().toISOString(),
            icon: 'Briefcase',
            colorTheme: 'mustard-gold'
        });

        return nodes.reverse();
    }, [event, eventQuote]);

    const handleDownloadFoodMenuPdf = (menuId) => {
        const token = localStorage.getItem('access_token');
        window.open(`${API_BASE_URL}/food-menus/${menuId}/pdf/?token=${token}`, '_blank');
    };

    if (loading) return <div className="p-4 sm:p-6 md:p-8 text-center text-gray-500">Loading event details...</div>;
    if (!event) return (
        <div className="text-center mt-10">
            <p className="text-red-400 mb-4">{error || 'Event not found'}</p>
            <button onClick={() => navigate('/admin/events')} className="text-mustard-gold hover:underline">Back to Events</button>
        </div>
    );

    const inputBaseClass = "w-full transition-all";
    const editableClass = `${inputBaseClass} px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600`;
    const readOnlyClass = `${inputBaseClass} py-2 text-white text-base font-medium bg-transparent border-transparent cursor-default resize-none m-0 p-0 focus:outline-none`;

    const auditLog = [...(event.audit_log || [])].reverse();
    const isLocked = event.status === 'finished' && !user?.is_superuser;

    return (
        <div className="max-w-5xl mx-auto">
            {isLocked && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center justify-center space-x-2">
                    <AlertCircle size={20} />
                    <span className="font-medium">This event is marked as Finished and is locked. Only a Superuser can make modifications.</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-start space-x-4">
                    <button onClick={() => navigate('/admin/events')}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors flex-shrink-0 mt-1">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white break-words">{event.event_name}</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-gray-400 text-sm">{getTypeLabel(event.event_type)}</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${getStatusStyle(event.status)}`}>
                                {getStatusLabel(event.status)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowLogbookModal(true)}
                        className="flex items-center justify-center w-full md:w-auto space-x-2 bg-white/10 border border-white/10 text-white font-medium px-4 py-3 md:py-2.5 rounded-xl hover:bg-white/15 transition-all text-base md:text-sm">
                        <BookOpen size={16} />
                        <span className="hidden sm:inline">Logbook</span>
                        {auditLog.length > 0 && (
                            <span className="bg-mustard-gold/20 text-mustard-gold text-xs px-1.5 py-0.5 rounded-md font-bold">{auditLog.length}</span>
                        )}
                    </button>
                    <button onClick={() => setSidebarOpen(true)}
                        className="flex items-center justify-center space-x-2 bg-mustard-gold/10 border border-mustard-gold/30 text-mustard-gold font-medium px-4 py-3 md:py-2.5 rounded-xl hover:bg-mustard-gold/20 transition-all text-base md:text-sm">
                        <SlidersHorizontal size={16} />
                        <span className="hidden sm:inline">Actions</span>
                    </button>
                </div>
            </div>

            {/* Receive Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                         onMouseDown={(e) => { if (e.target === e.currentTarget) setShowPaymentModal(false); }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0b1015] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                            <button type="button" onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <CheckCircle className="text-emerald-400" size={24} />
                                Receive Payment
                            </h3>
                            <form onSubmit={handleReceivePayment}>
                                {/* Payment Type Tabs */}
                                <div className="flex p-1 bg-white/5 rounded-xl mb-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const totalAmount = parseFloat(event?.budget || eventQuote?.total || 0);
                                            const prevReceived = parseFloat(event?.received_amount || 0);
                                            const prevDiscount = parseFloat(event?.payment_discount || 0);
                                            const bal = totalAmount - prevReceived - prevDiscount;
                                            setPaymentData({ ...paymentData, type: 'full', discount: '0', received: bal > 0 ? bal.toFixed(2) : '0' });
                                        }}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${paymentData.type === 'full' ? 'bg-mustard-gold text-deep-teal shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Full Balance
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentData({ ...paymentData, type: 'split' })}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${paymentData.type === 'split' ? 'bg-mustard-gold text-deep-teal shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Split Payment
                                    </button>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                                        <span className="text-gray-400">Total Quote Amount</span>
                                        <span className="text-white font-medium">€{parseFloat(event?.budget || eventQuote?.total || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                                        <span className="text-gray-400">Previously Received</span>
                                        <span className="text-white font-medium">€{parseFloat(event?.received_amount || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    {parseFloat(event?.payment_discount || 0) > 0 && (
                                        <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Previously Discounted</span>
                                            <span className="text-mustard-gold font-medium">€{parseFloat(event?.payment_discount || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Discount Allowed (€)</label>
                                        <input type="number" value={paymentData.discount}
                                            onChange={(e) => {
                                                let dVal = e.target.value;
                                                if (dVal.includes('.')) {
                                                    const parts = dVal.split('.');
                                                    dVal = `${parts[0]}.${parts[1].slice(0, 2)}`;
                                                }
                                                const updates = { discount: dVal };
                                                if (paymentData.type === 'full') {
                                                    const totalAmount = parseFloat(event?.budget || eventQuote?.total || 0);
                                                    const prevReceived = parseFloat(event?.received_amount || 0);
                                                    const prevDiscount = parseFloat(event?.payment_discount || 0);
                                                    const bal = totalAmount - prevReceived - prevDiscount;
                                                    const rem = bal - parseFloat(dVal || 0);
                                                    updates.received = rem > 0 ? rem.toFixed(2) : '0';
                                                }
                                                setPaymentData({ ...paymentData, ...updates });
                                            }}
                                            className={selectClass.replace('cursor-pointer', '')} placeholder="0.00" step="0.01" min="0" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Amount Receiving Now (€) *</label>
                                        <input type="number" value={paymentData.received}
                                            onChange={(e) => {
                                                let rVal = e.target.value;
                                                if (rVal.includes('.')) {
                                                    const parts = rVal.split('.');
                                                    rVal = `${parts[0]}.${parts[1].slice(0, 2)}`;
                                                }
                                                const updates = { received: rVal };
                                                if (paymentData.type === 'full') {
                                                    const totalAmount = parseFloat(event?.budget || eventQuote?.total || 0);
                                                    const prevReceived = parseFloat(event?.received_amount || 0);
                                                    const prevDiscount = parseFloat(event?.payment_discount || 0);
                                                    const bal = totalAmount - prevReceived - prevDiscount;
                                                    const rem = bal - parseFloat(rVal || 0);
                                                    updates.discount = rem > 0 ? rem.toFixed(2) : '0';
                                                }
                                                setPaymentData({ ...paymentData, ...updates });
                                            }}
                                            className={selectClass.replace('cursor-pointer', '')} placeholder="0.00" step="0.01" min="0" required />
                                    </div>

                                    {Number((parseFloat(paymentData.received || 0) + parseFloat(paymentData.discount || 0)).toFixed(2)) > Number((parseFloat(event?.budget || eventQuote?.total || 0) - parseFloat(event?.received_amount || 0) - parseFloat(event?.payment_discount || 0)).toFixed(2)) && (
                                        <div className="text-red-400 text-sm font-medium flex items-center gap-2 mt-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                            <AlertCircle size={16} />
                                            Amount exceeds the balance due.
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-mustard-gold font-semibold">Balance Due</span>
                                        <span className="text-white font-bold text-xl">
                                            €{Math.max(0, Number((parseFloat(event?.budget || eventQuote?.total || 0) - parseFloat(event?.received_amount || 0) - parseFloat(event?.payment_discount || 0)).toFixed(2))).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-gray-400 font-medium text-sm">Balance After Payment</span>
                                        <span className="text-gray-300 font-semibold text-lg">
                                            €{Math.max(0, Number((parseFloat(event?.budget || eventQuote?.total || 0) - parseFloat(event?.received_amount || 0) - parseFloat(event?.payment_discount || 0) - (parseFloat(paymentData.received) || 0) - (parseFloat(paymentData.discount) || 0)).toFixed(2))).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <button type="submit"
                                        disabled={
                                            paymentSubmitting ||
                                            ((parseFloat(paymentData.received) || 0) <= 0 && (parseFloat(paymentData.discount) || 0) <= 0) ||
                                            Number((parseFloat(paymentData.received || 0) + parseFloat(paymentData.discount || 0)).toFixed(2)) > Number((parseFloat(event?.budget || eventQuote?.total || 0) - parseFloat(event?.received_amount || 0) - parseFloat(event?.payment_discount || 0)).toFixed(2))
                                        }
                                        className="w-full bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold px-4 py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                        {paymentSubmitting ? 'Processing...' : paymentData.type === 'full' ? 'Receive Full Balance' : 'Receive Partial Payment'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Event Detail Form */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 mb-6 relative">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                    <div>
                        <h2 className="text-lg font-bold text-white">Event Information</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Created {formatDateTime(event.created_at)}
                            {event.created_by_name && <> by <span className="text-gray-400">{event.created_by_name}</span></>}
                        </p>
                    </div>
                    {!isLocked && (
                        <button type="button" onClick={handleOpenEditModal}
                            className="flex items-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all">
                            <Pencil size={18} />
                            <span className="hidden sm:inline">Edit Event</span>
                        </button>
                    )}
                </div>

                {/* Event Details Section */}
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                    <div className="lg:col-span-2">
                        <label className="block text-gray-400 text-sm font-medium mb-1">Event Name</label>
                        <p className="text-white text-lg font-medium">{event.event_name}</p>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm font-medium mb-1">Event Type</label>
                        <p className="text-white text-lg font-medium">{getTypeLabel(event.event_type)}</p>
                    </div>
                    {event.description && (
                        <div className="lg:col-span-3 mt-2">
                            <label className="block text-gray-400 text-sm font-medium mb-1">Description</label>
                            <p className="text-gray-300">{event.description}</p>
                        </div>
                    )}
                </div>

                {/* Client Info */}
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-t border-white/10 pt-6">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <div>
                        <label className="block text-gray-400 text-sm font-medium mb-1">Client Name</label>
                        <p className="text-white text-lg font-medium">{event.client_name}</p>
                    </div>
                    {event.client_email && (
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Client Email</label>
                            <p className="text-white text-lg font-medium">{event.client_email}</p>
                        </div>
                    )}
                    {event.client_phone && (
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Client Phone</label>
                            <p className="text-white text-lg font-medium">{event.client_phone}</p>
                        </div>
                    )}
                    {event.client_address && (
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Client Address</label>
                            <p className="text-white text-lg font-medium">{event.client_address}</p>
                        </div>
                    )}
                </div>

                {/* Venue & Schedule */}
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-t border-white/10 pt-6">Venue & Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <div>
                        <label className="block text-gray-400 text-sm font-medium mb-1">Event Date & Time</label>
                        <p className="text-white text-lg font-medium">{formatDateTime(event.event_date)}</p>
                    </div>
                    {event.end_date && (
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">End Date & Time</label>
                            <p className="text-white text-lg font-medium">{formatDateTime(event.end_date)}</p>
                        </div>
                    )}
                    {event.hall_available_from && (
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Hall Available From</label>
                            <p className="text-white text-lg font-medium">{formatDateTime(event.hall_available_from)}</p>
                        </div>
                    )}
                    {event.venue && (
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Venue</label>
                            <p className="text-white text-lg font-medium">{event.venue}</p>
                        </div>
                    )}
                    {(event.distance_from_ballinasloe !== null && event.distance_from_ballinasloe !== undefined) && (
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Distance (km)</label>
                            <p className="text-white text-lg font-medium">{event.distance_from_ballinasloe} km</p>
                        </div>
                    )}
                    {event.venue_address && (
                        <div className="lg:col-span-4 mt-2">
                            <label className="block text-gray-400 text-sm font-medium mb-1 flex items-center gap-1.5">
                                <MapPin size={14} className="text-mustard-gold" /> Venue Address
                            </label>
                            <p className="text-gray-300">{event.venue_address}</p>
                        </div>
                    )}
                </div>

                {/* Logistics */}
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-t border-white/10 pt-6">Logistics & Assignment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {(event.guest_count !== null && event.guest_count !== undefined) && (
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Guest Count</label>
                            <p className="text-white text-lg font-medium">{event.guest_count}</p>
                        </div>
                    )}
                    {(event.budget !== null && event.budget !== undefined) && (
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Customer Budget (€)</label>
                            <p className="text-white text-lg font-medium">€{parseFloat(event.budget).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-gray-400 text-sm font-medium mb-1">Status</label>
                        <div className="pt-1">
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${getStatusStyle(event.status)}`}>
                                {getStatusLabel(event.status)}
                            </span>
                        </div>
                    </div>
                    {event.assigned_to && (
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Assigned To</label>
                            <p className="text-white text-lg font-medium">{event.assigned_to_name || 'Unassigned'}</p>
                        </div>
                    )}
                </div>

                {/* Event Notes Section — collapsible */}
                {event.notes && (
                    <div className="border-t border-white/10 pt-4 mt-2" ref={notesRef}>
                        {/* Header row — click to expand/collapse */}
                        <div
                            className="flex items-center justify-between cursor-pointer group select-none"
                            onClick={() => {
                                const opening = !showNotes;
                                setShowNotes(opening);
                                if (opening) {
                                    setTimeout(() => notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
                                }
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <FileText size={15} className="text-mustard-gold" />
                                <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider group-hover:text-white transition-colors">
                                    Internal Notes
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Print button — stops propagation so it doesn't toggle the section */}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handlePrintNotes(); }}
                                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-mustard-gold hover:bg-mustard-gold/10 px-2.5 py-1.5 rounded-lg transition-all"
                                    title="Print Notes PDF"
                                >
                                    <Printer size={13} />
                                    <span>Print</span>
                                </button>
                                {showNotes
                                    ? <ChevronUp size={16} className="text-gray-400" />
                                    : <ChevronDown size={16} className="text-gray-400" />}
                            </div>
                        </div>

                        {/* Animated content */}
                        <AnimatePresence initial={false}>
                            {showNotes && (
                                <motion.div
                                    key="notes-body"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 mt-3">
                                        <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{event.notes}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Edit Event Form Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={handleCancelEdit}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-5xl bg-[#0b1015] border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Pencil size={22} className="text-mustard-gold" />
                                    <span>Edit Event Details</span>
                                </div>
                                <button type="button" onClick={handleCancelEdit} className="text-gray-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </h2>
                            <form onSubmit={handleSave}>
                                {/* Event Details Section */}
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Event Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                                    <div className="lg:col-span-2">
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Event Name *</label>
                                        <input type="text" name="event_name" value={formData.event_name} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} required />
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
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} />
                                    </div>
                                </div>

                                {/* Client Info */}
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-t border-white/10 pt-6">Client Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Client Name *</label>
                                        <input type="text" name="client_name" value={formData.client_name} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} required />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Client Email</label>
                                        <input type="email" name="client_email" value={formData.client_email} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Client Phone *</label>
                                        <input type="text" name="client_phone" value={formData.client_phone} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} required />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Client Address</label>
                                        <input type="text" name="client_address" value={formData.client_address} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} />
                                    </div>
                                </div>

                                {/* Venue & Schedule */}
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-t border-white/10 pt-6">Venue & Schedule</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Event Date & Time *</label>
                                        <input type="datetime-local" name="event_date" value={formData.event_date} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} required />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">End Date & Time</label>
                                        <input type="datetime-local" name="end_date" value={formData.end_date} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Hall Available From</label>
                                        <input type="datetime-local" name="hall_available_from" value={formData.hall_available_from || ''} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Venue *</label>
                                        <input type="text" name="venue" value={formData.venue} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} required />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Distance (km)</label>
                                        <input type="number" name="distance_from_ballinasloe" value={formData.distance_from_ballinasloe} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} min="0" step="0.1" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center gap-1.5">
                                            <MapPin size={14} className="text-mustard-gold" /> Venue Address
                                        </label>
                                        <input type="text" name="venue_address" value={formData.venue_address} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} />
                                    </div>
                                </div>

                                {/* Logistics */}
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-t border-white/10 pt-6">Logistics & Assignment</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Guest Count</label>
                                        <input type="number" name="guest_count" value={formData.guest_count} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} min="0" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Customer Budget (€)</label>
                                        <input type="number" name="budget" value={formData.budget} onChange={handleChange}
                                            className={selectClass.replace('appearance-none cursor-pointer', '')} min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Status</label>
                                        <select name="status" value={formData.status} onChange={handleChange} className={selectClass}>
                                            {STATUS_OPTIONS.filter(s => s.value !== 'finished').map(s => <option key={s.value} value={s.value} className="bg-gray-900">{s.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Assigned To</label>
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

                                {/* Event Notes Section */}
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-t border-white/10 pt-6">Notes</h3>
                                <div className="mb-6">
                                    <label className="block text-gray-400 text-sm font-medium mb-2">Internal General Notes</label>
                                    <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows="4"
                                        className={selectClass.replace('appearance-none cursor-pointer', '')} placeholder="Internal observations, specific details..." />
                                </div>

                                {/* Save / Cancel */}
                                <div className="mt-8 pt-6 border-t border-white/10 flex items-center space-x-4">
                                    <button type="submit" disabled={saving || !isDirty}
                                        className="w-full flex justify-center items-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold px-6 py-3.5 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Save size={18} />
                                        <span>{saving ? 'Saving...' : !isDirty ? 'No Changes' : 'Save Changes'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Quote Section ──────────────────────────────────────── */}
            < div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 mb-6" >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                            <FileText size={20} className="text-mustard-gold" />
                            <span>Quote</span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {eventQuote ? `Quote #${eventQuote.id}` : 'No quote created yet'}
                        </p>
                    </div>
                    {/* Buttons moved to bottom */}
                </div>

                {/* Quote Summary (read-only) */}
                {
                    eventQuote && !showQuoteForm && (
                        <div>
                            <div className="flex items-center space-x-3 mb-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getQuoteStatusStyle(eventQuote.status)}`}>
                                    {getQuoteStatusLabel(eventQuote.status)}
                                </span>
                                <span className="text-sm text-gray-400">
                                    Created {new Date(eventQuote.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="hidden md:grid grid-cols-12 gap-4 px-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <div className="col-span-4">Service</div>
                                    <div className="col-span-5">Special Requirement / Notes</div>
                                    <div className="col-span-3 text-right">Amount</div>
                                </div>
                                {eventQuote.items?.map((item, i) => (
                                    <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                                        <div className="md:col-span-4 text-sm font-medium text-white">
                                            {item.service_name}
                                        </div>
                                        <div className="md:col-span-5 text-sm text-gray-400 flex flex-col sm:flex-row sm:space-x-1">
                                            <span className="md:hidden font-semibold text-gray-500 text-xs uppercase mb-1 sm:mb-0">Note: </span>
                                            <span className="break-words">{item.comment || '—'}</span>
                                        </div>
                                        <div className="md:col-span-3 text-sm font-medium text-white flex justify-between md:block md:text-right">
                                            <span className="md:hidden font-semibold text-gray-500 text-xs uppercase">Amount: </span>
                                            <span>€{parseFloat(item.quoted_amount).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                ))}
                                {parseFloat(eventQuote.travel_cost) > 0 && (
                                    <div className="flex items-center justify-between bg-white/[0.03] border border-mustard-gold/30 rounded-xl px-4 py-3 mt-3">
                                        <div>
                                            <span className="text-sm text-mustard-gold font-bold block">Travel Expense</span>
                                            <span className="text-xs text-gray-400">Calculated based on {event.distance_from_ballinasloe} km distance</span>
                                        </div>
                                        <span className="text-sm font-bold text-white">€{parseFloat(eventQuote.travel_cost).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {parseFloat(eventQuote.catering_cost) > 0 && (
                                    <div className="flex items-center justify-between bg-white/[0.03] border border-orange-500/30 rounded-xl px-4 py-3 mt-3">
                                        <div>
                                            <span className="text-sm text-orange-400 font-bold block">Catering</span>
                                            {eventFoodMenu && (
                                                <span className="text-xs text-gray-400">{eventFoodMenu.adult_count} adults + {eventFoodMenu.kid_count} kids</span>
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-white">€{parseFloat(eventQuote.catering_cost).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end space-y-1 text-sm">
                                <div className="flex items-center space-x-6">
                                    <span className="text-gray-400">Subtotal:</span>
                                    <span className="text-white font-medium w-24 text-right">€{parseFloat(eventQuote.subtotal).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                {parseFloat(eventQuote.discount_percentage) > 0 && (
                                    <div className="flex items-center space-x-6">
                                        <span className="text-gray-400">Discount ({eventQuote.discount_percentage}%):</span>
                                        <span className="text-red-400 font-medium w-24 text-right">-€{parseFloat(eventQuote.discount_amount).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="flex items-center space-x-6 pt-2 border-t border-white/10">
                                    <span className="text-mustard-gold font-semibold">Total:</span>
                                    <span className="text-white font-bold text-lg w-24 text-right">€{parseFloat(eventQuote.total).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {/* Quote Actions at Bottom */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6 pt-6 border-t border-white/10 w-full">
                                <button onClick={() => handleDownloadPdf(eventQuote.id)}
                                    className="flex items-center justify-center space-x-1.5 text-white font-medium bg-emerald-500/20 border border-emerald-500/30 px-5 py-3 md:py-2.5 rounded-xl hover:opacity-80 hover:bg-emerald-500/30 transition-all text-base md:text-sm">
                                    <Download size={16} />
                                    <span>Download PDF</span>
                                </button>
                                {!isLocked && (
                                    <button onClick={openEditQuote}
                                        className="flex items-center justify-center space-x-1.5 text-white font-medium bg-white/10 border border-white/10 px-5 py-3 md:py-2.5 rounded-xl hover:opacity-80 hover:bg-white/15 transition-all text-base md:text-sm">
                                        <Pencil size={16} />
                                        <span>Edit Quote</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Create Quote Button when empty */}
                {
                    !showQuoteForm && !eventQuote && !isLocked && (
                        <div className="flex justify-end mt-4">
                            <button type="button" onClick={openCreateQuote}
                                className="w-full sm:w-auto flex items-center justify-center space-x-2 text-deep-teal font-bold bg-gradient-to-r from-mustard-gold to-yellow-500 px-6 py-3 md:py-2.5 rounded-xl hover:opacity-80 hover:shadow-lg hover:shadow-mustard-gold/20 transition-all text-base md:text-sm">
                                <Plus size={18} />
                                <span>Create Quote</span>
                            </button>
                        </div>
                    )
                }
            </div >

            {/* Quote Create/Edit Form Modal */}
            <AnimatePresence>
                {showQuoteForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 min-h-screen">
                        {/* Scrollable Container wrapper to prevent backdrop-blur cutoff issues */}
                        <div className="fixed inset-0 w-full h-full overflow-y-auto">
                            {/* Full document backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm min-h-screen"
                                onClick={() => setShowQuoteForm(false)}
                            />

                            {/* Centered Modal Content */}
                            <div className="flex min-h-full items-center justify-center p-4 py-10 pointer-events-none">
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="relative w-full max-w-5xl bg-[#0b1015] border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl pointer-events-auto"
                                >
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <FileText size={22} className="text-mustard-gold" />
                                            <span>{editingQuote ? 'Edit Quote' : 'Create Quote'}</span>
                                        </div>
                                        <button type="button" onClick={() => setShowQuoteForm(false)} className="text-gray-400 hover:text-white transition-colors">
                                            <X size={24} />
                                        </button>
                                    </h2>
                                    <form onSubmit={handleQuoteSubmit}>
                                        {/* Services */}
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Services</h3>
                                        </div>
                                        <div className="space-y-3 mb-6">
                                            {quoteFormData.items.map((item, index) => (
                                                <div key={index} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                                        <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                                                            {(() => {
                                                                const selectedService = services.find(s => s.id === parseInt(item.service)) || null;
                                                                const isSpecialRequirement = selectedService && selectedService.name === 'Special Requirement';
                                                                return (
                                                                    <div className={isSpecialRequirement ? "md:col-span-8" : "md:col-span-5"}>
                                                                        <label className="block text-gray-400 text-xs font-medium mb-1.5">Service *</label>
                                                                        <select value={item.service}
                                                                            onChange={(e) => handleQuoteItemChange(index, 'service', e.target.value)}
                                                                            className={selectClass} required>
                                                                            <option value="" className="bg-gray-900">Select a service</option>
                                                                            {services.filter(s => s.name !== 'Catering').map(s => (
                                                                                <option key={s.id} value={s.id} className="bg-gray-900">{s.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                );
                                                            })()}
                                                            {(() => {
                                                                const selectedService = services.find(s => s.id === parseInt(item.service)) || null;
                                                                const isSpecialRequirement = selectedService && selectedService.name === 'Special Requirement';
                                                                return isSpecialRequirement ? (
                                                                    <>
                                                                        <div className="md:col-span-4">
                                                                            <label className="block text-gray-400 text-xs font-medium mb-1.5">Amount (€) *</label>
                                                                            <input type="number" value={item.quoted_amount}
                                                                                onChange={(e) => handleQuoteItemChange(index, 'quoted_amount', e.target.value)}
                                                                                className={selectClass.replace('cursor-pointer', '')} placeholder="0.00" step="0.01" min={item.minimum_amount || 0} required />
                                                                        </div>
                                                                        <div className="md:col-span-12 mt-2">
                                                                            <label className="block text-gray-400 text-xs font-medium mb-1.5">Description (Required) *</label>
                                                                            <textarea value={item.comment}
                                                                                onChange={(e) => handleQuoteItemChange(index, 'comment', e.target.value)}
                                                                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 placeholder-gray-600 transition-all" placeholder="Details for this special requirement..." rows="2" required />
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="md:col-span-3">
                                                                            <label className="block text-gray-400 text-xs font-medium mb-1.5">Min Amount (€)</label>
                                                                            <input type="number" value={item.minimum_amount}
                                                                                className="w-full bg-white/[0.02] border border-white/5 text-gray-500 px-4 py-3 rounded-xl cursor-not-allowed"
                                                                                disabled readOnly placeholder="Auto-filled" />
                                                                        </div>
                                                                        <div className="md:col-span-4">
                                                                            <label className="block text-gray-400 text-xs font-medium mb-1.5">Quoted Amount (€) *</label>
                                                                            <input type="number" value={item.quoted_amount}
                                                                                onChange={(e) => handleQuoteItemChange(index, 'quoted_amount', e.target.value)}
                                                                                className={selectClass.replace('cursor-pointer', '')} placeholder="0.00" step="0.01" min={item.minimum_amount || 0} required />
                                                                        </div>
                                                                        <div className="md:col-span-12 mt-2">
                                                                            <input type="text" value={item.comment}
                                                                                onChange={(e) => handleQuoteItemChange(index, 'comment', e.target.value)}
                                                                                className={selectClass.replace('cursor-pointer', '')} placeholder="Add a comment or note for this specific service..." />
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="md:col-span-1 flex flex-col justify-center items-center space-y-2 mt-6">
                                                            {quoteFormData.items.length > 1 && (
                                                                <button type="button" onClick={() => removeQuoteItem(index)}
                                                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove Service">
                                                                    <MinusCircle size={20} />
                                                                </button>
                                                            )}
                                                            {index === quoteFormData.items.length - 1 && (
                                                                <button type="button" onClick={addQuoteItem}
                                                                    disabled={!item.service}
                                                                    className="p-2 text-mustard-gold hover:text-yellow-400 hover:bg-mustard-gold/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-mustard-gold/5" title="Add another service">
                                                                    <Plus size={20} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {quoteTravelCost > 0 && (
                                                <div className="bg-white/[0.03] border border-mustard-gold/30 rounded-xl p-4 mt-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                                        <div className="md:col-span-11">
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="text-mustard-gold text-sm font-bold">Travel Expense</p>
                                                                    <p className="text-xs text-gray-400 mt-1">Calculated based on {event.distance_from_ballinasloe} km distance</p>
                                                                </div>
                                                                <p className="font-bold text-white">€{quoteTravelCost.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Catering Cost */}
                                        <div className="bg-white/[0.03] border border-orange-500/30 rounded-xl p-4 mt-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="text-orange-400 text-sm font-bold">Catering</p>
                                                    {eventFoodMenu ? (
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            Food menu: {eventFoodMenu.adult_count} adults × €{parseFloat(eventFoodMenu.adult_rate).toFixed(2)} + {eventFoodMenu.kid_count} kids × €{parseFloat(eventFoodMenu.kid_rate).toFixed(2)}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 mt-0.5">No food menu added yet. Add a food menu to auto-fill.</p>
                                                    )}
                                                </div>
                                                {eventFoodMenu && (
                                                    <button type="button"
                                                        onClick={() => setQuoteFormData({ ...quoteFormData, catering_cost: parseFloat(eventFoodMenu.total_cost).toFixed(2) })}
                                                        className="text-xs text-orange-400 border border-orange-500/30 bg-orange-500/10 px-3 py-1 rounded-lg hover:bg-orange-500/20 transition-all">
                                                        Auto-fill from menu
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="number"
                                                value={quoteFormData.catering_cost}
                                                onChange={(e) => setQuoteFormData({ ...quoteFormData, catering_cost: e.target.value })}
                                                className={selectClass.replace('cursor-pointer', '')}
                                                placeholder="0.00" step="0.01" min="0"
                                            />
                                        </div>

                                        {/* Quote Details */}
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-t border-white/10 pt-6">Quote Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
                                            <div>
                                                <label className="block text-gray-400 text-sm font-medium mb-2">
                                                    Discount (%)
                                                </label>
                                                <input type="number" value={quoteFormData.discount_percentage}
                                                    onChange={(e) => setQuoteFormData({ ...quoteFormData, discount_percentage: e.target.value })}
                                                    disabled={eventQuote?.status === 'accepted' || parseFloat(event?.received_amount || 0) > 0}
                                                    className={`${selectClass.replace('cursor-pointer', '')} ${eventQuote?.status === 'accepted' || parseFloat(event?.received_amount || 0) > 0 ? 'opacity-50 cursor-not-allowed bg-black/20' : ''}`}
                                                    placeholder="0" step="0.01" min="0" max="100" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-sm font-medium mb-2">Status</label>
                                                <select value={quoteFormData.status}
                                                    onChange={(e) => setQuoteFormData({ ...quoteFormData, status: e.target.value })}
                                                    className={selectClass}>
                                                    {QUOTE_STATUS_OPTIONS.map(s => (
                                                        <option key={s.value} value={s.value} className="bg-gray-900">{s.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-sm font-medium mb-2">Notes</label>
                                                <input type="text" value={quoteFormData.notes}
                                                    onChange={(e) => setQuoteFormData({ ...quoteFormData, notes: e.target.value })}
                                                    className={selectClass.replace('cursor-pointer', '')} placeholder="Optional notes..." />
                                            </div>
                                        </div>

                                        {/* Live Totals */}
                                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 mb-6">
                                            <div className="flex flex-col items-end space-y-2">
                                                <div className="flex items-center space-x-8">
                                                    <span className="text-sm text-gray-400">Subtotal:</span>
                                                    <span className="text-sm font-medium text-white w-28 text-right">
                                                        €{quoteSubtotal.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                {quoteDiscountPct > 0 && (
                                                    <div className="flex items-center space-x-8">
                                                        <span className="text-sm text-gray-400">Discount ({quoteDiscountPct}%):</span>
                                                        <span className="text-sm font-medium text-red-400 w-28 text-right">
                                                            -€{quoteDiscountAmt.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center space-x-8 pt-2 border-t border-white/10">
                                                    <span className="text-sm font-semibold text-mustard-gold">Total:</span>
                                                    <span className="text-lg font-bold text-white w-28 text-right">
                                                        €{quoteTotal.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center space-x-4">
                                            <button type="submit" disabled={quoteSubmitting || (editingQuote && !isQuoteDirty)}
                                                className="w-full flex justify-center items-center space-x-2 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold px-6 py-3.5 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                <Save size={18} />
                                                <span>{quoteSubmitting ? 'Saving...' : editingQuote ? (!isQuoteDirty ? 'No Changes' : 'Update Quote') : 'Create Quote'}</span>
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Food Menu Section ──────────────────────────────────────── */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 mb-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                            <Utensils size={20} className="text-mustard-gold" />
                            <span>Food Menu</span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {eventFoodMenu ? `Catering for ${eventFoodMenu.adult_count + eventFoodMenu.kid_count} guests` : 'No food menu added yet'}
                        </p>
                    </div>
                </div>

                {eventFoodMenu && !showFoodMenuForm && (
                    <div>
                        <div className="space-y-4 mb-6">
                            {/* Rates Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">Adults Count</span>
                                    <span className="text-lg font-bold text-white">{eventFoodMenu.adult_count}</span>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">Adult Rate</span>
                                    <span className="text-lg font-bold text-white">€{parseFloat(eventFoodMenu.adult_rate).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">Kids Count</span>
                                    <span className="text-lg font-bold text-white">{eventFoodMenu.kid_count}</span>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">Kid Rate</span>
                                    <span className="text-lg font-bold text-white">€{parseFloat(eventFoodMenu.kid_rate).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {/* Menu Items List */}
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4">
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Menu Selection</h4>
                                {eventFoodMenu.items && eventFoodMenu.items.length > 0 ? (
                                    <ul className="space-y-2 list-disc list-inside text-gray-300">
                                        {eventFoodMenu.items.map((item, i) => (
                                            <li key={i}>{item.name}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">No items specified.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-6 pt-2 border-t border-white/10 text-sm">
                            <span className="text-mustard-gold font-semibold">Total Catering Cost:</span>
                            <span className="text-white font-bold text-lg w-28 text-right">
                                €{parseFloat(eventFoodMenu.total_cost).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Food Menu Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6 pt-6 border-t border-white/10 w-full">
                            <button onClick={() => handleDownloadFoodMenuPdf(eventFoodMenu.id)}
                                className="flex items-center justify-center space-x-1.5 text-white font-medium bg-emerald-500/20 border border-emerald-500/30 px-5 py-3 md:py-2.5 rounded-xl hover:opacity-80 hover:bg-emerald-500/30 transition-all text-base md:text-sm">
                                <Download size={16} />
                                <span>Download PDF</span>
                            </button>
                            {!isLocked && (
                                <button onClick={() => setShowFoodMenuForm(true)}
                                    className="flex items-center justify-center space-x-1.5 text-white font-medium bg-white/10 border border-white/10 px-5 py-3 md:py-2.5 rounded-xl hover:opacity-80 hover:bg-white/15 transition-all text-base md:text-sm">
                                    <Pencil size={16} />
                                    <span>Edit Menu</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {!showFoodMenuForm && !eventFoodMenu && !isLocked && (
                    <div className="flex justify-end mt-4">
                        <button type="button" onClick={() => setShowFoodMenuForm(true)}
                            className="w-full sm:w-auto flex items-center justify-center space-x-2 text-deep-teal font-bold bg-gradient-to-r from-mustard-gold to-yellow-500 px-6 py-3 md:py-2.5 rounded-xl hover:opacity-80 hover:shadow-lg hover:shadow-mustard-gold/20 transition-all text-base md:text-sm">
                            <Plus size={18} />
                            <span>Create Menu</span>
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showFoodMenuForm && (
                    <FoodMenuForm
                        event={event}
                        menu={eventFoodMenu}
                        onClose={() => setShowFoodMenuForm(false)}
                        onSuccess={() => {
                            setShowFoodMenuForm(false);
                            fetchFoodMenu();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ── Right Sidebar Drawer ──────────────────────────────────── */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                            onClick={() => setSidebarOpen(false)} />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 h-full w-80 z-50 bg-[#090e11] border-l border-white/10 flex flex-col shadow-2xl">
                            <div className="flex items-center justify-between p-5 border-b border-white/10">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <SlidersHorizontal size={18} className="text-mustard-gold" />
                                    Actions & Details
                                </h2>
                                <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">

                                {/* Financial group */}
                                {event?.status !== 'finished' && !isLocked && (
                                    <>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium px-2 pt-2 pb-1">Financial</p>
                                        <button onClick={() => { setSidebarOpen(false); handleOpenPayment(); }}
                                            className="w-full flex items-center space-x-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-left">
                                            <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0"><CheckCircle size={17} /></div>
                                            <div>
                                                <p className="font-semibold text-sm">Receive Payment</p>
                                                <p className="text-xs text-gray-500">Record a new payment</p>
                                            </div>
                                        </button>
                                        <button onClick={() => { setSidebarOpen(false); setShowRefundModal(true); }}
                                            className="w-full flex items-center space-x-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all text-left">
                                            <div className="p-2 bg-rose-500/20 rounded-lg shrink-0"><RefreshCw size={17} /></div>
                                            <div>
                                                <p className="font-semibold text-sm">Make Refund</p>
                                                <p className="text-xs text-gray-500">Process a refund</p>
                                            </div>
                                        </button>
                                        <button onClick={() => { setSidebarOpen(false); setShowExpenseModal(true); }}
                                            className="w-full flex items-center space-x-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-left">
                                            <div className="p-2 bg-amber-500/20 rounded-lg shrink-0"><PlusCircle size={17} /></div>
                                            <div>
                                                <p className="font-semibold text-sm">Add Expense</p>
                                                <p className="text-xs text-gray-500">Record an event expense</p>
                                            </div>
                                        </button>
                                    </>
                                )}

                                {/* Records group */}
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium px-2 pt-4 pb-1">Records</p>
                                <button onClick={() => { setSidebarOpen(false); setShowPaymentHistoryModal(true); }}
                                    className="w-full flex items-center space-x-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all text-left">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0"><Briefcase size={17} /></div>
                                    <div>
                                        <p className="font-semibold text-sm">Payment History</p>
                                        <p className="text-xs text-gray-500">Transactions & expenses</p>
                                    </div>
                                </button>
                                <button onClick={() => { setSidebarOpen(false); setShowLogbookModal(true); }}
                                    className="w-full flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-left">
                                    <div className="p-2 bg-white/10 rounded-lg shrink-0"><BookOpen size={17} /></div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">Logbook</p>
                                        <p className="text-xs text-gray-500">{auditLog.length} entries</p>
                                    </div>
                                    {auditLog.length > 0 && <span className="bg-mustard-gold/20 text-mustard-gold text-xs px-1.5 py-0.5 rounded-md font-bold">{auditLog.length}</span>}
                                </button>

                                {/* Media group */}
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium px-2 pt-4 pb-1">Media</p>
                                <button onClick={() => { setSidebarOpen(false); setShowGalleryModal(true); }}
                                    className="w-full flex items-center space-x-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all text-left">
                                    <div className="p-2 bg-purple-500/20 rounded-lg shrink-0"><ImageIcon size={17} /></div>
                                    <div>
                                        <p className="font-semibold text-sm">Gallery</p>
                                        <p className="text-xs text-gray-500">{event?.images?.length || 0} images</p>
                                    </div>
                                </button>

                                {/* Event Management group */}
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium px-2 pt-4 pb-1">Event Management</p>
                                {event?.status !== 'finished' && event?.status !== 'canceled' && (
                                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                        <p className="text-sm font-semibold text-emerald-400 mb-1">Finish Event</p>
                                        <p className="text-xs text-gray-500 mb-3">Mark as complete once the event date has passed.</p>
                                        {!confirmingFinish ? (
                                            <button type="button" onClick={() => setConfirmingFinish(true)} disabled={!isEventOver() || finishingEvent}
                                                className="w-full flex items-center justify-center space-x-2 text-emerald-400 font-medium bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 rounded-xl hover:bg-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                                                <CheckCircle size={15} />
                                                <span>Finish Event</span>
                                            </button>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-xs text-emerald-300 text-center font-medium">Are you sure? This will mark the event as finished.</p>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => setConfirmingFinish(false)}
                                                        className="flex-1 text-gray-400 font-medium bg-white/5 border border-white/10 px-3 py-2 rounded-xl hover:bg-white/10 transition-all text-sm">
                                                        Cancel
                                                    </button>
                                                    <button type="button" onClick={() => { setConfirmingFinish(false); setSidebarOpen(false); handleFinishEvent(); }} disabled={finishingEvent}
                                                        className="flex-1 flex items-center justify-center space-x-1 text-emerald-400 font-medium bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 rounded-xl hover:bg-emerald-500/30 transition-all text-sm">
                                                        <CheckCircle size={14} />
                                                        <span>{finishingEvent ? 'Processing...' : 'Confirm'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {!isEventOver() && <p className="text-xs text-emerald-500/50 mt-2 text-center">Event date has not passed yet.</p>}
                                    </div>
                                )}
                                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                                    <p className="text-sm font-semibold text-red-400 mb-1">Danger Zone</p>
                                    <p className="text-xs text-gray-500 mb-3">Permanently delete this event. Cannot be undone.</p>
                                    {!confirmingDelete ? (
                                        <button type="button" onClick={() => setConfirmingDelete(true)}
                                            className="w-full flex items-center justify-center space-x-2 text-red-400 font-medium bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-xl hover:bg-red-500/30 transition-all text-sm">
                                            <Trash2 size={15} />
                                            <span>Delete Event</span>
                                        </button>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-xs text-red-400 font-medium text-center">Are you sure?</p>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={handleDelete}
                                                    className="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl hover:bg-red-700 text-sm">Yes, Delete</button>
                                                <button type="button" onClick={() => setConfirmingDelete(false)}
                                                    className="flex-1 bg-white/10 text-gray-300 py-2 rounded-xl hover:bg-white/15 text-sm">Cancel</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Refund Modal ──────────────────────────────────────────── */}
            <AnimatePresence>
                {showRefundModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                         onMouseDown={(e) => { if (e.target === e.currentTarget) setShowRefundModal(false); }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0b1015] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                            <button type="button" onClick={() => setShowRefundModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <RefreshCw className="text-rose-400" size={24} />
                                Make Refund
                            </h3>
                            <form onSubmit={handleReceiveRefund}>
                                <div className="space-y-4 mb-6">
                                    <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                                        <span className="text-gray-400">Total Amount Paid</span>
                                        <span className="text-emerald-400 font-semibold text-lg">€{parseFloat(event?.received_amount || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Refund Amount (€) *</label>
                                        <input type="number" value={refundAmount}
                                            onChange={(e) => {
                                                let val = e.target.value;
                                                if (val.includes('.')) { const parts = val.split('.'); val = `${parts[0]}.${parts[1].slice(0, 2)}`; }
                                                setRefundAmount(val);
                                            }}
                                            className={`${selectClass.replace('cursor-pointer', '')} border-rose-500/30 focus:border-rose-500/50 focus:ring-rose-500/50`}
                                            placeholder="0.00" step="0.01" min="0.01" max={event?.received_amount || 0} required />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Reason for Refund</label>
                                        <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)}
                                            className={`${selectClass.replace('cursor-pointer', '')} h-24 border-rose-500/30 focus:border-rose-500/50 focus:ring-rose-500/50 resize-none`}
                                            placeholder="e.g., Event canceled by client, overpaid..." />
                                    </div>
                                    {parseFloat(refundAmount || 0) > parseFloat(event?.received_amount || 0) && (
                                        <div className="text-rose-400 text-sm font-medium flex items-center gap-2 mt-2 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                                            <AlertCircle size={16} /> Refund amount cannot exceed total paid.
                                        </div>
                                    )}
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-medium">Paid Amount After Refund</span>
                                        <span className="text-white font-semibold">
                                            €{Math.max(0, parseFloat(event?.received_amount || 0) - parseFloat(refundAmount || 0)).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                                <button type="submit" disabled={refundSubmitting || parseFloat(refundAmount || 0) > parseFloat(event?.received_amount || 0)}
                                    className="w-full px-4 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {refundSubmitting ? 'Processing...' : 'Confirm Refund'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Add Expense Modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {showExpenseModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                         onMouseDown={(e) => { if (e.target === e.currentTarget) setShowExpenseModal(false); }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0b1015] border border-amber-500/20 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                            <button type="button" onClick={() => setShowExpenseModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                <PlusCircle className="text-amber-400" size={24} />
                                Add Expense
                            </h3>
                            <p className="text-sm text-gray-500 mb-5">Record an expense for <span className="text-amber-400 font-medium">{event?.event_name}</span></p>
                            <form onSubmit={handleAddExpense}>
                                <div className="space-y-4 mb-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-sm font-medium mb-2">Date *</label>
                                            <input type="date" value={expenseFormData.date}
                                                onChange={(e) => setExpenseFormData(p => ({...p, date: e.target.value}))}
                                                className={`${selectClass.replace('cursor-pointer', '')} border-amber-500/30 focus:border-amber-500/50 focus:ring-amber-500/30`}
                                                required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm font-medium mb-2">Amount (€) *</label>
                                            <input type="number" value={expenseFormData.amount}
                                                onChange={(e) => {
                                                    let val = e.target.value;
                                                    if (val.includes('.')) { const parts = val.split('.'); val = `${parts[0]}.${parts[1].slice(0, 2)}`; }
                                                    setExpenseFormData(p => ({...p, amount: val}));
                                                }}
                                                className={`${selectClass.replace('cursor-pointer', '')} border-amber-500/30 focus:border-amber-500/50 focus:ring-amber-500/30`}
                                                placeholder="0.00" step="0.01" min="0.01" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Category *</label>
                                        <select value={expenseFormData.category}
                                            onChange={(e) => setExpenseFormData(p => ({...p, category: e.target.value}))}
                                            className={`${selectClass} border-amber-500/30`} required>
                                            {['Catering', 'Decor', 'Travel', 'Equipment', 'Staff', 'Venue', 'Entertainment', 'Marketing', 'Other'].map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Description *</label>
                                        <input type="text" value={expenseFormData.reason}
                                            onChange={(e) => setExpenseFormData(p => ({...p, reason: e.target.value}))}
                                            className={`${selectClass.replace('cursor-pointer', '')} border-amber-500/30 focus:border-amber-500/50 focus:ring-amber-500/30`}
                                            placeholder="e.g., Flowers and table decorations..." required />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Approved By</label>
                                        <select value={expenseFormData.approved_by}
                                            onChange={(e) => setExpenseFormData(p => ({...p, approved_by: e.target.value}))}
                                            className={`${selectClass} border-amber-500/30`}>
                                            <option value="">— Select staff member —</option>
                                            {staffList.map(s => (
                                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Receipt URL <span className="text-gray-600 font-normal">(optional)</span></label>
                                        <input type="url" value={expenseFormData.receipt_image_url}
                                            onChange={(e) => setExpenseFormData(p => ({...p, receipt_image_url: e.target.value}))}
                                            className={`${selectClass.replace('cursor-pointer', '')} border-amber-500/30 focus:border-amber-500/50`}
                                            placeholder="https://..." />
                                    </div>
                                </div>
                                <button type="submit" disabled={expenseSubmitting}
                                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {expenseSubmitting ? 'Saving...' : 'Record Expense'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Payment History Modal ─────────────────────────────────── */}
            <AnimatePresence>
                {showPaymentHistoryModal && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/60 backdrop-blur-sm overflow-y-auto"
                         onMouseDown={(e) => { if (e.target === e.currentTarget) setShowPaymentHistoryModal(false); }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0b1015] border border-indigo-500/20 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative mb-8">
                            <button type="button" onClick={() => setShowPaymentHistoryModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                <Briefcase className="text-indigo-400" size={22} />
                                Payment History
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">Transactions for <span className="text-indigo-400 font-medium">{event?.event_name}</span></p>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Quote Total</span>
                                    <p className="text-lg font-bold text-white mt-1">€{parseFloat(event?.budget || eventQuote?.total || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Discount</span>
                                    <p className="text-lg font-bold text-amber-400 mt-1">€{parseFloat(event?.payment_discount || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Paid</span>
                                    <p className="text-lg font-bold text-emerald-400 mt-1">€{parseFloat(event?.received_amount || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Balance Due</span>
                                    <p className="text-lg font-bold text-rose-400 mt-1">€{Math.max(0, parseFloat(event?.budget || eventQuote?.total || 0) - parseFloat(event?.received_amount || 0) - parseFloat(event?.payment_discount || 0)).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                            </div>

                            {/* Event Expenses */}
                            {eventExpenses.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                                        <PlusCircle size={13} className="text-amber-400" /> Event Expenses
                                    </h4>
                                    <div className="space-y-2">
                                        {eventExpenses.map(exp => (
                                            <div key={exp.id} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl">
                                                <div>
                                                    <p className="text-sm font-medium text-white">{exp.reason}</p>
                                                    <p className="text-xs text-gray-500">{exp.category} — {new Date(exp.date).toLocaleDateString('en-IE')}</p>
                                                </div>
                                                <span className="text-amber-400 font-bold text-sm">€{parseFloat(exp.amount).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-2 border-t border-amber-500/20">
                                            <span className="text-sm text-gray-400 font-medium">Total Expenses</span>
                                            <span className="text-amber-400 font-bold">€{eventExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Transaction Timeline */}
                            <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Timeline of Transactions</h4>
                            <div className="relative pl-6 border-l-2 border-white/10 space-y-5">
                                {timelineNodes.map((node) => {
                                    const isQuote = node.type === 'quote';
                                    let prefix = '';
                                    if (node.type === 'payment' || node.type === 'discount_reduce') prefix = '+';
                                    else if (node.type === 'refund' || node.type === 'discount') prefix = '-';
                                    const amountStr = `${prefix}€${node.amount.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                    const displayAmtStr = isQuote ? `€${node.amount.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : amountStr;
                                    const Icon = node.icon === 'Briefcase' ? Briefcase : node.icon === 'DollarSign' ? DollarSign : node.icon === 'CheckCircle' ? CheckCircle : RefreshCw;
                                    const THEMES = {
                                        'mustard-gold': { tag: 'bg-mustard-gold', grad: 'from-mustard-gold/10', border: 'border-mustard-gold/20', iconBg: 'bg-mustard-gold/20', text: 'text-mustard-gold', amount: 'text-white' },
                                        'emerald': { tag: 'bg-emerald-400', grad: 'from-emerald-500/10', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/20', text: 'text-emerald-400', amount: 'text-emerald-400' },
                                        'rose': { tag: 'bg-rose-400', grad: 'from-rose-500/10', border: 'border-rose-500/20', iconBg: 'bg-rose-500/20', text: 'text-rose-400', amount: 'text-rose-400' },
                                        'blue': { tag: 'bg-blue-400', grad: 'from-blue-500/10', border: 'border-blue-500/20', iconBg: 'bg-blue-500/20', text: 'text-blue-400', amount: 'text-blue-400' },
                                        'gray': { tag: 'bg-gray-400', grad: 'from-gray-500/10', border: 'border-gray-500/20', iconBg: 'bg-gray-500/20', text: 'text-gray-400', amount: 'text-gray-400' },
                                    };
                                    const theme = THEMES[node.colorTheme];
                                    return (
                                        <div key={node.id} className="relative">
                                            <div className={`absolute -left-[35px] mt-4 w-4 h-4 rounded-full border-2 border-[#090e11] ring-2 ring-white/10 ${theme.tag}`} />
                                            <div className={`bg-gradient-to-br ${theme.grad} to-white/[0.02] ${theme.border} border p-4 rounded-xl flex flex-col sm:flex-row gap-3 justify-between sm:items-center`}>
                                                <div className="flex items-start sm:items-center space-x-3">
                                                    <div className={`p-2.5 rounded-xl shrink-0 ${theme.iconBg} ${theme.text}`}><Icon size={17} /></div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm">{node.title}</h4>
                                                        {node.type === 'quote' || node.type === 'discount' || node.type === 'discount_reduce' ? (
                                                            <p className="text-xs text-gray-400 mt-0.5">{node.description}</p>
                                                        ) : (
                                                            <p className="text-xs text-gray-400 mt-0.5">{new Date(node.timestamp).toLocaleString('en-IE', { dateStyle: 'medium', timeStyle: 'short' })} · {node.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t border-white/5 sm:border-0 pt-2 sm:pt-0 mt-1 sm:mt-0 shrink-0">
                                                    <div className={`text-lg font-bold ${theme.amount}`}>{displayAmtStr}</div>
                                                    <div className="text-xs text-mustard-gold font-medium mt-0.5">Balance: €{node.balance.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Gallery Modal ─────────────────────────────────────────── */}
            <AnimatePresence>
                {showGalleryModal && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/60 backdrop-blur-sm overflow-y-auto"
                         onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowGalleryModal(false); setShowImageForm(false); } }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0b1015] border border-purple-500/20 rounded-2xl p-6 w-full max-w-3xl shadow-2xl relative mb-8">
                            <button type="button" onClick={() => { setShowGalleryModal(false); setShowImageForm(false); }} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <ImageIcon className="text-purple-400" size={22} />
                                            Gallery
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">{event?.images?.length || 0} images · {event?.event_name}</p>
                                    </div>
                                </div>
                                {!showImageForm && !isLocked && (
                                    <button type="button" onClick={() => setShowImageForm(true)}
                                        className="w-full flex items-center justify-center space-x-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-medium px-4 py-3 rounded-xl hover:bg-purple-500/20 transition-all text-sm">
                                        <Plus size={16} /><span>+ Add Image</span>
                                    </button>
                                )}
                            </div>

                            <AnimatePresence>
                                {showImageForm && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
                                        <form onSubmit={handleImageSubmit} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                                            <div className="flex items-center space-x-3 mb-5">
                                                <button type="button" onClick={() => setImageUploadType('url')}
                                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${imageUploadType === 'url' ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                                                    <LinkIcon size={15} /><span>Image URLs</span>
                                                </button>
                                                <button type="button" onClick={() => setImageUploadType('upload')}
                                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${imageUploadType === 'upload' ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                                                    <Upload size={15} /><span>Upload</span>
                                                </button>
                                            </div>
                                            <div className="space-y-4 mb-5">
                                                {imageUploadType === 'url' ? (
                                                    <div className="space-y-3">
                                                        {urlItems.map((item, index) => (
                                                            <div key={index} className="flex gap-3 items-start bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                                                <div className="flex-1 space-y-3">
                                                                    <div>
                                                                        <label className="block text-gray-400 text-xs font-medium mb-1.5">Image URL *</label>
                                                                        <input type="url" required value={item.url} onChange={(e) => handleUrlChange(index, 'url', e.target.value)} className={selectClass.replace('cursor-pointer', '')} placeholder="https://..." />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-gray-400 text-xs font-medium mb-1.5">Description</label>
                                                                        <input type="text" value={item.description} onChange={(e) => handleUrlChange(index, 'description', e.target.value)} className={selectClass.replace('cursor-pointer', '')} placeholder="Optional description..." />
                                                                    </div>
                                                                </div>
                                                                {urlItems.length > 1 && (
                                                                    <button type="button" onClick={() => handleRemoveUrlRow(index)} className="mt-6 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0">
                                                                        <Trash2 size={17} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button type="button" onClick={handleAddUrlRow} className="flex items-center space-x-2 text-purple-400 font-medium text-sm hover:text-purple-300 transition-colors">
                                                            <Plus size={15} /><span>Add Another URL</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <label className="block text-gray-400 text-sm font-medium mb-1">Select Files *</label>
                                                        <input type="file" accept="image/*" multiple onChange={handleFileSelect}
                                                            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600" />
                                                        {fileItems.length > 0 && (
                                                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                                                {fileItems.map((item, index) => (
                                                                    <div key={index} className="flex gap-3 items-center bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                                                                        <img src={item.preview} alt="preview" className="w-14 h-14 object-cover rounded-lg shrink-0" />
                                                                        <div className="flex-1">
                                                                            <input type="text" value={item.description} onChange={(e) => handleFileDescChange(index, e.target.value)} className={selectClass.replace('cursor-pointer', '')} placeholder="Optional description..." />
                                                                        </div>
                                                                        <button type="button" onClick={() => handleRemoveFile(index)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0">
                                                                            <X size={17} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button type="submit" disabled={imageSubmitting}
                                                    className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
                                                    <Save size={15} /><span>{imageSubmitting ? 'Saving...' : 'Save Image'}</span>
                                                </button>
                                                <button type="button" onClick={() => setShowImageForm(false)}
                                                    className="flex items-center space-x-2 bg-white/10 border border-white/10 text-gray-300 font-medium px-5 py-2.5 rounded-xl hover:bg-white/15 transition-all">
                                                    <X size={15} /><span>Cancel</span>
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {event?.images && event.images.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {event.images.map(img => (
                                        <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                                            <img src={img.image || img.image_url} alt={img.description || 'Event Gallery Image'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                                                <div className="flex justify-end">
                                                    {!isLocked && (
                                                        <button type="button" onClick={() => handleDeleteImage(img.id)} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-white text-xs text-center truncate px-2">{img.description || 'No description'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
                                    <p>No images yet. Click &quot;Add Image&quot; to upload.</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Logbook Modal ─────────────────────────────────────────── */}
            <AnimatePresence>
                {showLogbookModal && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/60 backdrop-blur-sm overflow-y-auto"
                         onMouseDown={(e) => { if (e.target === e.currentTarget) setShowLogbookModal(false); }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0b1015] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative mb-8">
                            <button type="button" onClick={() => setShowLogbookModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                <BookOpen className="text-mustard-gold" size={22} />
                                Change Logbook
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">{auditLog.length} entries · <span className="text-mustard-gold font-medium">{event?.event_name}</span></p>
                            {auditLog.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                                    <p>No logbook entries yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {auditLog.map((entry, idx) => (
                                        <LogbookEntry key={idx} entry={entry} isFirst={idx === 0} isLast={idx === auditLog.length - 1} eventId={id} logIdx={idx} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};


/* ── Logbook Entry Component ─────────────────────────────────────── */

const LogbookEntry = ({ entry, isFirst, isLast, eventId, logIdx }) => {
    const [expanded, setExpanded] = useState(isFirst);
    const isCreated = entry.action === 'created';
    const isQuoteAction = entry.action === 'quote_created' || entry.action === 'quote_updated';
    const isPaymentAction = entry.action === 'payment_received';
    const isRefundAction = entry.action === 'refund_made';

    const GRID_FIELDS = [
        { key: 'event_name', label: 'Event Name' },
        { key: 'event_type', label: 'Event Type' },
        { key: 'client_name', label: 'Client Name' },
        { key: 'client_email', label: 'Client Email' },
        { key: 'client_phone', label: 'Client Phone' },
        { key: 'client_address', label: 'Client Address' },
        { key: 'event_date', label: 'Event Date' },
        { key: 'end_date', label: 'End Date' },
        { key: 'hall_available_from', label: 'Hall Available From' },
        { key: 'venue', label: 'Venue' },
        { key: 'venue_address', label: 'Venue Address' },
        { key: 'guest_count', label: 'Guest Count' },
        { key: 'budget', label: 'Customer Budget' },
        { key: 'received_amount', label: 'Received Payment' },
        { key: 'payment_discount', label: 'Payment Discount' },
        { key: 'status', label: 'Status' },
        { key: 'assigned_to_name', label: 'Assigned To' },
    ];

    const snapshot = entry.snapshot || {};

    const formatValue = (key, providedVal = undefined) => {
        const val = providedVal !== undefined ? providedVal : snapshot[key];
        if (key === 'status') return getStatusLabel(val || '');
        if (key === 'event_type') return getTypeLabel(val || '');
        if (key === 'event_date' || key === 'end_date' || key === 'hall_available_from') return formatDateTime(val);
        if (key === 'budget') return val ? `€${parseFloat(val).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
        return val ?? '—';
    };

    const descriptionVal = snapshot.description || '—';
    const specialReqVal = snapshot.special_requirements || '—';

    const getActionLabel = () => {
        if (entry.action === 'created') return 'Event Created';
        if (entry.action === 'updated') return 'Event Updated';
        if (entry.action === 'quote_created') return 'Quote Created';
        if (entry.action === 'quote_updated') return 'Quote Updated';
        if (entry.action === 'payment_received') return 'Payment Received';
        if (entry.action === 'refund_made') return 'Refund Made';
        return entry.action;
    };

    const getActionColor = () => {
        if (isCreated) return 'bg-emerald-400';
        if (isQuoteAction) return 'bg-pink-400';
        if (isPaymentAction) return 'bg-indigo-400';
        if (isRefundAction) return 'bg-rose-400';
        return 'bg-amber-400';
    };

    const getBorderColor = () => {
        if (isCreated) return 'border-emerald-500/20 bg-emerald-500/5';
        if (isQuoteAction) return 'border-pink-500/20 bg-pink-500/5';
        if (isPaymentAction) return 'border-indigo-500/30 bg-indigo-500/10';
        if (isRefundAction) return 'border-rose-500/30 bg-rose-500/10';
        return 'border-white/10 bg-white/[0.02]';
    };

    return (
        <div className={`border rounded-xl overflow-hidden ${getBorderColor()}`}>
            <div
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors cursor-pointer"
            >
                <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getActionColor()}`} />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white">
                            {getActionLabel()}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {formatDateTime(entry.timestamp)} — by <span className="text-gray-400">{entry.user}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                    {isPaymentAction && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const token = localStorage.getItem('access_token');
                                const url = `${API_BASE_URL}/events/${eventId}/invoice/pdf/?token=${token}&logIdx=${logIdx}`;
                                window.open(url, '_blank');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors border border-indigo-500/30 text-xs font-medium"
                        >
                            <Download size={14} /> <span className="hidden sm:inline">Invoice</span>
                        </button>
                    )}
                    {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 border-t border-white/5">
                            {isPaymentAction ? (
                                <div className="mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                        <div className="flex items-center justify-between py-2 border-b border-indigo-500/20">
                                            <span className="text-xs text-indigo-300">Quoted Amount</span>
                                            <span className="text-sm font-semibold text-white">€{parseFloat(entry.quoted_amount || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-indigo-500/20">
                                            <span className="text-xs text-indigo-300">Total Amount Received</span>
                                            <span className="text-sm font-semibold text-white">€{parseFloat(entry.total_amount_received || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-indigo-500/20">
                                            <span className="text-xs text-indigo-300 font-bold">Amount Received Now</span>
                                            <span className="text-lg font-bold text-emerald-400">+€{parseFloat(entry.amount_received_now || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-indigo-500/20">
                                            <span className="text-xs text-indigo-300 font-bold">Remaining Balance</span>
                                            <span className="text-lg font-bold text-mustard-gold">€{parseFloat(entry.remaining_balance || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : isRefundAction ? (
                                <div className="mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                        <div className="flex items-center justify-between py-2 border-b border-rose-500/20">
                                            <span className="text-xs text-rose-300">Previous Amount Paid</span>
                                            <span className="text-sm font-semibold text-white">€{parseFloat(entry.previous_received_amount || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-rose-500/20">
                                            <span className="text-xs text-rose-300 font-bold">Amount Refunded</span>
                                            <span className="text-lg font-bold text-rose-400">-€{parseFloat(entry.amount_refunded || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-rose-500/20">
                                            <span className="text-xs text-rose-300">New Amount Paid</span>
                                            <span className="text-sm font-semibold text-white">€{parseFloat(entry.new_received_amount || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-rose-500/20">
                                            <span className="text-xs text-rose-300 font-bold">New Balance Due</span>
                                            <span className="text-lg font-bold text-mustard-gold">€{parseFloat(entry.balance_due || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        {entry.reason && (
                                            <div className="md:col-span-2 mt-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                                                <span className="text-xs text-rose-300 block font-medium mb-1">Reason for Refund</span>
                                                <p className="text-sm text-white italic">{entry.reason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : isQuoteAction ? (
                                /* Quote action details */
                                <div className="mt-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                                        <div className="flex items-baseline py-1 border-b border-white/5">
                                            <span className="text-xs text-gray-500 w-32 flex-shrink-0">Quote #</span>
                                            <span className="text-xs text-gray-300">{entry.quote_id}</span>
                                        </div>
                                        <div className="flex items-baseline py-1 border-b border-white/5">
                                            <span className="text-xs text-gray-500 w-32 flex-shrink-0">Status</span>
                                            <span className="text-xs text-gray-300">{entry.quote_status}</span>
                                        </div>
                                        {entry.quote_subtotal && (
                                            <div className="flex items-baseline py-1 border-b border-white/5">
                                                <span className="text-xs text-gray-500 w-32 flex-shrink-0">Subtotal</span>
                                                <span className="text-xs text-gray-300">€{parseFloat(entry.quote_subtotal).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        {entry.quote_discount && parseFloat(entry.quote_discount) > 0 && (
                                            <div className="flex items-baseline py-1 border-b border-white/5">
                                                <span className="text-xs text-gray-500 w-32 flex-shrink-0">Discount</span>
                                                <span className="text-xs text-red-400">-€{parseFloat(entry.quote_discount).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        <div className="flex items-baseline py-1 border-b border-white/5">
                                            <span className="text-xs font-bold text-mustard-gold w-32 flex-shrink-0">Total to Pay</span>
                                            <span className="text-xs font-bold text-mustard-gold">€{parseFloat(entry.quote_total || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="md:col-span-2 mt-2">
                                            <span className="text-xs text-gray-500 mb-2 block font-medium">Quote Line Items</span>
                                            {entry.services_detail && entry.services_detail.length > 0 ? (
                                                <div className="space-y-2">
                                                    {entry.services_detail.map((svc, idx) => (
                                                        <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-2.5 flex justify-between items-start">
                                                            <div className="flex-1 pr-4">
                                                                <span className="text-sm font-medium text-white block">
                                                                    {svc.name === 'Special Requirement' && svc.description ? svc.description : svc.name}
                                                                </span>
                                                                {svc.name !== 'Special Requirement' && svc.description && (
                                                                    <span className="text-xs text-gray-400 block mt-0.5">{svc.description}</span>
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-medium text-mustard-gold mt-0.5">
                                                                €{parseFloat(svc.amount || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-300">{(entry.services || []).join(', ') || '—'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : isCreated ? (
                                /* Event created complete snapshot details */
                                <>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-3 mb-2">Initial State</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                                        {GRID_FIELDS.map(({ key, label }) => (
                                            <div key={key} className="flex items-baseline py-1 border-b border-white/5">
                                                <span className="text-xs text-gray-500 w-32 flex-shrink-0">{label}</span>
                                                <span className="text-xs text-gray-300 truncate">{formatValue(key, snapshot?.[key]) || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 py-2 border-b border-white/5">
                                        <span className="text-xs text-gray-500 block mb-1">Description</span>
                                        <p className="text-xs text-gray-300 whitespace-pre-wrap break-words">{snapshot?.description || '—'}</p>
                                    </div>
                                    <div className="mt-2 py-2">
                                        <span className="text-xs text-gray-500 block mb-1">Event Notes</span>
                                        <p className="text-xs text-gray-300 whitespace-pre-wrap break-words">{snapshot?.notes || '—'}</p>
                                    </div>
                                </>
                            ) : entry.changes ? (
                                /* Event update mapped changes component */
                                <div className="mt-3">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Updated Details</p>
                                    <div className="space-y-4">
                                        {Object.entries(entry.changes)
                                            .sort(([keyA], [keyB]) => {
                                                const order = [
                                                    'event_name', 'event_type', 'description',
                                                    'client_name', 'client_email', 'client_phone', 'client_address',
                                                    'event_date', 'end_date', 'venue', 'distance_from_ballinasloe', 'venue_address',
                                                    'guest_count', 'budget', 'status', 'assigned_to', 'notes'
                                                ];
                                                const aIdx = order.indexOf(keyA);
                                                const bIdx = order.indexOf(keyB);
                                                if (aIdx === -1 && bIdx === -1) return 0;
                                                if (aIdx === -1) return 1;
                                                if (bIdx === -1) return -1;
                                                return aIdx - bIdx;
                                            })
                                            .map(([field, diff]) => {
                                                const isLongText = field === 'description' || field === 'notes' || field === 'special_requirements';
                                                const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                                                if (isLongText) {
                                                    return (
                                                        <div key={field} className="border-b border-white/5 pb-2">
                                                            <span className="text-xs text-gray-500 font-medium block mb-1">{fieldLabel}</span>
                                                            <div className="text-xs text-gray-300 whitespace-pre-wrap break-words">{diff.new || '—'}</div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={field} className="flex flex-col sm:flex-row sm:items-baseline py-2 border-b border-white/5 last:border-0 last:pb-0">
                                                        <span className="text-xs text-gray-400 w-32 flex-shrink-0 font-medium">{fieldLabel}</span>
                                                        <div className="flex items-center space-x-3 mt-1 sm:mt-0 flex-1 min-w-0">
                                                            <span className="text-xs text-emerald-400 font-medium truncate flex-1">{formatValue(field, diff.new)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


export default EventDetails;
