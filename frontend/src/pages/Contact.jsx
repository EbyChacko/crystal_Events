import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import api from '../utils/api';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: ''
    });
    const [services, setServices] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Fetch services for dropdown
        const fetchServices = async () => {
            try {
                const response = await api.get('/services/');
                setServices(response.data);
            } catch (error) {
                console.error('Error fetching services:', error);
            }
        };
        fetchServices();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        try {
            const payload = {
                ...formData,
                service: formData.service || null,
            };
            await api.post('/messages/', payload);
            setStatus('success');
            setFormData({ name: '', email: '', phone: '', service: '', message: '' });
        } catch (error) {
            console.error('Error sending message:', error);
            setStatus('error');
            setErrorMessage('Failed to send message. Please try again later.');
        }
    };

    return (
        <div className="bg-background-dark text-white font-sans min-h-screen pt-32 pb-16 px-6 md:px-12 lg:px-20">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16">
                {/* Contact Info */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-4xl md:text-5xl font-black mb-6">
                        Let's Create <span className="text-mustard-gold">Magic</span>
                    </h2>
                    <p className="text-white/60 text-lg mb-12 leading-relaxed">
                        Ready to plan an unforgettable event? Reach out to us for a bespoke consultation.
                        We are here to turn your vision into reality.
                    </p>

                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-mustard-gold/10 p-3 rounded-lg text-mustard-gold">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">Email Us</h4>
                                <p className="text-white/60">info@crystaleventsie.com</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-mustard-gold/10 p-3 rounded-lg text-mustard-gold">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">Call Us</h4>
                                <p className="text-white/60">Ireland: +353 892331060, +353 894173337</p>
                                <p className="text-white/60">UK: +44 7436586579</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-mustard-gold/10 p-3 rounded-lg text-mustard-gold">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">Visit Us</h4>
                                <p className="text-white/60">Ballinasloe, Galway, Ireland</p>
                                <p className="text-white/60">Redhill, London, UK</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Contact Form */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="bg-primary/30 p-6 md:p-10 rounded-2xl border border-white/10"
                >
                    {status === 'success' ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4">
                                <Send size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                            <p className="text-white/60">
                                Thank you for contacting us. We will get back to you shortly.
                            </p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-8 text-mustard-gold font-bold hover:underline"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-widest text-white/50 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-mustard-gold transition-colors text-white placeholder-white/20"
                                    placeholder="Your Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-widest text-white/50 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-mustard-gold transition-colors text-white placeholder-white/20"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-widest text-white/50 mb-2">
                                    Mobile Number *
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-mustard-gold transition-colors text-white placeholder-white/20"
                                    placeholder="+353 89 1234567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-widest text-white/50 mb-2">
                                    Service Interested In
                                </label>
                                <select
                                    name="service"
                                    value={formData.service}
                                    onChange={handleChange}
                                    className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-mustard-gold transition-colors text-white"
                                >
                                    <option value="">Select a Service (Optional)</option>
                                    {services.map((service) => (
                                        <option key={service.id} value={service.id}>
                                            {service.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-widest text-white/50 mb-2">
                                    Message
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows="4"
                                    className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-mustard-gold transition-colors text-white placeholder-white/20"
                                    placeholder="Tell us about the event..."
                                ></textarea>
                            </div>

                            {status === 'error' && (
                                <p className="text-red-400 text-sm">{errorMessage}</p>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="w-full bg-mustard-gold text-deep-teal font-bold uppercase tracking-widest py-4 rounded-lg hover:bg-mustard-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {status === 'submitting' ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" /> Sending...
                                    </>
                                ) : (
                                    'Send Message'
                                )}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Contact;
