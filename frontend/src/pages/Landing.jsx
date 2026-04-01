import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, Gem, UtensilsCrossed, Camera, Music, Speaker, ChevronDown, Paintbrush2, Star, Layers, Heart, MapPin, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroBg from '../assets/images/hero_background.webp';
import logo from '../assets/images/logo.png';
import CTAFooter from '../components/layout/CTAFooter';

const cardContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};
const cardItem = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const Landing = () => {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

    const { scrollY } = useScroll();
    const sectionShadow = useTransform(
        scrollY,
        [0, 80],
        ['0px -16px 60px rgba(0,0,0,0)', '0px -16px 60px rgba(0,0,0,0.5)']
    );

    return (
        <>
        <Helmet>
            <title>Crystal Events Ireland | Luxury Wedding & Event Planners</title>
            <meta name="description" content="Crystal Events — premium wedding and event planners in Ireland and the UK. Creating unforgettable weddings, corporate events, and celebrations with elegance and precision." />
            <meta name="robots" content="index, follow" />
            <link rel="canonical" href="https://crystaleventsie.com/" />
            <meta property="og:title" content="Crystal Events Ireland | Luxury Wedding & Event Planners" />
            <meta property="og:description" content="Crystal Events — premium wedding and event planners in Ireland and the UK. Creating unforgettable weddings, corporate events, and celebrations with elegance and precision." />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://crystaleventsie.com/" />
        </Helmet>
        <div className="font-sans text-deep-teal bg-deep-teal">

            {/* ── Hero ── sticky base, z-index 1 */}
            <section data-scroll-snap ref={heroRef} className="lg:sticky lg:top-0 z-[1] relative h-screen flex items-center justify-center overflow-hidden">
                {/* Parallax Background */}
                <motion.div
                    style={{ y, opacity }}
                    className="absolute inset-0 z-0"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${heroBg})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-deep-teal/60 via-deep-teal/40 to-background-dark" />
                </motion.div>

                {/* Radial dark glow behind content */}
                <div className="absolute inset-0 z-[5] pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(1,20,20,0.82) 0%, rgba(1,20,20,0.45) 45%, transparent 72%)' }} />

                {/* Hero Content */}
                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto text-white mt-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="mx-auto mb-8"
                    >
                        <div className="w-32 h-32 mx-auto flex items-center justify-center -mb-4">
                            <img src={logo} alt="Crystal Events Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(238,192,89,0.3)]" />
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-4xl sm:text-5xl md:text-8xl font-black leading-[1.1] tracking-tight text-white mb-6 font-sans"
                    >
                        Create your <br />
                        <span className="bg-gradient-to-r from-mustard-gold via-[#F8E0A0] to-mustard-gold bg-clip-text text-transparent">
                            best day ever
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                        className="mx-auto max-w-2xl text-lg md:text-xl font-light text-white/70 mb-10 leading-relaxed"
                    >
                        Creating unforgettable weddings, corporate events, and celebrations across Ireland with elegance and precision.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <Link
                            to="/contact"
                            className="w-full sm:w-auto min-w-[200px] flex items-center justify-center rounded-lg bg-mustard-gold px-8 py-4 text-base font-bold uppercase tracking-widest text-deep-teal hover:brightness-110 transition-all duration-300 shadow-[0_0_20px_rgba(238,192,89,0.4)]"
                        >
                            Book Your Event
                        </Link>
                        <Link
                            to="/gallery"
                            className="w-full sm:w-auto min-w-[200px] flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-base font-bold uppercase tracking-widest text-white backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                        >
                            View Lookbook
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 1, duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                        className="absolute bottom-[-15vh] md:bottom-[-20vh] left-1/2 -translate-x-1/2"
                    >
                        <ChevronDown size={48} className="text-white" />
                    </motion.div>
                </div>
            </section>

            {/* ── Services ── slides over hero, z-index 2 */}
            <motion.section
                data-scroll-snap
                style={{ boxShadow: sectionShadow }}
                className="lg:sticky lg:top-0 z-[2] min-h-screen py-28 px-6 md:px-16 bg-jungle-green text-white rounded-t-[2rem] flex flex-col justify-center"
                id="services"
            >
                <div className="mx-auto max-w-7xl">
                    <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-2xl">
                            <span className="text-mustard-gold font-bold uppercase tracking-[0.3em] text-sm mb-4 block">Our Expertise</span>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 font-sans">Bespoke Event Solutions</h2>
                            <p className="text-white/60 text-lg leading-relaxed">
                                From intimate gatherings to grand corporate celebrations, we provide end-to-end management with unmatched aesthetic precision.
                            </p>
                        </div>
                        <div className="h-1 w-24 bg-mustard-gold hidden md:block" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: <Calendar strokeWidth={1} />, title: "Event Planning", desc: "Comprehensive conceptualization, venue sourcing, and timeline management for a flawless flow." },
                            { icon: <Gem strokeWidth={1} />, title: "Stage Decoration", desc: "Breathtaking floral sculptures and structural designs that transform any space into a masterpiece." },
                            { icon: <UtensilsCrossed strokeWidth={1} />, title: "Catering", desc: "Exquisite culinary journeys crafted by world-class chefs, tailored to your palette and event theme." },
                            { icon: <Camera strokeWidth={1} />, title: "Photo & Video", desc: "Capturing the soul of your event through high-end cinematic lenses and art-focused photography." },
                            { icon: <Music strokeWidth={1} />, title: "Live Music", desc: "Curated talent from orchestral ensembles to jazz quartets and contemporary chart-toppers." },
                            { icon: <Speaker strokeWidth={1} />, title: "Light & Audio", desc: "Immersive atmospheric design utilizing state-of-the-art acoustics and dynamic light shows." },
                        ].map((service, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 p-6 md:p-7 transition-all duration-300 hover:bg-white/10"
                            >
                                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-mustard-gold/10 text-mustard-gold transition-transform duration-300 ease-out group-hover:scale-110">
                                    <div className="[&>svg]:w-7 [&>svg]:h-7">{service.icon}</div>
                                </div>
                                <h3 className="mb-3 text-lg font-bold text-white group-hover:text-mustard-gold transition-colors">{service.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{service.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* ── About ── slides over services, z-index 3 */}
            <motion.section
                data-scroll-snap
                style={{ boxShadow: sectionShadow }}
                className="lg:sticky lg:top-0 z-[3] min-h-screen py-28 px-6 md:px-16 bg-background-dark text-white rounded-t-[2rem] flex flex-col justify-center"
                id="about"
            >
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left: Text */}
                        <div>
                            <span className="text-mustard-gold font-bold uppercase tracking-[0.3em] text-sm mb-4 block">About Us</span>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 font-sans leading-tight">
                                Crafting Unforgettable <span className="text-mustard-gold">Experiences</span>
                            </h2>
                            <p className="text-white/60 text-lg leading-relaxed mb-6">
                                At Crystal Events, we specialize in delivering exceptional event experiences tailored to your vision. Since 2021, we have been creating memorable celebrations, starting in the UK and now expanding across Ireland.
                            </p>
                            <p className="text-white/60 text-lg leading-relaxed mb-8">
                                From elegant weddings to vibrant cultural events and professional corporate functions, we handle every detail with creativity and care.
                            </p>
                            <Link
                                to="/about"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all duration-300 shadow-[0_0_20px_rgba(238,192,89,0.3)]"
                            >
                                Learn More About Us
                            </Link>
                        </div>

                        {/* Right: Stats */}
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { value: '2021', label: 'Founded', sub: 'Started in the UK' },
                                { value: '200+', label: 'Events Done', sub: 'Across UK & Ireland' },
                                { value: '2', label: 'Countries', sub: 'UK & Ireland' },
                                { value: '100%', label: 'Satisfaction', sub: 'Client happiness' },
                            ].map((stat, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center hover:bg-white/10 transition-all duration-300"
                                >
                                    <p className="text-4xl font-black text-mustard-gold mb-1">{stat.value}</p>
                                    <p className="text-white font-semibold text-sm mb-1">{stat.label}</p>
                                    <p className="text-white/40 text-xs">{stat.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ── Why Choose Us ── slides over about, z-index 4 */}
            <motion.section
                data-scroll-snap
                style={{ boxShadow: sectionShadow }}
                className="lg:sticky lg:top-0 z-[4] min-h-screen py-28 px-6 md:px-16 bg-jungle-green text-white rounded-t-[2rem] flex flex-col justify-center"
                id="why-us"
            >
                <div className="mx-auto max-w-7xl">
                    <div className="text-center mb-12">
                        <span className="text-mustard-gold font-bold uppercase tracking-[0.3em] text-sm mb-4 block">Our Promise</span>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white font-sans">Why Choose Us</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[
                            { icon: <Paintbrush2 strokeWidth={1.5} />, title: 'Fully Customized Event Designs', desc: 'Every event is uniquely designed around your vision, taste, and personal style — no cookie-cutter packages.' },
                            { icon: <Award strokeWidth={1.5} />, title: 'Premium Quality Service', desc: 'We hold ourselves to the highest standards in every detail, from the first consultation to the final moment.' },
                            { icon: <Layers strokeWidth={1.5} />, title: 'One-Stop Solution', desc: 'Planning, decor, catering, entertainment — everything you need under one roof, seamlessly coordinated.' },
                            { icon: <Heart strokeWidth={1.5} />, title: 'Cultural & Indian Events', desc: 'Deep-rooted expertise in Indian and multicultural celebrations, honouring traditions with elegance and pride.' },
                            { icon: <MapPin strokeWidth={1.5} />, title: 'Serving All of Ireland', desc: 'From Galway to Dublin and everywhere in between, we bring world-class events to every corner of Ireland.' },
                            { icon: <Star strokeWidth={1.5} />, title: 'Experience You Can Trust', desc: 'Over 200 successful events since 2021, built on trust, professionalism, and a genuine passion for celebration.' },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-7 hover:bg-white/10 hover:border-mustard-gold/20 transition-all duration-300"
                            >
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-mustard-gold/10 text-mustard-gold group-hover:bg-mustard-gold/20 transition-all duration-300">
                                    <div className="[&>svg]:w-6 [&>svg]:h-6">{item.icon}</div>
                                </div>
                                <h3 className="text-base font-bold text-white mb-2 group-hover:text-mustard-gold transition-colors leading-snug">{item.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* ── Service Area ── slides over why-us, z-index 5 */}
            <motion.section
                data-scroll-snap
                style={{ boxShadow: sectionShadow }}
                className="lg:sticky lg:top-0 z-[5] min-h-screen py-28 px-6 md:px-16 bg-background-dark text-white rounded-t-[2rem] flex flex-col justify-center"
                id="service-area"
            >
                <div className="mx-auto max-w-7xl">
                    <div className="text-center mb-16">
                        <span className="text-mustard-gold font-bold uppercase tracking-[0.3em] text-sm mb-4 block">Where We Serve</span>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white font-sans mb-4">Our Service Area</h2>
                        <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
                            Based in Ballinasloe, Galway, Crystal Events brings world-class event planning and decoration to every corner of Ireland and the UK.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Locations grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.1 }}
                                    transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
                                    className="rounded-xl border border-white/10 bg-white/5 p-4 text-center hover:bg-white/10 hover:border-mustard-gold/30 transition-all duration-300"
                                >
                                    <div className="flex items-center justify-center gap-1.5 mb-1">
                                        <MapPin size={12} className="text-mustard-gold shrink-0" />
                                        <p className="text-white font-bold text-sm">{loc.city}</p>
                                    </div>
                                    <p className="text-white/40 text-xs">{loc.note}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Text block */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        >
                            <h3 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                                Celebrations Across{' '}
                                <span className="text-mustard-gold">All of Ireland</span>
                            </h3>
                            <p className="text-white/60 text-lg leading-relaxed mb-6">
                                No matter where you are in Ireland, our team travels to you. From intimate village gatherings to grand city celebrations, we bring the same premium experience everywhere we go.
                            </p>
                            <p className="text-white/60 text-lg leading-relaxed">
                                We also serve clients in the UK through our Redhill, London base — so wherever your celebration takes place, Crystal Events will be there.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* ── CTA + Footer ── top card, z-index 6 */}
            <motion.div data-scroll-snap style={{ boxShadow: sectionShadow }} className="lg:sticky lg:top-0 z-[6]">
                <CTAFooter />
            </motion.div>

        </div>
        </>
    );
};

export default Landing;
