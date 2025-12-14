import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, QrCode, FileText, UserCheck, Download, Share2, Copy } from 'lucide-react';
import { getEvent, getAttendeesByEvent } from '../db/database';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import TabNavigation from '../components/TabNavigation';
import { exportToCSV, prepareAttendeeData } from '../utils/csv';
import { generateQRCode, generateRegistrationURL } from '../utils/qrcode';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/events')}
              className="btn-primary w-full"
            >
              View All Events
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary w-full"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">No event data available</p>
      </div>
    );
  }

  // Only show Check-in tab for super admin - Customer feedback: admin only access
  const tabs = [
    { id: 'event', label: 'Event' },
    { id: 'details', label: 'Details' },
    { id: 'flyer', label: 'Flyer' },
    ...(isSuperAdmin() ? [{ id: 'checkin', label: 'Check-in (Admin Only)' }] : []),
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header
        showBack
        rightAction={
          canEditEvent(event?.ownerId) ? (
            <button
              onClick={() => navigate(`/${id}/edit`)}
              className="text-white hover:text-gray-300"
            >
              <Edit size={20} />
            </button>
          ) : null
        }
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Event Header with Image/Logo */}
        {(event.image || event.logo) && (
          <div className="mb-6">
            {event.image && (
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <div className="flex items-center gap-4">
              {event.logo && !event.image && (
                <img
                  src={event.logo}
                  alt="Logo"
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{event.title}</h1>
                {event.date && (
                  <p className="text-gray-400 mt-1">
                    {format(new Date(event.date), 'PPP')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {!event.image && !event.logo && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            {event.date && (
              <p className="text-gray-400 mt-1">
                {format(new Date(event.date), 'PPP')}
              </p>
            )}
          </div>
        )}

        {/* Shareable Link Section */}
        <div className="mb-6 bg-blue-900/20 border border-blue-500 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Share2 size={20} className="text-blue-500" />
            Share This Event
          </h3>
          <p className="text-sm text-gray-400 mb-4">Copy and share this link to invite people</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-dark-light border border-gray-700 rounded-lg px-4 py-3 font-mono text-sm text-gray-300 overflow-x-auto">
              {window.location.origin}/event/{id}
            </div>
            <button
              onClick={() => {
                const link = `${window.location.origin}/event/${id}`;
                navigator.clipboard.writeText(link);
                alert('✓ Link copied to clipboard!');
              }}
              className="btn-primary flex items-center gap-2 px-6 py-3 whitespace-nowrap"
            >
              <Copy size={18} />
              Copy Link
            </button>
          </div>
        </div>

        {/* Prominent Register Button */}
        <div className="mb-6 bg-primary/10 border border-primary rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Join This Event</h3>
              <p className="text-gray-400 flex items-center gap-2">
                <UserCheck size={18} />
                {attendees.length} people registered
              </p>
            </div>
            <button
              onClick={() => navigate(`/${id}/register`)}
              className="btn-primary flex items-center gap-2 px-8 py-4 text-lg"
            >
              <UserCheck size={24} />
              Register Now
            </button>
          </div>
        </div>

        {/* QR Code Section - Always Visible */}
        <div className="mb-6 bg-dark-lighter rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <QrCode size={20} className="text-primary" />
            Quick Registration
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Scan this QR code with your phone to register instantly
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {qrCodeDataURL ? (
              <div className="flex-shrink-0">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img 
                    src={qrCodeDataURL} 
                    alt="Registration QR Code" 
                    className="w-32 h-32 md:w-40 md:h-40"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-gray-400">Loading...</p>
                </div>
              </div>
            )}
            
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm text-gray-300 mb-3">
                Or copy this registration link:
              </p>
              <div className="bg-dark-light border border-gray-700 rounded-lg px-4 py-3 font-mono text-sm text-gray-300 mb-3 break-all">
                {generateRegistrationURL(id)}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    const link = generateRegistrationURL(id);
                    navigator.clipboard.writeText(link);
                    alert('✓ Registration link copied to clipboard!');
                  }}
                  className="btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  <Copy size={16} />
                  Copy Link
                </button>
                {qrCodeDataURL && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `${event.title}-registration-qr.png`;
                      link.href = qrCodeDataURL;
                      link.click();
                    }}
                    className="btn-secondary flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={16} />
                    Download QR
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'event' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Event date</label>
              <p className="text-white">{event.date ? format(new Date(event.date), 'yyyy-MM-dd') : '-'}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <p className="text-white">{event.title}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Desc</label>
              <p className="text-white">{event.description || '-'}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Venue</label>
              <p className="text-white">{event.venue || '-'}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Organiser name</label>
              {event.organisers && event.organisers.length > 0 ? (
                <div className="space-y-2">
                  {event.organisers.map((org, idx) => (
                    <div key={idx} className="bg-dark-lighter p-3 rounded">
                      <p className="text-white">{org.name}</p>
                      {org.detail && <p className="text-sm text-gray-400">{org.detail}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white">-</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Logo</label>
              {event.logo ? (
                <img src={event.logo} alt="Logo" className="w-24 h-24 object-cover rounded" />
              ) : (
                <p className="text-white">No file chosen</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Event Image</label>
              {event.image ? (
                <img src={event.image} alt="Event" className="w-full max-w-md rounded" />
              ) : (
                <p className="text-white">No file chosen</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            {event.guestsOfHonour && event.guestsOfHonour.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Guests of Honour</h3>
                <div className="grid gap-3">
                  {event.guestsOfHonour.map((guest, idx) => (
                    <div key={idx} className="bg-dark-lighter p-4 rounded flex items-center gap-4">
                      {guest.photo && (
                        <img src={guest.photo} alt={guest.name} className="w-16 h-16 object-cover rounded-full" />
                      )}
                      <div>
                        <p className="font-medium">{guest.name}</p>
                        {guest.title && <p className="text-sm text-gray-400">{guest.title}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.speakers && event.speakers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Speakers</h3>
                <div className="grid gap-3">
                  {event.speakers.map((speaker, idx) => (
                    <div key={idx} className="bg-dark-lighter p-4 rounded flex items-center gap-4">
                      {speaker.photo && (
                        <img src={speaker.photo} alt={speaker.name} className="w-16 h-16 object-cover rounded-full" />
                      )}
                      <div>
                        <p className="font-medium">{speaker.name}</p>
                        {speaker.title && <p className="text-sm text-gray-400">{speaker.title}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.sponsors && event.sponsors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Sponsors</h3>
                <div className="grid grid-cols-2 gap-3">
                  {event.sponsors.map((sponsor, idx) => (
                    <div key={idx} className="bg-dark-lighter p-4 rounded text-center">
                      {sponsor.logo && (
                        <img src={sponsor.logo} alt={sponsor.name} className="w-20 h-20 object-contain mx-auto mb-2" />
                      )}
                      <p className="text-sm">{sponsor.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.media && event.media.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Media Partners</h3>
                <div className="grid grid-cols-2 gap-3">
                  {event.media.map((media, idx) => (
                    <div key={idx} className="bg-dark-lighter p-4 rounded text-center">
                      {media.logo && (
                        <img src={media.logo} alt={media.name} className="w-20 h-20 object-contain mx-auto mb-2" />
                      )}
                      <p className="text-sm">{media.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'flyer' && (
          <div className="space-y-4">
            <button
              onClick={() => navigate(`/${id}/flyer`)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              View & Download Flyer
            </button>
            <button
              onClick={() => navigate(`/${id}/register`)}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <QrCode size={20} />
              Registration Page
            </button>
            <div className="bg-dark-lighter rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400">
                💡 The QR code for registration is now available on the main event page above
              </p>
            </div>
          </div>
        )}

        {activeTab === 'checkin' && (
          <div className="space-y-4">
            {/* Admin Only Warning */}
            <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-black text-xs font-bold">!</span>
                </div>
                <h3 className="font-semibold text-yellow-400">Admin Only Access</h3>
              </div>
              <p className="text-sm text-gray-300">
                Check-in and export functions are restricted to Super Admin users only.
                Regular users cannot access these features.
              </p>
            </div>

            <div className="bg-dark-lighter p-4 rounded">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">{attendees.length}</p>
                  <p className="text-sm text-gray-400">Registered</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-500">
                    {attendees.filter(a => a.attended).length}
                  </p>
                  <p className="text-sm text-gray-400">Attended</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/${id}/checkin`)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <UserCheck size={20} />
              Check-in Attendees (Admin Only)
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportRegistered}
                disabled={attendees.length === 0}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Export Registered
              </button>
              <button
                onClick={handleExportAttended}
                disabled={attendees.filter(a => a.attended).length === 0}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Export Attended
              </button>
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              Only Super Admin (Robocorpsg@gmail.com) can perform check-in operations
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
