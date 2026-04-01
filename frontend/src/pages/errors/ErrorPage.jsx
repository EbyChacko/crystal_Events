import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

const ErrorPage = ({ code, title, description, icon: Icon }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center px-6">
            <div className="text-center max-w-lg">
                {/* Decorative glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-mustard-gold/5 blur-3xl" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="relative"
                >
                    {/* Icon */}
                    {Icon && (
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-mustard-gold/10 border border-mustard-gold/30 text-mustard-gold mb-8 mx-auto [&>svg]:w-9 [&>svg]:h-9">
                            <Icon strokeWidth={1} />
                        </div>
                    )}

                    {/* Code */}
                    <p className="text-mustard-gold text-8xl md:text-[10rem] font-extrabold leading-none tracking-tighter mb-4 select-none">
                        {code}
                    </p>

                    {/* Divider */}
                    <div className="h-px w-24 bg-mustard-gold/40 mx-auto mb-6" />

                    {/* Title */}
                    <h1 className="text-white text-2xl md:text-3xl font-bold mb-4">
                        {title}
                    </h1>

                    {/* Description */}
                    <p className="text-slate-400 text-base leading-relaxed mb-10">
                        {description}
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 px-6 py-3 border border-mustard-gold/40 text-mustard-gold font-semibold rounded-lg hover:bg-mustard-gold/10 transition-all duration-300 text-sm w-full sm:w-auto justify-center"
                        >
                            <ArrowLeft size={16} />
                            Go Back
                        </button>
                        <button
                            onClick={() => navigate('/')}
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
};

export default ErrorPage;
