import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
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
    // Service detail pages (e.g. /services/wedding-planning) are long-form scrolling
    // pages — scroll snap and sticky footer don't apply to them.
    const isServiceDetail = location.pathname.startsWith('/services/');
    const serviceCta = SERVICE_CTAS[location.pathname];

    const { scrollY } = useScroll();
    const sectionShadow = useTransform(
        scrollY,
        [0, 80],
        ['0px -16px 60px rgba(0,0,0,0)', '0px -16px 60px rgba(0,0,0,0.5)']
    );

    // JavaScript scroll snap — fires when scroll stops, snaps to nearest section.
    // Disabled on service detail pages and on mobile/tablet screens (<1024px) where
    // touch inertia makes snapping feel broken and content can become unreachable.
    useEffect(() => {
        if (isServiceDetail) return;
        if (window.innerWidth < 1024) return;

        let scrollTimer;
        let isSnapping = false;

        const getSnapPoints = () =>
            Array.from(document.querySelectorAll('[data-scroll-snap]'))
                .map(el => Math.round(el.offsetTop));

        const snapToNearest = () => {
            if (isSnapping) return;
            if (window.innerWidth < 1024) return;
            const points = getSnapPoints();
            if (points.length < 1) return;

            const scroll = window.scrollY;
            const nearest = points.reduce((a, b) =>
                Math.abs(b - scroll) < Math.abs(a - scroll) ? b : a
            );

            if (Math.abs(nearest - scroll) > 8) {
                isSnapping = true;
                window.scrollTo({ top: nearest, behavior: 'smooth' });
                setTimeout(() => { isSnapping = false; }, 900);
            }
        };

        const onScroll = () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(snapToNearest, 180);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            clearTimeout(scrollTimer);
        };
    }, [location.pathname, isServiceDetail]);

    return (
        <div>
            <Navbar />
            <Outlet />
            {!isLanding && !isServiceDetail && (
                <motion.div
                    data-scroll-snap
                    className="lg:sticky lg:top-0 z-[10] bg-background-dark"
                    style={{ boxShadow: sectionShadow }}
                >
                    <CTAFooter />
                </motion.div>
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
