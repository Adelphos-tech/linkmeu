import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, LogOut, Users } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();
  const events = useLiveQuery(() => db.events.toArray(), []);
  const users = useLiveQuery(() => db.users.toArray(), []);

  useEffect(() => {
    if (!user || !isSuperAdmin()) {
      navigate('/login');
    }
  }, [user]);

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

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Super Admin Dashboard</h1>
          <p className="text-gray-400">Full system access</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-dark-lighter border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Events</p>
                <p className="text-3xl font-bold text-primary">{events?.length || 0}</p>
              </div>
              <Calendar size={40} className="text-gray-600" />
            </div>
          </div>

          <div className="bg-dark-lighter border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-primary">{users?.length || 0}</p>
              </div>
              <Users size={40} className="text-gray-600" />
            </div>
          </div>

          <div className="bg-dark-lighter border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Event Owners</p>
                <p className="text-3xl font-bold text-primary">
                  {users?.filter(u => u.role === 'owner').length || 0}
                </p>
              </div>
              <Users size={40} className="text-gray-600" />
            </div>
          </div>
        </div>

        {/* All Events */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">All Events</h2>
          {!events || events.length === 0 ? (
            <div className="text-center py-20 bg-dark-lighter rounded-lg border border-gray-800">
              <Calendar size={64} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
              <p className="text-gray-400 mb-6">Create the first event</p>
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
                      <div className="flex items-start justify-between">
                        <div>
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
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                          Owner ID: {event.ownerId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
