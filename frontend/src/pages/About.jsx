import { useRef, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useMotionValue, animate, useScroll, useTransform } from 'framer-motion';
import aboutHero from '../assets/images/aboutus_hero.webp';
import aboutStory from '../assets/images/aboutus_second_image.webp';
import {
    Gem, Star, ChevronLeft, ChevronRight,
    Palette, Globe, Layers, CheckCircle2, ArrowRight, MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import AnimatedWords from '../components/AnimatedWords';
import {
    VP, VP_CONTENT,
    cascadeContainer, blockReveal, goldLine,
    fromLeft, fromRight, cardGrid, cardItem, scaleIn
} from '../utils/animations';

const whatWeDo = [
    'Wedding planning and coordination',
    'Birthday and private events',
    'Corporate event management',
    'Stage decoration and design',
    'Catering services',
    'Photography and videography',
    'DJ, live music, and sound solutions',
];

const missionPoints = [
    'Deliver exceptional and personalised event experiences',
    'Maintain high standards of quality and professionalism',
    'Build long-term relationships with our clients',
    'Continuously innovate and improve our services',
];

const whatMakesDifferent = [
    {
        icon: <Palette strokeWidth={1.5} />,
        title: 'Fully Customized Events',
        desc: 'Every event we create is designed based on your unique vision, preferences, and cultural background.',
    },
    {
        icon: <Globe strokeWidth={1.5} />,
        title: 'Cultural Expertise',
        desc: 'We specialise in Indian and multicultural events, bringing authenticity and elegance to every celebration.',
    },
    {
        icon: <Gem strokeWidth={1.5} />,
        title: 'Premium Quality Service',
        desc: 'From planning to execution, we focus on delivering a seamless and high-quality experience.',
    },
    {
        icon: <Layers strokeWidth={1.5} />,
        title: 'One-Stop Solution',
        desc: 'We handle everything — so you can enjoy your event stress-free.',
    },
];

const whoWeServe = [
    { label: 'Families & Individuals', sub: 'Private & personal celebrations' },
    { label: 'Indian Community', sub: 'Cultural events across Ireland' },
    { label: 'Irish & Multicultural', sub: 'All traditions honoured' },
    { label: 'Businesses & Corporates', sub: 'Professional event management' },
];

const About = () => {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });

    const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    const [teamMembers, setTeamMembers] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [reviewIndex, setReviewIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const response = await api.get('/team-members/');
                const validMembers = response.data
                    .sort((a, b) => a.order - b.order)
                    .filter(member => member.user_details.profile_picture);
                setTeamMembers(validMembers);
            } catch (err) {
                console.error('Failed to fetch team members:', err);
            } finally {
                setLoadingTeam(false);
            }
        };
        fetchTeam();
    }, []);

    useEffect(() => {
        api.get('/public/reviews/')
            .then(res => setReviews(res.data))
            .catch(() => {});
    }, []);

    // ── Carousel ────────────────────────────────────────────────
    const carouselRef = useRef(null);
    const trackX = useMotionValue(0);
    const [trackCards, setTrackCards] = useState([]);
    const [isSliding, setIsSliding] = useState(false);
    const [cardWidth, setCardWidth] = useState(0);
    const CARD_GAP = 32;

    const getColCount = (w) => (w >= 1024 ? 3 : w >= 768 ? 2 : 1);

    useEffect(() => {
        if (!carouselRef.current) return;
        const measure = () => {
            if (!carouselRef.current) return;
            const w = carouselRef.current.offsetWidth;
            const cols = getColCount(w);
            setCardWidth((w - (cols - 1) * CARD_GAP) / cols);
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(carouselRef.current);
        return () => ro.disconnect();
    }, [reviews.length]);

    useEffect(() => {
        if (isSliding || reviews.length === 0) return;
        if (!carouselRef.current) return;
        const w = carouselRef.current.offsetWidth;
        const cols = getColCount(w);
        const cw = (w - (cols - 1) * CARD_GAP) / cols;
        setCardWidth(cw);
        const count = Math.min(cols, reviews.length);
        setTrackCards(Array.from({ length: count }, (_, i) => reviews[(reviewIndex + i) % reviews.length]));
        trackX.set(0);
    }, [reviews, reviewIndex, isSliding]);

    const slideOffset = cardWidth + CARD_GAP;

    const handleNext = () => {
        if (isSliding || reviews.length <= trackCards.length || cardWidth === 0) return;
        setIsSliding(true);
        const newCard = reviews[(reviewIndex + trackCards.length) % reviews.length];
        setTrackCards(prev => [...prev, newCard]);
        animate(trackX, -slideOffset, {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            onComplete: () => {
                setReviewIndex(i => (i + 1) % reviews.length);
                setIsSliding(false);
            },
        });
    };

    const handlePrev = () => {
        if (isSliding || reviews.length <= trackCards.length || cardWidth === 0) return;
        setIsSliding(true);
        const newIndex = (reviewIndex - 1 + reviews.length) % reviews.length;
        const newCard = reviews[newIndex];
        setTrackCards(prev => [newCard, ...prev]);
        trackX.set(-slideOffset);
        animate(trackX, 0, {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            onComplete: () => {
                setReviewIndex(newIndex);
                setIsSliding(false);
            },
        });
    };

    return (
        <>
            <Helmet>
                <title>About Crystal Events | Event Management Company in Ireland</title>
                <meta name="description" content="Learn about Crystal Events, a premium event management company in Ireland specializing in weddings, corporate events, and cultural celebrations." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://crystaleventsie.com/about" />
                <meta property="og:title" content="About Crystal Events | Event Management Company in Ireland" />
                <meta property="og:description" content="Learn about Crystal Events, a premium event management company in Ireland specializing in weddings, corporate events, and cultural celebrations." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://crystaleventsie.com/about" />
            </Helmet>
            <div className="font-sans text-white">

                {/* ── Hero ── Dark noir ──────────────────────────────────── */}
                <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden section-noir">
                    <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#050d0d]/80 via-[#050d0d]/60 to-[#050d0d] z-10" />
                        <img src={aboutHero} alt="Crystal Events Ireland" className="w-full h-full object-cover" />
                    </motion.div>
                    <div className="relative z-20 text-center px-6 md:px-12 lg:px-20 max-w-4xl">
                        <motion.span
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.65, ease: 'easeOut' }}
                            className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block"
                        >
                            About Crystal Events
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.85, delay: 0.15, ease: 'easeOut' }}
                            className="text-4xl md:text-7xl font-black mb-6 leading-tight"
                        >
                            Creating Unforgettable Events{' '}
                            <span className="bg-gradient-to-r from-[#e2c08d] to-mustard-gold bg-clip-text text-transparent">
                                Across Ireland
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.85, delay: 0.3, ease: 'easeOut' }}
                            className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
                        >
                            Your trusted partner for weddings, celebrations, and corporate events.
                        </motion.p>
                    </div>
                </section>

                {/* ── Our Story ── Cream light section ──────────────────── */}
                <section className="relative py-28 md:py-36 section-cream overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px gold-shimmer-line" />
                    <div className="px-6 lg:px-20 max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <motion.div variants={fromLeft} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="space-y-8">
                                <div>
                                    <motion.div variants={cascadeContainer} initial="hidden" whileInView="visible" viewport={VP_CONTENT}>
                                        <motion.span variants={blockReveal} className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold inline-block">Our Story</motion.span>
                                        <motion.div variants={goldLine} className="h-0.5 w-16 bg-mustard-gold origin-left mt-3 mb-5" />
                                    </motion.div>
                                    <motion.h2
                                        variants={blockReveal}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={VP_CONTENT}
                                        className="text-4xl font-bold mb-6 leading-tight text-deep-teal"
                                    >
                                        From the UK to Ireland —{' '}
                                        <span className="text-mustard-gold">Built on Passion</span>
                                    </motion.h2>
                                    <motion.p variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="text-deep-teal/70 leading-relaxed text-lg mb-4">
                                        Crystal Events was founded in 2021 with a passion for creating memorable experiences and beautifully crafted events. Starting our journey in the UK, we built a reputation for delivering high-quality, customised event solutions.
                                    </motion.p>
                                    <motion.p variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="text-deep-teal/70 leading-relaxed text-lg mb-4">
                                        Today, we are proud to bring our expertise to Ireland, offering premium event management services tailored to diverse cultures, styles, and celebrations.
                                    </motion.p>
                                    <motion.p variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="text-deep-teal/70 leading-relaxed text-lg">
                                        Our mission is simple — to turn your vision into reality and create moments that last a lifetime.
                                    </motion.p>
                                </div>
                                <motion.div
                                    className="grid grid-cols-2 gap-8 pt-4"
                                    variants={cardGrid}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={VP_CONTENT}
                                >
                                    {[
                                        { value: '2021', label: 'Founded' },
                                        { value: '200+', label: 'Events Done' },
                                        { value: '2', label: 'Countries' },
                                        { value: '100%', label: 'Satisfaction' },
                                    ].map((stat, i) => (
                                        <motion.div key={i} variants={scaleIn}>
                                            <div className="text-3xl font-black text-mustard-gold mb-1 font-sans">{stat.value}</div>
                                            <div className="text-deep-teal/50 text-xs uppercase tracking-widest">{stat.label}</div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>

                            <motion.div variants={fromRight} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="relative mt-8 lg:mt-0">
                                <div className="absolute -top-6 -left-6 w-32 h-32 border-t-2 border-l-2 border-mustard-gold/40 z-0 rounded-tl-2xl" />
                                <div className="absolute -bottom-6 -right-6 w-32 h-32 border-b-2 border-r-2 border-mustard-gold/40 z-0 rounded-br-2xl" />
                                <div className="relative z-10 rounded-2xl overflow-hidden aspect-[4/5] shadow-2xl">
                                    <img className="w-full h-full object-cover" src={aboutStory} alt="Event management company Ireland" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── What We Do & Vision ── Gold glow dark ───────────── */}
                <section className="py-28 md:py-36 px-6 md:px-12 lg:px-20 section-gold-glow relative overflow-hidden">
                    <div className="orb orb-gold w-[400px] h-[400px] -bottom-20 right-0" style={{ animationDelay: '5s' }} />

                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start relative z-10">

                        {/* What We Do */}
                        <motion.div variants={fromLeft} initial="hidden" whileInView="visible" viewport={VP_CONTENT}>
                            <motion.div variants={cascadeContainer} initial="hidden" whileInView="visible" viewport={VP_CONTENT}>
                                <motion.span variants={blockReveal} className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold inline-block">What We Do</motion.span>
                                <motion.div variants={goldLine} className="h-0.5 w-16 bg-mustard-gold origin-left mt-3 mb-5" />
                            </motion.div>
                            <motion.h2
                                variants={blockReveal}
                                initial="hidden"
                                whileInView="visible"
                                viewport={VP_CONTENT}
                                className="text-3xl md:text-4xl font-bold mb-4 leading-tight"
                            >
                                Complete Event Management,{' '}
                                <span className="text-mustard-gold">End to End</span>
                            </motion.h2>
                            <motion.p variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="text-white/70 text-lg leading-relaxed mb-8">
                                We provide complete event management services, handling every detail from planning to execution. Whether it's an intimate gathering or a large-scale celebration, we ensure every event is executed with precision and creativity.
                            </motion.p>
                            <motion.ul
                                className="space-y-3"
                                variants={cardGrid}
                                initial="hidden"
                                whileInView="visible"
                                viewport={VP_CONTENT}
                            >
                                {whatWeDo.map((item, i) => (
                                    <motion.li key={i} variants={cardItem} className="flex items-center gap-3 text-white/70 text-sm">
                                        <CheckCircle2 size={16} className="text-mustard-gold shrink-0" strokeWidth={2} />
                                        {item}
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </motion.div>

                        {/* Our Vision & Mission */}
                        <motion.div variants={fromRight} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="space-y-10">
                            <motion.div variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="glass-card rounded-2xl p-8">
                                <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-3 block">Our Vision</span>
                                <p className="text-white/80 text-lg leading-relaxed">
                                    To become one of the most trusted and recognised event management companies in Ireland, known for creativity, quality, and customer satisfaction.
                                </p>
                            </motion.div>
                            <motion.div variants={blockReveal} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="glass-card rounded-2xl p-8">
                                <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block">Our Mission</span>
                                <ul className="space-y-3">
                                    {missionPoints.map((point, i) => (
                                        <li key={i} className="flex items-start gap-3 text-white/70 text-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-mustard-gold shrink-0 mt-1.5" />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* ── What Makes Us Different ── Sage light section ────── */}
                <section className="py-28 md:py-36 px-6 md:px-12 lg:px-20 section-sage relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px gold-shimmer-line" />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <motion.div variants={cascadeContainer} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="text-center mb-16">
                            <motion.span variants={blockReveal} className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold mb-3 inline-block">The Crystal Difference</motion.span>
                            <motion.div variants={goldLine} className="h-0.5 w-16 bg-mustard-gold origin-left mb-6 mx-auto" />
                            <motion.h2 variants={blockReveal} className="text-4xl md:text-5xl font-bold leading-tight text-deep-teal">
                                What Makes Us <span className="text-mustard-gold">Different</span>
                            </motion.h2>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                            variants={cardGrid}
                            initial="hidden"
                            whileInView="visible"
                            viewport={VP_CONTENT}
                        >
                            {whatMakesDifferent.map((item, i) => (
                                <motion.div
                                    key={i}
                                    variants={cardItem}
                                    className="glass-card-light rounded-2xl p-7 transition-all duration-300 group text-center"
                                >
                                    <div className="text-mustard-gold mb-5 [&>svg]:w-8 [&>svg]:h-8 transition-transform duration-300 ease-out group-hover:scale-110 inline-block">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-deep-teal font-bold text-base mb-3 group-hover:text-mustard-gold transition-colors duration-300">{item.title}</h3>
                                    <p className="text-deep-teal/50 text-sm leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ── Who We Serve & Where We Work ── Pattern dark ────── */}
                <section className="py-28 md:py-36 px-6 md:px-12 lg:px-20 section-pattern relative overflow-hidden">
                    <div className="orb orb-teal w-[350px] h-[350px] top-20 -left-20" style={{ animationDelay: '4s' }} />

                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                        <motion.div variants={fromLeft} initial="hidden" whileInView="visible" viewport={VP_CONTENT}>
                            <motion.div variants={cascadeContainer} initial="hidden" whileInView="visible" viewport={VP_CONTENT}>
                                <motion.span variants={blockReveal} className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold mb-3 inline-block">Who We Serve</motion.span>
                                <motion.div variants={goldLine} className="h-0.5 w-16 bg-mustard-gold origin-left mb-6" />
                            </motion.div>
                            <motion.h3
                                variants={blockReveal}
                                initial="hidden"
                                whileInView="visible"
                                viewport={VP_CONTENT}
                                className="text-3xl md:text-4xl font-bold mb-8 leading-tight"
                            >
                                Proudly Serving{' '}
                                <span className="text-mustard-gold">Every Community</span>
                            </motion.h3>
                            <motion.div
                                className="grid grid-cols-2 gap-4"
                                variants={cardGrid}
                                initial="hidden"
                                whileInView="visible"
                                viewport={VP_CONTENT}
                            >
                                {whoWeServe.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        variants={cardItem}
                                        className="card-gold-border rounded-xl p-5 transition-all duration-300"
                                    >
                                        <p className="text-white font-bold text-sm mb-1">{item.label}</p>
                                        <p className="text-white/40 text-xs">{item.sub}</p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>

                        <motion.div variants={fromRight} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="space-y-8">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <MapPin className="text-mustard-gold w-6 h-6" strokeWidth={1.5} />
                                    <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold">Where We Work</span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                                    Serving All of{' '}
                                    <span className="text-mustard-gold">Ireland</span>
                                </h3>
                                <p className="text-white/70 text-lg leading-relaxed">
                                    Based in Ballinasloe, Galway, Crystal Events provides services across all of Ireland — and beyond through our UK base in Redhill, London.
                                </p>
                            </div>
                            <div className="glass-card rounded-2xl p-7">
                                <p className="text-white/60 text-sm leading-relaxed mb-6">
                                    Browse our gallery to see real events we've delivered — from wedding stages to corporate setups and birthday celebrations.
                                </p>
                                <Link
                                    to="/gallery"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-full hover:brightness-110 transition-all duration-300 text-xs shadow-[0_0_15px_rgba(238,192,89,0.25)]"
                                >
                                    View Our Work <ArrowRight size={13} />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ── Team ── Cream light section ──────────────────────── */}
                {!loadingTeam && teamMembers.length > 0 && (
                    <section className="py-28 md:py-36 section-cream relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-px gold-shimmer-line" />
                        <div className="px-6 lg:px-20 max-w-7xl mx-auto min-h-[500px] relative z-10">
                            <motion.div variants={cascadeContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0 }} className="text-center mb-16">
                                <motion.span variants={blockReveal} className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold inline-block">The Visionaries</motion.span>
                                <motion.div variants={goldLine} className="h-0.5 w-16 bg-mustard-gold origin-left mt-4 mb-4 mx-auto" />
                                <AnimatedWords text="Meet Our Team" el="h2" className="text-4xl font-bold mb-2 text-deep-teal" />
                            </motion.div>

                            <div className="flex flex-wrap justify-center gap-8 lg:gap-10">
                                {teamMembers.map((member) => (
                                    <motion.div
                                        key={member.id}
                                        variants={cardItem}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true, amount: 0.1 }}
                                        className="group flex flex-col items-center text-center w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] lg:w-[calc(25%-2rem)]"
                                    >
                                        <div className="relative overflow-hidden rounded-2xl aspect-[3/4] mb-8 w-full shadow-2xl border border-white/5">
                                            <div className="absolute inset-0 transition-all duration-700 ease-out [filter:grayscale(70%)] group-hover:[filter:grayscale(0%)]">
                                                <img
                                                    className="w-full h-full object-cover transition-transform duration-700 ease-out scale-105 group-hover:scale-100"
                                                    src={member.user_details.profile_picture}
                                                    alt={`Professional portrait of ${member.user_details.first_name}`}
                                                />
                                            </div>
                                            {member.description && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a1a]/95 via-[#0a1a1a]/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out flex items-end p-6 md:p-8 z-20 translate-y-4 group-hover:translate-y-0">
                                                    <p className="text-sm text-mustard-gold italic font-medium leading-relaxed">
                                                        "{member.description}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-black tracking-wide text-deep-teal mb-1">
                                            {member.user_details.first_name} {member.user_details.last_name}
                                        </h3>
                                        <p className="text-mustard-gold text-xs uppercase tracking-[0.2em] font-bold">
                                            {member.user_details.designation}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Testimonials ── Emerald mesh dark ─────────────────── */}
                <section className="py-28 md:py-36 px-6 lg:px-20 section-emerald relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px gold-shimmer-line" />
                    <div className="orb orb-gold w-[300px] h-[300px] bottom-10 right-10" style={{ animationDelay: '8s' }} />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-6">
                            <motion.div variants={cascadeContainer} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="max-w-xl">
                                <motion.span variants={blockReveal} className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold inline-block">Client Voices</motion.span>
                                <motion.div variants={goldLine} className="h-0.5 w-16 bg-mustard-gold origin-left mt-3 mb-5" />
                                <AnimatedWords text="The Words of Those We've Celebrated With" el="h2" className="text-4xl font-bold" />
                            </motion.div>
                            {reviews.length > trackCards.length && (
                                <div className="flex gap-2">
                                    <button onClick={handlePrev} className="size-12 rounded-full border border-mustard-gold/30 flex items-center justify-center hover:bg-mustard-gold hover:text-deep-teal transition-all duration-300">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button onClick={handleNext} className="size-12 rounded-full border border-mustard-gold/30 flex items-center justify-center hover:bg-mustard-gold hover:text-deep-teal transition-all duration-300">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {reviews.length === 0 ? (
                            <div className="text-center py-12 text-white/40 text-sm">No reviews to display yet.</div>
                        ) : (
                            <div ref={carouselRef} className="overflow-hidden">
                                <motion.div className="flex gap-8" style={{ x: trackX }}>
                                    {trackCards.map((review) => (
                                        <div
                                            key={review.id}
                                            style={{ width: cardWidth || undefined, flexShrink: 0 }}
                                            className="glass-card p-6 md:p-8 rounded-2xl space-y-6"
                                        >
                                            <div className="flex text-mustard-gold">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-5 h-5 fill-current" strokeWidth={0} />
                                                ))}
                                            </div>
                                            <p className="text-lg italic text-white/90 leading-relaxed">&ldquo;{review.review}&rdquo;</p>
                                            <div>
                                                <p className="font-bold">{review.name}</p>
                                                <p className="text-white/50 text-sm">{review.place}</p>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </>
    );
};

export default About;
