import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, Gem, UtensilsCrossed, Camera, Music, Speaker, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroBg from '../assets/images/hero_background.png';
import galleryWedding from '../assets/images/gallery_wedding.png';
import galleryCorporate from '../assets/images/gallery_corporate.png';
import galleryParty from '../assets/images/gallery_party.png';
import logo from '../assets/images/logo.png';

const Landing = () => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    return (
        <div className="overflow-x-hidden font-sans text-deep-teal" ref={targetRef}>
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
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

                {/* Hero Content */}
                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto text-white mt-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="mx-auto mb-8"
                    >
                        {/* Logo Icon / Graphic */}
                        <div className="w-32 h-32 mx-auto flex items-center justify-center backdrop-blur-sm -mb-4">
                            <img src={logo} alt="Crystal Events Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(238,192,89,0.3)]" />
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl sm:text-5xl md:text-8xl font-black leading-[1.1] tracking-tight text-white mb-6 font-sans"
                    >
                        Create your <br />
                        <span className="bg-gradient-to-r from-mustard-gold via-[#F8E0A0] to-mustard-gold bg-clip-text text-transparent">
                            best day ever
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mx-auto max-w-2xl text-lg md:text-xl font-light text-white/70 mb-10 leading-relaxed"
                    >
                        Exquisite planning for life's most precious moments. Luxury event management tailored to your vision with uncompromising elegance.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <Link
                            to="/contact"
                            className="w-full sm:w-auto min-w-[200px] flex items-center justify-center rounded-lg bg-mustard-gold px-8 py-4 text-base font-bold uppercase tracking-widest text-deep-teal hover:brightness-110 transition-all shadow-[0_0_20px_rgba(238,192,89,0.4)]"
                        >
                            Book Your Event
                        </Link>
                        <Link
                            to="/gallery"
                            className="w-full sm:w-auto min-w-[200px] flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-base font-bold uppercase tracking-widest text-white backdrop-blur-sm hover:bg-white/10 transition-all"
                        >
                            View Lookbook
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 1, duration: 1, repeat: Infinity, repeatType: "reverse" }}
                        className="absolute bottom-[-15vh] md:bottom-[-20vh] left-1/2 -translate-x-1/2"
                    >
                        <ChevronDown size={48} className="text-white" />
                    </motion.div>
                </div>
            </section>

            {/* Services Overview */}
            <section className="py-24 px-6 md:px-16 bg-jungle-green text-white relative z-20" id="services">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-2xl">
                            <span className="text-mustard-gold font-bold uppercase tracking-[0.3em] text-sm mb-4 block">Our Expertise</span>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 font-sans">Bespoke Event Solutions</h2>
                            <p className="text-white/60 text-lg leading-relaxed">
                                From intimate gatherings to grand corporate celebrations, we provide end-to-end management with unmatched aesthetic precision.
                            </p>
                        </div>
                        <div className="h-1 w-24 bg-mustard-gold hidden md:block" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 p-6 md:p-8 transition-all hover:bg-white/10"
                            >
                                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-mustard-gold/10 text-mustard-gold transition-transform group-hover:scale-110">
                                    <div className="[&>svg]:w-8 [&>svg]:h-8">{service.icon}</div>
                                </div>
                                <h3 className="mb-4 text-xl font-bold text-white group-hover:text-mustard-gold transition-colors">{service.title}</h3>
                                <p className="text-white/50 leading-relaxed">{service.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Gallery */}
            <section className="py-24 bg-jungle-green relative z-20" id="gallery">
                <div className="mx-auto max-w-7xl px-6 md:px-16">
                    <div className="mb-16 text-center">
                        <span className="text-mustard-gold font-bold uppercase tracking-[0.3em] text-sm mb-4 block">The Portfolio</span>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white">Moments of Perfection</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-[800px]">
                        {/* Featured Item - Wedding */}
                        <div className="md:col-span-8 group relative overflow-hidden rounded-xl h-[400px] md:h-full shadow-xl">
                            <div className="absolute inset-0 bg-deep-teal/20 transition-all group-hover:bg-deep-teal/10 z-10" />
                            <img
                                src={galleryWedding}
                                alt="Royal Wedding"
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 z-20">
                                <p className="text-mustard-gold font-bold uppercase tracking-widest text-xs mb-2">Grand Wedding</p>
                                <h4 className="text-3xl font-bold font-serif">The Royal Gala 2023</h4>
                            </div>
                        </div>

                        {/* Side Column */}
                        <div className="md:col-span-4 flex flex-col gap-6 h-full">
                            {/* Corporate */}
                            <div className="relative flex-1 group overflow-hidden rounded-xl h-[300px] md:h-auto shadow-lg">
                                <img
                                    src={galleryCorporate}
                                    alt="Corporate Event"
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-deep-teal/20 group-hover:bg-deep-teal/10 transition-all z-10" />
                                <div className="absolute bottom-0 left-0 p-6 text-white translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 z-20">
                                    <p className="text-mustard-gold font-bold uppercase tracking-widest text-xs mb-1">Corporate</p>
                                    <h4 className="text-xl font-bold font-serif">Tech Summit VIP Lounge</h4>
                                </div>
                            </div>

                            {/* Private Party */}
                            <div className="relative flex-1 group overflow-hidden rounded-xl h-[300px] md:h-auto shadow-lg">
                                <img
                                    src={galleryParty}
                                    alt="Private Soiree"
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-deep-teal/20 group-hover:bg-deep-teal/10 transition-all z-10" />
                                <div className="absolute bottom-0 left-0 p-6 text-white translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 z-20">
                                    <p className="text-mustard-gold font-bold uppercase tracking-widest text-xs mb-1">Private Soiree</p>
                                    <h4 className="text-xl font-bold font-serif">Emerald Anniversary Dinner</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <Link
                            to="/gallery"
                            className="inline-block px-10 py-4 border border-mustard-gold text-mustard-gold font-bold uppercase tracking-widest rounded-lg hover:bg-mustard-gold hover:text-jungle-green transition-all"
                        >
                            Explore Full Gallery
                        </Link>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-24 px-6 md:px-12 lg:px-20 bg-jungle-green relative z-20">
                <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-mustard-gold p-12 md:p-20 text-center text-jungle-green relative shadow-2xl">
                    <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight font-sans">
                        Ready to begin your <br />
                        next celebration?
                    </h2>
                    <p className="mx-auto max-w-xl text-lg font-medium mb-10 text-jungle-green/80">
                        Let's turn your vision into an unforgettable reality. Our consultants are ready to discuss your requirements.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                        <Link
                            to="/contact"
                            className="w-full sm:w-auto px-10 py-5 bg-jungle-green text-mustard-gold font-bold uppercase tracking-widest rounded-lg hover:bg-jungle-green/90 transition-all shadow-xl"
                        >
                            Book Your Event
                        </Link>
                        <Link
                            to="/contact"
                            className="w-full sm:w-auto px-10 py-5 border-2 border-jungle-green text-jungle-green font-bold uppercase tracking-widest rounded-lg hover:bg-jungle-green hover:text-mustard-gold transition-all"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
