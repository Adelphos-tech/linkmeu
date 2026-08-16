import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, QrCode, FileText, UserCheck, Download, Share2, Copy, Calendar, MapPin, Users, Clock, ChevronRight, ArrowLeft, Check, Sparkles, Image, ExternalLink } from 'lucide-react';
import { getEvent, getAttendeesByEvent } from '../db/databaseAdapter';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { exportToCSV, prepareAttendeeData } from '../utils/csv';
import { generateQRCode, generateRegistrationURL } from '../utils/qrcode';
import { isToday, parseISO, isFuture, isPast } from 'date-fns';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, canEditEvent, isSuperAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [activeTab, setActiveTab] = useState('event');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Check if check-in is allowed (only on event day) - Customer feedback
  const isCheckInAllowed = () => {
    if (!event?.startDate) return false;
    try {
      const eventDate = parseISO(event.startDate);
      return isToday(eventDate);
    } catch (error) {
      console.error('Error parsing event date:', error);
      return false;
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const eventData = await getEvent(parseInt(id));
      
      if (!eventData) {
        setError(`Event with ID ${id} not found. This event may not exist or may have been created on a different device.`);
        setLoading(false);
        return;
      }
      
      setEvent(eventData);
      
      const attendeeData = await getAttendeesByEvent(parseInt(id));
      setAttendees(attendeeData);
      
      // Generate QR code for registration
      try {
        const registrationURL = generateRegistrationURL(id);
        const qrCode = await generateQRCode(registrationURL);
        setQrCodeDataURL(qrCode);
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load event data. Please try again.');
      setLoading(false);
    }
  };

  const handleExportRegistered = () => {
    if (!isSuperAdmin()) {
      alert('Export feature is only available for Super Admin. Please contact Robocorpsg@gmail.com');
      return;
    }
    const data = prepareAttendeeData(attendees);
    exportToCSV(data, `${event.title}-registered.csv`);
  };

  const handleExportAttended = () => {
    if (!isSuperAdmin()) {
      alert('Export feature is only available for Super Admin. Please contact Robocorpsg@gmail.com');
      return;
    }
    const attended = attendees.filter(a => a.attended);
    const data = prepareAttendeeData(attended, true);
    exportToCSV(data, `${event.title}-attended.csv`);
  };

  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEventStatus = () => {
    if (!event?.startDate) return { label: 'No Date', color: 'gray' };
    const date = new Date(event.startDate);
    if (isToday(date)) return { label: 'Today', color: 'emerald', bg: 'bg-emerald-500' };
    if (isFuture(date)) return { label: 'Upcoming', color: 'blue', bg: 'bg-blue-500' };
    return { label: 'Past', color: 'gray', bg: 'bg-gray-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-6">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Event Not Found</h1>
          <p className="text-gray-400 mb-8">{error || 'This event does not exist'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/events')} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all">
              View All Events
            </button>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-all">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = getEventStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Decorative */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-gray-800/50 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Back</span>
              </button>
              {/* LinkMeU Logo */}
              <div className="hidden sm:flex items-center cursor-pointer border-l border-gray-700 pl-4" onClick={() => navigate('/')}>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-white">Link</span>
                  <span className="text-lg font-bold text-red-500">Me</span>
                  <span className="text-lg font-bold text-white">U</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {canEditEvent(event?.ownerId) && (
                <button onClick={() => navigate(`/${id}/edit`)} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all">
                  <Edit size={18} />
                </button>
              )}
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/${id}`)}
                className="p-2 sm:px-4 sm:py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all flex items-center gap-2"
              >
                {copied ? <Check size={18} className="text-green-400" /> : <Share2 size={18} />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="mb-6 sm:mb-8">
          {/* Event Image */}
          {(event.image || event.logo) ? (
            <div 
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-6 cursor-pointer"
              onClick={() => setShowImageModal(true)}
            >
              <img
                src={event.image || event.logo}
                alt={event.title}
                className="w-full h-48 sm:h-64 md:h-80 object-cover hover:scale-105 transition-transform duration-300"
              />
              {/* Gradient overlay - pointer-events-none to allow clicks through */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent pointer-events-none"></div>
              
              {/* Tap to view hint */}
              <div className="absolute top-4 right-4 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-white text-xs flex items-center gap-1 pointer-events-none">
                <ExternalLink size={12} />
                Tap to view
              </div>
              
              {/* Status Badge */}
              <div className="absolute top-4 left-4 pointer-events-none">
                <span className={`px-3 py-1.5 ${status.bg}/90 backdrop-blur-sm text-white text-xs sm:text-sm font-medium rounded-full flex items-center gap-2`}>
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  {status.label}
                </span>
              </div>

              {/* Event Info Overlay - pointer-events-none to allow clicks through */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pointer-events-none">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 line-clamp-2">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-gray-300 text-sm sm:text-base">
                  {event.startDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={16} />
                      {format(new Date(event.startDate), 'EEE, MMM d, yyyy')}
                    </span>
                  )}
                  {event.venue && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={16} />
                      <span className="truncate max-w-[150px] sm:max-w-none">{event.venue}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <span className={`inline-flex px-3 py-1.5 ${status.bg} text-white text-xs sm:text-sm font-medium rounded-full items-center gap-2 mb-4`}>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                {status.label}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-gray-400">
                {event.startDate && (
                  <span className="flex items-center gap-1.5 text-sm sm:text-base">
                    <Calendar size={16} />
                    {format(new Date(event.startDate), 'EEE, MMM d, yyyy')}
                  </span>
                )}
                {event.venue && (
                  <span className="flex items-center gap-1.5 text-sm sm:text-base">
                    <MapPin size={16} />
                    {event.venue}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4">
              <Users className="w-5 h-5 text-red-400 mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{attendees.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">Registered</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4">
              <UserCheck className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{attendees.filter(a => a.attended).length}</p>
              <p className="text-xs sm:text-sm text-gray-500">Attended</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4">
              <Clock className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{event.capacity || '∞'}</p>
              <p className="text-xs sm:text-sm text-gray-500">Capacity</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4">
              <Sparkles className="w-5 h-5 text-amber-400 mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">
                {event.capacity ? Math.round((attendees.length / event.capacity) * 100) : 0}%
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Filled</p>
            </div>
          </div>

          {/* Register CTA */}
          <div className="bg-gradient-to-r from-red-600/20 to-red-900/20 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">Join This Event</h3>
                <p className="text-gray-400 text-sm sm:text-base">
                  {attendees.length} people already registered
                  {event.capacity && attendees.length >= parseInt(event.capacity) && 
                    <span className="text-amber-400 ml-2">(Full but open)</span>
                  }
                </p>
              </div>
              <button
                onClick={() => navigate(`/${id}/register`)}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-semibold text-base sm:text-lg transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
              >
                <UserCheck size={20} />
                Register Now
              </button>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {event.description && (
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-3">About This Event</h3>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{event.description}</p>
              </div>
            )}

            {/* Event Details */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Event Details</h3>
              <div className="space-y-4">
                {event.startDate && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Date & Time</p>
                      <p className="text-gray-400 text-sm">
                        {event.startDate === event.endDate 
                          ? format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')
                          : `${format(new Date(event.startDate), 'MMM d')} - ${format(new Date(event.endDate), 'MMM d, yyyy')}`
                        }
                      </p>
                    </div>
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Location</p>
                      <p className="text-gray-400 text-sm">{event.venue}</p>
                    </div>
                  </div>
                )}
                {event.capacity && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Capacity</p>
                      <p className="text-gray-400 text-sm">{attendees.length} / {event.capacity} registered</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Organisers */}
            {event.organisers && event.organisers.length > 0 && (
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Organisers</h3>
                <div className="space-y-3">
                  {event.organisers.map((org, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">{org.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{org.name}</p>
                        {org.detail && <p className="text-gray-400 text-sm">{org.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speakers */}
            {event.speakers && event.speakers.length > 0 && (
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Speakers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.speakers.map((speaker, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                      {speaker.photo ? (
                        <img src={speaker.photo} alt={speaker.name} className="w-12 h-12 object-cover rounded-full" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">{speaker.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium text-sm">{speaker.name}</p>
                        {speaker.title && <p className="text-gray-400 text-xs">{speaker.title}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-red-400" />
                Quick Register
              </h3>
              <p className="text-gray-400 text-sm mb-4">Scan to register instantly</p>
              
              <div className="flex justify-center mb-4">
                {qrCodeDataURL ? (
                  <div className="bg-white p-3 rounded-xl">
                    <img src={qrCodeDataURL} alt="QR Code" className="w-32 h-32 sm:w-40 sm:h-40" />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-gray-800 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => copyToClipboard(generateRegistrationURL(id))}
                  className="w-full px-4 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                {qrCodeDataURL && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `${event.title}-qr.png`;
                      link.href = qrCodeDataURL;
                      link.click();
                    }}
                    className="w-full px-4 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download QR
                  </button>
                )}
              </div>
            </div>

            {/* Share */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-400" />
                Share Event
              </h3>
              <p className="text-gray-400 text-sm mb-4">Invite others to join</p>
              <div className="bg-gray-900/50 rounded-lg p-3 mb-3 break-all">
                <p className="text-gray-300 text-xs font-mono">{window.location.origin}/{id}</p>
              </div>
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/${id}`)}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Event Link'}
              </button>
            </div>

            {/* Admin Actions */}
            {isSuperAdmin() && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-3">Admin Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/${id}/flyer`)}
                    className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <FileText size={16} />
                    View Flyer
                  </button>
                  {isCheckInAllowed() && (
                    <button
                      onClick={() => navigate(`/${id}/checkin`)}
                      className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <UserCheck size={16} />
                      Check-in (Today)
                    </button>
                  )}
                  <button
                    onClick={handleExportRegistered}
                    disabled={attendees.length === 0}
                    className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download size={16} />
                    Export List
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {showImageModal && (event.image || event.logo) && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          {/* Close button */}
          <button 
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          {/* Image */}
          <img
            src={event.image || event.logo}
            alt={event.title}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Tap anywhere to close hint */}
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            Tap anywhere to close
          </p>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
