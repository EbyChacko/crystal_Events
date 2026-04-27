import { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Percent, DollarSign, Users, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { inputClass, labelClass } from '../../utils/classes';
import { useToast } from '../../context/ToastContext';

const defaultItem = { name: '', amount: '' };

const FoodMenuForm = ({ event, menu, onClose, onSuccess }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [adultCount, setAdultCount] = useState(0);
    const [adultRate, setAdultRate] = useState(0);
    const [kidCount, setKidCount] = useState(0);
    const [kidRate, setKidRate] = useState(0);
    const [items, setItems] = useState([{ ...defaultItem }]);

    useEffect(() => {
        if (menu) {
            setAdultCount(menu.adult_count || 0);
            setAdultRate(parseFloat(menu.adult_rate) || 0);
            setKidCount(menu.kid_count || 0);
            setKidRate(parseFloat(menu.kid_rate) || 0);
            if (menu.items && menu.items.length > 0) {
                setItems(menu.items.map(i => ({ name: i.name, amount: i.amount ?? '' })));
            } else {
                setItems([{ ...defaultItem }]);
            }
        }
    }, [menu]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        // Prevent adding if last item is completely empty
        const lastItem = items[items.length - 1];
        if (items.length > 0 && !lastItem.name.trim()) {
            addToast('Please fill out the last menu item before adding a new one.', 'warning');
            return;
        }
        setItems([...items, { ...defaultItem }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const itemsTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalCost = (adultCount * adultRate) + (kidCount * kidRate) + itemsTotal;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const validItems = items
            .filter(item => item.name.trim() !== '')
            .map(item => ({ name: item.name, amount: item.amount !== '' ? item.amount : null }));

        const payload = {
            event: event.id,
            adult_count: adultCount,
            adult_rate: adultRate,
            kid_count: kidCount,
            kid_rate: kidRate,
            items: validItems
        };

        try {
            if (menu) {
                await api.put(`/food-menus/${menu.id}/`, payload);
                addToast('Food menu updated successfully!', 'success');
            } else {
                await api.post('/food-menus/', payload);
                addToast('Food menu created successfully!', 'success');
            }
            onSuccess();
        } catch (error) {
            console.error('Failed to save food menu:', error);
            addToast(error.response?.data?.error || 'Failed to save food menu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-[#071223] border border-white/10 shadow-[0_0_80px_rgba(0,160,150,0.14),0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col rounded-2xl max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {menu ? 'Edit Food Menu' : 'Create Food Menu'}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            For {event.event_name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-white/[0.05] text-gray-400 hover:text-white rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Rates Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Users size={20} className="text-mustard-gold" />
                            Guest Catering Rates
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Adults Count</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={adultCount}
                                        onChange={(e) => setAdultCount(parseInt(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Rate per Adult (€)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={adultRate}
                                        onChange={(e) => setAdultRate(parseFloat(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Kids Count</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={kidCount}
                                        onChange={(e) => setKidCount(parseInt(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Rate per Kid (€)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={kidRate}
                                        onChange={(e) => setKidRate(parseFloat(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <CheckCircle size={20} className="text-mustard-gold" />
                            Menu Items
                        </h3>
                        
                        <div className="space-y-3">
                            <AnimatePresence initial={false}>
                                {items.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                placeholder="e.g. Garlic Bread, Roast Beef..."
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="relative w-32 flex-shrink-0">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">€</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.amount}
                                                onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                placeholder="Optional"
                                                className={`${inputClass} pl-7`}
                                            />
                                        </div>

                                        {/* Inline Add Button for the latest active item */}
                                        {item.name.trim() !== '' && index === items.length - 1 && (
                                            <button
                                                type="button"
                                                onClick={addItem}
                                                className="flex-shrink-0 p-3.5 bg-mustard-gold/10 hover:bg-mustard-gold/20 text-mustard-gold rounded-xl transition-colors border border-mustard-gold/20"
                                                title="Add another item"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        )}

                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="flex-shrink-0 p-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors border border-red-500/20"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                </div>

                {/* Footer / Summary */}
                <div className="flex-shrink-0 border-t border-white/10 bg-[#040c18] p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        
                        <div className="flex-1 w-full bg-white/5 rounded-xl p-4 border border-white/10 space-y-1">
                            {itemsTotal > 0 && (
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Guest catering:</span>
                                    <span>€{((adultCount * adultRate) + (kidCount * kidRate)).toFixed(2)}</span>
                                </div>
                            )}
                            {itemsTotal > 0 && (
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Item extras:</span>
                                    <span>€{itemsTotal.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Total Catering Cost:</span>
                                <span className="text-2xl font-bold text-white">€{totalCost.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 md:flex-none px-6 py-3 bg-white/5 hover:bg-white/[0.05] text-white font-semibold rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 md:flex-none px-8 py-3 bg-mustard-gold hover:bg-yellow-400 text-deep-teal font-bold rounded-xl shadow-lg shadow-mustard-gold/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-deep-teal border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle size={20} />
                                        Save Menu
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            </motion.div>
        </div>
    );
};

export default FoodMenuForm;
