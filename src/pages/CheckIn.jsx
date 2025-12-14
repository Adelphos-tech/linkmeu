import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, QrCode, X, Shield } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { getEvent, getAttendeesByEvent, updateAttendeeStatus, searchAttendees } from '../db/database';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const CheckIn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [filteredAttendees, setFilteredAttendees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);
  const scannerRef = useRef(null);

  // Admin-only access control - Customer feedback implementation
  if (!isSuperAdmin()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Shield size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-red-400">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            Check-in functionality is restricted to Super Admin users only.
            Regular users cannot access this feature.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/${id}`)}
              className="btn-primary w-full"
            >
              Back to Event
            </button>
            <button
              onClick={() => navigate('/events')}
              className="btn-secondary w-full"
            >
              View All Events
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-4">
            Contact: Robocorpsg@gmail.com for admin access
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (searchQuery) {
      performSearch();
    } else {
      setFilteredAttendees(attendees);
    }
  }, [searchQuery, attendees]);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.stop().catch(console.error);
      }
    };
  }, [scanner]);

  const loadData = async () => {
    try {
      const eventData = await getEvent(parseInt(id));
      setEvent(eventData);

      const attendeeData = await getAttendeesByEvent(parseInt(id));
      setAttendees(attendeeData);
      setFilteredAttendees(attendeeData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const performSearch = async () => {
    try {
      const results = await searchAttendees(parseInt(id), searchQuery);
      setFilteredAttendees(results);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleMarkAttend = async (attendeeId, currentStatus) => {
    try {
      await updateAttendeeStatus(attendeeId, !currentStatus);
      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update attendance');
    }
  };

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      setScanner(html5QrCode);

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanFailure
      );

      setScanning(true);
    } catch (error) {
      console.error('Error starting scanner:', error);
      alert('Failed to start camera. Please check permissions.');
    }
  };

  const stopScanning = async () => {
    if (scanner) {
      try {
        await scanner.stop();
        setScanner(null);
        setScanning(false);
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    // Check if scanned text contains attendee info (email or name)
    const results = await searchAttendees(parseInt(id), decodedText);
    
    if (results.length > 0) {
      const attendee = results[0];
      if (!attendee.attended) {
        await handleMarkAttend(attendee.id, attendee.attended);
        alert(`✓ ${attendee.name} checked in successfully!`);
      } else {
        alert(`${attendee.name} already checked in.`);
      }
    } else {
      alert('Attendee not found. Please register first.');
    }
  };

  const onScanFailure = (error) => {
    // Silent fail - QR scanning errors are common
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
      <Header title="Check-in (Admin Only)" showBack />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Admin Access Confirmation */}
        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={20} className="text-green-400" />
            <h3 className="font-semibold text-green-400">Super Admin Access Confirmed</h3>
          </div>
          <p className="text-sm text-gray-300">
            You have admin privileges to check-in attendees and export data.
            This functionality is restricted to Super Admin users only.
          </p>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-dark-lighter p-4 rounded text-center">
            <p className="text-3xl font-bold text-primary">{attendees.length}</p>
            <p className="text-sm text-gray-400">Registered</p>
          </div>
          <div className="bg-dark-lighter p-4 rounded text-center">
            <p className="text-3xl font-bold text-green-500">
              {attendees.filter(a => a.attended).length}
            </p>
            <p className="text-sm text-gray-400">Attended</p>
          </div>
        </div>

        {/* Search and Scan */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or contact..."
              className="pl-10"
            />
          </div>

          {!scanning ? (
            <button
              onClick={startScanning}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <QrCode size={20} />
              Scan QR
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <X size={20} />
              Stop Scanning
            </button>
          )}
        </div>

        {/* QR Scanner */}
        {scanning && (
          <div className="mb-6 bg-dark-lighter p-4 rounded">
            <div id="qr-reader" className="w-full"></div>
          </div>
        )}

        {/* Separate Lists for Registered and Attended */}
        {filteredAttendees.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            {searchQuery ? 'No attendees found' : 'No registrations yet'}
          </p>
        ) : (
          <div className="space-y-6">
            {/* List A: Registered (Not Yet Attended) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-primary">
                  Registered ({filteredAttendees.filter(a => !a.attended).length})
                </h2>
                <span className="text-sm text-gray-400">Waiting to check-in</span>
              </div>
              <div className="space-y-3">
                {filteredAttendees.filter(a => !a.attended).length === 0 ? (
                  <p className="text-center text-gray-500 py-4 bg-dark-lighter rounded">
                    All registered attendees have checked in! 🎉
                  </p>
                ) : (
                  filteredAttendees
                    .filter(a => !a.attended)
                    .map((attendee) => (
                      <div
                        key={attendee.id}
                        className="bg-dark-lighter border border-gray-800 rounded-lg p-4 hover:border-primary transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{attendee.name}</h3>
                            <p className="text-sm text-gray-400">{attendee.email}</p>
                            {attendee.contact && (
                              <p className="text-sm text-gray-400">{attendee.contact}</p>
                            )}
                            {attendee.notes && (
                              <p className="text-sm text-gray-500 mt-1">{attendee.notes}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleMarkAttend(attendee.id, attendee.attended)}
                            className="px-6 py-2 rounded font-medium bg-primary hover:bg-primary-dark text-white"
                          >
                            Check-in
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* List B: Attended (Checked-in) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-green-500">
                  Attended ({filteredAttendees.filter(a => a.attended).length})
                </h2>
                <span className="text-sm text-gray-400">Successfully checked in</span>
              </div>
              <div className="space-y-3">
                {filteredAttendees.filter(a => a.attended).length === 0 ? (
                  <p className="text-center text-gray-500 py-4 bg-dark-lighter rounded">
                    No attendees checked in yet
                  </p>
                ) : (
                  filteredAttendees
                    .filter(a => a.attended)
                    .map((attendee) => (
                      <div
                        key={attendee.id}
                        className="bg-dark-lighter border border-green-800 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{attendee.name}</h3>
                            <p className="text-sm text-gray-400">{attendee.email}</p>
                            {attendee.contact && (
                              <p className="text-sm text-gray-400">{attendee.contact}</p>
                            )}
                            {attendee.notes && (
                              <p className="text-sm text-gray-500 mt-1">{attendee.notes}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleMarkAttend(attendee.id, attendee.attended)}
                            className="px-6 py-2 rounded font-medium bg-green-600 hover:bg-green-700 text-white"
                          >
                            ✓ Attended
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
