import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/ScrollToTop';
import NotFound from './pages/errors/NotFound';
import Forbidden from './pages/errors/Forbidden';
import Landing from './pages/Landing';
import About from './pages/About';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import WeddingPlanning from './pages/services/WeddingPlanning';
import BirthdayEvents from './pages/services/BirthdayEvents';
import CorporateEvents from './pages/services/CorporateEvents';
import StageDecoration from './pages/services/StageDecoration';
import LiveMusicDJ from './pages/services/LiveMusicDJ';
import Catering from './pages/services/Catering';

// Admin Imports
import Login from './pages/admin/Login';
import ForgotPassword from './pages/admin/ForgotPassword';
import ResetPassword from './pages/admin/ResetPassword';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Messages from './pages/admin/Messages';
import Events from './pages/admin/Events';
import EventDetails from './pages/admin/EventDetails';
import Users from './pages/admin/Users';
import UserDetails from './pages/admin/UserDetails';
import Profile from './pages/admin/Profile';
import Financials from './pages/admin/Financials';
import StaffFinance from './pages/admin/StaffFinance';
import MyFinance from './pages/admin/MyFinance';
import Assets from './pages/admin/Assets';
import Quotes from './pages/admin/Quotes';
import ServicesAdmin from './pages/admin/ServicesAdmin';
import Settings from './pages/admin/Settings';
import CalendarView from './pages/admin/CalendarView';
import TeamAdmin from './pages/admin/TeamAdmin';
import TravelRates from './pages/admin/TravelRates';
import ProfitSplit from './pages/admin/ProfitSplit';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Landing />} />
              <Route path="about" element={<About />} />
              <Route path="services" element={<Services />} />
              <Route path="services/wedding-planning" element={<WeddingPlanning />} />
              <Route path="services/birthday-events" element={<BirthdayEvents />} />
              <Route path="services/corporate-events" element={<CorporateEvents />} />
              <Route path="services/stage-decoration" element={<StageDecoration />} />
              <Route path="services/live-music-dj" element={<LiveMusicDJ />} />
              <Route path="services/catering" element={<Catering />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin Login (public but redirects if logged in) */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin/reset-password/:uid/:token" element={<ResetPassword />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="messages" element={<Messages />} />
              <Route path="events" element={<Events />} />
              <Route path="events/:id" element={<EventDetails />} />
              <Route path="profile" element={<Profile />} />
              <Route path="financials" element={<Financials />} />
              <Route path="profit-split" element={<ProfitSplit />} />
              <Route path="staff-finance" element={<StaffFinance />} />
              <Route path="my-finance" element={<MyFinance />} />
              <Route path="assets" element={
                <ProtectedRoute requireAssets>
                  <Assets />
                </ProtectedRoute>
              } />
              <Route path="quotes" element={<Quotes />} />
              <Route path="services" element={
                <ProtectedRoute requireSuperUser>
                  <ServicesAdmin />
                </ProtectedRoute>
              } />
              <Route path="settings" element={<Settings />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="users" element={
                <ProtectedRoute requireSuperUser>
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="users/:id" element={
                <ProtectedRoute requireSuperUser>
                  <UserDetails />
                </ProtectedRoute>
              } />
              <Route path="team" element={
                <ProtectedRoute requireSuperUser>
                  <TeamAdmin />
                </ProtectedRoute>
              } />
              <Route path="travel-rates" element={
                <ProtectedRoute requireSuperUser>
                  <TravelRates />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Route>
            {/* Global catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
