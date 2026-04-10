import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Music, Mic, Speaker, Lightbulb,
    CheckCircle2, Star, ArrowRight, Headphones
} from 'lucide-react';
import liveMusicHero from '../../assets/images/live_music_dj_ligt&sound.webp';

const djServices = [
    {
        icon: <Headphones strokeWidth={1.5} />,
        title: 'Professional DJ Services',
        items: [
            'Experienced DJs for all event types',
            'Customised playlists (Indian, Irish, international)',
            'Dance floor setup and party lighting',
        ],
        alt: 'DJ services Ireland',
    },
    {
        icon: <Mic strokeWidth={1.5} />,
        title: 'Live Music Performances',
        items: [
            'Live bands and singers',
            'Cultural and traditional performances',
            'Acoustic and stage performances',
        ],
        alt: 'Live music performance Ireland',
    },
    {
        icon: <Speaker strokeWidth={1.5} />,
        title: 'Sound System Setup',
        items: [
            'High-quality speakers and audio systems',
            'Microphones (corded & wireless)',
            'Indoor & outdoor sound setup',
        ],
        alt: 'Sound system setup Galway',
    },
    {
        icon: <Lightbulb strokeWidth={1.5} />,
        title: 'Lighting Solutions',
        items: [
            'Stage lighting and ambient lighting',
            'LED lights and effects',
            'Dance floor lighting',
        ],
        alt: 'Event lighting Ireland',
    },
];

const whyUs = [
    'Professional DJ and sound team',
    'High-quality equipment',
    'Customised music and lighting setup',
    'Suitable for all event types',
    'Serving all of Ireland',
];

const customFactors = [
    { label: 'Music Preferences', sub: 'Your playlist, your vibe' },
    { label: 'Event Size & Venue', sub: 'Scaled to your space' },
    { label: 'Audience Type', sub: 'From kids to corporate' },
    { label: 'Cultural Requirements', sub: 'Indian, Irish & more' },
];

const perfectFor = [
    { label: 'Weddings & Receptions', linkTo: '/services/wedding-planning' },
    { label: 'Birthday Parties', linkTo: '/services/birthday-events' },
    { label: 'Corporate Events', linkTo: '/services/corporate-events' },
    { label: 'Cultural Programs & Stage Shows', linkTo: '/services/stage-decoration' },
];

