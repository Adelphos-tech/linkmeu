import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, LogOut, Users, Download, FileText, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getAttendeesByEvent, deleteEvent } from '../db/database';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { exportToCSV, prepareAttendeeData } from '../utils/csv';

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

  const handleExportRegistered = async (event) => {
    try {
      const attendees = await getAttendeesByEvent(event.id);
      if (attendees.length === 0) {
        alert('No registrations found for this event');
        return;
      }
      const data = prepareAttendeeData(attendees);
      exportToCSV(data, `${event.title}-registered-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export registration list');
    }
  };

  const handleExportAttended = async (event) => {
    try {
      const attendees = await getAttendeesByEvent(event.id);
      const attended = attendees.filter(a => a.attended);
      if (attended.length === 0) {
        alert('No attendance records found for this event');
        return;
      }
      const data = prepareAttendeeData(attended, true);
      exportToCSV(data, `${event.title}-attended-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export attendance list');
    }
  };

  const handleDeleteEvent = async (event) => {
    // Double confirmation for safety
    const confirmed = window.confirm(
      `⚠️ DELETE EVENT?\n\nEvent: ${event.title}\n\nThis will permanently delete:\n- The event\n- All registrations (${event.attendeeCount || 0} people)\n- All attendance records\n\nThis action CANNOT be undone!\n\nAre you sure?`
    );
    
    if (!confirmed) return;

    // Second confirmation
    const doubleConfirm = window.confirm(
      `🚨 FINAL CONFIRMATION\n\nYou are about to delete "${event.title}"\n\nClick OK to permanently delete this event.`
    );

    if (!doubleConfirm) return;

    try {
      await deleteEvent(event.id);
      alert(`✓ Event "${event.title}" has been deleted successfully.`);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(`Failed to delete event: ${error.message}`);
    }
  };

  // Show loading state
  if (!events || !users) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

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

        {/* Registration & Attendance Reports */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText size={24} className="text-primary" />
                Registration & Attendance Reports
              </h2>
              <p className="text-sm text-gray-400 mt-1">Export registration and attendance lists for all events</p>
            </div>
          </div>

          {!events || events.length === 0 ? (
            <div className="text-center py-12 bg-dark-lighter rounded-lg border border-gray-800">
              <FileText size={48} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No events available for reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const EventReportRow = ({ event }) => {
                  const [attendees, setAttendees] = useState([]);
                  const [loading, setLoading] = useState(true);

                  useEffect(() => {
                    const loadAttendees = async () => {
                      try {
                        const data = await getAttendeesByEvent(event.id);
                        setAttendees(data);
                      } catch (error) {
                        console.error('Error loading attendees:', error);
                      } finally {
                        setLoading(false);
                      }
                    };
                    loadAttendees();
                  }, [event.id]);

                  const registeredCount = attendees.length;
                  const attendedCount = attendees.filter(a => a.attended).length;

                  return (
                    <div className="bg-dark-lighter border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{event.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {event.startDate && format(new Date(event.startDate), 'PPP')}
                            </div>
                            {loading ? (
                              <span>Loading...</span>
                            ) : (
                              <>
                                <span className="text-primary font-medium">{registeredCount} Registered</span>
                                <span className="text-green-500 font-medium">{attendedCount} Attended</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleExportRegistered(event)}
                            disabled={loading || registeredCount === 0}
                            className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Export Registration List"
                          >
                            <Download size={16} />
                            Registration
                          </button>
                          <button
                            onClick={() => handleExportAttended(event)}
                            disabled={loading || attendedCount === 0}
                            className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Export Attendance List"
                          >
                            <Download size={16} />
                            Attendance
                          </button>
                          <button
                            onClick={() => navigate(`/${event.id}`)}
                            className="btn-primary px-4 py-2 text-sm"
                            title="View Event Details"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent({ ...event, attendeeCount: registeredCount });
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm rounded flex items-center gap-2"
                            title="Delete Event"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                };

                return <EventReportRow key={event.id} event={event} />;
              })}
            </div>
          )}
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            Owner ID: {event.ownerId}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded flex items-center gap-1"
                            title="Delete Event"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
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
