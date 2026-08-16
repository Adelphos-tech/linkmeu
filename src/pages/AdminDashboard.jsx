import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, LogOut, Users, Download, FileText, Trash2, RefreshCw, Sparkles, BarChart3, TrendingUp, Eye, ChevronRight, Shield, Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { getAllEvents, getAttendeesByEvent, deleteEvent, getDatabaseStatus, getAllUsers } from '../db/databaseAdapter';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { exportToCSV, prepareAttendeeData } from '../utils/csv';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const eventsData = await getAllEvents();
      setEvents(eventsData || []);
      const usersData = await getAllUsers();
      setUsers(usersData || []);
      const status = await getDatabaseStatus();
      setDbStatus(status);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isSuperAdmin()) {
      navigate('/login');
    } else {
      fetchData();
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
    const confirmed = window.confirm(
      `⚠️ DELETE EVENT?\n\nEvent: ${event.title}\n\nThis will permanently delete the event and all registrations.\n\nThis action CANNOT be undone!`
    );
    
    if (!confirmed) return;

    try {
      await deleteEvent(event.id);
      alert(`✓ Event "${event.title}" has been deleted successfully.`);
      fetchData();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(`❌ Failed to delete event: ${error.message}`);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalEvents: events.length,
    totalUsers: users.length,
    eventOwners: users.filter(u => u.role === 'owner').length,
    superAdmins: users.filter(u => u.role === 'superadmin').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-amber-500/30 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-gray-400 mt-6">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-gray-800/50 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg flex items-center gap-2">
                  Admin Dashboard
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">Super Admin</span>
                </h1>
                <p className="text-gray-500 text-xs">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/events')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-all"
              >
                View Events
              </button>
              <button
                onClick={() => navigate('/new')}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Plus size={18} />
                New Event
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-all"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-500" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.totalEvents}</p>
            <p className="text-gray-500 text-sm">Total Events</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</p>
            <p className="text-gray-500 text-sm">Total Users</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.eventOwners}</p>
            <p className="text-gray-500 text-sm">Event Owners</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.superAdmins}</p>
            <p className="text-gray-500 text-sm">Super Admins</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-800/50 pb-4">
          {['overview', 'events', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {tab}
            </button>
          ))}
          <div className="flex-1"></div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50 w-64"
            />
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 rounded-lg transition-all"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Events */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-700/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Events & Reports
                </h2>
                <p className="text-gray-500 text-sm mt-1">Export registration and attendance data</p>
              </div>
              
              {events.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No events yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {events.slice(0, 5).map((event) => (
                    <EventRow key={event.id} event={event} onExportRegistered={handleExportRegistered} onExportAttended={handleExportAttended} onDelete={handleDeleteEvent} onView={() => navigate(`/${event.id}`)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">All Events</h2>
                <p className="text-gray-500 text-sm">{filteredEvents.length} events</p>
              </div>
            </div>
            
            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No events found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/50">
                {filteredEvents.map((event) => (
                  <EventRow key={event.id} event={event} onExportRegistered={handleExportRegistered} onExportAttended={handleExportAttended} onDelete={handleDeleteEvent} onView={() => navigate(`/${event.id}`)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-700/50">
              <h2 className="text-lg font-semibold text-white">All Users</h2>
              <p className="text-gray-500 text-sm">{filteredUsers.length} users</p>
            </div>
            
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/50">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-gray-700/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{user.email}</p>
                        <p className="text-gray-500 text-sm">{user.contact || 'No contact'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'superadmin' 
                          ? 'bg-amber-500/20 text-amber-400' 
                          : user.role === 'owner'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Database Status */}
        {dbStatus && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Database: {dbStatus.mode === 'api' ? '☁️ API Backend' : '💾 Local'} 
              {dbStatus.connected ? ' • Connected' : ' • Disconnected'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

// Event Row Component
const EventRow = ({ event, onExportRegistered, onExportAttended, onDelete, onView }) => {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendees = async () => {
      try {
        const data = await getAttendeesByEvent(event.id);
        setAttendees(data || []);
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
    <div className="p-4 hover:bg-gray-700/20 transition-all">
      <div className="flex items-center gap-4">
        {/* Event Image */}
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
          {event.image || event.logo ? (
            <img src={event.image || event.logo} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-gray-600" />
            </div>
          )}
        </div>

        {/* Event Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{event.title}</h3>
          <div className="flex items-center gap-4 mt-1 text-sm">
            {event.startDate && (
              <span className="text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(event.startDate), 'MMM d, yyyy')}
              </span>
            )}
            {loading ? (
              <span className="text-gray-500">Loading...</span>
            ) : (
              <>
                <span className="text-amber-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {registeredCount} registered
                </span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {attendedCount} attended
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExportRegistered(event)}
            disabled={loading || registeredCount === 0}
            className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
          <button
            onClick={onView}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
          <button
            onClick={() => onDelete(event)}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
