import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    UtensilsCrossed, ChefHat, Leaf, Star,
    CheckCircle2, ArrowRight, Coffee
} from 'lucide-react';
import cateringHero from '../../assets/images/catering_tradisional_indian_cuisine.webp';

const cardContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};
const cardItem = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const cateringServices = [
    {
        icon: <UtensilsCrossed strokeWidth={1.5} />,
        title: 'Indian Cuisine',
        items: [
            'Authentic North & South Indian dishes',
            'Traditional wedding banquet menus',
            'Biryani, curries, breads & desserts',
        ],
        alt: 'Indian catering Ireland',
    },
    {
        icon: <ChefHat strokeWidth={1.5} />,
        title: 'Multicultural Menus',
        items: [
            'Irish, Asian & fusion cuisine',
            'Custom menus for every culture',
            'Dietary accommodations (vegetarian, vegan, halal)',
        ],
        alt: 'Multicultural catering Ireland',
    },
    {
        icon: <Coffee strokeWidth={1.5} />,
        title: 'Buffet & Live Stations',
        items: [
            'Lavish buffet spreads & food stations',
            'Live cooking & chaat counters',
            'Dessert tables & sweet stations',
        ],
        alt: 'Buffet catering Ireland',
    },
    {
        icon: <Leaf strokeWidth={1.5} />,
        title: 'Vegetarian & Vegan',
        items: [
            'Extensive plant-based menus',
            'Jain & vegan-friendly options',
            'Fresh, locally sourced ingredients',
        ],
        alt: 'Vegetarian vegan catering Ireland',
    },
];

const perfectFor = [
    { title: 'Weddings', link: '/services/wedding-planning' },
    { title: 'Birthday Parties', link: '/services/birthday-events' },
    { title: 'Corporate Events', link: '/services/corporate-events' },
    { title: 'Engagements & Receptions', link: null },
    { title: 'Cultural Celebrations', link: null },
    { title: 'Private Dining Events', link: null },
];

const whyUs = [
    'Authentic recipes crafted by experienced chefs',
    'Fully customised menus tailored to your event',
    'Hygienic preparation & professional presentation',
    'Flexible packages for any budget and guest count',
    'Dietary-friendly options — vegetarian, vegan, halal',
    'Seamless coordination with your overall event planning',
];

