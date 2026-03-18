import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchServices = async () => {
            try {
                const res = await api.get('/services/');
                setServices(res.data);
            } catch (err) {
                console.error("Failed to fetch services", err);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-off-white dark:bg-background-dark font-sans text-slate-800 dark:text-slate-100">
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-deep-teal/80 via-deep-teal/60 to-background-dark z-10"></div>
                    <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtG6wjruurQ-hzQcuQpO6DkZ33TLQsjXQC5JDKOXmXQBxrPPLx8mNZ7-RZWUTdnNu_Mrqokmduqj63ibxxaeFJlFlk1cZuji7Rx4HjLETXdplfT4GwjOFzaHOQppwpavSu46_E9dlzNho-ByZrM7-GKhYZ_rQc-FwMkJlRE4wJc37UZr_PWHs6Zck2GdYWnjmXvhq8i7336UQVrtlwZA-0i-ZAtVS8s1N9g4RRwopo50ZzdDoZgzI567brYgYaOe67TWFEawPitWo9"
                        alt="Luxury Event Hall"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="relative z-20 text-center px-4 max-w-4xl pt-20">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block"
                    >
                        Exclusivity Defined
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-white text-4xl md:text-7xl font-extrabold mb-6 tracking-tight"
                    >
                        Our Bespoke <span className="bg-gradient-to-r from-mustard-gold via-[#e2c283] to-mustard-gold bg-clip-text text-transparent">Services</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
                    >
                        Elevating your celebrations with elegance and precision. Experience the curated art of event design where every detail whispers luxury.
                    </motion.p>
                </div>
            </section>

            {/* Services Grid */}
            <section className="px-6 md:px-16 lg:px-40 py-24 bg-background-dark">
                <div className="max-w-[1200px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">Premium Event Solutions</h2>
                            <div className="h-1 w-20 bg-mustard-gold mb-6"></div>
                            <p className="text-slate-400">Discover our comprehensive suite of services designed for those who demand nothing less than perfection.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="p-3 border border-deep-teal/30 rounded-lg text-mustard-gold">
                                <Star strokeWidth={1} />
                            </div>
                            <div className="p-3 border border-deep-teal/30 rounded-lg text-mustard-gold">
                                <BadgeCheck strokeWidth={1} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-slate-400 py-12">Loading services...</div>
                        ) : services.length === 0 ? (
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-slate-400 py-12">No services available at the moment.</div>
                        ) : services.map((service, index) => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group relative bg-deep-teal/20 border border-mustard-gold/30 rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-mustard-gold/50 hover:shadow-[0_0_15px_rgba(197,160,89,0.3)]"
                            >
                                <div className="h-64 overflow-hidden relative">
                                    <img
                                        src={service.image || "https://res.cloudinary.com/dgd5gtn1w/image/upload/v1772162028/crystal%20events/event_sjzxpf.webp"}
                                        alt={service.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-deep-teal to-transparent opacity-80"></div>
                                </div>
                                <div className="p-6 md:p-8">
                                    <h3 className="text-white text-xl font-bold mb-3 group-hover:text-mustard-gold transition-colors">{service.name}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{service.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>



            {/* Call to Action */}
            <section className="py-24 px-6 md:px-12 lg:px-20 bg-jungle-green relative z-20">
                <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-mustard-gold p-12 md:p-20 text-center text-jungle-green relative shadow-2xl">
                    <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight font-sans">
                        Ready to create <span className="italic font-serif">magic?</span>
                    </h2>
                    <p className="mx-auto max-w-xl text-lg font-medium mb-10 text-jungle-green/80">
                        Let's collaborate to bring your dream event to life with the precision of Crystal Events.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                        <Link
                            to="/contact"
                            className="w-full sm:w-auto px-10 py-5 bg-jungle-green text-mustard-gold font-bold uppercase tracking-widest rounded-lg hover:bg-jungle-green/90 transition-all shadow-xl"
                        >
                            Start Planning
                        </Link>
                        <Link
                            to="/gallery"
                            className="w-full sm:w-auto px-10 py-5 border-2 border-jungle-green text-jungle-green font-bold uppercase tracking-widest rounded-lg hover:bg-jungle-green hover:text-mustard-gold transition-all"
                        >
                            View Portfolio
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Services;
