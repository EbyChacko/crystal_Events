import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import CTAFooter from './CTAFooter';

const SERVICE_CTAS = {
    '/services/wedding-planning': {
        label: 'Wedding Planning',
        title: 'Ready to Plan Your Dream Wedding?',
        description: 'Let our team create a beautiful, culturally rich wedding experience tailored entirely to your vision.',
        buttonText: 'Book Your Wedding Consultation',
        buttonLink: '/contact',
    },
    '/services/birthday-events': {
        label: 'Birthday Events',
        title: 'Ready to Celebrate in Style?',
        description: "Let's create a birthday party your guests will talk about for years to come. Limited weekend bookings available.",
        buttonText: 'Plan Your Birthday Party Today',
        buttonLink: '/contact',
    },
    '/services/corporate-events': {
        label: 'Corporate Events',
        title: 'Ready to Host a Memorable Corporate Event?',
        description: 'Let us handle everything — from planning to execution — so your event runs flawlessly and leaves a lasting impression.',
        buttonText: 'Plan Your Corporate Event',
        buttonLink: '/contact',
    },
    '/services/stage-decoration': {
        label: 'Stage Decoration',
        title: 'Ready to Create a Stunning Stage?',
        description: "Let's design something unforgettable. Contact us today for custom stage decoration — full packages or stage-only bookings available.",
        buttonText: 'Book Your Stage Decoration',
        buttonLink: '/contact',
    },
    '/services/live-music-dj': {
        label: 'DJ, Live Music & Sound',
        title: 'Ready to Energize Your Event?',
        description: "Let's create an unforgettable atmosphere with the perfect music, sound, and lighting for your celebration.",
        buttonText: 'Book DJ & Sound Services',
        buttonLink: '/contact',
    },
    '/services/catering': {
        label: 'Catering Services',
        title: 'Ready to Delight Your Guests?',
        description: "Let our chefs craft a bespoke menu that reflects your culture, style, and taste. Contact us for a custom catering quote.",
        buttonText: 'Get a Catering Quote',
        buttonLink: '/contact',
    },
};

const Layout = () => {
    const location = useLocation();
    const isLanding = location.pathname === '/';
    const isServiceDetail = location.pathname.startsWith('/services/');
    const serviceCta = SERVICE_CTAS[location.pathname];

    return (
        <div>
            <Navbar />
            <Outlet />
            {!isLanding && !isServiceDetail && (
                <div className="bg-background-dark">
                    <CTAFooter />
                </div>
            )}
            {!isLanding && isServiceDetail && (
                <div className="bg-deep-teal">
                    <CTAFooter cta={serviceCta} />
                </div>
            )}
        </div>
    );
};

export default Layout;
