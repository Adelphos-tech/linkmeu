import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { saveEvent, getEvent, registerUser, loginUser } from '../db/database';
import { convertImageToBase64, resizeImage } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import DynamicList from '../components/DynamicList';

const EventForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, canEditEvent, login } = useAuth();
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      checkPermissions();
    }
  }, [user, id]);

  const checkPermissions = async () => {
    try {
      const event = await getEvent(parseInt(id));
      // Only super admin can edit events
      if (!user || !canEditEvent(event.ownerId)) {
        alert('Only Super Admin can edit events. Events cannot be edited after creation.');
        navigate('/events');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    venue: '',
    capacity: '',
    organisers: [],
    logo: null,
    image: null,
    guestsOfHonour: [],
    speakers: [],
    sponsors: [],
    media: [],
    // Creator registration info
    creatorEmail: '',
    creatorPassword: '',
    creatorContact: '',
    creatorCountryCode: '+65'
  });

  const [loading, setLoading] = useState(false);
  const [showRegistration, setShowRegistration] = useState(!isEdit);

  useEffect(() => {
    if (isEdit) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      const event = await getEvent(parseInt(id));
      if (event) {
        setFormData(event);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      alert('Failed to load event');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (field, file) => {
    if (file) {
      try {
        const base64 = await convertImageToBase64(file);
        const resized = await resizeImage(base64, 800, 800);
        handleChange(field, resized);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.startDate || !formData.endDate) {
      alert('Please fill in title, start date, and end date');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert('End date must be after or equal to start date');
      return;
    }

    if (formData.capacity && parseInt(formData.capacity) <= 0) {
      alert('Capacity must be a positive number');
      return;
    }

    // For new events, require registration info
    if (!isEdit && !user) {
      if (!formData.creatorEmail || !formData.creatorPassword || !formData.creatorContact) {
        alert('Please fill in your registration details (Email, Password, Contact)');
        return;
      }
      if (formData.creatorPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);
    try {
      let ownerId = user?.id;

      // Register new user if not logged in
      if (!isEdit && !user) {
        try {
          ownerId = await registerUser({
            email: formData.creatorEmail,
            password: formData.creatorPassword,
            contact: `${formData.creatorCountryCode} ${formData.creatorContact}`
          });

          // Auto-login the new user
          const newUser = await loginUser(formData.creatorEmail, formData.creatorPassword);
          login(newUser);
        } catch (error) {
          if (error.message.includes('already exists')) {
            // Try to login instead
            try {
              const existingUser = await loginUser(formData.creatorEmail, formData.creatorPassword);
              login(existingUser);
              ownerId = existingUser.id;
            } catch (loginError) {
              alert('Email already exists. Please use correct password or use a different email.');
              setLoading(false);
              return;
            }
          } else {
            throw error;
          }
        }
      }

      const eventData = {
        ...formData,
        id: isEdit ? parseInt(id) : undefined,
        ownerId: ownerId,
        updatedAt: new Date().toISOString(),
        // Remove creator fields from event data
        creatorEmail: undefined,
        creatorPassword: undefined,
        creatorContact: undefined,
        creatorCountryCode: undefined
      };

      if (!isEdit) {
        eventData.createdAt = new Date().toISOString();
      }

      const savedId = await saveEvent(eventData);
      
      // Redirect to events page
      navigate('/events');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header title={isEdit ? 'Edit Event' : 'New Event'} showBack />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Registration Section - Only for new events when not logged in */}
          {!isEdit && !user && (
            <div className="bg-primary/10 border border-primary rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold text-primary">Your Registration Details</h2>
              <p className="text-sm text-gray-400">
                Register to create and manage your event. If you already have an account, use the same email and password.
              </p>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.creatorEmail}
                  onChange={(e) => handleChange('creatorEmail', e.target.value)}
                  placeholder="your@email.com"
                  required={!user}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.creatorPassword}
                  onChange={(e) => handleChange('creatorPassword', e.target.value)}
                  placeholder="At least 6 characters"
                  required={!user}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contact Number *</label>
                <div className="flex gap-2">
                  <select
                    value={formData.creatorCountryCode}
                    onChange={(e) => handleChange('creatorCountryCode', e.target.value)}
                    className="w-32"
                  >
                    <option value="+65">+65 (SG)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+91">+91 (IN)</option>
                    <option value="+86">+86 (CN)</option>
                    <option value="+81">+81 (JP)</option>
                    <option value="+82">+82 (KR)</option>
                    <option value="+61">+61 (AU)</option>
                  </select>
                  <input
                    type="tel"
                    value={formData.creatorContact}
                    onChange={(e) => handleChange('creatorContact', e.target.value)}
                    placeholder="Phone number"
                    className="flex-1"
                    required={!user}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Event Details Section */}
          <div className="bg-dark-lighter border border-gray-800 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold">Event Details</h2>
            
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  required
                />
              </div>
            </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Event title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Event description here"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Venue</label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => handleChange('venue', e.target.value)}
              placeholder="Venue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
              placeholder="Maximum number of attendees (leave empty for unlimited)"
              min="1"
            />
            <p className="text-xs text-gray-400 mt-1">
              Registration will be allowed beyond capacity with a warning, but attendance can only be marked up to capacity.
            </p>
          </div>

          {/* Organisers */}
          <DynamicList
            title="Organisers"
            items={formData.organisers}
            onChange={(items) => handleChange('organisers', items)}
            fields={[
              { name: 'name', label: 'Name', placeholder: 'Name', type: 'text' },
              { name: 'detail', label: 'Detail', placeholder: 'Detail', type: 'text' },
            ]}
          />

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium mb-2">Logo</label>
            <div className="flex items-center gap-4">
              {formData.logo && (
                <img
                  src={formData.logo}
                  alt="Logo"
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <label className="flex items-center gap-2 px-4 py-2 bg-dark-light rounded cursor-pointer hover:bg-gray-700">
                <Upload size={18} />
                {formData.logo ? 'Change Logo' : 'Choose Logo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload('logo', e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {/* Event Image */}
          <div>
            <label className="block text-sm font-medium mb-2">Event Image</label>
            <div className="flex items-center gap-4">
              {formData.image && (
                <img
                  src={formData.image}
                  alt="Event"
                  className="w-32 h-20 object-cover rounded"
                />
              )}
              <label className="flex items-center gap-2 px-4 py-2 bg-dark-light rounded cursor-pointer hover:bg-gray-700">
                <Upload size={18} />
                {formData.image ? 'Change Image' : 'Choose Image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload('image', e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {/* Guests of Honour */}
          <DynamicList
            title="Guests of Honour"
            items={formData.guestsOfHonour}
            onChange={(items) => handleChange('guestsOfHonour', items)}
            fields={[
              { name: 'name', label: 'Name', placeholder: 'Name', type: 'text' },
              { name: 'title', label: 'Title', placeholder: 'Title/Position', type: 'text' },
              { name: 'photo', label: 'Photo', type: 'image' },
            ]}
          />

          {/* Speakers */}
          <DynamicList
            title="Speakers"
            items={formData.speakers}
            onChange={(items) => handleChange('speakers', items)}
            fields={[
              { name: 'name', label: 'Name', placeholder: 'Name', type: 'text' },
              { name: 'title', label: 'Title', placeholder: 'Title/Position', type: 'text' },
              { name: 'photo', label: 'Photo', type: 'image' },
            ]}
          />

          {/* Sponsors */}
          <DynamicList
            title="Sponsors"
            items={formData.sponsors}
            onChange={(items) => handleChange('sponsors', items)}
            fields={[
              { name: 'name', label: 'Name', placeholder: 'Sponsor Name', type: 'text' },
              { name: 'logo', label: 'Logo', type: 'image' },
            ]}
          />

          {/* Media */}
          <DynamicList
            title="Media Partners"
            items={formData.media}
            onChange={(items) => handleChange('media', items)}
            fields={[
              { name: 'name', label: 'Name', placeholder: 'Media Name', type: 'text' },
              { name: 'logo', label: 'Logo', type: 'image' },
            ]}
          />

          </div>
          {/* End Event Details Section */}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
