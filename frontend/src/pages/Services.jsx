import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Star, BadgeCheck, ArrowRight, Calendar, PartyPopper, Briefcase, Gem, Music, UtensilsCrossed, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import servicesBg from '../assets/images/wedding_decoration.webp';
import {
    VP_CONTENT,
    cascadeContainer, blockReveal, goldLine,
    fromLeft, fromRight, cardGrid, cardItem
} from '../utils/animations';

const STATIC_SERVICES = [
    {
        icon: <Calendar strokeWidth={1} />,
        title: 'Wedding Planning',
        slug: 'wedding-planning',
        description: 'Make your dream wedding a reality. We specialise in elegant, culturally rich weddings — from intimate ceremonies to grand celebrations.',
        features: ['Complete planning & coordination', 'Stage & venue decoration', 'Catering, photography & entertainment'],
    },
    {
        icon: <PartyPopper strokeWidth={1} />,
        title: 'Birthday Events',
        slug: 'birthday-events',
        description: "From fun-filled kids' parties to elegant milestone birthdays, we create unforgettable celebrations with themed decorations, catering, and entertainment.",
        features: ['Themed decorations & balloon design', 'Catering, cakes & entertainment', 'Photography, lighting & sound'],
    },
    {
        icon: <Briefcase strokeWidth={1} />,
        title: 'Corporate Events',
        slug: 'corporate-events',
        description: 'Professional end-to-end corporate event management for conferences, product launches, team-building events, and company celebrations across Ireland.',
        features: ['Conferences, seminars & product launches', 'AV, lighting & staging solutions', 'Team-building & award ceremonies'],
    },
    {
        icon: <Gem strokeWidth={1} />,
        title: 'Stage Decoration',
        slug: 'stage-decoration',
        description: 'Visually stunning, custom-designed stage setups for weddings, birthdays, and corporate events. From simple elegant backdrops to premium luxury designs.',
        features: ['Wedding, birthday & corporate stages', 'Floral, LED & lighting setups', 'Cultural & themed designs'],
    },
    {
        icon: <Music strokeWidth={1} />,
        title: 'DJ, Live Music & Sound',
        slug: 'live-music-dj',
        description: 'Professional DJ services, live music performances, and advanced sound & lighting solutions to create the perfect atmosphere for any event across Ireland.',
        features: ['DJ & live music for all events', 'High-quality sound systems', 'Stage & dance floor lighting'],
    },
    {
        icon: <UtensilsCrossed strokeWidth={1} />,
        title: 'Catering Services',
        slug: 'catering',
        description: 'Authentic Indian cuisine, multicultural menus, and bespoke dining experiences crafted for weddings, corporate events, birthdays, and private celebrations across Ireland.',
        features: ['Authentic Indian & multicultural cuisine', 'Buffets, live stations & custom menus', 'Vegetarian, vegan & dietary-friendly options'],
    },
];

