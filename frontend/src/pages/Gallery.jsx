import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MapPin, Calendar as CalendarIcon, Grid } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import heroBg from '../assets/images/gallery_hero.webp';
import {
    VP_CONTENT,
    blockReveal, cardGrid, cardItem
} from '../utils/animations';

const EVENT_TYPES = {
    'wedding': 'Wedding',
    'corporate': 'Corporate',
    'birthday': 'Birthday',
    'concert': 'Concert',
    'conference': 'Conference',
    'private_party': 'Private Party',
    'charity': 'Charity',
    'festival': 'Festival',
    'other': 'Other',
};

const Gallery = () => {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    // Modal & Lightbox state
    const [searchParams, setSearchParams] = useSearchParams();
    const albumQueryId = searchParams.get('album');

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    useEffect(() => {
        if (albumQueryId && events.length > 0) {
            const event = events.find(e => e.id.toString() === albumQueryId);
            setSelectedEvent(event || null);
        } else {
            setSelectedEvent(null);
        }
    }, [albumQueryId, events]);

    useEffect(() => {
        const fetchGalleryEvents = async () => {
            try {
                const res = await api.get('/events/');
                const withImages = res.data.filter(e => e.images && e.images.length > 0);
                withImages.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
                setEvents(withImages);
            } catch (err) {
                console.error('Failed to fetch gallery events', err);
            } finally {
                setLoading(false);
            }
        };
        fetchGalleryEvents();
    }, []);

    const activeCategories = ['All', ...new Set(events.map(e => EVENT_TYPES[e.event_type] || 'Other'))];

    const filteredEvents = filter === 'All'
        ? events
        : events.filter(e => (EVENT_TYPES[e.event_type] || 'Other') === filter);

    const openAlbum = (event) => {
        setSearchParams({ album: event.id });
        setSelectedEvent(event);
        setLightboxIndex(null);
    };

    const closeAlbum = () => {
        setSearchParams(params => {
            const newParams = new URLSearchParams(params);
            newParams.delete('album');
            return newParams;
        });
        setSelectedEvent(null);
        setLightboxIndex(null);
    };

    useEffect(() => {
        if (selectedEvent || lightboxIndex !== null) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [selectedEvent, lightboxIndex]);

    const openLightbox = (index) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    const showPrevImage = (e) => {
        e.stopPropagation();
        if (lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
    };

    const showNextImage = (e) => {
        e.stopPropagation();
        if (selectedEvent && lightboxIndex < selectedEvent.images.length - 1) {
            setLightboxIndex(lightboxIndex + 1);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (lightboxIndex !== null) {
                if (e.key === 'ArrowLeft') showPrevImage(e);
                if (e.key === 'ArrowRight') showNextImage(e);
                if (e.key === 'Escape') closeLightbox();
            } else if (selectedEvent) {
                if (e.key === 'Escape') closeAlbum();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    return (
        <>
        <Helmet>
            <title>Event Gallery — Weddings, Parties & Celebrations | Crystal Events</title>
            <meta name="description" content="Browse Crystal Events' gallery of weddings, corporate galas, birthday celebrations, and more across Ireland and the UK." />
            <meta name="robots" content="index, follow" />
            <link rel="canonical" href="https://crystaleventsie.com/gallery" />
            <meta property="og:title" content="Event Gallery — Weddings, Parties & Celebrations | Crystal Events" />
            <meta property="og:description" content="Browse Crystal Events' gallery of weddings, corporate galas, birthday celebrations, and more across Ireland and the UK." />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://crystaleventsie.com/gallery" />
        </Helmet>

        <div className="bg-background-dark text-white font-sans">

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
                <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroBg})` }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-deep-teal/50 via-deep-teal/30 to-background-dark" />
                </motion.div>
                <div className="text-center space-y-6 px-6 md:px-12 lg:px-20 relative z-10 mt-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.85, ease: 'easeOut' }}
                        className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase"
                    >
                        Capturing Moments <br />
                        <span className="text-mustard-gold italic font-light lowercase font-serif">of</span> Brilliance
                    </motion.h1>
                    <div className="max-w-3xl mx-auto space-y-4">
                        <motion.p
                            initial={{ opacity: 0, y: 22 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.85, delay: 0.2, ease: 'easeOut' }}
                            className="text-white/80 text-lg md:text-xl font-light leading-relaxed"
                        >
                            Explore our curated collection of extraordinary events that define luxury and elegance.
                            Each album is a visual journey showcasing our meticulous attention to detail, breathtaking
                            venues, and the unforgettable atmospheres we craft for our clients.
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0, y: 22 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.85, delay: 0.35, ease: 'easeOut' }}
                            className="text-white/50 text-sm max-w-2xl mx-auto"
                        >
                            From intimate weddings to grand corporate galas, browse through our visual stories below
                            to see how we transform visions into spectacular reality. Click on any event to view the full gallery.
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* ── Gallery Grid ───────────────────────────────────────────── */}
            <section className="section-gradient relative z-10">
                {/* Separator rule */}
                <div className="flex items-center justify-center pt-10 pb-2">
                    <div className="h-px w-24 bg-mustard-gold/40" />
                    <div className="mx-4 w-1.5 h-1.5 rounded-full bg-mustard-gold/60" />
                    <div className="h-px w-24 bg-mustard-gold/40" />
                </div>
                <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-10 pb-20 relative z-10">

                    {/* Filter Bar */}
                    {events.length > 0 && (
                        <motion.div
                            variants={cardGrid}
                            initial="hidden"
                            whileInView="visible"
                            viewport={VP_CONTENT}
                            className="flex flex-wrap justify-center gap-3 mb-12"
                        >
                            {activeCategories.map(cat => (
                                <motion.button
                                    key={cat}
                                    variants={cardItem}
                                    onClick={() => setFilter(cat)}
                                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${filter === cat
                                        ? 'bg-mustard-gold text-deep-teal shadow-lg shadow-mustard-gold/20 font-bold'
                                        : 'border border-white/10 hover:border-mustard-gold hover:text-mustard-gold'
                                    }`}
                                >
                                    {cat}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-12 h-12 border-4 border-mustard-gold border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && events.length === 0 && (
                        <motion.div
                            variants={blockReveal}
                            initial="hidden"
                            whileInView="visible"
                            viewport={VP_CONTENT}
                            className="text-center py-20 text-white/50"
                        >
                            <Grid size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-xl">No gallery images available yet.</p>
                        </motion.div>
                    )}

                    {/* Gallery Grid */}
                    {!loading && events.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredEvents.map((event, idx) => {
                                const coverImage = event.images[0].image || event.images[0].image_url;
                                const category = EVENT_TYPES[event.event_type] || 'Event';
                                return (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, scale: 0.92 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true, amount: 0.08 }}
                                        transition={{ duration: 0.5, delay: (idx % 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                        onClick={() => openAlbum(event)}
                                        className="aspect-[4/3] group relative overflow-hidden rounded-xl bg-[#1a3333] cursor-pointer"
                                    >
                                        <img
                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                            src={coverImage}
                                            alt={event.event_name}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex flex-col justify-end p-6">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-mustard-gold text-xs font-bold uppercase tracking-widest">{category}</span>
                                                {event.images.length > 1 && (
                                                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-md backdrop-blur-md">
                                                        +{event.images.length - 1} more
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-white text-xl font-bold">{event.event_name}</h3>
                                            <p className="text-white/70 text-sm mt-1 flex items-center gap-1.5">
                                                <MapPin size={14} /> {event.venue}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Event Album Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="fixed inset-0 z-50 flex flex-col bg-[#050a0a]/95 backdrop-blur-xl overflow-y-auto custom-scrollbar"
                    >
                        <div className="sticky top-0 z-20 flex items-center justify-between p-6 bg-gradient-to-b from-[#050a0a] to-transparent">
                            <div className="pr-4">
                                <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">{selectedEvent.event_name}</h2>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-mustard-gold mt-2 font-medium">
                                    <span className="flex items-center gap-1.5"><MapPin size={16} /> {selectedEvent.venue}</span>
                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                        <CalendarIcon size={16} />
                                        {new Date(selectedEvent.event_date).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                {selectedEvent.description && (
                                    <p className="text-white/70 mt-4 max-w-3xl text-sm leading-relaxed">{selectedEvent.description}</p>
                                )}
                            </div>
                            <button onClick={closeAlbum} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 p-6 z-10 pb-20">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
                                {selectedEvent.images.map((img, idx) => (
                                    <motion.div
                                        key={img.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4, delay: idx * 0.04, ease: 'easeOut' }}
                                        onClick={() => openLightbox(idx)}
                                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-white/5"
                                    >
                                        <img
                                            src={img.image || img.image_url}
                                            alt={img.description || `Gallery image ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-mustard-gold/90 text-deep-teal flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300 ease-out">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fullscreen Lightbox */}
            <AnimatePresence>
                {lightboxIndex !== null && selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center select-none"
                        onClick={closeLightbox}
                    >
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
                            <span className="text-white/50 text-sm font-medium">
                                {lightboxIndex + 1} / {selectedEvent.images.length}
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        {lightboxIndex > 0 && (
                            <button onClick={showPrevImage} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all duration-200 z-50 hover:scale-110">
                                <ChevronLeft size={32} />
                            </button>
                        )}
                        {lightboxIndex < selectedEvent.images.length - 1 && (
                            <button onClick={showNextImage} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all duration-200 z-50 hover:scale-110">
                                <ChevronRight size={32} />
                            </button>
                        )}
                        <div className="w-full h-full flex items-center justify-center p-4 md:p-12" onClick={(e) => e.stopPropagation()}>
                            <motion.img
                                key={lightboxIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                                src={selectedEvent.images[lightboxIndex].image || selectedEvent.images[lightboxIndex].image_url}
                                alt={selectedEvent.images[lightboxIndex].description || 'Fullscreen gallery view'}
                                className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm"
                            />
                        </div>
                        {selectedEvent.images[lightboxIndex].description && (
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-center z-50" onClick={(e) => e.stopPropagation()}>
                                <p className="text-white text-lg font-medium max-w-4xl mx-auto drop-shadow-md">
                                    {selectedEvent.images[lightboxIndex].description}
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
        </>
    );
};

export default Gallery;
