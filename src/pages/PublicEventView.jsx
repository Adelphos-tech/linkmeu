import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, QrCode, Share2, Check } from 'lucide-react';
import { getEvent, getAttendeesByEvent } from '../db/database';
import { format } from 'date-fns';
import { generateRegistrationURL } from '../utils/qrcode';

const PublicEventView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const eventData = await getEvent(parseInt(id));
      setEvent(eventData);
      
      const attendeeData = await getAttendeesByEvent(parseInt(id));
      setAttendees(attendeeData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRegistrationLink = () => {
    const regUrl = generateRegistrationURL(id);
    navigator.clipboard.writeText(regUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-white hover:text-gray-300"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <button
            onClick={handleShare}
            className="btn-secondary flex items-center gap-2"
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Event Image */}
        {event.image && (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        {/* Event Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4 mb-4">
            {event.logo && (
              <img
                src={event.logo}
                alt="Logo"
                className="w-20 h-20 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              <div className="flex flex-col gap-2 text-gray-400">
                {event.startDate && event.endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={18} />
                    {event.startDate === event.endDate ? 
                      format(new Date(event.startDate), 'PPP') :
                      `${format(new Date(event.startDate), 'PPP')} - ${format(new Date(event.endDate), 'PPP')}`
                    }
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    {event.venue}
                  </div>
                )}
                {event.capacity && (
                  <div className="flex items-center gap-2">
                    <Users size={18} />
                    Capacity: {attendees.length} / {event.capacity}
                    {attendees.length >= parseInt(event.capacity) && 
                      <span className="text-yellow-400 ml-2">(Full)</span>
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="bg-dark-lighter border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3">About This Event</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Registration CTA */}
        <div className="bg-primary/10 border border-primary rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Register for this event</h3>
              <div className="space-y-1">
                <p className="text-gray-400 flex items-center gap-2">
                  <Users size={18} />
                  {attendees.length} people registered
                </p>
                {event.capacity && (
                  <p className="text-sm text-gray-400">
                    Capacity: {attendees.length} / {event.capacity}
                    {attendees.length >= parseInt(event.capacity) && 
                      <span className="text-yellow-400"> (Full - Registration still allowed)</span>
                    }
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopyRegistrationLink}
                className="btn-secondary flex items-center gap-2"
              >
                {copied ? <Check size={18} /> : <QrCode size={18} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <Link
                to={`/${id}/register`}
                className="btn-primary flex items-center gap-2"
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>

        {/* Organizers */}
        {event.organisers && event.organisers.length > 0 && (
          <div className="bg-dark-lighter border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Organized By</h2>
            <div className="space-y-2">
              {event.organisers.map((org, idx) => (
                <div key={idx}>
                  <p className="font-medium">{org.name}</p>
                  {org.detail && <p className="text-sm text-gray-400">{org.detail}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Details */}
        {(event.guestsOfHonour?.length > 0 || event.speakers?.length > 0 || 
          event.sponsors?.length > 0 || event.media?.length > 0) && (
          <div className="space-y-6">
            {event.guestsOfHonour && event.guestsOfHonour.length > 0 && (
              <div className="bg-dark-lighter border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Guests of Honour</h3>
                <div className="grid gap-3">
                  {event.guestsOfHonour.map((guest, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      {guest.photo && (
                        <img src={guest.photo} alt={guest.name} className="w-12 h-12 object-cover rounded-full" />
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
              <div className="bg-dark-lighter border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Speakers</h3>
                <div className="grid gap-3">
                  {event.speakers.map((speaker, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      {speaker.photo && (
                        <img src={speaker.photo} alt={speaker.name} className="w-12 h-12 object-cover rounded-full" />
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
              <div className="bg-dark-lighter border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Sponsors</h3>
                <div className="grid grid-cols-3 gap-4">
                  {event.sponsors.map((sponsor, idx) => (
                    <div key={idx} className="text-center">
                      {sponsor.logo && (
                        <img src={sponsor.logo} alt={sponsor.name} className="w-16 h-16 object-contain mx-auto mb-2" />
                      )}
                      <p className="text-sm">{sponsor.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicEventView;
