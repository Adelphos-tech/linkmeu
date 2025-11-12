import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { saveEvent, getEvent } from '../db/database';
import { convertImageToBase64, resizeImage } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import DynamicList from '../components/DynamicList';

const EventForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, canEditEvent } = useAuth();
  const isEdit = !!id;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isEdit) {
      checkPermissions();
    }
  }, [user, id]);

  const checkPermissions = async () => {
    try {
      const event = await getEvent(parseInt(id));
      if (!canEditEvent(event.ownerId)) {
        alert('You do not have permission to edit this event');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    venue: '',
    organisers: [],
    logo: null,
    image: null,
    guestsOfHonour: [],
    speakers: [],
    sponsors: [],
    media: [],
  });

  const [loading, setLoading] = useState(false);

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
    
    if (!formData.title || !formData.date) {
      alert('Please fill in title and date');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        ...formData,
        id: isEdit ? parseInt(id) : undefined,
        ownerId: isEdit ? formData.ownerId : user.id,
        updatedAt: new Date().toISOString(),
      };

      if (!isEdit) {
        eventData.createdAt = new Date().toISOString();
      }

      const savedId = await saveEvent(eventData);
      
      // Redirect based on user role
      if (user.role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header title={isEdit ? 'Edit Event' : 'New Event'} showBack />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium mb-2">Event Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
            />
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
