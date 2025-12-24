import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Calendar, MapPin, LogIn, LogOut, Share2, Check } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format, isToday, isFuture, isPast, startOfDay } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const EventList = () => {
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();
  const allEvents = useLiveQuery(() => db.events.toArray(), []);
  const [copiedId, setCopiedId] = useState(null);

  // Sort events: Today's first, then upcoming, then past
  const events = allEvents ? [...allEvents].sort((a, b) => {
    // Handle missing dates
    if (!a.startDate && !b.startDate) return 0;
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    
    // Check for invalid dates
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    const isAToday = isToday(dateA);
    const isBToday = isToday(dateB);
    const isAFuture = isFuture(dateA);
    const isBFuture = isFuture(dateB);
    
    // Today's events first
    if (isAToday && !isBToday) return -1;
    if (!isAToday && isBToday) return 1;
    
    // Then upcoming events
    if (isAFuture && !isBFuture && !isBToday) return -1;
    if (!isAFuture && isBFuture && !isAToday) return 1;
    
    // Within same category, sort by date (ascending for future, descending for past)
    if (isAFuture && isBFuture) return dateA - dateB;
    if (!isAFuture && !isBFuture && !isAToday && !isBToday) return dateB - dateA;
    
    return dateA - dateB;
  }) : [];

  const handleLogout = () => {
    logout();
    navigate('/events');
  };

  const handleCopyLink = (eventId, e) => {
    e.stopPropagation(); // Prevent navigation when clicking share button
    const eventUrl = `${window.location.origin}/event/${eventId}`;
    navigator.clipboard.writeText(eventUrl);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getEventDateLabel = (eventDate) => {
    if (isToday(new Date(eventDate))) {
      return <span className="text-green-500 font-semibold">Today</span>;
    } else if (isFuture(new Date(eventDate))) {
      return <span className="text-blue-500">Upcoming</span>;
    } else {
      return <span className="text-gray-500">Past</span>;
    }
  };

  const getRightAction = () => {
    if (isSuperAdmin()) {
      return (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="btn-secondary flex items-center gap-2"
          >
            Admin Panel
          </button>
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
          </button>
        </div>
      );
    }

    // For public and event owners - same interface
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Event
        </button>
        {user && (
          <button
            onClick={handleLogout}
            className="btn-secondary flex items-center gap-2"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    );
  };

  // Show loading state while events are being fetched
  if (allEvents === undefined) {
    return (
      <div className="min-h-screen bg-black">
        <Header rightAction={getRightAction()} />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header rightAction={getRightAction()} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {isSuperAdmin() ? 'All Events - Admin View' : 'Events'}
          </h1>
          <p className="text-gray-400">
            {user ? (
              <>
                Welcome back, {user.email}
                {isSuperAdmin() && <span className="text-primary ml-2">(Super Admin)</span>}
              </>
            ) : (
              'Browse, create, and register for events'
            )}
          </p>
        </div>

        {events.length === 0 ? (
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
                  {/* Event Image/Logo - Left Side */}
                  <div className="flex-shrink-0">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : event.logo ? (
                      <img
                        src={event.logo}
                        alt={event.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-dark-light rounded flex items-center justify-center">
                        <Calendar size={32} className="text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Event Details - Center */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold truncate">{event.title}</h3>
                      {event.startDate && getEventDateLabel(event.startDate)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-400">
                      {event.startDate && event.endDate && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          {(() => {
                            try {
                              return event.startDate === event.endDate ? 
                                format(new Date(event.startDate), 'PPP') :
                                `${format(new Date(event.startDate), 'PPP')} - ${format(new Date(event.endDate), 'PPP')}`;
                            } catch (error) {
                              return `${event.startDate} - ${event.endDate}`;
                            }
                          })()}
                        </div>
                      )}
                      {event.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Share Button - Right Side */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={(e) => handleCopyLink(event.id, e)}
                      className="p-2 bg-dark-light rounded-full hover:bg-gray-700 transition-colors"
                      title="Copy event link"
                    >
                      {copiedId === event.id ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <Share2 size={18} className="text-gray-400" />
                      )}
                    </button>
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

export default EventList;
