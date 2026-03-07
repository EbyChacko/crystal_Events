import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/images/logo.png';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location]);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services' },
        { name: 'Gallery', path: '/gallery' },
        { name: 'About Us', path: '/about' },
    ];

    return (
        <nav
            className={`fixed w-full z-50 transition-all duration-300 border-b border-white/10 ${scrolled ? 'bg-background-dark/95 backdrop-blur-md shadow-lg py-3' : 'bg-background-dark/80 backdrop-blur-md py-4'
                }`}
        >
            <div className="w-full px-6 md:px-8 lg:px-16 flex justify-between items-center max-w-[1440px] mx-auto">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3">
                    <img src={logo} alt="Crystal Events Logo" className="h-12 w-auto" />
                    <div className="text-xl text-white font-serif tracking-tight uppercase">
                        <span className="font-bold">Crystal</span> <span className="text-mustard-gold font-normal tracking-tighter">Events</span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden lg:flex items-center space-x-10">
                    {navLinks.map((link) => (
                        link.path.startsWith('/#') ? (
                            <a
                                key={link.name}
                                href={link.path}
                                className="text-white/80 hover:text-mustard-gold transition-colors duration-300 text-sm font-semibold uppercase tracking-widest"
                            >
                                {link.name}
                            </a>
                        ) : (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="text-white/80 hover:text-mustard-gold transition-colors duration-300 text-sm font-semibold uppercase tracking-widest"
                            >
                                {link.name}
                            </Link>
                        )
                    ))}

                    <div className="flex items-center ml-4 space-x-4">
                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center rounded-lg border-2 border-mustard-gold px-6 py-2 text-sm font-bold uppercase tracking-widest text-mustard-gold hover:bg-mustard-gold hover:text-deep-teal transition-all"
                        >
                            Get a Quote
                        </Link>
                        <Link
                            to="/admin/login"
                            className="flex items-center space-x-2 text-mustard-gold hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                            title="Staff Login"
                        >
                            <User size={20} />
                            <span className="text-sm font-semibold uppercase tracking-widest hidden lg:block">Staff Login</span>
                            <span className="text-sm font-semibold uppercase tracking-widest lg:hidden">Login</span>
                        </Link>
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <div className="lg:hidden flex items-center">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-white focus:outline-none p-2"
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-background-dark border-t border-white/10 overflow-hidden"
                    >
                        <div className="flex flex-col items-center py-8 space-y-6">
                            {navLinks.map((link) => (
                                link.path.startsWith('/#') ? (
                                    <a
                                        key={link.name}
                                        href={link.path}
                                        onClick={() => setIsOpen(false)}
                                        className="text-white text-lg font-medium hover:text-mustard-gold transition-colors duration-300 uppercase tracking-widest"
                                    >
                                        {link.name}
                                    </a>
                                ) : (
                                    <Link
                                        key={link.name}
                                        to={link.path}
                                        className="text-white text-lg font-medium hover:text-mustard-gold transition-colors duration-300 uppercase tracking-widest"
                                    >
                                        {link.name}
                                    </Link>
                                )
                            ))}
                            <div className="flex flex-col items-center justify-center space-y-4 mt-4 w-full px-6">
                                <Link
                                    to="/contact"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full text-center py-3 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-lg"
                                >
                                    Get a Quote
                                </Link>
                                <Link
                                    to="/admin/login"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full justify-center flex items-center space-x-2 py-3 bg-white/5 border border-white/10 rounded-lg text-mustard-gold hover:bg-white/10 transition-colors"
                                    title="Staff Login"
                                >
                                    <User size={20} />
                                    <span className="font-bold uppercase tracking-widest text-sm">Staff Login</span>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
export default Navbar;
