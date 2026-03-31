import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/ScrollToTop';
import Landing from './pages/Landing';
import About from './pages/About';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import WeddingPlanning from './pages/services/WeddingPlanning';

// Admin Imports
import Login from './pages/admin/Login';
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
import Assets from './pages/admin/Assets';
import Quotes from './pages/admin/Quotes';
import ServicesAdmin from './pages/admin/ServicesAdmin';
import Settings from './pages/admin/Settings';
import CalendarView from './pages/admin/CalendarView';
import TeamAdmin from './pages/admin/TeamAdmin';
import TravelRates from './pages/admin/TravelRates';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Landing />} />
              <Route path="about" element={<About />} />
              <Route path="services" element={<Services />} />
              <Route path="services/wedding-planning" element={<WeddingPlanning />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="contact" element={<Contact />} />
            </Route>

            {/* Admin Login (public but redirects if logged in) */}
            <Route path="/admin/login" element={<Login />} />

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
              <Route path="staff-finance" element={<StaffFinance />} />
              <Route path="assets" element={<Assets />} />
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
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
