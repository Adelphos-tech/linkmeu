import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, LogIn } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format } from 'date-fns';

const PublicEvents = () => {
  const navigate = useNavigate();
  const events = useLiveQuery(() => db.events.toArray(), []);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">EX</span>
            </div>
            <p className="text-xs text-gray-400">EventsX - Powered by Robocorp</p>
          </div>
          <Link
            to="/login"
            className="btn-primary flex items-center gap-2"
          >
            <LogIn size={18} />
            Login
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Public Events</h1>
          <p className="text-gray-400">Browse and register for upcoming events</p>
        </div>

        {!events || events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={64} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Events Available</h2>
            <p className="text-gray-400 mb-6">Check back later for upcoming events</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/event/${event.id}/view`)}
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
                    {event.description && (
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
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

export default PublicEvents;
