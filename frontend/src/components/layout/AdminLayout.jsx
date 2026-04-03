import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, CalendarDays, DollarSign, FileText, Settings, LogOut, Mail, Users, User, Briefcase, UsersRound, Menu, X, Map, PieChart, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Close menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Determine the navigation order based on user roles and permissions
    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Calendar', path: '/admin/calendar', icon: <CalendarDays size={20} /> },
        { name: 'Messages', path: '/admin/messages', icon: <Mail size={20} /> },
        { name: 'Events', path: '/admin/events', icon: <Calendar size={20} /> },
        { name: 'Quotes', path: '/admin/quotes', icon: <FileText size={20} /> },
    ];

    if (user?.is_superuser || user?.can_view_financials) {
        navItems.push({ name: 'Financials', path: '/admin/financials', icon: <DollarSign size={20} /> });
        navItems.push({ name: 'Staff Finance', path: '/admin/staff-finance', icon: <Wallet size={20} /> });
        navItems.push({ name: 'Assets', path: '/admin/assets', icon: <PieChart size={20} /> });
    }

    if (user?.is_superuser) {
        navItems.push({ name: 'Services', path: '/admin/services', icon: <Briefcase size={20} /> });
        navItems.push({ name: 'Users', path: '/admin/users', icon: <Users size={20} /> });
        navItems.push({ name: 'Team', path: '/admin/team', icon: <UsersRound size={20} /> });
        navItems.push({ name: 'Travel Rates', path: '/admin/travel-rates', icon: <Map size={20} /> });
    }

    navItems.push({ name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> });

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const profilePicture = user?.profile_picture || null;

    return (
        <div className="flex h-screen bg-gradient-to-br from-[#071212] via-[#091818] to-[#071212] overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="w-72 bg-black/35 backdrop-blur-xl border-r border-white/10 hidden md:flex flex-col flex-shrink-0 z-20">
                {/* Logo Area */}
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        Crystal <span className="text-mustard-gold">Events</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Admin Panel</p>
                </div>

                {/* User Profile Card in Sidebar */}
                <Link to="/admin/profile" className="mx-4 mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center space-x-3 hover:bg-white/[0.05] transition-all group">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-mustard-gold to-deep-teal flex items-center justify-center flex-shrink-0">
                        {profilePicture ? (
                            <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-bold text-white">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {user?.designation || (user?.is_superuser ? 'Super Admin' : 'Staff')}
                        </p>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 mt-2 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path === '/admin/dashboard' && location.pathname === '/admin');
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-mustard-gold/20 to-mustard-gold/5 text-mustard-gold border border-mustard-gold/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                    }`}
                            >
                                {item.icon}
                                <span className="text-sm font-medium">{item.name}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-mustard-gold" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 text-gray-400 hover:text-red-400 w-full px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all"
                    >
                        <LogOut size={20} />
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Drawer Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="fixed inset-y-0 left-0 w-72 bg-[#071212] border-r border-white/10 flex flex-col z-50 md:hidden shadow-2xl"
                        >
                            {/* Logo Area & Close Button */}
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">
                                        Crystal <span className="text-mustard-gold">Events</span>
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Admin Panel</p>
                                </div>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* User Profile Card */}
                            <Link to="/admin/profile" className="mx-4 mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center space-x-3 hover:bg-white/[0.05] transition-all">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-mustard-gold to-deep-teal flex items-center justify-center flex-shrink-0">
                                    {profilePicture ? (
                                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-bold text-white">
                                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-white truncate">
                                        {user?.first_name} {user?.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {user?.designation || (user?.is_superuser ? 'Super Admin' : 'Staff')}
                                    </p>
                                </div>
                            </Link>

                            {/* Navigation */}
                            <nav className="flex-1 overflow-y-auto p-4 mt-2 space-y-1">
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.path ||
                                        (item.path === '/admin/dashboard' && location.pathname === '/admin');
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                                ? 'bg-gradient-to-r from-mustard-gold/20 to-mustard-gold/5 text-mustard-gold border border-mustard-gold/20'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                                }`}
                                        >
                                            {item.icon}
                                            <span className="text-sm font-medium">{item.name}</span>
                                            {isActive && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-mustard-gold" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Logout Button */}
                            <div className="p-4 border-t border-white/10">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-3 text-gray-400 hover:text-red-400 w-full px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all"
                                >
                                    <LogOut size={20} />
                                    <span className="text-sm font-medium">Log Out</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto w-full relative">
                {/* Top Bar */}
                <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#071212]/80 border-b border-white/10 px-4 md:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                    <div className="hidden md:block">
                        <p className="text-gray-400 text-sm">
                            {new Date().toLocaleDateString('en-IE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link to="/admin/profile" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                            <User size={18} />
                            <span className="text-sm hidden sm:inline">Profile</span>
                        </Link>
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
