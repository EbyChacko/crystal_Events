import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Shield, Mail, Phone } from 'lucide-react';

const Section = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="text-mustard-gold font-bold uppercase tracking-widest text-xs mb-3">{title}</h3>
        {children}
    </div>
);

const BulletList = ({ items }) => (
    <ul className="space-y-1.5 mt-2">
        {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-white/60 text-sm">
                <span className="w-1 h-1 rounded-full bg-mustard-gold shrink-0 mt-2" />
                {item}
            </li>
        ))}
    </ul>
);

const PrivacyPolicyModal = ({ onClose }) => {
    useEffect(() => {
        const handle = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-2xl max-h-[85vh] bg-[#0a1f1f] border border-mustard-gold/20 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-mustard-gold/10 flex items-center justify-center">
                            <Shield size={16} className="text-mustard-gold" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg leading-none">Privacy Policy</h2>
                            <p className="text-white/40 text-xs mt-0.5">Crystal Events Ireland</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c5a059 transparent' }}>

                    <p className="text-white/50 text-sm leading-relaxed mb-8">
                        This Privacy Policy describes how <span className="text-white/80">Crystal Events</span> ("we", "our", or "us") collects, uses, and protects your information when you visit our website <span className="text-mustard-gold">crystaleventsie.com</span>.
                    </p>

                    <Section title="Information We Collect">
                        <p className="text-white/60 text-sm font-medium mb-1">Personal Information</p>
                        <BulletList items={['Name', 'Email address', 'Phone number', 'Event details submitted through contact forms']} />
                        <p className="text-white/60 text-sm font-medium mt-4 mb-1">Non-Personal Information</p>
                        <BulletList items={['Browser type', 'IP address', 'Pages visited on our website', 'Date and time of visits']} />
                    </Section>

                    <Section title="How We Use Your Information">
                        <p className="text-white/60 text-sm mb-2">We use the collected information to:</p>
                        <BulletList items={[
                            'Respond to your inquiries and provide services',
                            'Communicate with you regarding your event',
                            'Improve our website and user experience',
                            'Send updates or promotional information (only if you opt-in)',
                        ]} />
                    </Section>

                    <Section title="Cookies">
                        <p className="text-white/60 text-sm leading-relaxed">
                            Our website may use cookies to enhance your browsing experience. Cookies help us understand how users interact with our website and improve performance.
                        </p>
                        <p className="text-white/60 text-sm leading-relaxed mt-2">
                            You can choose to disable cookies through your browser settings.
                        </p>
                    </Section>

                    <Section title="Data Protection">
                        <p className="text-white/60 text-sm leading-relaxed">
                            We take appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.
                        </p>
                        <p className="text-white/50 text-sm leading-relaxed mt-2 italic">
                            No method of transmission over the internet is 100% secure.
                        </p>
                    </Section>

                    <Section title="Sharing Your Information">
                        <p className="text-white/60 text-sm leading-relaxed mb-2">
                            We do not sell, trade, or rent your personal information to others. We may share information only when necessary:
                        </p>
                        <BulletList items={[
                            'To provide services (e.g., catering partners, vendors)',
                            'To comply with legal obligations',
                        ]} />
                    </Section>

                    <Section title="Third-Party Links">
                        <p className="text-white/60 text-sm leading-relaxed">
                            Our website may contain links to external websites. We are not responsible for the privacy practices of those websites.
                        </p>
                    </Section>

                    <Section title="Children's Privacy">
                        <p className="text-white/60 text-sm leading-relaxed">
                            Our services are not directed to individuals under the age of 13, and we do not knowingly collect personal information from children.
                        </p>
                    </Section>

                    <Section title="Your Rights">
                        <p className="text-white/60 text-sm mb-2">You have the right to:</p>
                        <BulletList items={[
                            'Request access to your personal data',
                            'Request correction or deletion of your data',
                            'Withdraw consent for communication',
                        ]} />
                        <p className="text-white/50 text-sm mt-3">To exercise these rights, please contact us.</p>
                    </Section>

                    <Section title="Contact Us">
                        <p className="text-white/60 text-sm mb-3">If you have any questions about this Privacy Policy, contact us at:</p>
                        <div className="space-y-2">
                            <a href="mailto:info@crystaleventsie.com" className="flex items-center gap-2.5 text-sm text-white/60 hover:text-mustard-gold transition-colors">
                                <Mail size={14} className="text-mustard-gold shrink-0" />
                                info@crystaleventsie.com
                            </a>
                            <div className="flex items-start gap-2.5 text-sm text-white/60">
                                <Phone size={14} className="text-mustard-gold shrink-0 mt-0.5" />
                                <div>
                                    <div>Ireland: +353 892331060, +353 894173337</div>
                                    <div>UK: +44 7436586579</div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section title="Updates to This Policy">
                        <p className="text-white/60 text-sm leading-relaxed">
                            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
                        </p>
                    </Section>

                </div>

                {/* Footer bar */}
                <div className="px-6 py-4 border-t border-white/10 shrink-0 flex items-center justify-between">
                    <p className="text-white/30 text-xs">© {new Date().getFullYear()} Crystal Events Management</p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 bg-mustard-gold text-deep-teal text-xs font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

export default PrivacyPolicyModal;
