import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, ChevronLeft, ChevronRight, MapPin, Calendar as CalendarIcon, Grid } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import heroBg from '../assets/images/hero_background.webp';

const EVENT_TYPES = {
    'wedding': 'Wedding',
    'corporate': 'Corporate',
    'birthday': 'Birthday',
    'concert': 'Concert',
    'conference': 'Conference',
    'private_party': 'Private Party',
    'charity': 'Charity',
    'festival': 'Festival',
    'other': 'Other'
};

const Gallery = () => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });

    const { scrollY } = useScroll();
    const sectionShadow = useTransform(
        scrollY,
        [0, 80],
        ['0px -16px 60px rgba(0,0,0,0)', '0px -16px 60px rgba(0,0,0,0.5)']
    );

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
                // Only keep events that have at least one image
                const withImages = res.data.filter(e => e.images && e.images.length > 0);

                // Sort by date descending
                withImages.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
                setEvents(withImages);
            } catch (err) {
                console.error("Failed to fetch gallery events", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGalleryEvents();
    }, []);

    // Extract unique categories that actually have images
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
        // Remove 'album' search param instead of pushing empty object, leaving other params intact if any exist
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

        // Cleanup function for when component unmounts
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedEvent, lightboxIndex]);

    const openLightbox = (index) => {
        setLightboxIndex(index);
    };

    const closeLightbox = () => {
        setLightboxIndex(null);
    };

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
        <div className="bg-background-dark text-white font-sans">
            {/* ── Hero ── z-index 1 */}
            <section data-scroll-snap ref={targetRef} className="sticky top-0 z-[1] relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
                {/* Background image with overlay */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroBg})` }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-deep-teal/70 via-deep-teal/50 to-background-dark" />
                </div>
                <div className="text-center space-y-6 px-6 md:px-12 lg:px-20 relative z-10 border-b-0">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase"
                >
                    Capturing Moments <br /> <span className="text-mustard-gold italic font-light lowercase font-serif">of</span> Brilliance
                </motion.h2>
                <div className="max-w-3xl mx-auto space-y-4">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-white/80 text-lg md:text-xl font-light leading-relaxed"
                    >
                        Explore our curated collection of extraordinary events that define luxury and elegance.
                        Each album is a visual journey showcasing our meticulous attention to detail, breathtaking
                        venues, and the unforgettable atmospheres we craft for our clients.
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-white/50 text-sm max-w-2xl mx-auto"
                    >
                        From intimate weddings to grand corporate galas, browse through our visual stories below
                        to see how we transform visions into spectacular reality. Click on any event to view the full gallery.
                    </motion.p>
                </div>
                </div>
            </section>

            {/* ── Gallery Grid ── slides over hero, z-index 2 */}
            <motion.section data-scroll-snap style={{ boxShadow: sectionShadow }} className="sticky top-0 z-[2] min-h-screen bg-background-dark rounded-t-[2rem]">
            <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-16 relative z-10">
                {/* Filter Bar */}
                {events.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex flex-wrap justify-center gap-3 mb-12"
                    >
                        {activeCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${filter === cat
                                    ? 'bg-mustard-gold text-deep-teal shadow-lg shadow-mustard-gold/20 font-bold'
                                    : 'border border-white/10 hover:border-mustard-gold hover:text-mustard-gold'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </motion.div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-mustard-gold border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && events.length === 0 && (
                    <div className="text-center py-20 text-white/50">
                        <Grid size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-xl">No gallery images available yet.</p>
                    </div>
                )}

                {/* Masonry Grid */}
                {!loading && events.length > 0 && (
                    <div className="masonry-grid">
                        {filteredEvents.map((event, idx) => {
                            const coverImage = event.images[0].image || event.images[0].image_url;
                            const category = EVENT_TYPES[event.event_type] || 'Event';

                            return (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: (idx % 8) * 0.1 }}
                                    onClick={() => openAlbum(event)}
                                    className="masonry-item group relative overflow-hidden rounded-xl bg-[#1a3333] cursor-pointer"
                                >
                                    <img
                                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                                        src={coverImage}
                                        alt={event.event_name}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
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
            </motion.section>

            {/* Event Album Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col bg-[#050a0a]/95 backdrop-blur-xl overflow-y-auto custom-scrollbar"
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 z-20 flex items-center justify-between p-6 bg-gradient-to-b from-[#050a0a] to-transparent">
                            <div className="pr-4">
                                <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">{selectedEvent.event_name}</h2>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-mustard-gold mt-2 font-medium">
                                    <span className="flex items-center gap-1.5"><MapPin size={16} /> {selectedEvent.venue}</span>
                                    <span className="flex items-center gap-1.5 whitespace-nowrap"><CalendarIcon size={16} /> {new Date(selectedEvent.event_date).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                {selectedEvent.description && (
                                    <p className="text-white/70 mt-4 max-w-3xl text-sm leading-relaxed">{selectedEvent.description}</p>
                                )}
                            </div>
                            <button onClick={closeAlbum} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Thumbnails Grid */}
                        <div className="flex-1 p-6 z-10 pb-20">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
                                {selectedEvent.images.map((img, idx) => (
                                    <motion.div
                                        key={img.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => openLightbox(idx)}
                                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-white/5"
                                    >
                                        <img
                                            src={img.image || img.image_url}
                                            alt={img.description || `Gallery image ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-mustard-gold/90 text-deep-teal flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
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
                        className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center select-none"
                        onClick={closeLightbox}
                    >
                        {/* Top Controls */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
                            <span className="text-white/50 text-sm font-medium">
                                {lightboxIndex + 1} / {selectedEvent.images.length}
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Arrows */}
                        {lightboxIndex > 0 && (
                            <button
                                onClick={showPrevImage}
                                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all z-50 hover:scale-110"
                            >
                                <ChevronLeft size={32} />
                            </button>
                        )}

                        {lightboxIndex < selectedEvent.images.length - 1 && (
                            <button
                                onClick={showNextImage}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all z-50 hover:scale-110"
                            >
                                <ChevronRight size={32} />
                            </button>
                        )}

                        {/* Main Image */}
                        <div className="w-full h-full flex items-center justify-center p-4 md:p-12" onClick={(e) => e.stopPropagation()}>
                            <motion.img
                                key={lightboxIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                src={selectedEvent.images[lightboxIndex].image || selectedEvent.images[lightboxIndex].image_url}
                                alt={selectedEvent.images[lightboxIndex].description || 'Fullscreen gallery view'}
                                className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm"
                            />
                        </div>

                        {/* Image Description Footer */}
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

            {/* Floating CTA */}
            <Link to="/contact">
                <button className="fixed bottom-8 right-8 z-[40] bg-mustard-gold text-deep-teal p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
                    <MessageSquare size={24} fill="currentColor" />
                </button>
            </Link>
        </div>
    );
};

export default Gallery;