const Services = () => {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchServices = async () => {
            try {
                const res = await api.get('/services/');
                setServices(res.data);
            } catch (err) {
                console.error('Failed to fetch services', err);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    return (
        <>
            <Helmet>
                <title>Event Planning Services in Ireland | Crystal Events</title>
                <meta
                    name="description"
                    content="Explore Crystal Events' bespoke event services in Ireland — wedding planning, stage decoration, catering, photography, live music, and more."
                />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://crystaleventsie.com/services" />
                <meta property="og:title" content="Event Planning Services in Ireland | Crystal Events" />
                <meta property="og:description" content="Explore Crystal Events' bespoke event services in Ireland — wedding planning, stage decoration, catering, photography, live music, and more." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://crystaleventsie.com/services" />
            </Helmet>

            <div className="font-sans text-white">

                {/* ── Hero ── Noir dark ─────────────────────────────────── */}
                <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden section-noir">
                    <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#050d0d]/80 via-[#050d0d]/60 to-[#050d0d] z-10" />
                        <img src={servicesBg} alt="Wedding decoration setup" className="w-full h-full object-cover" />
                    </motion.div>
                    <div className="relative z-20 text-center px-4 max-w-4xl pt-20">
                        <motion.span
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.65, ease: 'easeOut' }}
                            className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block"
                        >
                            Exclusivity Defined
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.85, delay: 0.2, ease: 'easeOut' }}
                            className="text-white text-4xl md:text-7xl font-extrabold mb-6 tracking-tight"
                        >
                            Our Bespoke{' '}
                            <span className="bg-gradient-to-r from-mustard-gold via-[#e2c283] to-mustard-gold bg-clip-text text-transparent">
                                Services
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.85, delay: 0.4, ease: 'easeOut' }}
                            className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
                        >
                            Elevating your celebrations with elegance and precision. Experience the curated art of event design where every detail whispers luxury.
                        </motion.p>
                    </div>
                </section>

                {/* ── Flagship Services ── Cream light ────────────────── */}
                <section className="px-6 md:px-16 lg:px-40 pt-28 pb-20 section-cream relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px gold-shimmer-line" />

                    <div className="max-w-[1200px] mx-auto relative z-10">

                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                            <motion.div variants={fromLeft} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="max-w-xl">
                                <h2 className="text-deep-teal text-3xl md:text-4xl font-bold mb-3">Our Signature Services</h2>
                                <motion.div variants={goldLine} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="h-1 w-20 bg-mustard-gold origin-left mb-6" />
                                <p className="text-deep-teal/60">Handcrafted experiences built around your vision. Explore each service and discover how we bring it to life.</p>
                            </motion.div>
                            <motion.div variants={fromRight} initial="hidden" whileInView="visible" viewport={VP_CONTENT} className="flex gap-4">
                                <div className="p-3 border border-mustard-gold/30 rounded-xl text-mustard-gold bg-white/50"><Star strokeWidth={1} /></div>
                                <div className="p-3 border border-mustard-gold/30 rounded-xl text-mustard-gold bg-white/50"><BadgeCheck strokeWidth={1} /></div>
                            </motion.div>
                        </div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-8"
                            variants={cardGrid}
                            initial="hidden"
                            whileInView="visible"
                            viewport={VP_CONTENT}
                        >
                            {STATIC_SERVICES.map((service) => (
                                <motion.div
                                    key={service.slug}
                                    variants={cardItem}
                                    className="group relative glass-card-light rounded-2xl overflow-hidden hover:shadow-[0_0_25px_rgba(197,160,89,0.12)] transition-all duration-500 ease-out flex flex-col"
                                >
                                    <div className="p-8 flex flex-col flex-1">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-mustard-gold/10 text-mustard-gold mb-6 transition-transform duration-300 ease-out group-hover:scale-110 [&>svg]:w-7 [&>svg]:h-7">
                                            {service.icon}
                                        </div>
                                        <h3 className="text-deep-teal text-xl font-bold mb-3 group-hover:text-mustard-gold transition-colors duration-300">
                                            {service.title}
                                        </h3>
                                        <p className="text-deep-teal/60 text-sm leading-relaxed mb-5">{service.description}</p>
                                        <ul className="space-y-2 mb-8 flex-1">
                                            {service.features.map((f, fi) => (
                                                <li key={fi} className="flex items-center gap-2 text-deep-teal/50 text-sm">
                                                    <span className="w-1 h-1 rounded-full bg-mustard-gold shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <Link
                                            to={`/services/${service.slug}`}
                                            className="inline-flex items-center gap-2 self-start px-6 py-2.5 bg-deep-teal text-mustard-gold font-bold uppercase tracking-widest rounded-full hover:bg-deep-teal/90 transition-all duration-300 text-xs shadow-lg"
                                        >
                                            Learn More <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* ── More Services ── */}
                        <div className="mt-24">
                            <motion.div variants={cascadeContainer} initial="hidden" whileInView="visible" viewport={VP_CONTENT}>
                                <motion.h2 variants={blockReveal} className="text-deep-teal text-2xl md:text-3xl font-bold mb-3">More Services From Us</motion.h2>
                                <motion.div variants={goldLine} className="h-1 w-16 bg-mustard-gold origin-left mb-10" />
                            </motion.div>

                            {(() => {
                                const visible = services.filter(s => s.show_on_website);
                                if (loading) return <div className="text-center text-deep-teal/50 py-12">Loading services...</div>;
                                if (visible.length === 0) return <div className="text-center text-deep-teal/50 py-12">No additional services available at the moment.</div>;
                                return (
                                    <motion.div
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                        variants={cardGrid}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={VP_CONTENT}
                                    >
                                        {visible.map((service) => (
                                            <motion.div
                                                key={service.id}
                                                variants={cardItem}
                                                className="group relative glass-card-light rounded-2xl overflow-hidden transition-all duration-500 ease-out hover:-translate-y-2 flex flex-col"
                                            >
                                                <div className="h-48 overflow-hidden relative shrink-0">
                                                    <img
                                                        src={service.image || service.image_url || 'https://res.cloudinary.com/dgd5gtn1w/image/upload/v1772162028/crystal%20events/event_sjzxpf.webp'}
                                                        alt={service.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-cream to-transparent opacity-60" />
                                                </div>
                                                <div className="p-6 flex flex-col flex-1">
                                                    <h3 className="text-deep-teal text-lg font-bold mb-2 group-hover:text-mustard-gold transition-colors duration-300">{service.name}</h3>
                                                    <p className="text-deep-teal/60 text-sm leading-relaxed flex-1">{service.description}</p>
                                                    <div className="mt-5 pt-4 border-t border-mustard-gold/10">
                                                        <Link
                                                            to="/contact"
                                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-deep-teal/10 border border-deep-teal/20 text-deep-teal text-xs font-bold uppercase tracking-widest rounded-full hover:bg-deep-teal hover:text-mustard-gold transition-all duration-300"
                                                        >
                                                            <Mail size={13} />
                                                            Get More Details
                                                        </Link>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                );
                            })()}
                        </div>
                    </div>
                </section>

            </div>
        </>
    );
};

export default Services;
