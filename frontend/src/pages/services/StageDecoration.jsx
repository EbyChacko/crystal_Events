import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Gem, PartyPopper, Briefcase, Lightbulb,
    CheckCircle2, Palette, Star, ArrowRight
} from 'lucide-react';
import stageHero from '../../assets/images/wedding_stage.webp';

const stageServices = [
    {
        icon: <Gem strokeWidth={1.5} />,
        title: 'Wedding Stage Decoration',
        items: [
            'Traditional and modern wedding stages',
            'Floral and luxury backdrop designs',
            'Cultural themes (including Indian & Kerala style)',
        ],
        alt: 'Wedding stage decoration Galway',
        linkTo: '/services/wedding-planning',
        linkLabel: 'Explore full wedding planning services',
    },
    {
        icon: <PartyPopper strokeWidth={1.5} />,
        title: 'Birthday Stage Decoration',
        items: [
            "Kids' themed backdrops",
            'Balloon decorations and creative designs',
            'Custom birthday stage setups',
        ],
        alt: 'Birthday backdrop decoration Ireland',
        linkTo: '/services/birthday-events',
        linkLabel: 'Explore full birthday planning services',
    },
    {
        icon: <Briefcase strokeWidth={1.5} />,
        title: 'Corporate Event Stage Setup',
        items: [
            'Professional stage and branding setup',
            'LED screens and presentation design',
            'Clean and modern corporate styling',
        ],
        alt: 'Corporate stage setup Ireland',
        linkTo: '/services/corporate-events',
        linkLabel: 'See our corporate event services',
    },
];

const whyUs = [
    'Creative and eye-catching stage designs',
    'High-quality materials and setup',
    'Expertise in cultural and Indian events',
    'Affordable to premium customisation options',
    'Serving all of Ireland',
];

const customDesignFactors = [
    { label: 'Your Theme & Vision', sub: 'We start with your ideas' },
    { label: 'Event Type & Audience', sub: 'Tailored to the occasion' },
    { label: 'Cultural Preferences', sub: 'Indian, Irish & more' },
    { label: 'Budget & Style', sub: 'Simple to luxury' },
];

