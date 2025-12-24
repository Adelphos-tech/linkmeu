import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { getEvent, saveAttendee } from '../db/database';
import { format } from 'date-fns';
import Header from '../components/Header';

const RegistrationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      const eventData = await getEvent(parseInt(id));
      setEvent(eventData);
      
      // Get current attendees to check capacity
      const { getAttendeesByEvent } = await import('../db/database');
      const attendeeData = await getAttendeesByEvent(parseInt(id));
      setAttendees(attendeeData);
      
      // Check if capacity is exceeded
      if (eventData.capacity && attendeeData.length >= parseInt(eventData.capacity)) {
        setCapacityWarning(true);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert('Please fill in name and email');
      return;
    }

    setLoading(true);
    try {
      await saveAttendee({
        eventId: parseInt(id),
        ...formData,
        attended: false,
        registeredAt: new Date().toISOString(),
      });

      setSuccess(true);
      setTimeout(() => {
        setFormData({ name: '', contact: '', email: '', notes: '' });
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving registration:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
          <p className="text-gray-400">Thank you for registering.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header title="Registration" showBack />

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Capacity Warning */}
        {capacityWarning && (
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">!</span>
              </div>
              <h3 className="font-semibold text-yellow-400">Capacity Exceeded</h3>
            </div>
            <p className="text-sm text-gray-300">
              This event has reached its capacity of {event.capacity} attendees. 
              Registration is still allowed, but we will try to fit you in. 
              Priority will be given to early registrants.
            </p>
          </div>
        )}

        {/* Event Info */}
        <div className="bg-dark-lighter rounded-lg p-6 mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-3xl font-bold">EX</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">EventsX</p>

          <h1 className="text-2xl font-bold mb-3 uppercase">{event.title}</h1>
          
          <p className="text-gray-300 mb-4 text-sm">
            {event.description || 'Event description here.'}
          </p>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-primary">📍 Venue</span>
              <p className="text-white">{event.venue || 'Venue'}</p>
            </div>
            <div>
              <span className="text-primary">📅 Date & Time</span>
              <p className="text-white">
                {event.startDate && event.endDate ? (
                  event.startDate === event.endDate ? 
                    format(new Date(event.startDate), 'PPP') :
                    `${format(new Date(event.startDate), 'PPP')} - ${format(new Date(event.endDate), 'PPP')}`
                ) : 'Date'}
              </p>
            </div>
            {event.capacity && (
              <div>
                <span className="text-primary">👥 Capacity</span>
                <p className="text-white">
                  {attendees.length} / {event.capacity} registered
                  {capacityWarning && <span className="text-yellow-400"> (Capacity Exceeded)</span>}
                </p>
              </div>
            )}
          </div>

          {event.organisers && event.organisers.length > 0 && (
            <div className="mt-4 text-sm">
              <p className="text-gray-400">Organiser:</p>
              <p className="text-white">
                {event.organisers.map(o => o.name || o.detail).join(' - ')}
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-4">
            Powered by Robocorp
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Contact or Phone"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Contact</label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Notes or Company"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
