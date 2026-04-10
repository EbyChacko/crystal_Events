import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import PrivacyPolicyModal from '../PrivacyPolicyModal';
import TermsOfServiceModal from '../TermsOfServiceModal';

const defaultCta = {
    label: "Let's Create Something Beautiful",
    title: 'Ready to begin your next celebration?',
    description: "Let's turn your vision into an unforgettable reality. Our team is ready to discuss your requirements.",
    buttonText: 'Book Your Event',
    buttonLink: '/contact',
};

const CTAFooter = ({ cta }) => {
    const { label, title, description, buttonText, buttonLink } = cta || defaultCta;
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    return (
        <div className="section-gradient text-white font-sans">

            {/* ── Compact CTA ── */}
            <div className="mx-auto max-w-5xl px-6 md:px-12 pt-24 pb-12 text-center">
                <span className="text-mustard-gold font-bold uppercase tracking-[0.3em] text-xs mb-4 block">
                    {label}
                </span>
                <h2 className="text-2xl md:text-4xl font-black leading-tight font-sans mb-4">
                    {title}
                </h2>
                <p className="mx-auto max-w-xl text-sm md:text-base text-white/50 mb-8 leading-relaxed">
                    {description}
                </p>
                <div className="flex items-center justify-center">
                    <Link
                        to={buttonLink}
                        className="px-8 py-3.5 bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all duration-300 shadow-[0_0_20px_rgba(238,192,89,0.25)] text-sm"
                    >
                        {buttonText}
                    </Link>
                </div>
            </div>

            {/* ── Divider ── */}
            <div className="mx-auto max-w-7xl px-6 md:px-16">
                <div className="border-t border-white/10" />
            </div>

            {/* ── Footer ── */}
            <div className="mx-auto max-w-7xl px-6 md:px-16 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">

                {/* Brand */}
                <div className="md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3 mb-5">
                        <img src={logo} alt="Crystal Events Logo" className="h-9 w-auto" />
                        <h2 className="text-base font-extrabold tracking-tighter text-white uppercase font-serif">
                            Crystal <span className="text-mustard-gold">Events</span>
                        </h2>
                    </div>
                    <p className="text-white/40 leading-relaxed mb-5 text-sm">
                        Defining luxury in event management through precision, passion, and unparalleled elegance.
                    </p>
                    <div className="flex gap-3">
                        <a href="https://www.facebook.com/redhillcrystalevents" target="_blank" rel="noopener noreferrer" className="h-9 w-9 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-mustard-gold hover:text-deep-teal transition-all duration-300">
                            <Facebook size={16} />
                        </a>
                        <a href="https://instagram.com/irl_crystalevents" target="_blank" rel="noopener noreferrer" className="h-9 w-9 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-mustard-gold hover:text-deep-teal transition-all duration-300">
                            <Instagram size={16} />
                        </a>
                    </div>
                </div>

                {/* Company */}
                <div>
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-5">Company</h4>
                    <ul className="space-y-3 text-white/40 text-sm">
                        <li><Link to="/services" className="hover:text-mustard-gold transition-colors">Services</Link></li>
                        <li><Link to="/gallery" className="hover:text-mustard-gold transition-colors">Gallery</Link></li>
                        <li><Link to="/about" className="hover:text-mustard-gold transition-colors">About Us</Link></li>
                        <li><Link to="/contact" className="hover:text-mustard-gold transition-colors">Careers</Link></li>
                        <li><Link to="/contact" className="hover:text-mustard-gold transition-colors">Contact Us</Link></li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="md:col-span-2">
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-5">Contact</h4>
                    <ul className="space-y-3 text-white/40 text-sm">
                        <li className="flex items-center gap-3">
                            <Mail size={14} className="text-mustard-gold shrink-0" />
                            <a href="mailto:info@crystaleventsie.com" className="hover:text-mustard-gold transition-colors duration-300">info@crystaleventsie.com</a>
                        </li>
                        <li className="flex items-start gap-3">
                            <Phone size={14} className="text-mustard-gold shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-0.5">
                                <span>Ireland: <a href="tel:+353892331060" className="hover:text-mustard-gold transition-colors duration-300">+353 892331060</a> / <a href="tel:+353894173337" className="hover:text-mustard-gold transition-colors duration-300">+353 894173337</a></span>
                                <span>UK: <a href="tel:+447436586579" className="hover:text-mustard-gold transition-colors duration-300">+44 7436586579</a></span>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <MapPin size={14} className="text-mustard-gold shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-0.5">
                                <span>Ballinasloe, Galway, Ireland</span>
                                <span>Redhill, London, UK</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            {/* ── Copyright ── */}
            <div className="mx-auto max-w-7xl px-6 md:px-16 pb-8 border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-white/30 text-xs">© {new Date().getFullYear()} Crystal Events Management. All rights reserved.</p>
                <div className="flex gap-6 text-white/30 text-xs uppercase tracking-widest">
                    <button type="button" onClick={() => setShowPrivacy(true)} className="hover:text-white transition-colors">Privacy Policy</button>
                    <button type="button" onClick={() => setShowTerms(true)} className="hover:text-white transition-colors">Terms of Service</button>
                </div>
            </div>

            {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
            {showTerms && <TermsOfServiceModal onClose={() => setShowTerms(false)} />}
        </div>
    );
};

export default CTAFooter;
