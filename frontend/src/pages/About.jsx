import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import aboutHero from '../assets/images/aboutus_hero.webp';
import aboutStory from '../assets/images/aboutus_second_image.webp';
import {
    Gem, Star, ChevronLeft, ChevronRight,
    Palette, Globe, Layers, CheckCircle2, ArrowRight, MapPin
} from 'lucide-react';

const cardContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
};
const cardItem = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../utils/api';

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
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    const { scrollY } = useScroll();
    const sectionShadow = useTransform(
        scrollY,
        [0, 80],
        ['0px -16px 60px rgba(0,0,0,0)', '0px -16px 60px rgba(0,0,0,0.5)']
    );

    const [teamMembers, setTeamMembers] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(true);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const response = await api.get('/team-members/');
                const validMembers = response.data
                    .sort((a, b) => a.order - b.order)
                    .filter(member => member.user_details.profile_picture);
                setTeamMembers(validMembers);
            } catch (err) {
                console.error("Failed to fetch team members:", err);
            } finally {
                setLoadingTeam(false);
            }
        };

        fetchTeam();
    }, []);

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
        <div className="font-sans text-white bg-background-dark">

            {/* ── Hero ── z-index 1 */}
            <section data-scroll-snap ref={heroRef} className="lg:sticky lg:top-0 z-[1] relative min-h-screen flex items-center justify-center overflow-hidden">
                <motion.div
                    style={{ y, opacity }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-background-dark/80 via-background-dark/60 to-background-dark z-10"></div>
                    <img
                        src={aboutHero}
                        alt="Crystal Events Ireland"
                        className="w-full h-full object-cover"
                    />
                </motion.div>
                <div className="relative z-20 text-center px-6 md:px-12 lg:px-20 max-w-4xl">
                    <motion.span
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block"
                    >
                        About Crystal Events
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                        className="text-4xl md:text-7xl font-black mb-6 leading-tight"
                    >
                        Creating Unforgettable Events{' '}
                        <span className="bg-gradient-to-r from-[#e2c08d] to-mustard-gold bg-clip-text text-transparent">
                            Across Ireland
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                        className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
                    >
                        Your trusted partner for weddings, celebrations, and corporate events.
                    </motion.p>
                </div>
            </section>

            {/* ── Our Story ── slides over hero, z-index 2 */}
            <motion.section data-scroll-snap style={{ boxShadow: sectionShadow }} className="lg:sticky lg:top-0 z-[2] min-h-screen py-28 bg-background-dark rounded-t-[2rem] flex flex-col justify-center">
                <div className="px-6 lg:px-20 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="space-y-8"
                        >
                            <div>
                                <span className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold">Our Story</span>
                                <h2 className="text-4xl font-bold mt-4 mb-6 leading-tight">
                                    From the UK to Ireland —{' '}
                                    <span className="text-mustard-gold">Built on Passion</span>
                                </h2>
                                <p className="text-white/70 leading-relaxed text-lg mb-4">
                                    Crystal Events was founded in 2021 with a passion for creating memorable experiences and beautifully crafted events. Starting our journey in the UK, we built a reputation for delivering high-quality, customised event solutions.
                                </p>
                                <p className="text-white/70 leading-relaxed text-lg mb-4">
                                    Today, we are proud to bring our expertise to Ireland, offering premium event management services tailored to diverse cultures, styles, and celebrations.
                                </p>
                                <p className="text-white/70 leading-relaxed text-lg">
                                    Our mission is simple — to turn your vision into reality and create moments that last a lifetime.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                {[
                                    { value: '2021', label: 'Founded' },
                                    { value: '200+', label: 'Events Done' },
                                    { value: '2', label: 'Countries' },
                                    { value: '100%', label: 'Satisfaction' },
                                ].map((stat, i) => (
                                    <div key={i}>
                                        <div className="text-3xl font-black text-mustard-gold mb-1">{stat.value}</div>
                                        <div className="text-white/50 text-xs uppercase tracking-widest">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative mt-8 lg:mt-0"
                        >
                            <div className="absolute -top-6 -left-6 w-32 h-32 border-t-2 border-l-2 border-mustard-gold/40 z-0"></div>
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 border-b-2 border-r-2 border-mustard-gold/40 z-0"></div>
                            <div className="relative z-10 rounded-lg overflow-hidden aspect-[4/5] shadow-2xl">
                                <img
                                    className="w-full h-full object-cover"
                                    src={aboutStory}
                                    alt="Event management company Ireland"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* ── What We Do & Vision ── slides over story, z-index 3 */}
            <motion.section data-scroll-snap style={{ boxShadow: sectionShadow }} className="lg:sticky lg:top-0 z-[3] min-h-screen py-28 px-6 md:px-12 lg:px-20 bg-deep-teal rounded-t-[2rem] flex flex-col justify-center">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">

                    {/* What We Do */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <span className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold">What We Do</span>
                        <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4 leading-tight">
                            Complete Event Management,{' '}
                            <span className="text-mustard-gold">End to End</span>
                        </h2>
                        <p className="text-white/70 text-lg leading-relaxed mb-8">
                            We provide complete event management services, handling every detail from planning to execution. Whether it's an intimate gathering or a large-scale celebration, we ensure every event is executed with precision and creativity.
                        </p>
                        <motion.ul
                            className="space-y-3"
                            variants={cardContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.1 }}
                        >
                            {whatWeDo.map((item, i) => (
                                <motion.li
                                    key={i}
                                    variants={cardItem}
                                    className="flex items-center gap-3 text-white/70 text-sm"
                                >
                                    <CheckCircle2 size={16} className="text-mustard-gold shrink-0" strokeWidth={2} />
                                    {item}
                                </motion.li>
                            ))}
                        </motion.ul>
                    </motion.div>

                    {/* Our Vision & Mission */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="space-y-10"
                    >
                        {/* Vision */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                            <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-3 block">Our Vision</span>
                            <p className="text-white/80 text-lg leading-relaxed">
                                To become one of the most trusted and recognised event management companies in Ireland, known for creativity, quality, and customer satisfaction.
                            </p>
                        </div>
                        {/* Mission */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                            <span className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block">Our Mission</span>
                            <ul className="space-y-3">
                                {missionPoints.map((point, i) => (
                                    <li key={i} className="flex items-start gap-3 text-white/70 text-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-mustard-gold shrink-0 mt-1.5" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* ── What Makes Us Different ── slides over what-we-do, z-index 4 */}
            <motion.section data-scroll-snap style={{ boxShadow: sectionShadow }} className="lg:sticky lg:top-0 z-[4] min-h-screen py-28 px-6 md:px-12 lg:px-20 bg-background-dark rounded-t-[2rem] flex flex-col justify-center">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="text-center mb-16"
                    >
                        <span className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold mb-4 block">The Crystal Difference</span>
                        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                            What Makes Us <span className="text-mustard-gold">Different</span>
                        </h2>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        variants={cardContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                    >
                        {whatMakesDifferent.map((item, i) => (
                            <motion.div
                                key={i}
                                variants={cardItem}
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
                    </motion.div>
                </div>
            </motion.section>

            {/* ── Who We Serve & Where We Work ── slides over what-makes-different, z-index 5 */}
            <motion.section data-scroll-snap style={{ boxShadow: sectionShadow }} className="lg:sticky lg:top-0 z-[5] min-h-screen py-28 px-6 md:px-12 lg:px-20 bg-deep-teal rounded-t-[2rem] flex flex-col justify-center">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <span className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold mb-4 block">Who We Serve</span>
                        <h3 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
                            Proudly Serving{' '}
                            <span className="text-mustard-gold">Every Community</span>
                        </h3>
                        <motion.div
                            className="grid grid-cols-2 gap-4"
                            variants={cardContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.1 }}
                        >
                            {whoWeServe.map((item, i) => (
                                <motion.div
                                    key={i}
                                    variants={cardItem}
                                    className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-mustard-gold/30 transition-all duration-300"
                                >
                                    <p className="text-white font-bold text-sm mb-1">{item.label}</p>
                                    <p className="text-white/40 text-xs">{item.sub}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="space-y-8"
                    >
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
                        <div className="bg-white/5 border border-mustard-gold/20 rounded-2xl p-7">
                            <p className="text-white/60 text-sm leading-relaxed mb-6">
                                Browse our gallery to see real events we've delivered — from wedding stages to corporate setups and birthday celebrations.
                            </p>
                            <Link
                                to="/gallery"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all duration-300 text-xs shadow-[0_0_15px_rgba(238,192,89,0.25)]"
                            >
                                View Our Work <ArrowRight size={13} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* ── Team ── slides over who-we-serve, z-index 6 */}
            {!loadingTeam && teamMembers.length > 0 && (
                <motion.section data-scroll-snap style={{ boxShadow: sectionShadow }} className="lg:sticky lg:top-0 z-[6] min-h-screen py-28 bg-background-dark rounded-t-[2rem] flex flex-col justify-center">
                    <div className="px-6 lg:px-20 max-w-7xl mx-auto min-h-[500px]">
                        <div className="text-center mb-16">
                            <span className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold">The Visionaries</span>
                            <h2 className="text-4xl font-bold mt-4 mb-2">Meet Our Team</h2>
                            <div className="w-16 h-1 bg-mustard-gold mx-auto rounded-full"></div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-8 lg:gap-10">
                            {teamMembers.map((member, idx) => (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.1 }}
                                    transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
                                    className="group flex flex-col items-center text-center w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] lg:w-[calc(25%-2rem)]"
                                >
                                    <div className="relative overflow-hidden rounded-2xl aspect-[3/4] mb-8 w-full shadow-2xl border border-white/5">
                                        <div className="absolute inset-0 bg-jungle-green mix-blend-color z-10 opacity-40 group-hover:opacity-0 transition-opacity duration-700 ease-out"></div>
                                        <img
                                            className="w-full h-full object-cover transition-all duration-700 ease-out scale-105 group-hover:scale-100 filter contrast-125"
                                            src={member.user_details.profile_picture}
                                            alt={`Professional portrait of ${member.user_details.first_name}`}
                                        />
                                        {member.description && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a1a]/95 via-[#0a1a1a]/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out flex items-end p-6 md:p-8 z-20 translate-y-4 group-hover:translate-y-0">
                                                <p className="text-sm text-mustard-gold italic font-medium leading-relaxed">
                                                    "{member.description}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black tracking-wide text-white mb-1">
                                        {member.user_details.first_name} {member.user_details.last_name}
                                    </h3>
                                    <p className="text-mustard-gold text-xs uppercase tracking-[0.2em] font-bold">
                                        {member.user_details.designation}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.section>
            )}

            {/* ── Testimonials ── slides over team (or who-we-serve if no team), z-index 7 */}
            <motion.section data-scroll-snap style={{ boxShadow: sectionShadow }} className="lg:sticky lg:top-0 z-[7] min-h-screen py-28 px-6 lg:px-20 bg-deep-teal border-y border-mustard-gold/10 rounded-t-[2rem] flex flex-col justify-center">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-6">
                        <div className="max-w-xl">
                            <span className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold">Client Voices</span>
                            <h2 className="text-4xl font-bold mt-4">The Words of Those We've Celebrated With</h2>
                        </div>
                        <div className="flex gap-2">
                            <button className="size-12 rounded-full border border-mustard-gold/30 flex items-center justify-center hover:bg-mustard-gold hover:text-deep-teal transition-all duration-300">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button className="size-12 rounded-full border border-mustard-gold/30 flex items-center justify-center hover:bg-mustard-gold hover:text-deep-teal transition-all duration-300">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                text: "\"Crystal Events turned our vision for a 500-guest gala at the RDS into a seamless masterpiece. Their attention to detail in Dublin is unmatched.\"",
                                name: "Aidan & Siobhan",
                                loc: "Dublin, Ireland"
                            },
                            {
                                text: "\"From the first consultation in London to the final toast in the Scottish Highlands, their team provided absolute excellence.\"",
                                name: "Lord Harrington",
                                loc: "London, UK"
                            },
                            {
                                text: "\"Truly the architects of magic. Our corporate anniversary wasn't just an event; it was a sensory experience we will never forget.\"",
                                name: "The CEO, Nexus Tech",
                                loc: "Belfast, NI"
                            }
                        ].map((testimonial, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, amount: 0.1 }}
                                transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                                className="bg-[rgba(1,45,45,0.4)] backdrop-blur-md border border-[rgba(197,160,89,0.2)] p-6 md:p-8 rounded-xl space-y-6"
                            >
                                <div className="flex text-mustard-gold">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-current" strokeWidth={0} />
                                    ))}
                                </div>
                                <p className="text-lg italic text-white/90 leading-relaxed">
                                    {testimonial.text}
                                </p>
                                <div>
                                    <p className="font-bold">{testimonial.name}</p>
                                    <p className="text-white/50 text-sm">{testimonial.loc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

        </div>
        </>
    );
};

export default About;
