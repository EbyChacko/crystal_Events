import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Gem, UtensilsCrossed, Camera, Music, Lightbulb,
    CheckCircle2, Heart, Star, Globe
} from 'lucide-react';
import weddingHero from '../../assets/images/wedding_service.webp';

const weddingServices = [
    {
        icon: <Gem strokeWidth={1.5} />,
        title: 'Stage & Venue Decoration',
        items: [
            'Custom-designed wedding stages',
            'Floral and theme-based decoration',
            'Traditional and modern setups',
        ],
        alt: 'Wedding stage decoration in Ireland',
    },
    {
        icon: <UtensilsCrossed strokeWidth={1.5} />,
        title: 'Catering Services',
        items: [
            'Authentic Indian cuisine',
            'Multi-cuisine options',
            'Custom menu planning',
        ],
        alt: 'Indian wedding catering Ireland',
    },
    {
        icon: <Camera strokeWidth={1.5} />,
        title: 'Photography & Videography',
        items: [
            'Professional wedding photography',
            'Cinematic videography',
            'Pre-wedding shoots',
        ],
        alt: 'Wedding photography Ireland',
    },
    {
        icon: <Music strokeWidth={1.5} />,
        title: 'Entertainment & Music',
        items: [
            'DJ and sound systems',
            'Live music bands',
            'Cultural performances',
        ],
        alt: 'Wedding entertainment Ireland',
    },
    {
        icon: <Lightbulb strokeWidth={1.5} />,
        title: 'Lighting & Sound',
        items: [
            'Advanced lighting design',
            'High-quality sound systems',
            'Indoor & outdoor setups',
        ],
        alt: 'Wedding lighting and decoration Ireland',
    },
];

const whyUs = [
    'Fully customized wedding experiences',
    'Expertise in Indian & multicultural weddings',
    'Premium quality service with attention to detail',
    'One-stop solution for all wedding needs',
    'Serving all of Ireland from Galway',
];

