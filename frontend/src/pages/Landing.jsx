import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    Calendar, Gem, UtensilsCrossed, Camera, Music, Speaker,
    ChevronDown, Paintbrush2, Star, Layers, Heart, MapPin, Award,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroBg from '../assets/images/hero_background.webp';
import logo from '../assets/images/logo.png';
import CTAFooter from '../components/layout/CTAFooter';
import AnimatedWords from '../components/AnimatedWords';
import {
    VP, VP_CONTENT,
    cascadeContainer, blockReveal, goldLine,
    fromLeft, fromRight,
    cardGrid, cardItem, scaleIn,
} from '../utils/animations';

const Landing = () => {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

    return (
        <>
        <Helmet>
            <title>Crystal Events Ireland | Luxury Wedding & Event Planners</title>
            <meta name="description" content="Crystal Events — premium wedding and event planners in Ireland and the UK. Creating unforgettable weddings, corporate events, and celebrations with elegance and precision." />
            <meta name="robots" content="index, follow" />
            <link rel="canonical" href="https://crystaleventsie.com/" />
            <meta property="og:title" content="Crystal Events Ireland | Luxury Wedding & Event Planners" />
            <meta property="og:description" content="Crystal Events — premium wedding and event planners in Ireland and the UK." />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://crystaleventsie.com/" />
        </Helmet>

        <div className="font-sans text-deep-teal bg-deep-teal">

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
                <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroBg})` }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-deep-teal/60 via-deep-teal/40 to-background-dark" />
                </motion.div>
                <div className="absolute inset-0 z-[5] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(1,20,20,0.82) 0%, rgba(1,20,20,0.45) 45%, transparent 72%)' }} />

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto text-white mt-16">

                    {/* ── Gold logo with real-gold sheen ── */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.95, ease: [0.34, 1.56, 0.64, 1] }}
                        className="logo-metal-wrapper w-36 h-36 mx-auto mb-8"
                    >
                        <img src={logo} alt="Crystal Events Logo" className="logo-metal-img w-full h-full object-contain" />
                        <div className="logo-metal-shine" style={{ '--logo-url': `url(${logo})` }} />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.85, delay: 0.25, ease: 'easeOut' }}
                        className="text-4xl sm:text-5xl md:text-8xl font-black leading-[1.1] tracking-tight text-white mb-6 font-sans"
                    >
                        Create your <br />
                        <span className="bg-gradient-to-r from-mustard-gold via-[#F8E0A0] to-mustard-gold bg-clip-text text-transparent">
                            best day ever
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.85, delay: 0.45, ease: 'easeOut' }}
                        className="mx-auto max-w-2xl text-lg md:text-xl font-light text-white/70 mb-10 leading-relaxed"
                    >
                        Creating unforgettable weddings, corporate events, and celebrations across Ireland with elegance and precision.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.85, delay: 0.65, ease: 'easeOut' }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <Link to="/contact"
                            className="w-full sm:w-auto min-w-[200px] flex items-center justify-center rounded-lg bg-mustard-gold px-8 py-4 text-base font-bold uppercase tracking-widest text-deep-teal hover:brightness-110 transition-all duration-300 shadow-[0_0_20px_rgba(238,192,89,0.4)]">
                            Book Your Event
                        </Link>
                        <Link to="/gallery"
                            className="w-full sm:w-auto min-w-[200px] flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-base font-bold uppercase tracking-widest text-white backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                            View Lookbook
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 1.2, duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                        className="absolute bottom-[-15vh] md:bottom-[-20vh] left-1/2 -translate-x-1/2"
                    >
                        <ChevronDown size={48} className="text-white" />
                    </motion.div>
                </div>
            </section>

            {/* ── Services ──────────────────────────────────────────────── */}
            <section className="min-h-screen pt-28 pb-20 px-6 md:px-16 bg-jungle-green text-white rounded-t-[2rem] flex flex-col justify-center" id="services">
                <div className="mx-auto max-w-7xl">

                    {/* Header — cascade: eyebrow → line → body */}
                    <motion.div className="mb-14" variants={cascadeContainer} initial="hidden" whileInView="visible" viewport={VP}>
                        <motion.span variants={blockReveal} className="text-mustard-gold font-bold uppercase tracking-[0.3em] text-sm mb-3 block">
                            Our Expertise
                        </motion.span>
                        <motion.div variants={goldLine} className="h-0.5 w-16 bg-mustard-gold origin-left mb-6" />
                        <AnimatedWords text="Bespoke Event Solutions" el="h2"
                            className="text-4xl md:text-5xl font-extrabold text-white mb-5 font-sans" />
                        <motion.p variants={blockReveal} className="text-white/60 text-lg leading-relaxed max-w-2xl">
                            From intimate gatherings to grand corporate celebrations, we provide end-to-end management with unmatched aesthetic precision.
                        </motion.p>
                    </motion.div>

                    {/* Cards — Apple icon stagger */}
                    <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={cardGrid} initial="hidden" whileInView="visible" viewport={VP}>
                        {[
                            { icon: <Calendar strokeWidth={1} />, title: 'Event Planning', desc: 'Comprehensive conceptualization, venue sourcing, and timeline management for a flawless flow.' },
                            { icon: <Gem strokeWidth={1} />, title: 'Stage Decoration', desc: 'Breathtaking floral sculptures and structural designs that transform any space into a masterpiece.' },
                            { icon: <UtensilsCrossed strokeWidth={1} />, title: 'Catering', desc: 'Exquisite culinary journeys crafted by world-class chefs, tailored to your palette and event theme.' },
                            { icon: <Camera strokeWidth={1} />, title: 'Photo & Video', desc: 'Capturing the soul of your event through high-end cinematic lenses and art-focused photography.' },
                            { icon: <Music strokeWidth={1} />, title: 'Live Music', desc: 'Curated talent from orchestral ensembles to jazz quartets and contemporary chart-toppers.' },
                            { icon: <Speaker strokeWidth={1} />, title: 'Light & Audio', desc: 'Immersive atmospheric design utilizing state-of-the-art acoustics and dynamic light shows.' },
                        ].map((s, i) => (
                            <motion.div key={i} variants={cardItem}
                                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                className="group overflow-hidden rounded-xl border border-white/5 bg-white/5 p-6 md:p-7 hover:bg-white/10 transition-colors duration-300">
                                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-mustard-gold/10 text-mustard-gold group-hover:scale-110 transition-transform duration-300">
                                    <div className="[&>svg]:w-7 [&>svg]:h-7">{s.icon}</div>
                                </div>
                                <h3 className="mb-3 text-lg font-bold text-white group-hover:text-mustard-gold transition-colors">{s.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── About ─────────────────────────────────────────────────── */}
            <section className="min-h-screen pt-28 pb-20 px-6 md:px-16 bg-background-dark text-white rounded-t-[2rem] flex flex-col justify-center" id="about">
                <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left */}
                    <div>
                        <motion.div variants={cascadeContainer} initial="hidden" whileInView="visible" viewport={VP}>
                            <motion.span variants={blockReveal} className="text-mustard-gold font-bold uppercase tracking-[0.3em] text-sm mb-3 block">
                                About Us
                            </motion.span>
                            <motion.div variants={goldLine} className="h-0.5 w-16 bg-mustard-gold origin-left mb-6" />
                        </motion.div>
                        <motion.h2
                            variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP_CONTENT}
                            className="text-4xl md:text-5xl font-extrabold text-white mb-6 font-sans leading-tight">
                            Crafting Unforgettable{' '}
                            <span className="text-mustard-gold">Experiences</span>
                        </motion.h2>
                        <motion.p variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP_CONTENT}
                            className="text-white/60 text-lg leading-relaxed mb-5">
                            At Crystal Events, we specialize in delivering exceptional event experiences tailored to your vision. Since 2021, we have been creating memorable celebrations, starting in the UK and now expanding across Ireland.
                        </motion.p>
                        <motion.p variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP_CONTENT}
                            className="text-white/60 text-lg leading-relaxed mb-8">
                            From elegant weddings to vibrant cultural events and professional corporate functions, we handle every detail with creativity and care.
                        </motion.p>
                        <motion.div variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP_CONTENT}>
                            <Link to="/about"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all duration-300 shadow-[0_0_20px_rgba(238,192,89,0.3)]">
                                Learn More About Us
                            </Link>
                        </motion.div>
                    </div>

                    {/* Right — stats, Apple icon stagger */}
                    <motion.div className="grid grid-cols-2 gap-6"
                        variants={cardGrid} initial="hidden" whileInView="visible" viewport={VP}>
                        {[
                            { value: '2021', label: 'Founded', sub: 'Started in the UK' },
                            { value: '200+', label: 'Events Done', sub: 'Across UK & Ireland' },
                            { value: '2', label: 'Countries', sub: 'UK & Ireland' },
                            { value: '100%', label: 'Satisfaction', sub: 'Client happiness' },
                        ].map((stat, i) => (
                            <motion.div key={i} variants={scaleIn}
                                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center hover:bg-white/10 transition-all duration-300">
                                <p className="text-4xl font-black text-mustard-gold mb-1">{stat.value}</p>
                                <p className="text-white font-semibold text-sm mb-1">{stat.label}</p>
                                <p className="text-white/40 text-xs">{stat.sub}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── Why Choose Us ────────────────────────────────────────── */}
            <section className="min-h-screen pt-28 pb-20 px-6 md:px-16 bg-jungle-green text-white rounded-t-[2rem] flex flex-col justify-center" id="why-us">
                <div className="mx-auto max-w-7xl">

                    <motion.div className="text-center mb-14" variants={cascadeContainer} initial="hidden" whileInView="visible" viewport={VP}>
                        <motion.span variants={blockReveal} className="text-mustard-gold font-bold uppercase tracking-[0.3em] text-sm mb-3 block">
                            Our Promise
                        </motion.span>
                        <motion.div variants={goldLine} className="h-0.5 w-16 bg-mustard-gold origin-left mb-6 mx-auto" />
                    </motion.div>
                    <AnimatedWords text="Why Choose Us" el="h2"
                        className="text-4xl md:text-5xl font-extrabold text-white font-sans text-center mb-14" />

                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                        variants={cardGrid} initial="hidden" whileInView="visible" viewport={VP}>
                        {[
                            { icon: <Paintbrush2 strokeWidth={1.5} />, title: 'Fully Customized Event Designs', desc: 'Every event is uniquely designed around your vision, taste, and personal style.' },
                            { icon: <Award strokeWidth={1.5} />, title: 'Premium Quality Service', desc: 'We hold ourselves to the highest standards in every detail, from first consultation to final moment.' },
                            { icon: <Layers strokeWidth={1.5} />, title: 'One-Stop Solution', desc: 'Planning, decor, catering, entertainment — everything under one roof, seamlessly coordinated.' },
                            { icon: <Heart strokeWidth={1.5} />, title: 'Cultural & Indian Events', desc: 'Deep-rooted expertise in Indian and multicultural celebrations, honouring traditions with elegance.' },
                            { icon: <MapPin strokeWidth={1.5} />, title: 'Serving All of Ireland', desc: 'From Galway to Dublin and everywhere in between, we bring world-class events to every corner.' },
                            { icon: <Star strokeWidth={1.5} />, title: 'Experience You Can Trust', desc: 'Over 200 successful events since 2021, built on trust, professionalism, and genuine passion.' },
                        ].map((item, i) => (
                            <motion.div key={i} variants={cardItem}
                                whileHover={{ y: -5, transition: { duration: 0.25 } }}
                                className="group overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-7 hover:bg-white/10 hover:border-mustard-gold/20 transition-all duration-300">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-mustard-gold/10 text-mustard-gold group-hover:bg-mustard-gold/20 transition-all duration-300">
                                    <div className="[&>svg]:w-6 [&>svg]:h-6">{item.icon}</div>
                                </div>
                                <h3 className="text-base font-bold text-white mb-2 group-hover:text-mustard-gold transition-colors leading-snug">{item.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── Service Area ──────────────────────────────────────────── */}
            <section className="min-h-screen pt-28 pb-20 px-6 md:px-16 bg-background-dark text-white rounded-t-[2rem] flex flex-col justify-center" id="service-area">
                <div className="mx-auto max-w-7xl">

                    <motion.div className="text-center mb-16" variants={cascadeContainer} initial="hidden" whileInView="visible" viewport={VP}>
                        <motion.span variants={blockReveal} className="text-mustard-gold font-bold uppercase tracking-[0.3em] text-sm mb-3 block">
                            Where We Serve
                        </motion.span>
                        <motion.div variants={goldLine} className="h-0.5 w-16 bg-mustard-gold origin-left mb-6 mx-auto" />
                        <AnimatedWords text="Our Service Area" el="h2"
                            className="text-4xl md:text-5xl font-extrabold text-white font-sans mb-4" />
                        <motion.p variants={blockReveal}
                            className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
                            Based in Ballinasloe, Galway, Crystal Events brings world-class event planning and decoration to every corner of Ireland and the UK.
                        </motion.p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Locations — Apple icon stagger */}
                        <motion.div className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                            variants={cardGrid} initial="hidden" whileInView="visible" viewport={VP}>
                            {[
                                { city: 'Galway', note: 'Home base' },
                                { city: 'Dublin', note: 'Capital region' },
                                { city: 'Cork', note: 'Southern Ireland' },
                                { city: 'Limerick', note: 'Mid-west Ireland' },
                                { city: 'Athlone', note: 'Midlands' },
                                { city: 'Roscommon', note: 'Connacht' },
                                { city: 'Sligo', note: 'North-west' },
                                { city: 'Waterford', note: 'South-east' },
                                { city: 'London, UK', note: 'Redhill base' },
                            ].map((loc, i) => (
                                <motion.div key={i} variants={cardItem}
                                    className="rounded-xl border border-white/10 bg-white/5 p-4 text-center hover:bg-white/10 hover:border-mustard-gold/30 transition-all duration-300">
                                    <div className="flex items-center justify-center gap-1.5 mb-1">
                                        <MapPin size={12} className="text-mustard-gold shrink-0" />
                                        <p className="text-white font-bold text-sm">{loc.city}</p>
                                    </div>
                                    <p className="text-white/40 text-xs">{loc.note}</p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Text block */}
                        <motion.div variants={fromRight} initial="hidden" whileInView="visible" viewport={VP}>
                            <AnimatedWords text="Celebrations Across All of Ireland" el="h3"
                                className="text-3xl md:text-4xl font-black mb-6 leading-tight text-white" />
                            <motion.p variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP_CONTENT}
                                className="text-white/60 text-lg leading-relaxed mb-6">
                                No matter where you are in Ireland, our team travels to you. From intimate village gatherings to grand city celebrations, we bring the same premium experience everywhere we go.
                            </motion.p>
                            <motion.p variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP_CONTENT}
                                className="text-white/60 text-lg leading-relaxed">
                                We also serve clients in the UK through our Redhill, London base — so wherever your celebration takes place, Crystal Events will be there.
                            </motion.p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── CTA + Footer ──────────────────────────────────────────── */}
            <motion.div variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP}>
                <CTAFooter />
            </motion.div>

        </div>
        </>
    );
};

export default Landing;
