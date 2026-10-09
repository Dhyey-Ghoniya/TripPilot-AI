import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import UserLayout from '../layouts/UserLayout';
import AdminLayout from '../layouts/AdminLayout';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

// Public Pages
import Home from '../pages/public/Home';
import Explore from '../pages/public/Explore';
import Flights from '../pages/public/Flights';
import Hotels from '../pages/public/Hotels';
import About from '../pages/public/About';
import Contact from '../pages/public/Contact';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import DestinationDetails from '../pages/public/DestinationDetails';
import AttractionsExplorer from '../pages/public/AttractionsExplorer';
import AttractionDetails from '../pages/public/AttractionDetails';
import AiPlanner from '../pages/public/AiPlanner';
import NotFound from '../pages/public/NotFound';

// User / Planner Pages
import UserDashboard from '../pages/user/UserDashboard';
import PlanTrip from '../pages/user/PlanTrip';
import MyTrips from '../pages/user/MyTrips';
import TripWorkspace from '../pages/user/TripWorkspace';
import Wishlist from '../pages/user/Wishlist';
import Journal from '../pages/user/Journal';
import Profile from '../pages/user/Profile';
import Settings from '../pages/user/Settings';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminProviders from '../pages/admin/AdminProviders';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminDestinations from '../pages/admin/AdminDestinations';
import AdminAttractions from '../pages/admin/AdminAttractions';
import AdminCollections from '../pages/admin/AdminCollections';
import AdminReports from '../pages/admin/AdminReports';
import AdminTrips from '../pages/admin/AdminTrips';
import AdminHotels from '../pages/admin/AdminHotels';
import AdminRestaurants from '../pages/admin/AdminRestaurants';
import AdminReviews from '../pages/admin/AdminReviews';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminSettings from '../pages/admin/AdminSettings';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/plan-trip" element={<PlanTrip />} />
        <Route path="/ai-planner" element={<AiPlanner />} />
        <Route path="/explore/attractions" element={<AttractionsExplorer />} />
        <Route path="/explore/attractions/:slug" element={<AttractionDetails />} />
        <Route path="/destinations/:slug" element={<DestinationDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Protected User Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<UserLayout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/trips/:id" element={<TripWorkspace />} />
          <Route path="/my-trips/:id" element={<TripWorkspace />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Admin Dashboard Routes */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/providers" element={<AdminProviders />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/destinations" element={<AdminDestinations />} />
          <Route path="/admin/attractions" element={<AdminAttractions />} />
          <Route path="/admin/collections" element={<AdminCollections />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/trips" element={<AdminTrips />} />
          <Route path="/admin/hotels" element={<AdminHotels />} />
          <Route path="/admin/restaurants" element={<AdminRestaurants />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