const Catering = () => {
    return (
        <>
            <Helmet>
                <title>Catering Services | Crystal Events Ireland</title>
                <meta
                    name="description"
                    content="Crystal Events offers premium catering services in Ireland — authentic Indian cuisine, multicultural menus, buffets, and bespoke dining experiences for weddings, corporate events, and private celebrations."
                />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://crystaleventsie.com/services/catering" />
                <meta property="og:title" content="Catering Services | Crystal Events Ireland" />
                <meta property="og:description" content="Premium catering services in Ireland — authentic Indian cuisine, multicultural menus, and bespoke dining for every occasion." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://crystaleventsie.com/services/catering" />
            </Helmet>

            <div className="font-sans text-white bg-background-dark">

                {/* ── Hero ── */}
                <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-deep-teal/80 via-deep-teal/60 to-background-dark z-10" />
                        <img
                            src={cateringHero}
                            alt="Traditional Indian cuisine catering Ireland"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="relative z-20 text-center px-4 max-w-4xl pt-24 pb-16">
                        <motion.span
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="text-mustard-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block"
                        >
                            Taste the Difference
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                            className="text-white text-4xl md:text-7xl font-extrabold mb-6 tracking-tight"
                        >
                            Premium <span className="bg-gradient-to-r from-mustard-gold via-[#e2c283] to-mustard-gold bg-clip-text text-transparent">Catering</span> Services
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                            className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
                        >
                            Authentic Indian cuisine, multicultural menus, and bespoke dining experiences crafted to make every celebration truly unforgettable.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                            className="mt-8"
                        >
                            <Link
                                to="/contact"
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all duration-300 text-sm shadow-[0_0_20px_rgba(238,192,89,0.3)]"
                            >
                                Get a Catering Quote <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* ── What We Offer ── */}
                <section className="px-6 md:px-16 lg:px-40 py-24 bg-background-dark">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="mb-14">
                            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">What We Offer</h2>
                            <div className="h-1 w-20 bg-mustard-gold mb-6" />
                            <p className="text-slate-400 max-w-2xl">
                                From intimate gatherings to grand celebrations, our catering team delivers exceptional food and service tailored to your event and cultural preferences.
                            </p>
                        </div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-8"
                            variants={cardContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.1 }}
                        >
                            {cateringServices.map((service) => (
                                <motion.div
                                    key={service.title}
                                    variants={cardItem}
                                    className="group bg-deep-teal/20 border border-mustard-gold/30 rounded-xl p-8 hover:border-mustard-gold/60 hover:shadow-[0_0_25px_rgba(197,160,89,0.2)] transition-all duration-500 ease-out"
                                >
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-mustard-gold/10 text-mustard-gold mb-5 transition-transform duration-300 ease-out group-hover:scale-110 [&>svg]:w-6 [&>svg]:h-6">
                                        {service.icon}
                                    </div>
                                    <h3 className="text-white text-xl font-bold mb-4 group-hover:text-mustard-gold transition-colors duration-300">
                                        {service.title}
                                    </h3>
                                    <ul className="space-y-2.5">
                                        {service.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-slate-400 text-sm">
                                                <CheckCircle2 size={15} className="text-mustard-gold mt-0.5 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ── Perfect For ── */}
                <section className="px-6 md:px-16 lg:px-40 py-20 bg-deep-teal/10">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">Perfect for Every Occasion</h2>
                                <div className="h-1 w-20 bg-mustard-gold mb-6" />
                                <p className="text-slate-400 leading-relaxed mb-8">
                                    Whether you're hosting an intimate family gathering or a grand multicultural wedding, our catering team brings the same dedication, quality, and passion to every event across Ireland.
                                </p>
                                <motion.div
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                    variants={cardContainer}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: false, amount: 0.1 }}
                                >
                                    {perfectFor.map((item) => (
                                        <motion.div key={item.title} variants={cardItem}>
                                            {item.link ? (
                                                <Link
                                                    to={item.link}
                                                    className="flex items-center gap-3 p-3.5 bg-deep-teal/20 border border-mustard-gold/20 rounded-lg hover:border-mustard-gold/50 hover:bg-deep-teal/30 transition-all duration-300 group"
                                                >
                                                    <Star size={14} className="text-mustard-gold shrink-0" />
                                                    <span className="text-white text-sm font-medium group-hover:text-mustard-gold transition-colors duration-300">{item.title}</span>
                                                    <ArrowRight size={13} className="text-mustard-gold ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                </Link>
                                            ) : (
                                                <div className="flex items-center gap-3 p-3.5 bg-deep-teal/20 border border-mustard-gold/20 rounded-lg">
                                                    <Star size={14} className="text-mustard-gold shrink-0" />
                                                    <span className="text-white text-sm font-medium">{item.title}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: false, amount: 0.3 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="bg-deep-teal/20 border border-mustard-gold/30 rounded-2xl p-8"
                            >
                                <h3 className="text-mustard-gold text-sm font-bold uppercase tracking-widest mb-2">Our Speciality</h3>
                                <h4 className="text-white text-2xl font-bold mb-4">Authentic Indian & Multicultural Cuisine</h4>
                                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                    We take great pride in bringing the rich flavours of Indian cuisine to Ireland. From fragrant biryanis and creamy curries to traditional sweets, our chefs use authentic recipes and premium ingredients to create a dining experience your guests will remember.
                                </p>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                    We also cater to Irish tastes and diverse multicultural preferences, offering fusion menus and globally inspired dishes that bring your community together at the table.
                                </p>
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all duration-300 text-xs"
                                >
                                    Discuss Your Menu <ArrowRight size={14} />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── Why Choose Us ── */}
                <section className="px-6 md:px-16 lg:px-40 py-24 bg-background-dark">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="text-center mb-14">
                            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">Why Choose Crystal Events Catering?</h2>
                            <div className="h-1 w-20 bg-mustard-gold mx-auto mb-6" />
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                We don't just serve food — we create a dining experience that complements your event and delights every guest.
                            </p>
                        </div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                            variants={cardContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.1 }}
                        >
                            {whyUs.map((point, i) => (
                                <motion.div
                                    key={i}
                                    variants={cardItem}
                                    className="flex items-start gap-4 bg-deep-teal/20 border border-mustard-gold/20 rounded-xl p-5 hover:border-mustard-gold/40 transition-all duration-300"
                                >
                                    <CheckCircle2 size={18} className="text-mustard-gold shrink-0 mt-0.5" />
                                    <span className="text-white text-sm leading-relaxed">{point}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

            </div>
        </>
    );
};

export default Catering;
