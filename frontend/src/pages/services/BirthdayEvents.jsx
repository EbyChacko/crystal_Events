import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Palette, UtensilsCrossed, Camera, Music, Lightbulb,
    CheckCircle2, PartyPopper, Star
} from 'lucide-react';
import birthdayHero from '../../assets/images/birthday_service.webp';

const birthdayServices = [
    {
        icon: <Palette strokeWidth={1.5} />,
        title: 'Themed Decorations',
        items: [
            'Custom birthday themes (kids & adults)',
            'Balloon decoration & backdrop design',
            'Stage and venue styling',
        ],
        alt: 'Birthday party decoration Ireland',
    },
    {
        icon: <UtensilsCrossed strokeWidth={1.5} />,
        title: 'Catering & Cakes',
        items: [
            'Custom birthday cakes',
            'Snacks and full catering services',
            'Multi-cuisine options',
        ],
        alt: 'Birthday catering Ireland',
    },
    {
        icon: <Music strokeWidth={1.5} />,
        title: 'Entertainment & Activities',
        items: [
            'DJ & music setup',
            'Games and fun activities',
            'Kids\' entertainment options',
        ],
        alt: 'Birthday entertainment Ireland',
    },
    {
        icon: <Camera strokeWidth={1.5} />,
        title: 'Photography & Videography',
        items: [
            'Professional birthday photography',
            'Event highlight videos',
            'Family and candid moments',
        ],
        alt: 'Birthday photography Ireland',
    },
    {
        icon: <Lightbulb strokeWidth={1.5} />,
        title: 'Lighting & Sound',
        items: [
            'Party lighting setup',
            'Sound systems for music & announcements',
            'Indoor & outdoor setups',
        ],
        alt: 'Birthday lighting setup Ireland',
    },
];

const whyUs = [
    'Unique and creative party themes',
    'Fully customized event planning',
    'High-quality decoration and setup',
    'One-stop solution for all birthday needs',
    'Serving all of Ireland',
];

const ageGroups = [
    { label: 'Kids\' Parties', sub: 'Fun-filled themes', alt: 'Kids birthday party Ireland' },
    { label: 'Teen Celebrations', sub: 'Cool & stylish', alt: 'Teen birthday Ireland' },
    { label: 'Adult Birthdays', sub: 'Elegant & memorable', alt: 'Adult birthday Ireland' },
    { label: 'Milestone Birthdays', sub: '18th, 30th, 50th & more', alt: 'Milestone birthday Ireland' },
];

const BirthdayEvents = () => {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
    return (
        <>
            <Helmet>
                <title>Birthday Party Planners in Ireland | Crystal Events</title>
                <meta
                    name="description"
                    content="Looking for birthday party planners in Ireland? Crystal Events offers themed decorations, catering, entertainment, and complete event management for unforgettable celebrations."
                />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://crystaleventsie.com/services/birthday-events" />
                <meta property="og:title" content="Birthday Party Planners in Ireland | Crystal Events" />
                <meta
                    property="og:description"
                    content="Looking for birthday party planners in Ireland? Crystal Events offers themed decorations, catering, entertainment, and complete event management for unforgettable celebrations."
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://crystaleventsie.com/services/birthday-events" />
            </Helmet>

            <div className="font-sans text-white">

                {/* ── Hero ── */}
                <section ref={heroRef} className="section-noir relative min-h-screen flex items-center justify-center overflow-hidden">
                    <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${birthdayHero})` }}
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
                            Birthday Events
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
                            className="text-4xl md:text-7xl font-black leading-tight mb-6"
                        >
                            Make Every Birthday{' '}
                            <span className="bg-gradient-to-r from-mustard-gold via-[#F8E0A0] to-mustard-gold bg-clip-text text-transparent">
                                Unforgettable
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                            className="text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
                        >
                            Creative birthday party planning and decoration services across Ireland for kids and adults.
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
                                Plan Your Birthday Party Today
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
                                <PartyPopper className="w-12 h-12 text-mustard-gold mx-auto mb-6" strokeWidth={1.5} />
                            </motion.div>
                            <motion.h2
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="text-3xl md:text-4xl font-black mb-6 leading-tight text-deep-teal"
                            >
                                Every Birthday is a{' '}
                                <span className="text-mustard-gold">Special Milestone</span>
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                                className="text-deep-teal/60 text-lg leading-relaxed mb-4"
                            >
                                Every birthday is a special milestone, and at Crystal Events, we turn it into a memorable celebration.
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                                className="text-deep-teal/60 text-lg leading-relaxed"
                            >
                                From fun-filled kids' parties to elegant milestone birthdays, we provide complete birthday event planning services across Ireland. Our team focuses on creativity, detail, and personalisation to create experiences that truly stand out.
                            </motion.p>
                        </div>
                    </div>
                </section>

                {/* ── Our Birthday Services ── */}
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
                                    Our Birthday Services
                                </h2>
                                <p className="text-white/50 mt-4 max-w-xl mx-auto">
                                    We handle everything so you can enjoy the celebration stress-free.
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {birthdayServices.map((service, i) => (
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

                {/* ── Customized Experiences & Perfect for All Ages ── */}
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
                                    <Star className="text-mustard-gold w-6 h-6" strokeWidth={1.5} />
                                    <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold">Customized Experiences</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight text-deep-teal">
                                    Perfect for{' '}
                                    <span className="text-mustard-gold">All Ages</span>
                                </h2>
                                <p className="text-deep-teal/60 text-lg leading-relaxed mb-6">
                                    We believe every birthday should reflect your personality. Whether it's a themed kids' party, a surprise celebration, or a luxury birthday event, we design everything based on your ideas and preferences.
                                </p>
                                <p className="text-deep-teal/60 text-lg leading-relaxed">
                                    No matter the age or occasion, Crystal Events delivers a celebration that creates lasting memories for you and your guests.
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="grid grid-cols-2 gap-4"
                            >
                                {ageGroups.map((group, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true, amount: 0.18, margin: '0px 0px -80px 0px' }}
                                        transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                                        className="glass-card-light rounded-xl p-5 text-center hover:border-mustard-gold/30 transition-all duration-300"
                                    >
                                        <p className="text-deep-teal font-bold text-sm mb-1">{group.label}</p>
                                        <p className="text-deep-teal/40 text-xs">{group.sub}</p>
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

export default BirthdayEvents;
