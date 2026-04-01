import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Mic, Rocket, PartyPopper, Users, Lightbulb,
    CheckCircle2, Briefcase, Star, Clock, Shield, Zap, Smile
} from 'lucide-react';
import corporateHero from '../../assets/images/corporate_event.webp';

const corporateServices = [
    {
        icon: <Mic strokeWidth={1.5} />,
        title: 'Conferences & Seminars',
        items: [
            'Venue setup and management',
            'Stage design and branding',
            'Audio-visual setup',
        ],
        alt: 'Conference stage design Galway',
    },
    {
        icon: <Rocket strokeWidth={1.5} />,
        title: 'Product Launches',
        items: [
            'Creative event concepts',
            'Stage and lighting design',
            'Media-ready presentation setup',
        ],
        alt: 'Product launch event Ireland',
    },
    {
        icon: <PartyPopper strokeWidth={1.5} />,
        title: 'Corporate Parties & Celebrations',
        items: [
            'Annual parties',
            'Award ceremonies',
            'Festive events',
        ],
        alt: 'Corporate event setup Ireland',
    },
    {
        icon: <Users strokeWidth={1.5} />,
        title: 'Team-Building Events',
        items: [
            'Indoor & outdoor activities',
            'Employee engagement events',
            'Fun and interactive setups',
        ],
        alt: 'Business event management Ireland',
    },
    {
        icon: <Lightbulb strokeWidth={1.5} />,
        title: 'Lighting, Sound & AV Solutions',
        items: [
            'Professional sound systems',
            'LED screens & projectors',
            'Lighting design for ambiance',
        ],
        alt: 'Corporate lighting and sound Ireland',
    },
];

const whyUs = [
    'Professional and reliable event execution',
    'Customized solutions for every business',
    'High-quality audio, lighting, and staging',
    'Creative and modern event designs',
    'Serving companies across all of Ireland',
];

const industries = [
    { label: 'Small Businesses', sub: 'Tailored & affordable' },
    { label: 'Large Corporations', sub: 'Grand-scale execution' },
    { label: 'Startups', sub: 'Bold & creative events' },
    { label: 'Cultural & Community', sub: 'Inclusive celebrations' },
];

const ourPromise = [
    { icon: <Clock strokeWidth={1.5} />, title: 'On-Time Execution', desc: 'Every timeline is respected. We plan meticulously so your event runs exactly on schedule.' },
    { icon: <Shield strokeWidth={1.5} />, title: 'Professional Team', desc: 'Experienced event professionals who treat your brand with the respect and care it deserves.' },
    { icon: <Zap strokeWidth={1.5} />, title: 'High-Quality Equipment', desc: 'Premium AV, lighting, and staging equipment to ensure a polished, impressive event.' },
    { icon: <Smile strokeWidth={1.5} />, title: 'Stress-Free Management', desc: 'We handle every detail from planning to execution, so you can focus on your guests.' },
];

