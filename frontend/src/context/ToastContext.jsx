import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-full max-w-sm pointer-events-none text-center">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <Toast
                            key={toast.id}
                            toast={toast}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const Toast = ({ toast, onClose }) => {
    const icons = {
        success: <CheckCircle className="text-emerald-400" size={20} />,
        error: <AlertCircle className="text-red-400" size={20} />,
        info: <Info className="text-blue-400" size={20} />,
    };

    const backgrounds = {
        success: 'bg-[#0f1a15] border border-emerald-500/20 text-emerald-100',
        error: 'bg-[#1a0f0f] border border-red-500/20 text-red-100',
        info: 'bg-[#0f141a] border border-blue-500/20 text-blue-100',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl pointer-events-auto backdrop-blur-md ${backgrounds[toast.type] || backgrounds.info}`}
            layout
        >
            <div className="flex-shrink-0 mt-0.5">
                {icons[toast.type] || icons.info}
            </div>
            <div className="flex-1 min-w-0 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                {toast.message}
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 ml-4 text-white/40 hover:text-white/80 transition-colors p-1 rounded-md hover:bg-white/10"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
