import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import EventList from './pages/EventList';
import EventForm from './pages/EventForm';
import EventDetails from './pages/EventDetails';
import FlyerView from './pages/FlyerView';
import RegistrationForm from './pages/RegistrationForm';
import CheckIn from './pages/CheckIn';

function App() {
  return (
    <AuthProvider>
      <Router basename="/event">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<div className="min-h-screen bg-black text-white"><Login /></div>} />
          <Route path="/register" element={<div className="min-h-screen bg-black text-white"><Register /></div>} />
          <Route path="/admin" element={<div className="min-h-screen bg-black text-white"><AdminDashboard /></div>} />
          <Route path="/events" element={<div className="min-h-screen bg-black text-white"><EventList /></div>} />
          <Route path="/new" element={<div className="min-h-screen bg-black text-white"><EventForm /></div>} />
          <Route path="/:id/edit" element={<div className="min-h-screen bg-black text-white"><EventForm /></div>} />
          <Route path="/:id" element={<div className="min-h-screen bg-black text-white"><EventDetails /></div>} />
          <Route path="/:id/flyer" element={<div className="min-h-screen bg-black text-white"><FlyerView /></div>} />
          <Route path="/:id/register" element={<div className="min-h-screen bg-black text-white"><RegistrationForm /></div>} />
          <Route path="/:id/checkin" element={<div className="min-h-screen bg-black text-white"><CheckIn /></div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
