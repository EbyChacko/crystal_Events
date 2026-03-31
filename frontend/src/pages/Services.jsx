import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Star, BadgeCheck, ArrowRight, Calendar, Gem, UtensilsCrossed, Camera, Music, Speaker } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

// Static flagship services shown at the top
const STATIC_SERVICES = [
    {
        icon: <Calendar strokeWidth={1} />,
        title: 'Wedding Planning',
        slug: 'wedding-planning',
        description: 'Make your dream wedding a reality. We specialise in elegant, culturally rich weddings — from intimate ceremonies to grand celebrations.',
        features: ['Complete planning & coordination', 'Stage & venue decoration', 'Catering, photography & entertainment'],
    },
];

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const { scrollY } = useScroll();
    const sectionShadow = useTransform(
        scrollY,
        [0, 80],
        ['0px -16px 60px rgba(0,0,0,0)', '0px -16px 60px rgba(0,0,0,0.5)']
    );

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
        <>
            <Helmet>
                <title>Our Services | Crystal Events Ireland</title>
                <meta
                    name="description"
                    content="Explore Crystal Events' bespoke event services in Ireland — wedding planning, stage decoration, catering, photography, live music, and more."
                />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://crystaleventsie.com/services" />
                <meta property="og:title" content="Our Services | Crystal Events Ireland" />
                <meta property="og:description" content="Explore Crystal Events' bespoke event services in Ireland — wedding planning, stage decoration, catering, photography, live music, and more." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://crystaleventsie.com/services" />
            </Helmet>

            <div className="font-sans text-white bg-background-dark">

                {/* ── Hero ── z-index 1 */}
                <section data-scroll-snap className="lg:sticky lg:top-0 z-[1] relative min-h-screen flex items-center justify-center overflow-hidden">
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
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block"
                        >
                            Exclusivity Defined
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            className="text-white text-4xl md:text-7xl font-extrabold mb-6 tracking-tight"
                        >
                            Our Bespoke <span className="bg-gradient-to-r from-mustard-gold via-[#e2c283] to-mustard-gold bg-clip-text text-transparent">Services</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                            className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
                        >
                            Elevating your celebrations with elegance and precision. Experience the curated art of event design where every detail whispers luxury.
                        </motion.p>
                    </div>
                </section>

                {/* ── Static Flagship Services ── slides over hero, z-index 2 */}
                <motion.section data-scroll-snap style={{ boxShadow: sectionShadow }} className="lg:sticky lg:top-0 z-[2] min-h-screen px-6 md:px-16 lg:px-40 py-28 bg-background-dark rounded-t-[2rem] flex flex-col justify-center">
                    <div className="max-w-[1200px] mx-auto">

                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                            <div className="max-w-xl">
                                <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">Our Signature Services</h2>
                                <div className="h-1 w-20 bg-mustard-gold mb-6"></div>
                                <p className="text-slate-400">Handcrafted experiences built around your vision. Explore each service and discover how we bring it to life.</p>
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

                        {/* Static service cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {STATIC_SERVICES.map((service, i) => (
                                <motion.div
                                    key={service.slug}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                                    className="group relative bg-deep-teal/20 border border-mustard-gold/30 rounded-xl overflow-hidden hover:border-mustard-gold/60 hover:shadow-[0_0_25px_rgba(197,160,89,0.2)] transition-all duration-500 ease-out flex flex-col"
                                >
                                    <div className="p-8 flex flex-col flex-1">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-mustard-gold/10 text-mustard-gold mb-6 transition-transform duration-300 ease-out group-hover:scale-110 [&>svg]:w-7 [&>svg]:h-7">
                                            {service.icon}
                                        </div>
                                        <h3 className="text-white text-xl font-bold mb-3 group-hover:text-mustard-gold transition-colors duration-300">
                                            {service.title}
                                        </h3>
                                        <p className="text-slate-400 text-sm leading-relaxed mb-5">
                                            {service.description}
                                        </p>
                                        <ul className="space-y-2 mb-8 flex-1">
                                            {service.features.map((f, fi) => (
                                                <li key={fi} className="flex items-center gap-2 text-white/60 text-sm">
                                                    <span className="w-1 h-1 rounded-full bg-mustard-gold shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <Link
                                            to={`/services/${service.slug}`}
                                            className="inline-flex items-center gap-2 self-start px-6 py-2.5 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all duration-300 text-xs shadow-[0_0_15px_rgba(238,192,89,0.2)]"
                                        >
                                            Learn More <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* ── More Services ── dynamic from API */}
                        <div className="mt-24">
                            <h2 className="text-white text-2xl md:text-3xl font-bold mb-3">More Services From Us</h2>
                            <div className="h-1 w-16 bg-mustard-gold mb-10"></div>

                            {loading ? (
                                <div className="text-center text-slate-400 py-12">Loading services...</div>
                            ) : services.length === 0 ? (
                                <div className="text-center text-slate-400 py-12">No additional services available at the moment.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {services.map((service, index) => (
                                        <motion.div
                                            key={service.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                                            className="group relative bg-deep-teal/20 border border-mustard-gold/30 rounded-xl overflow-hidden transition-all duration-500 ease-out hover:-translate-y-2 hover:border-mustard-gold/50 hover:shadow-[0_0_15px_rgba(197,160,89,0.3)]"
                                        >
                                            <div className="h-48 overflow-hidden relative">
                                                <img
                                                    src={service.image || "https://res.cloudinary.com/dgd5gtn1w/image/upload/v1772162028/crystal%20events/event_sjzxpf.webp"}
                                                    alt={service.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-deep-teal to-transparent opacity-80"></div>
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-white text-lg font-bold mb-2 group-hover:text-mustard-gold transition-colors duration-300">{service.name}</h3>
                                                <p className="text-slate-400 text-sm leading-relaxed">{service.description}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

            </div>
        </>
    );
};

export default Services;
