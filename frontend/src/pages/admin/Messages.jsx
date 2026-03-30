import { useState, useEffect } from 'react';
import { Search, Mail, CheckCircle, XCircle, Reply, MessageSquare, Phone, Trash2, CheckSquare, ChevronDown, ChevronUp, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [replySuccess, setReplySuccess] = useState('');
    const [replyError, setReplyError] = useState('');
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
    const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await api.get('/messages/');
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.patch(`/messages/${id}/`, { status: newStatus });
            fetchMessages();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Open the message detail modal AND mark as read
    const openMessage = (msg, markAsRead = true) => {
        setSelectedMessage(msg);
        setReplyContent('');
        setReplySuccess('');
        setReplyError('');
        if (markAsRead && msg.status === 'unread') {
            handleStatusUpdate(msg.id, 'read');
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        setSendingReply(true);
        setReplyError('');
        setReplySuccess('');
        try {
            await api.post(`/messages/${selectedMessage.id}/reply/`, { reply: replyContent });
            setReplyContent('');
            setReplySuccess('Reply sent successfully!');
            fetchMessages();
            // Update selectedMessage status locally so the UI reflects it
            setSelectedMessage(prev => prev ? { ...prev, status: 'replied' } : null);
        } catch (error) {
            console.error('Error sending reply:', error);
            setReplyError('Failed to send reply. Please check your email settings.');
        } finally {
            setSendingReply(false);
        }
    };

    const handleDeleteSingle = async (id) => {
        try {
            await api.delete(`/messages/${id}/`);
            setSelectedMessage(null);
            setConfirmingDeleteId(null);
            fetchMessages();
        } catch (error) {
            console.error('Error deleting message:', error);
            setConfirmingDeleteId(null);
        }
    };

    const handleBulkDelete = async () => {
        setDeleting(true);
        try {
            await api.post('/messages/bulk_delete/', { ids: selectedMessages });
            setSelectedMessages([]);
            setConfirmingBulkDelete(false);
            fetchMessages();
        } catch (error) {
            console.error('Error in bulk delete:', error);
            setConfirmingBulkDelete(false);
        } finally {
            setDeleting(false);
        }
    };

    const toggleSelection = (id, e) => {
        e.stopPropagation();
        setSelectedMessages(prev =>
            prev.includes(id) ? prev.filter(msgId => msgId !== id) : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        const currentlyDisplayedIds = filteredMessages.map(m => m.id);
        const allSelected = currentlyDisplayedIds.every(id => selectedMessages.includes(id));
        if (allSelected) {
            setSelectedMessages(prev => prev.filter(id => !currentlyDisplayedIds.includes(id)));
        } else {
            const newSelections = new Set([...selectedMessages, ...currentlyDisplayedIds]);
            setSelectedMessages(Array.from(newSelections));
        }
    };

    // Build WhatsApp URL using customer's phone number
    const getWhatsAppUrl = (msg) => {
        const text = encodeURIComponent(`Hi ${msg.name}, regarding your inquiry to Crystal Events: `);
        if (msg.phone) {
            // Strip +, spaces, dashes, brackets
            let cleanPhone = msg.phone.replace(/[\+\s\-\(\)]/g, '');

            // WhatsApp requires a country code. If starts with 00, strip it. If simply starts with 0, add default country code.
            if (cleanPhone.startsWith('00')) {
                cleanPhone = cleanPhone.substring(2);
            } else if (cleanPhone.startsWith('0')) {
                // If it looks like a UK mobile (07...), use 44. Otherwise default to Ireland (353).
                if (cleanPhone.startsWith('07')) {
                    cleanPhone = '44' + cleanPhone.substring(1);
                } else {
                    cleanPhone = '353' + cleanPhone.substring(1);
                }
            }

            return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
        }
        // Fallback: open WhatsApp web with just the text (no phone = user picks contact)
        return `https://api.whatsapp.com/send?text=${text}`;
    };

    const filteredMessages = messages.filter(msg => {
        const matchesFilter = filter === 'all' || msg.status === filter;
        const matchesSearch =
            msg.name.toLowerCase().includes(search.toLowerCase()) ||
            msg.email.toLowerCase().includes(search.toLowerCase()) ||
            msg.message.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'unread': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case 'read': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'replied': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            default: return 'bg-gray-500/10 text-gray-400';
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Messages</h1>
                <p className="text-gray-400 mt-1">View and respond to customer inquiries</p>
            </div>

            {/* Controls */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden mb-6">
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
                <div className={`p-4 px-6 md:p-6 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 text-sm rounded-xl pl-9 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600 transition-all"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'unread', 'read', 'replied'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2.5 rounded-xl capitalize text-sm font-medium transition-all ${filter === f
                                        ? 'bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold'
                                        : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedMessages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6 flex items-center justify-between bg-white/5 border border-white/10 px-6 py-3 rounded-xl"
                    >
                        <span className="text-white font-medium">{selectedMessages.length} selected</span>
                        {!confirmingBulkDelete ? (
                            <button
                                onClick={() => setConfirmingBulkDelete(true)}
                                className="flex items-center gap-2 bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                                <Trash2 size={16} />
                                <span>Delete Selected</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-red-400 font-medium">Are you sure?</span>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={deleting}
                                    className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                                <button
                                    onClick={() => setConfirmingBulkDelete(false)}
                                    className="bg-white/10 border border-white/10 text-gray-300 font-medium px-4 py-2 rounded-lg hover:bg-white/15 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages Table */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                <div className="w-full">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="px-6 py-3 w-12">
                                        <button onClick={toggleAllSelection} className="text-gray-400 hover:text-white transition-colors" title="Select all visible">
                                            <CheckSquare size={16}
                                                className={filteredMessages.length > 0 && filteredMessages.every(m => selectedMessages.includes(m.id)) ? 'text-mustard-gold' : ''}
                                            />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {filteredMessages.map((msg) => (
                                    <tr
                                        key={msg.id}
                                        className={`hover:bg-white/5 transition-colors cursor-pointer ${msg.status === 'unread' ? 'bg-white/[0.02]' : ''
                                            }`}
                                        onClick={() => openMessage(msg, true)}
                                    >
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedMessages.includes(msg.id)}
                                                onChange={(e) => toggleSelection(msg.id, e)}
                                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase ${getStatusColor(msg.status)}`}>
                                                {msg.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`${msg.status === 'unread' ? 'text-white font-medium' : 'text-gray-300'}`}>{msg.name}</div>
                                            <div className="text-xs text-gray-500">{msg.email}</div>
                                            {msg.phone && <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={10} />{msg.phone}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-mustard-gold text-sm">{msg.service_name || '-'}</td>
                                        <td className="px-6 py-4 max-w-xs truncate text-gray-400">{msg.message}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                            {format(new Date(msg.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openMessage(msg, true);
                                                }}
                                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-mustard-gold transition-colors"
                                                title="Reply"
                                            >
                                                <Reply size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List View (WhatsApp Style) */}
                    <div className="md:hidden divide-y divide-white/5">
                        {/* Global Select All for Mobile */}
                        {filteredMessages.length > 0 && (
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filteredMessages.length > 0 && filteredMessages.every(m => selectedMessages.includes(m.id))}
                                        onChange={toggleAllSelection}
                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold cursor-pointer"
                                    />
                                    Select All
                                </label>
                            </div>
                        )}

                        {filteredMessages.map((msg) => (
                            <div key={msg.id}
                                className={`p-4 transition-colors cursor-pointer group flex gap-3 ${msg.status === 'unread' ? 'bg-white/[0.04]' : 'hover:bg-white/5'}`}
                                onClick={() => openMessage(msg, true)}
                            >
                                <div className="flex-shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedMessages.includes(msg.id)}
                                        onChange={(e) => toggleSelection(msg.id, e)}
                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-mustard-gold focus:ring-mustard-gold cursor-pointer"
                                    />
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className={`text-base truncate ${msg.status === 'unread' ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>{msg.name}</h3>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap pt-1 flex-shrink-0">{format(new Date(msg.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="text-xs text-mustard-gold truncate">{msg.service_name || 'General Inquiry'}</div>
                                    <div className="text-sm text-gray-400 line-clamp-2 leading-snug">{msg.message}</div>

                                    <div className="flex justify-between items-center mt-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase border ${getStatusColor(msg.status)}`}>
                                            {msg.status}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openMessage(msg, true);
                                            }}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-mustard-gold transition-colors"
                                            title="Reply"
                                        >
                                            <Reply size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {filteredMessages.length === 0 && (
                    <div className="p-12 text-center text-gray-500">No messages found.</div>
                )}
            </div>

            {/* Message Detail / Reply Modal */}
            <AnimatePresence>
                {selectedMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setSelectedMessage(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0d2424] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{selectedMessage.name}</h3>
                                    <p className="text-mustard-gold text-sm">{selectedMessage.email}</p>
                                    {selectedMessage.phone && (
                                        <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-1">
                                            <Phone size={14} /> {selectedMessage.phone}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {confirmingDeleteId === selectedMessage.id ? (
                                        <>
                                            <span className="text-xs text-red-400 font-medium">Delete?</span>
                                            <button onClick={() => handleDeleteSingle(selectedMessage.id)}
                                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors">
                                                Yes
                                            </button>
                                            <button onClick={() => setConfirmingDeleteId(null)}
                                                className="px-3 py-1.5 bg-white/10 text-gray-300 text-xs font-medium rounded-lg hover:bg-white/15 transition-colors">
                                                No
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => setConfirmingDeleteId(selectedMessage.id)}
                                            className="p-2 hover:bg-red-500/10 rounded-xl text-gray-400 hover:text-red-400 transition-colors"
                                            title="Delete Message">
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button onClick={() => { setSelectedMessage(null); setConfirmingDeleteId(null); }}
                                        className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                                        <XCircle size={22} />
                                    </button>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="p-6 space-y-6">
                                <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                                        {format(new Date(selectedMessage.created_at), 'PPpp')} • {selectedMessage.service_name || 'General Inquiry'}
                                    </p>
                                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
                                </div>

                                {/* Reply Success */}
                                {replySuccess && (
                                    <div className="text-emerald-400 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl">
                                        <CheckCircle size={20} />
                                        <span className="font-medium">{replySuccess}</span>
                                    </div>
                                )}

                                {/* Reply Error */}
                                {replyError && (
                                    <div className="text-red-400 flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                                        <XCircle size={20} />
                                        <span className="font-medium">{replyError}</span>
                                    </div>
                                )}

                                {/* Already Replied */}
                                {selectedMessage.status === 'replied' && (
                                    <div className="space-y-4 pt-4 border-t border-white/10">
                                        <h4 className="text-lg font-bold text-white flex items-center space-x-2">
                                            <Mail size={18} className="text-mustard-gold" />
                                            <span>Our Reply</span>
                                        </h4>
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-xl">
                                            <p className="text-[10px] text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <CheckCircle size={12} />
                                                SENT {selectedMessage.replied_at ? `ON ${format(new Date(selectedMessage.replied_at), 'PPpp')}` : ''}
                                            </p>
                                            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedMessage.reply_text}</p>
                                        </div>
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={() => {
                                                    // Allow re-replying by temporarily changing local state
                                                    setSelectedMessage(prev => ({...prev, status: 'read'}));
                                                    setReplyContent(selectedMessage.reply_text);
                                                }}
                                                className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                                            >
                                                <Reply size={14} /> Send another reply
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selectedMessage.status !== 'replied' && (
                                    <form onSubmit={handleReply} className="space-y-4 pt-4 border-t border-white/10">
                                        <h4 className="text-lg font-bold text-white flex items-center space-x-2">
                                            <Mail size={18} className="text-mustard-gold" />
                                            <span>Send Reply</span>
                                        </h4>
                                        <textarea
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            rows="5"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-mustard-gold/50 focus:border-mustard-gold/50 placeholder-gray-600"
                                            placeholder="Type your reply here..."
                                            required
                                        />
                                        <div className="flex flex-wrap justify-end gap-3">
                                            <button type="button" onClick={() => setSelectedMessage(null)}
                                                className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                                Cancel
                                            </button>
                                            <button type="submit" disabled={sendingReply}
                                                className="px-6 py-2.5 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all flex items-center gap-2 disabled:opacity-50">
                                                {sendingReply ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-deep-teal" />
                                                ) : (
                                                    <Reply size={18} />
                                                )}
                                                Send Reply
                                            </button>
                                            <a href={getWhatsAppUrl(selectedMessage)}
                                                target="_blank" rel="noreferrer"
                                                className={`px-5 py-2.5 border font-medium rounded-xl transition-all flex items-center gap-2 ${selectedMessage.phone
                                                    ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                                                    : 'border-gray-600/30 text-gray-500 hover:bg-white/5'
                                                    }`}
                                                title={selectedMessage.phone
                                                    ? `Open WhatsApp for ${selectedMessage.phone}`
                                                    : 'No phone number provided — opens WhatsApp without a contact'}
                                            >
                                                <MessageSquare size={18} />
                                                WhatsApp
                                                {!selectedMessage.phone && <span className="text-xs">(no phone)</span>}
                                            </a>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Messages;
