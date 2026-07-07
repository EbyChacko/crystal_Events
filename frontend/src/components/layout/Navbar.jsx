import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/images/logo.png';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [visible, setVisible] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const [hovered, setHovered] = useState(false);
    const lastScrollY = useRef(0);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;
            const prev = lastScrollY.current;

            setScrolled(currentY > 10);

            if (currentY < 60) {
                // Always show near the top
                setVisible(true);
            } else if (currentY > prev + 6) {
                // Scrolling down — hide
                setVisible(false);
                setIsOpen(false);
            } else if (prev > currentY + 4) {
                // Scrolling up — show
                setVisible(true);
            }

            lastScrollY.current = currentY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [location]);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services' },
        { name: 'Gallery', path: '/gallery' },
        { name: 'About Us', path: '/about' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <motion.div
            className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8"
            initial={{ y: '-120%' }}
            animate={{ y: visible ? 0 : '-120%' }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {/* ── Floating pill navbar — always glass ── */}
            <nav
                className="max-w-6xl mx-auto rounded-full border border-white/10 backdrop-blur-xl px-5 py-2.5"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    backgroundColor: hovered ? 'rgba(1, 45, 45, 0.80)' : scrolled ? 'rgba(1, 45, 45, 0.60)' : 'rgba(1, 45, 45, 0.22)',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
                    transition: 'background-color 0.35s ease',
                }}
            >
                <div className="flex justify-between items-center">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                        <img
                            src={logo}
                            alt="Crystal Events Logo"
                            className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="text-base text-white font-serif tracking-tight uppercase leading-none">
                            <span className="font-bold">Crystal</span>{' '}
                            <span className="text-mustard-gold font-normal tracking-tighter">Events</span>
                        </div>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`relative text-xs uppercase tracking-widest transition-colors duration-300 ${
                                    isActive(link.path)
                                        ? 'text-mustard-gold font-bold'
                                        : 'text-white/70 font-normal hover:text-white'
                                }`}
                            >
                                {link.name}
                                {isActive(link.path) && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-mustard-gold rounded-full"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop CTAs */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center rounded-full border border-mustard-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-mustard-gold hover:bg-mustard-gold hover:text-deep-teal transition-all duration-300"
                        >
                            Get a Quote
                        </Link>
                        <Link
                            to="/admin/login"
                            className="flex items-center gap-1.5 text-white/40 hover:text-mustard-gold transition-colors px-2.5 py-2 rounded-full hover:bg-white/5"
                            title="Staff Login"
                        >
                            <User size={16} />
                            <span className="text-xs font-medium uppercase tracking-widest">Staff</span>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-white focus:outline-none p-1.5 rounded-full hover:bg-white/10 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="max-w-6xl mx-auto mt-2 rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden"
                        style={{ backgroundColor: 'rgba(1, 45, 45, 0.88)' }}
                    >
                        <div className="flex flex-col items-center py-7 space-y-5">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`text-base uppercase tracking-widest transition-colors duration-300 ${
                                        isActive(link.path)
                                            ? 'text-mustard-gold font-bold'
                                            : 'text-white/70 font-normal hover:text-white'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="flex flex-col items-center gap-3 w-full px-6 pt-2">
                                <Link
                                    to="/contact"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full text-center py-3 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(238,192,89,0.25)]"
                                >
                                    Get a Quote
                                </Link>
                                <Link
                                    to="/admin/login"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full justify-center flex items-center gap-2 py-3 bg-white/5 border border-white/10 rounded-full text-mustard-gold hover:bg-white/10 transition-colors"
                                >
                                    <User size={18} />
                                    <span className="font-bold uppercase tracking-widest text-sm">Staff Login</span>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Navbar;
