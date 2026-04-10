import { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import PrivacyPolicyModal from '../PrivacyPolicyModal';

const Footer = () => {
    const [showPrivacy, setShowPrivacy] = useState(false);
    return (
        <footer className="section-gradient border-t border-white/5 py-16 px-6 md:px-16 text-white font-sans">
            <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-12">

                {/* Brand Column */}
                <div className="md:col-span-2 lg:col-span-1 mb-8 md:mb-0">
                    <div className="flex items-center gap-3 mb-6">
                        <img src={logo} alt="Crystal Events Logo" className="h-10 w-auto" />
                        <h2 className="text-lg font-extrabold tracking-tighter text-white uppercase font-serif">
                            Crystal <span className="text-mustard-gold">Events</span>
                        </h2>
                    </div>
                    <p className="text-white/40 leading-relaxed mb-6 text-sm">
                        Defining luxury in event management through precision, passion, and unparalleled elegance.
                    </p>
                    <div className="flex gap-4">
                        <a href="https://www.facebook.com/redhillcrystalevents" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-mustard-gold hover:text-deep-teal transition-all">
                            <Facebook size={18} />
                        </a>
                        <a href="https://instagram.com/irl_crystalevents" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-mustard-gold hover:text-deep-teal transition-all">
                            <Instagram size={18} />
                        </a>
                    </div>
                </div>

                {/* Company & Navigation */}
                <div className="md:col-span-1">
                    <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-6">Company</h4>
                    <ul className="space-y-4 text-white/40 text-sm">
                        <li><Link to="/services" className="hover:text-mustard-gold transition-colors">Services</Link></li>
                        <li><Link to="/gallery" className="hover:text-mustard-gold transition-colors">Gallery</Link></li>
                        <li><Link to="/about" className="hover:text-mustard-gold transition-colors">About Us</Link></li>
                        <li><Link to="/contact" className="hover:text-mustard-gold transition-colors">Careers</Link></li>
                        <li><Link to="/contact" className="hover:text-mustard-gold transition-colors">Contact Us</Link></li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="md:col-span-2">
                    <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-6">Contact</h4>
                    <ul className="space-y-4 text-white/40 text-sm">
                        <li className="flex items-center gap-3">
                            <Mail size={16} className="text-mustard-gold shrink-0" />
                            <a href="mailto:info@crystaleventsie.com" className="hover:text-mustard-gold transition-colors duration-300">info@crystaleventsie.com</a>
                        </li>
                        <li className="flex items-start gap-3">
                            <Phone size={16} className="text-mustard-gold shrink-0 mt-1" />
                            <div className="flex flex-col">
                                <span>Ireland: <a href="tel:+353892331060" className="hover:text-mustard-gold transition-colors duration-300">+353 892331060</a>, <a href="tel:+353894173337" className="hover:text-mustard-gold transition-colors duration-300">+353 894173337</a></span>
                                <span>UK: <a href="tel:+447436586579" className="hover:text-mustard-gold transition-colors duration-300">+44 7436586579</a></span>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <MapPin size={16} className="text-mustard-gold shrink-0 mt-1" />
                            <div className="flex flex-col">
                                <span>Ballinasloe, Galway, Ireland</span>
                                <span>Redhill, London, UK</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="mx-auto max-w-7xl mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-white/30 text-xs">© {new Date().getFullYear()} Crystal Events Management. All rights reserved.</p>
                <div className="flex gap-8 text-white/30 text-xs uppercase tracking-widest">
                    <button onClick={() => setShowPrivacy(true)} className="hover:text-white transition-colors">Privacy Policy</button>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                </div>
            </div>

            {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
        </footer>
    );
};

export default Footer;