const LiveMusicDJ = () => {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
    return (
        <>
            <Helmet>
                <title>DJ, Live Music & Sound Services in Ireland | Crystal Events</title>
                <meta
                    name="description"
                    content="Professional DJ, live music, and sound system services in Ireland. Crystal Events provides lighting, sound, and entertainment for weddings, parties, and corporate events."
                />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://crystaleventsie.com/services/live-music-dj" />
                <meta property="og:title" content="DJ, Live Music & Sound Services in Ireland | Crystal Events" />
                <meta
                    property="og:description"
                    content="Professional DJ, live music, and sound system services in Ireland. Crystal Events provides lighting, sound, and entertainment for weddings, parties, and corporate events."
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://crystaleventsie.com/services/live-music-dj" />
            </Helmet>

            <div className="font-sans text-white bg-[#011414]">

                {/* ── Hero ── */}
                <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
                    <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${liveMusicHero})` }}
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
                            DJ, Live Music & Sound
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
                            className="text-4xl md:text-7xl font-black leading-tight mb-6"
                        >
                            Bring Your Event to Life{' '}
                            <span className="bg-gradient-to-r from-mustard-gold via-[#F8E0A0] to-mustard-gold bg-clip-text text-transparent">
                                with Music & Lighting
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                            className="text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
                        >
                            Professional DJ, live music, and high-quality sound & lighting services across Ireland.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Link
                                to="/contact"
                                className="px-8 py-4 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all duration-300 shadow-[0_0_20px_rgba(238,192,89,0.35)] text-sm"
                            >
                                Book DJ & Sound Services
                            </Link>
                            <Link
                                to="/services"
                                className="px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-widest rounded-lg hover:border-mustard-gold hover:text-mustard-gold transition-all duration-300 text-sm"
                            >
                                All Services
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* ── Content Sections ── */}
                <section className="section-gradient px-6 md:px-16 lg:px-28">

                {/* ── Introduction ── */}
                <div className="py-24">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            <Music className="w-12 h-12 text-mustard-gold mx-auto mb-6" strokeWidth={1.5} />
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="text-3xl md:text-4xl font-black mb-6 leading-tight"
                        >
                            Music & Lighting That{' '}
                            <span className="text-mustard-gold">Define the Atmosphere</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                            className="text-white/60 text-lg leading-relaxed mb-4"
                        >
                            Music and lighting define the atmosphere of any event.
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                            className="text-white/60 text-lg leading-relaxed"
                        >
                            At Crystal Events, we provide professional DJ services, live music performances, and advanced sound and lighting solutions to create the perfect mood for your celebration. Whether it's a wedding, birthday party, or corporate event, we ensure an unforgettable experience for you and your guests.
                        </motion.p>
                    </div>
                </div>

                <div className="h-px bg-white/10 max-w-7xl mx-auto" />

                {/* ── Our Services ── */}
                <div className="py-24">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="text-center mb-16"
                        >
                            <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block">What We Offer</span>
                            <h2 className="text-3xl md:text-4xl font-black leading-tight">
                                Our DJ, Music & Sound Services
                            </h2>
                            <p className="text-white/50 mt-4 max-w-xl mx-auto">
                                Everything you need to fill your venue with energy, emotion, and atmosphere.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {djServices.map((service, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true, amount: 0.1 }}
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

                <div className="h-px bg-white/10 max-w-7xl mx-auto" />

                {/* ── Perfect for All Events & Customized Experience ── */}
                <div className="py-24">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

                        {/* Perfect for All Events */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Music className="text-mustard-gold w-6 h-6" strokeWidth={1.5} />
                                <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold">Perfect For</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                                Perfect for{' '}
                                <span className="text-mustard-gold">All Events</span>
                            </h2>
                            <p className="text-white/60 text-lg leading-relaxed mb-8">
                                Our DJ, music, and sound services work seamlessly with any event type. You can also combine this with our full event planning services for a complete experience.
                            </p>
                            <div className="space-y-3">
                                {perfectFor.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -15 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true, amount: 0.1 }}
                                        transition={{ duration: 0.4, delay: i * 0.07, ease: 'easeOut' }}
                                    >
                                        <Link
                                            to={item.linkTo}
                                            className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-4 hover:bg-white/10 hover:border-mustard-gold/30 hover:text-mustard-gold transition-all duration-300 group"
                                        >
                                            <span className="text-white/70 text-sm group-hover:text-mustard-gold transition-colors duration-300">{item.label}</span>
                                            <ArrowRight size={14} className="text-mustard-gold shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Customized Experience */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Headphones className="text-mustard-gold w-6 h-6" strokeWidth={1.5} />
                                <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold">Customized Experience</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                                Tailored to Your{' '}
                                <span className="text-mustard-gold">Event</span>
                            </h2>
                            <p className="text-white/60 text-lg leading-relaxed mb-8">
                                From elegant background music to high-energy dance parties — we create the perfect vibe based on what matters most to you.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {customFactors.map((f, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true, amount: 0.1 }}
                                        transition={{ duration: 0.4, delay: i * 0.07, ease: 'easeOut' }}
                                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-mustard-gold/30 transition-all duration-300"
                                    >
                                        <p className="text-white font-bold text-sm mb-1">{f.label}</p>
                                        <p className="text-white/40 text-xs">{f.sub}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="h-px bg-white/10 max-w-7xl mx-auto" />

                {/* ── Why Choose Crystal Events ── */}
                <div className="py-24">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, amount: 0.1 }}
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
                                    viewport={{ once: true, amount: 0.1 }}
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

export default LiveMusicDJ;
