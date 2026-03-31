import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from './Navbar';
import CTAFooter from './CTAFooter';

const Layout = () => {
    const location = useLocation();
    const isLanding = location.pathname === '/';
    // Service detail pages (e.g. /services/wedding-planning) are long-form scrolling
    // pages — scroll snap and sticky footer don't apply to them.
    const isServiceDetail = location.pathname.startsWith('/services/');

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
                    <CTAFooter />
                </div>
            )}
        </div>
    );
};

export default Layout;
