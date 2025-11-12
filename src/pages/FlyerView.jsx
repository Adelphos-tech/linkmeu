import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { getEvent } from '../db/database';
import { generateQRCode, generateRegistrationURL } from '../utils/qrcode';
import { generateA5Flyer, downloadPDF } from '../utils/pdf';
import { format } from 'date-fns';
import Header from '../components/Header';

const FlyerView = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEventAndQR();
  }, [id]);

  const loadEventAndQR = async () => {
    try {
      const eventData = await getEvent(parseInt(id));
      setEvent(eventData);

      const registrationURL = generateRegistrationURL(id);
      const qrDataURL = await generateQRCode(registrationURL);
      setQrCode(qrDataURL);
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!event || !qrCode) return;

    setLoading(true);
    try {
      const pdf = await generateA5Flyer(event, qrCode);
      downloadPDF(pdf, `${event.title}-flyer.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  if (!event || !qrCode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header title="Event Flyer" showBack />

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Flyer Preview */}
        <div className="bg-black border border-gray-800 rounded-lg p-6 mb-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl font-bold">EX</span>
            </div>
            <p className="text-sm text-gray-400 text-center">EventsX</p>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-4 uppercase">{event.title}</h1>

          {/* Description */}
          <p className="text-gray-300 mb-6 text-sm">
            {event.description || 'Event description here.'}
          </p>

          {/* Venue */}
          <div className="mb-3">
            <span className="text-primary">📍 Venue</span>
            <p className="text-white ml-6">{event.venue || 'Venue'}</p>
          </div>

          {/* Date & Time */}
          <div className="mb-6">
            <span className="text-primary">📅 Date & Time</span>
            <p className="text-white ml-6">
              {event.date ? format(new Date(event.date), 'PPP') : 'Date'}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white p-3 rounded">
              <img src={qrCode} alt="Registration QR" className="w-48 h-48" />
            </div>
            <p className="text-sm font-bold mt-3">SCAN TO REGISTER</p>
          </div>

          {/* Organiser */}
          {event.organisers && event.organisers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400">Organiser:</p>
              <p className="text-white">
                {event.organisers.map(o => o.name || o.detail).join(', ')}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-6">
            Powered by Robocorp
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownloadPDF}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Download size={20} />
          {loading ? 'Generating PDF...' : 'Download A5 Flyer (PDF)'}
        </button>

        {/* Registration URL */}
        <div className="mt-6 p-4 bg-dark-lighter rounded">
          <p className="text-sm text-gray-400 mb-2">Registration URL:</p>
          <p className="text-xs text-primary break-all">
            {generateRegistrationURL(id)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlyerView;
