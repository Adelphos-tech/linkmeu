import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Main Platform Page - loaded immediately
import MainPage from './pages/MainPage';

// Events Module - lazy loaded to prevent blocking
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EventList = lazy(() => import('./pages/EventList'));
const EventForm = lazy(() => import('./pages/EventForm'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const FlyerView = lazy(() => import('./pages/FlyerView'));
const RegistrationForm = lazy(() => import('./pages/RegistrationForm'));
const CheckIn = lazy(() => import('./pages/CheckIn'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router basename="/">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Main LinkMeU Platform */}
            <Route path="/" element={<MainPage />} />

            {/* Events Module Routes */}
            <Route path="/events" element={<div className="min-h-screen bg-black text-white"><EventList /></div>} />
            <Route path="/events/new" element={<div className="min-h-screen bg-black text-white"><EventForm /></div>} />
            <Route path="/events/landing" element={<LandingPage />} />
            <Route path="/events/login" element={<div className="min-h-screen bg-black text-white"><Login /></div>} />
            <Route path="/events/register" element={<div className="min-h-screen bg-black text-white"><Register /></div>} />
            <Route path="/events/admin" element={<div className="min-h-screen bg-black text-white"><AdminDashboard /></div>} />
            <Route path="/events/:id" element={<div className="min-h-screen bg-black text-white"><EventDetails /></div>} />
            <Route path="/events/:id/edit" element={<div className="min-h-screen bg-black text-white"><EventForm /></div>} />
            <Route path="/events/:id/flyer" element={<div className="min-h-screen bg-black text-white"><FlyerView /></div>} />
            <Route path="/events/:id/register" element={<div className="min-h-screen bg-black text-white"><RegistrationForm /></div>} />
            <Route path="/events/:id/checkin" element={<div className="min-h-screen bg-black text-white"><CheckIn /></div>} />

            {/* Legacy routes - redirect to events */}
            <Route path="/login" element={<Navigate to="/events/login" replace />} />
            <Route path="/register" element={<Navigate to="/events/register" replace />} />
            <Route path="/admin" element={<Navigate to="/events/admin" replace />} />
            <Route path="/new" element={<Navigate to="/events/new" replace />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
