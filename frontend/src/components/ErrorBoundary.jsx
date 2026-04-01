import { Component } from 'react';
import { motion } from 'framer-motion';
import { ServerCrash, Home, ArrowLeft } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background-dark flex items-center justify-center px-6 font-sans">
                    <div className="text-center max-w-lg relative">
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-mustard-gold/5 blur-3xl" />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-mustard-gold/10 border border-mustard-gold/30 text-mustard-gold mb-8 mx-auto">
                                <ServerCrash strokeWidth={1} className="w-9 h-9" />
                            </div>

                            <p className="text-mustard-gold text-8xl md:text-[10rem] font-extrabold leading-none tracking-tighter mb-4 select-none">
                                500
                            </p>

                            <div className="h-px w-24 bg-mustard-gold/40 mx-auto mb-6" />

                            <h1 className="text-white text-2xl md:text-3xl font-bold mb-4">
                                Something Went Wrong
                            </h1>

                            <p className="text-slate-400 text-base leading-relaxed mb-10">
                                We hit an unexpected error on our end. Our team has been notified. Please try again or head back home.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={() => {
                                        this.setState({ hasError: false });
                                        window.history.back();
                                    }}
                                    className="inline-flex items-center gap-2 px-6 py-3 border border-mustard-gold/40 text-mustard-gold font-semibold rounded-lg hover:bg-mustard-gold/10 transition-all duration-300 text-sm w-full sm:w-auto justify-center"
                                >
                                    <ArrowLeft size={16} />
                                    Go Back
                                </button>
                                <button
                                    onClick={() => {
                                        this.setState({ hasError: false });
                                        window.location.href = '/';
                                    }}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all duration-300 text-sm shadow-[0_0_20px_rgba(238,192,89,0.2)] w-full sm:w-auto justify-center"
                                >
                                    <Home size={16} />
                                    Home Page
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
