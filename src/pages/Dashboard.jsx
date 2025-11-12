import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, LogOut } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getEventsByOwner } from '../db/database';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    if (user) {
      const userEvents = await getEventsByOwner(user.id);
      setEvents(userEvents);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black">
      <Header
        rightAction={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/new')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              New Event
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Events</h1>
          <p className="text-gray-400">Welcome back, {user?.email}</p>
        </div>

        {!events || events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={64} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Events Yet</h2>
            <p className="text-gray-400 mb-6">Create your first event to get started</p>
            <button
              onClick={() => navigate('/new')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/${event.id}`)}
                className="bg-dark-lighter border border-gray-800 rounded-lg p-5 cursor-pointer hover:border-primary transition-colors"
              >
                <div className="flex items-start gap-4">
                  {event.logo && (
                    <img
                      src={event.logo}
                      alt={event.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                    <div className="space-y-1 text-sm text-gray-400">
                      {event.date && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          {format(new Date(event.date), 'PPP')}
                        </div>
                      )}
                      {event.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          {event.venue}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
