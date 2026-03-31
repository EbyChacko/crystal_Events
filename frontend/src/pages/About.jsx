import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    Gem,
    Star,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Mail,
    Phone,
    Share2,
    UsersRound
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../utils/api';

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
            <title>About Us | Crystal Events Ireland</title>
            <meta name="description" content="Learn about Crystal Events — a luxury event management company serving Ireland and the UK since 2021. Meet our team and discover our story." />
            <meta name="robots" content="index, follow" />
            <link rel="canonical" href="https://crystaleventsie.com/about" />
            <meta property="og:title" content="About Us | Crystal Events Ireland" />
            <meta property="og:description" content="Learn about Crystal Events — a luxury event management company serving Ireland and the UK since 2021. Meet our team and discover our story." />
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
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuADAX7hM6V-J1rpQC5MoBKtXBMb0rmVn997ZgawBixIA1_hzcBHl0Cva28yP1REeJrObVrAX3f_hS2CgpyaxEo9qNp4n4b4FbdZDk-62ElqcVzDqZu8CPWBo9sJ0F8p9rN4FPUOR80p6m8iJlMwCB0oRB0vyQezrouocy2hOI5HbYMmjzeBDWjWI9ECwGOxxpmVX1pYJ9k2l-Pk5Y-V2PHDwvLkqSgZtTKaZMhXjSeKxUC6I--ctOMjAeVOX_dg5z8zBtbBWNr5xtd-")' }}
                    ></div>
                </motion.div>
                <div className="relative z-20 text-center px-6 md:px-12 lg:px-20 max-w-4xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-4xl md:text-7xl font-black mb-6 leading-tight"
                    >
                        Crafting <span className="bg-gradient-to-r from-[#e2c08d] to-mustard-gold bg-clip-text text-transparent">Unforgettable</span> Legacies
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
                    >
                        Crystal Events is more than an agency; we are the architects of your most precious moments across Ireland and the United Kingdom.
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
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="space-y-8"
                        >
                            <div>
                                <span className="text-mustard-gold uppercase tracking-[0.3em] text-sm font-bold">The Heritage</span>
                                <h2 className="text-4xl font-bold mt-4 mb-6">Established luxury management with a personal touch.</h2>
                                <p className="text-white/70 leading-relaxed text-lg">
                                    Founded over a decade ago, Crystal Events began with a singular vision: to bring world-class sophistication to the landscapes of Ireland and the UK. What started as a boutique planning house in Dublin has expanded into a premier luxury event firm serving elite clientele across London, Edinburgh, and beyond.
                                </p>
                                <p className="text-white/70 leading-relaxed mt-4 text-lg">
                                    Our journey is defined by the relationships we build. From intimate countryside weddings in the Cotswolds to high-profile corporate galas in Belfast's historic venues, we treat every event as a unique masterpiece.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-8 pt-6">
                                <div>
                                    <div className="text-3xl font-black text-mustard-gold mb-1">150+</div>
                                    <div className="text-white/50 text-xs uppercase tracking-widest">Bespoke Events</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-mustard-gold mb-1">12 Yrs</div>
                                    <div className="text-white/50 text-xs uppercase tracking-widest">Of Excellence</div>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative mt-8 lg:mt-0"
                        >
                            <div className="absolute -top-6 -left-6 w-32 h-32 border-t-2 border-l-2 border-mustard-gold/40 z-0"></div>
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 border-b-2 border-r-2 border-mustard-gold/40 z-0"></div>
                            <div className="relative z-10 rounded-lg overflow-hidden aspect-[4/5] shadow-2xl">
                                <img
                                    className="w-full h-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYGTC97_zSIg4jJFSvxBgDpyKj9V3rXaGzi2KDuFyvSHVq4BcGUnnrpDevEE6D1w9rkixkxZY4AgIhQLup0Q8FsmkftkuK6zi0M-v9b2yVG1wDDPDqDrD9EyPL65DW_NNJQKiio11-VKqJgAVTPq0X4YoFfrX_WkGxoh-70LYYDUlqOawzGly6pGvMcZ1IUiaQJ9BSG_1PMUx1PvtYtDdUxIE7R8mIBHBSR7GAqa2zJiRqcMtjZOYzXb-CNt-ozbAk11qG-cO8Uw49"
                                    alt="Sophisticated event planner arranging high-end table settings"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* ── Our Mission ── slides over story, z-index 3 */}
            <motion.section data-scroll-snap style={{ boxShadow: sectionShadow }} className="lg:sticky lg:top-0 z-[3] min-h-screen py-28 px-6 md:px-12 lg:px-20 bg-deep-teal rounded-t-[2rem] flex flex-col justify-center">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <Gem className="w-16 h-16 text-mustard-gold mx-auto" strokeWidth={1} />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-3xl md:text-5xl font-bold leading-tight"
                    >
                        Our Mission is Simple: <br />
                        <span className="italic font-normal">Delivering perfection for every client, every time.</span>
                    </motion.h2>
                    <div className="w-24 h-px bg-mustard-gold mx-auto"></div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                        className="text-white/70 text-lg max-w-2xl mx-auto"
                    >
                        We believe that true luxury lies in the details. Our mission is to alleviate every burden from our clients, allowing them to be guests at their own extraordinary celebrations while we orchestrate perfection behind the scenes.
                    </motion.p>
                </div>
            </motion.section>

            {/* ── Team ── slides over mission, z-index 4 */}
            {!loadingTeam && teamMembers.length > 0 && (
                <motion.section data-scroll-snap style={{ boxShadow: sectionShadow }} className="lg:sticky lg:top-0 z-[4] min-h-screen py-28 bg-background-dark rounded-t-[2rem] flex flex-col justify-center">
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
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
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

            {/* ── Testimonials ── slides over team (or mission if no team), z-index 5 */}
            <motion.section data-scroll-snap style={{ boxShadow: sectionShadow }} className="lg:sticky lg:top-0 z-[5] min-h-screen py-28 px-6 lg:px-20 bg-deep-teal border-y border-mustard-gold/10 rounded-t-[2rem] flex flex-col justify-center">
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
                                text: "\"From the first consultation in London to the final toast in the Scottish Highlands, Sarah and her team provided absolute excellence.\"",
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
                                viewport={{ once: true }}
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