const WeddingPlanning = () => {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
    return (
        <>
            <Helmet>
                <title>Wedding Planning Services in Ireland | Crystal Events</title>
                <meta
                    name="description"
                    content="Premium wedding planning services in Ireland. We provide complete solutions including decoration, catering, photography, and entertainment."
                />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://crystaleventsie.com/services/wedding-planning" />
                <meta property="og:title" content="Wedding Planning Services in Ireland | Crystal Events" />
                <meta
                    property="og:description"
                    content="Premium wedding planning services in Ireland. We provide complete solutions including decoration, catering, photography, and entertainment."
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://crystaleventsie.com/services/wedding-planning" />
            </Helmet>

            <div className="font-sans text-white">

                {/* ── Hero ── */}
                <section ref={heroRef} className="section-noir relative min-h-screen flex items-center justify-center overflow-hidden">
                    <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${weddingHero})`
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/80 via-background-dark/50 to-background-dark" />
                    </motion.div>

                    <div className="relative z-10 text-center px-6 md:px-12 max-w-4xl mx-auto pt-24">
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block"
                        >
                            Wedding Planning
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
                            className="text-4xl md:text-7xl font-black leading-tight mb-6"
                        >
                            Create Your Dream{' '}
                            <span className="bg-gradient-to-r from-mustard-gold via-[#F8E0A0] to-mustard-gold bg-clip-text text-transparent">
                                Wedding in Ireland
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                            className="text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
                        >
                            Premium wedding planning and event management tailored to your style, culture, and vision.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Link
                                to="/contact"
                                className="px-8 py-4 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-full hover:brightness-110 transition-all duration-300 shadow-[0_0_20px_rgba(238,192,89,0.35)] text-sm"
                            >
                                Book Your Wedding Consultation
                            </Link>
                            <Link
                                to="/services"
                                className="px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-widest rounded-full hover:border-mustard-gold hover:text-mustard-gold transition-all duration-300 text-sm"
                            >
                                All Services
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* ── Introduction ── */}
                <section className="section-cream overflow-hidden relative px-6 md:px-16 lg:px-28">
                    <div className="absolute top-0 left-0 right-0 h-px gold-shimmer-line" />

                    <div className="py-24">
                        <div className="max-w-4xl mx-auto text-center">
                            <motion.div
                                initial={{ scale: 0.92, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                            >
                                <Heart className="w-12 h-12 text-mustard-gold mx-auto mb-6" strokeWidth={1.5} />
                            </motion.div>
                            <motion.h2
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="text-3xl md:text-4xl font-black mb-6 leading-tight text-deep-teal"
                            >
                                Your Wedding Day,{' '}
                                <span className="text-mustard-gold">Made Perfect</span>
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                                className="text-deep-teal/60 text-lg leading-relaxed mb-4"
                            >
                                Your wedding day is one of the most important moments in your life — and at Crystal Events, we make sure it is nothing less than perfect.
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                                className="text-deep-teal/60 text-lg leading-relaxed"
                            >
                                We provide complete wedding planning services across Ireland, combining elegance, creativity, and cultural richness. Whether you are planning a traditional Indian wedding or a modern Irish celebration, our team ensures every detail is beautifully executed.
                            </motion.p>
                        </div>
                    </div>
                </section>

                {/* ── Our Wedding Services ── */}
                <section className="section-gold-glow overflow-hidden relative px-6 md:px-16 lg:px-28">
                    <div className="py-24">
                        <div className="max-w-7xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="text-center mb-16"
                            >
                                <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block">What We Offer</span>
                                <h2 className="text-3xl md:text-4xl font-black leading-tight">
                                    Our Wedding Services
                                </h2>
                                <p className="text-white/50 mt-4 max-w-xl mx-auto">
                                    A complete range of services to make your wedding stress-free and unforgettable.
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {weddingServices.map((service, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                        transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                                        className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 hover:border-mustard-gold/30 transition-all duration-300 group"
                                    >
                                        <div className="text-mustard-gold mb-5 [&>svg]:w-8 [&>svg]:h-8 transition-transform duration-300 ease-out group-hover:scale-110 inline-block">
                                            {service.icon}
                                        </div>
                                        <h3 className="text-white font-bold text-lg mb-4 group-hover:text-mustard-gold transition-colors duration-300">
                                            {service.title}
                                        </h3>
                                        <ul className="space-y-2">
                                            {service.items.map((item, j) => (
                                                <li key={j} className="flex items-start gap-2 text-white/60 text-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-mustard-gold shrink-0 mt-1.5" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Destination & Cultural Weddings ── */}
                <section className="section-sage overflow-hidden relative px-6 md:px-16 lg:px-28">
                    <div className="absolute top-0 left-0 right-0 h-px gold-shimmer-line" />
                    <div className="py-24">
                        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Globe className="text-mustard-gold w-6 h-6" strokeWidth={1.5} />
                                    <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold">Cultural & Destination</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight text-deep-teal">
                                    Destination &{' '}
                                    <span className="text-mustard-gold">Cultural Weddings</span>
                                </h2>
                                <p className="text-deep-teal/60 text-lg leading-relaxed mb-6">
                                    We specialise in culturally rich weddings, especially for the Indian community in Ireland. From Kerala-style weddings to multicultural celebrations, we bring authenticity and elegance together.
                                </p>
                                <p className="text-deep-teal/60 text-lg leading-relaxed">
                                    We are also expanding into destination weddings, helping you celebrate your big day in unique and beautiful locations.
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="grid grid-cols-2 gap-4"
                            >
                                {[
                                    { label: 'Kerala Weddings', sub: 'Traditional elegance', alt: 'Kerala wedding Ireland' },
                                    { label: 'Indian Weddings', sub: 'Galway & beyond', alt: 'Indian wedding setup Galway' },
                                    { label: 'Irish Weddings', sub: 'Modern & classic', alt: 'Irish wedding planning Galway' },
                                    { label: 'Multicultural', sub: 'All traditions honoured', alt: 'Multicultural wedding Ireland' },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                        transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                                        className="glass-card-light rounded-xl p-5 text-center hover:border-mustard-gold/30 transition-all duration-300"
                                    >
                                        <p className="text-deep-teal font-bold text-sm mb-1">{item.label}</p>
                                        <p className="text-deep-teal/40 text-xs">{item.sub}</p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── Why Choose Crystal Events ── */}
                <section className="section-emerald overflow-hidden relative px-6 md:px-16 lg:px-28">
                    <div className="py-24">
                        <div className="max-w-5xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="text-center mb-14"
                            >
                                <Star className="w-10 h-10 text-mustard-gold mx-auto mb-5" strokeWidth={1.5} />
                                <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block">Our Promise</span>
                                <h2 className="text-3xl md:text-4xl font-black leading-tight">
                                    Why Choose{' '}
                                    <span className="text-mustard-gold">Crystal Events</span>
                                </h2>
                            </motion.div>

                            <div className="grid md:grid-cols-2 gap-4 mb-16">
                                {whyUs.map((point, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                        transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                                        className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-mustard-gold/30 transition-all duration-300"
                                    >
                                        <CheckCircle2 size={18} className="text-mustard-gold shrink-0 mt-0.5" strokeWidth={2} />
                                        <span className="text-white/70 text-sm leading-relaxed">{point}</span>
                                    </motion.div>
                                ))}
                            </div>

                        </div>
                    </div>
                </section>

            </div>
        </>
    );
};

export default WeddingPlanning;