const CorporateEvents = () => {
    return (
        <>
            <Helmet>
                <title>Corporate Event Management Ireland | Crystal Events</title>
                <meta
                    name="description"
                    content="Professional corporate event management services in Ireland. Crystal Events specializes in conferences, product launches, team events, and corporate celebrations."
                />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://crystaleventsie.com/services/corporate-events" />
                <meta property="og:title" content="Corporate Event Management Ireland | Crystal Events" />
                <meta
                    property="og:description"
                    content="Professional corporate event management services in Ireland. Crystal Events specializes in conferences, product launches, team events, and corporate celebrations."
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://crystaleventsie.com/services/corporate-events" />
            </Helmet>

            <div className="font-sans text-white bg-background-dark">

                {/* ── Hero ── */}
                <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${corporateHero})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/80 via-background-dark/50 to-background-dark" />
                    </div>

                    <div className="relative z-10 text-center px-6 md:px-12 max-w-4xl mx-auto pt-24">
                        <motion.span
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block"
                        >
                            Corporate Events
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
                            className="text-4xl md:text-7xl font-black leading-tight mb-6"
                        >
                            Professional Corporate Events,{' '}
                            <span className="bg-gradient-to-r from-mustard-gold via-[#F8E0A0] to-mustard-gold bg-clip-text text-transparent">
                                Perfectly Managed
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                            className="text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
                        >
                            Delivering seamless and impactful corporate events across Ireland with precision and style.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Link
                                to="/contact"
                                className="px-8 py-4 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all duration-300 shadow-[0_0_20px_rgba(238,192,89,0.35)] text-sm"
                            >
                                Plan Your Corporate Event
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

                {/* ── Introduction ── */}
                <section className="py-24 px-6 md:px-16 lg:px-28 bg-background-dark">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            <Briefcase className="w-12 h-12 text-mustard-gold mx-auto mb-6" strokeWidth={1.5} />
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="text-3xl md:text-4xl font-black mb-6 leading-tight"
                        >
                            Events That Represent{' '}
                            <span className="text-mustard-gold">Your Brand</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                            className="text-white/60 text-lg leading-relaxed mb-4"
                        >
                            At Crystal Events, we understand that corporate events are more than just gatherings — they represent your brand, your vision, and your professionalism.
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                            className="text-white/60 text-lg leading-relaxed"
                        >
                            We provide end-to-end corporate event management services across Ireland, ensuring every detail is handled with efficiency and excellence. Whether it's a conference, product launch, or company celebration, we create events that leave a lasting impression.
                        </motion.p>
                    </div>
                </section>

                {/* ── Our Corporate Event Services ── */}
                <section className="py-24 px-6 md:px-16 lg:px-28 bg-deep-teal/30">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="text-center mb-16"
                        >
                            <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block">What We Offer</span>
                            <h2 className="text-3xl md:text-4xl font-black leading-tight">
                                Our Corporate Event Services
                            </h2>
                            <p className="text-white/50 mt-4 max-w-xl mx-auto">
                                A complete range of corporate event solutions handled with precision and professionalism.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {corporateServices.map((service, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
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
                </section>

                {/* ── Tailored for Your Business & Industries ── */}
                <section className="py-24 px-6 md:px-16 lg:px-28 bg-background-dark">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Briefcase className="text-mustard-gold w-6 h-6" strokeWidth={1.5} />
                                <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold">Tailored for You</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                                Serving All{' '}
                                <span className="text-mustard-gold">Industries</span>
                            </h2>
                            <p className="text-white/60 text-lg leading-relaxed mb-6">
                                Every company is unique — and so is every event we create. We work closely with you to understand your objectives, audience, and brand identity.
                            </p>
                            <p className="text-white/60 text-lg leading-relaxed">
                                From intimate team away-days to large-scale conferences and award galas, we deliver customized corporate events that align perfectly with your goals.
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {industries.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.1 }}
                                    transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                                    className="bg-white/5 border border-white/10 rounded-xl p-5 text-center hover:bg-white/10 hover:border-mustard-gold/30 transition-all duration-300"
                                >
                                    <p className="text-white font-bold text-sm mb-1">{item.label}</p>
                                    <p className="text-white/40 text-xs">{item.sub}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ── Our Promise ── */}
                <section className="py-24 px-6 md:px-16 lg:px-28 bg-deep-teal/30">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="text-center mb-16"
                        >
                            <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block">Our Promise</span>
                            <h2 className="text-3xl md:text-4xl font-black leading-tight">
                                Why Businesses Trust Crystal Events
                            </h2>
                            <p className="text-white/50 mt-4 max-w-xl mx-auto">
                                We deliver on every commitment — because your reputation is on the line too.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {ourPromise.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.1 }}
                                    transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 hover:border-mustard-gold/30 transition-all duration-300 group text-center"
                                >
                                    <div className="text-mustard-gold mb-5 [&>svg]:w-8 [&>svg]:h-8 transition-transform duration-300 ease-out group-hover:scale-110 inline-block">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-white font-bold text-base mb-3 group-hover:text-mustard-gold transition-colors duration-300">
                                        {item.title}
                                    </h3>
                                    <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Why Choose Crystal Events ── */}
                <section className="py-24 px-6 md:px-16 lg:px-28 bg-deep-teal rounded-t-[2rem]">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="text-center mb-14"
                        >
                            <Star className="w-10 h-10 text-mustard-gold mx-auto mb-5" strokeWidth={1.5} />
                            <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block">The Crystal Events Difference</span>
                            <h2 className="text-3xl md:text-4xl font-black leading-tight">
                                Why Choose{' '}
                                <span className="text-mustard-gold">Crystal Events</span>
                            </h2>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {whyUs.map((point, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
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
                </section>

            </div>
        </>
    );
};

export default CorporateEvents;