const StageDecoration = () => {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
    return (
        <>
            <Helmet>
                <title>Stage Decoration Services in Ireland | Crystal Events</title>
                <meta
                    name="description"
                    content="Looking for stage decoration in Ireland? Crystal Events offers custom wedding, birthday, and corporate stage designs with lighting, themes, and premium setups across Ireland."
                />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://crystaleventsie.com/services/stage-decoration" />
                <meta property="og:title" content="Stage Decoration Services in Ireland | Crystal Events" />
                <meta
                    property="og:description"
                    content="Looking for stage decoration in Ireland? Crystal Events offers custom wedding, birthday, and corporate stage designs with lighting, themes, and premium setups across Ireland."
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://crystaleventsie.com/services/stage-decoration" />
            </Helmet>

            <div className="font-sans text-white">

                {/* ── Hero ── */}
                <section ref={heroRef} className="section-noir relative min-h-screen flex items-center justify-center overflow-hidden">
                    <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${stageHero})` }}
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
                            Stage Decoration
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
                            className="text-4xl md:text-7xl font-black leading-tight mb-6"
                        >
                            Stunning Stage Decorations{' '}
                            <span className="bg-gradient-to-r from-mustard-gold via-[#F8E0A0] to-mustard-gold bg-clip-text text-transparent">
                                for Every Occasion
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                            className="text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
                        >
                            Custom-designed stage setups for weddings, birthdays, and corporate events across Ireland.
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
                                Book Your Stage Decoration
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
                                <Palette className="w-12 h-12 text-mustard-gold mx-auto mb-6" strokeWidth={1.5} />
                            </motion.div>
                            <motion.h2
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="text-3xl md:text-4xl font-black mb-6 leading-tight text-deep-teal"
                            >
                                The Stage is Where{' '}
                                <span className="text-mustard-gold">Memories Are Made</span>
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                                className="text-deep-teal/60 text-lg leading-relaxed mb-4"
                            >
                                The stage is the centrepiece of any event — it's where memories are created and captured.
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                                className="text-deep-teal/60 text-lg leading-relaxed"
                            >
                                At Crystal Events, we specialise in designing and delivering visually stunning stage decorations tailored to your event theme, culture, and personal style. Whether it's an elegant wedding, a fun birthday party, or a professional corporate event, we create stage setups that leave a lasting impression.
                            </motion.p>
                        </div>
                    </div>
                </section>

                {/* ── Our Stage Decoration Services ── */}
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
                                    Our Stage Decoration Services
                                </h2>
                                <p className="text-white/50 mt-4 max-w-xl mx-auto">
                                    Complete stage decoration solutions for every type of event — with internal links to explore full service packages.
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {stageServices.map((service, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                        transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                                        className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 hover:border-mustard-gold/30 transition-all duration-300 group flex flex-col"
                                    >
                                        <div className="text-mustard-gold mb-5 [&>svg]:w-8 [&>svg]:h-8 transition-transform duration-300 ease-out group-hover:scale-110 inline-block">
                                            {service.icon}
                                        </div>
                                        <h3 className="text-white font-bold text-lg mb-4 group-hover:text-mustard-gold transition-colors duration-300">
                                            {service.title}
                                        </h3>
                                        <ul className="space-y-2 mb-6 flex-1">
                                            {service.items.map((item, j) => (
                                                <li key={j} className="flex items-start gap-2 text-white/60 text-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-mustard-gold shrink-0 mt-1.5" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                        <Link
                                            to={service.linkTo}
                                            className="inline-flex items-center gap-2 text-mustard-gold text-xs font-bold uppercase tracking-widest hover:gap-3 transition-all duration-300"
                                        >
                                            {service.linkLabel} <ArrowRight size={13} />
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Lighting & Customized Designs ── */}
                <section className="section-sage overflow-hidden relative px-6 md:px-16 lg:px-28">
                    <div className="absolute top-0 left-0 right-0 h-px gold-shimmer-line" />
                    <div className="py-24">
                        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

                            {/* Lighting */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Lightbulb className="text-mustard-gold w-6 h-6" strokeWidth={1.5} />
                                    <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold">Lighting & Design</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight text-deep-teal">
                                    Lighting That{' '}
                                    <span className="text-mustard-gold">Elevates Every Stage</span>
                                </h2>
                                <p className="text-deep-teal/60 text-lg leading-relaxed mb-6">
                                    We combine decoration with advanced lighting to enhance the entire experience — turning a great stage into an unforgettable one.
                                </p>
                                <ul className="space-y-3">
                                    {['Ambient and stage lighting', 'LED and spotlight setups', 'Indoor and outdoor configurations'].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-deep-teal/60 text-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-mustard-gold shrink-0 mt-1.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Customized Designs */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Palette className="text-mustard-gold w-6 h-6" strokeWidth={1.5} />
                                    <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold">Fully Customized</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight text-deep-teal">
                                    Every Stage Is{' '}
                                    <span className="text-mustard-gold">Unique</span>
                                </h2>
                                <p className="text-deep-teal/60 text-lg leading-relaxed mb-8">
                                    From simple elegant setups to premium luxury designs — we bring your ideas to life based on what matters most to you.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {customDesignFactors.map((f, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0 }}
                                            whileInView={{ opacity: 1 }}
                                            viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                            transition={{ duration: 0.4, delay: i * 0.07, ease: 'easeOut' }}
                                            className="glass-card-light rounded-xl p-4 hover:border-mustard-gold/30 transition-all duration-300"
                                        >
                                            <p className="text-deep-teal font-bold text-sm mb-1">{f.label}</p>
                                            <p className="text-deep-teal/40 text-xs">{f.sub}</p>
                                        </motion.div>
                                    ))}
                                </div>
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

                            <div className="grid md:grid-cols-2 gap-4">
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

export default StageDecoration;
