// ── Shared constants used across admin pages ──

export const EVENT_TYPES = [
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

export const EVENT_STATUS_OPTIONS = [
    { value: 'enquiry', label: 'Enquiry', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { value: 'finished', label: 'Finished', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { value: 'canceled', label: 'Canceled', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

export const QUOTE_STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
    { value: 'sent', label: 'Sent', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { value: 'accepted', label: 'Accepted', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

export const EXPENSE_CATEGORIES = [
    'Decor', 'Catering', 'Venue', 'Logistics', 'Entertainment', 'Staffing', 'Marketing', 'Stationery', 'Profit Payout', 'Other'
];

export const INCOME_CATEGORIES = [
    'Investment', 'Sales', 'Tip', 'Other'
];

// ── Lookup helpers ──

export const getStatusStyle = (status) =>
    EVENT_STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

export const getStatusLabel = (status) =>
    EVENT_STATUS_OPTIONS.find(s => s.value === status)?.label || status;

export const getTypeLabel = (type) =>
    EVENT_TYPES.find(t => t.value === type)?.label || type;

export const getQuoteStatusStyle = (status) =>
    QUOTE_STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

export const getQuoteStatusLabel = (status) =>
    QUOTE_STATUS_OPTIONS.find(s => s.value === status)?.label || status;
