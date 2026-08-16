import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import MainPage from './pages/MainPage';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterListing from './pages/RegisterListing';
import AdminDashboard from './pages/AdminDashboard';
import EventList from './pages/EventList';
import EventForm from './pages/EventForm';
import EventDetails from './pages/EventDetails';
import FlyerView from './pages/FlyerView';
import RegistrationForm from './pages/RegistrationForm';
import CheckIn from './pages/CheckIn';
import ListingsAdmin from './pages/ListingsAdmin';
import ListingsLogin from './pages/ListingsLogin';
import ListingDetail from './pages/ListingDetail';
import Membership from './pages/Membership';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Router basename="/">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/register-listing" element={<RegisterListing />} />
          <Route path="/listing/:listingId" element={<ListingDetail />} />
          <Route path="/login" element={<div className="min-h-screen bg-black text-white"><Login /></div>} />
          <Route path="/register" element={<div className="min-h-screen bg-black text-white"><Register /></div>} />
          <Route path="/admin" element={<div className="min-h-screen bg-black text-white"><AdminDashboard /></div>} />
          <Route path="/listings-admin" element={<ListingsAdmin />} />
          <Route path="/listings-login" element={<ListingsLogin />} />
          <Route path="/events" element={<div className="min-h-screen bg-black text-white"><EventList /></div>} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/new" element={<EventForm />} />
          <Route path="/:id/edit" element={<EventForm />} />
          <Route path="/:id" element={<div className="min-h-screen bg-black text-white"><EventDetails /></div>} />
          <Route path="/:id/flyer" element={<div className="min-h-screen bg-black text-white"><FlyerView /></div>} />
          <Route path="/:id/register" element={<div className="min-h-screen bg-black text-white"><RegistrationForm /></div>} />
          <Route path="/:id/checkin" element={<div className="min-h-screen bg-black text-white"><CheckIn /></div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
