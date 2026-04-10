import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, FileText, Mail, Phone } from 'lucide-react';

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

const TermsOfServiceModal = ({ onClose }) => {
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
                            <FileText size={16} className="text-mustard-gold" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg leading-none">Terms of Service</h2>
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
                        By using the website or services of <span className="text-white/80">Crystal Events</span> ("we", "our", or "us"), you agree to be bound by the following Terms of Service. Please read them carefully before making a booking or enquiry at <span className="text-mustard-gold">crystaleventsie.com</span>.
                    </p>

                    <Section title="Acceptance of Terms">
                        <p className="text-white/60 text-sm leading-relaxed">
                            By accessing our website or engaging our services, you confirm that you have read, understood, and agree to these Terms of Service. If you do not agree, please do not use our website or services.
                        </p>
                    </Section>

                    <Section title="Services">
                        <p className="text-white/60 text-sm leading-relaxed mb-2">
                            Crystal Events provides professional event planning and management services including but not limited to:
                        </p>
                        <BulletList items={[
                            'Wedding planning and coordination',
                            'Birthday and private celebrations',
                            'Corporate events and conferences',
                            'Stage productions and live entertainment',
                            'Music event management',
                            'Catering coordination',
                        ]} />
                        <p className="text-white/50 text-sm leading-relaxed mt-3">
                            All services are subject to availability and the terms agreed in your specific service contract.
                        </p>
                    </Section>

                    <Section title="Bookings & Payments">
                        <BulletList items={[
                            'A non-refundable deposit is required to secure your event date',
                            'Full payment terms will be outlined in your individual service agreement',
                            'Prices quoted are subject to change until a contract is signed',
                            'Crystal Events reserves the right to decline any booking at its discretion',
                        ]} />
                    </Section>

                    <Section title="Cancellations & Refunds">
                        <p className="text-white/60 text-sm leading-relaxed mb-2">
                            Cancellation policies vary by service type and are detailed in each service contract. As a general guide:
                        </p>
                        <BulletList items={[
                            'Deposits are non-refundable under all circumstances',
                            'Cancellations made less than 30 days before the event date may incur additional charges',
                            'Crystal Events will not be liable for cancellations due to circumstances beyond our reasonable control (force majeure)',
                        ]} />
                    </Section>

                    <Section title="Client Responsibilities">
                        <p className="text-white/60 text-sm leading-relaxed mb-2">
                            As a client, you agree to:
                        </p>
                        <BulletList items={[
                            'Provide accurate and complete information at the time of booking',
                            'Communicate any changes to event requirements promptly',
                            'Ensure all guests and attendees comply with venue rules and applicable laws',
                            'Obtain any permits or licences required for your event that are not within the scope of our agreed services',
                        ]} />
                    </Section>

                    <Section title="Intellectual Property">
                        <p className="text-white/60 text-sm leading-relaxed">
                            All content on this website — including text, graphics, logos, and images — is the property of Crystal Events and protected by applicable intellectual property laws. You may not reproduce or redistribute any content without our prior written consent.
                        </p>
                    </Section>

                    <Section title="Limitation of Liability">
                        <p className="text-white/60 text-sm leading-relaxed mb-2">
                            To the fullest extent permitted by law, Crystal Events shall not be liable for:
                        </p>
                        <BulletList items={[
                            'Any indirect, incidental, or consequential loss arising from the use of our services',
                            'Loss caused by third-party vendors or suppliers engaged on your behalf',
                            'Disruptions resulting from circumstances outside our reasonable control',
                        ]} />
                    </Section>

                    <Section title="Third-Party Vendors">
                        <p className="text-white/60 text-sm leading-relaxed">
                            Crystal Events may engage third-party suppliers (caterers, venues, entertainers, etc.) to fulfil elements of your event. While we select partners carefully, we are not responsible for the independent actions or failures of third-party vendors.
                        </p>
                    </Section>

                    <Section title="Website Use">
                        <p className="text-white/60 text-sm leading-relaxed mb-2">
                            You agree not to use this website to:
                        </p>
                        <BulletList items={[
                            'Submit false or misleading information',
                            'Engage in any unlawful activity',
                            'Attempt to gain unauthorised access to any part of the site',
                        ]} />
                    </Section>

                    <Section title="Governing Law">
                        <p className="text-white/60 text-sm leading-relaxed">
                            These Terms of Service are governed by the laws of the Republic of Ireland. Any disputes shall be subject to the exclusive jurisdiction of the Irish courts.
                        </p>
                    </Section>

                    <Section title="Contact Us">
                        <p className="text-white/60 text-sm mb-3">If you have any questions about these Terms of Service, contact us at:</p>
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

                    <Section title="Updates to These Terms">
                        <p className="text-white/60 text-sm leading-relaxed">
                            We may update these Terms of Service from time to time. Any changes will be posted on this page with an updated effective date. Continued use of our website or services constitutes acceptance of the revised terms.
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

export default TermsOfServiceModal;
