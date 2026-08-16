import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, QrCode, X, Shield, Plus } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { getEvent, getAttendeesByEvent, updateAttendeeStatus, searchAttendees, saveEvent } from '../db/database';
import { useAuth } from '../context/AuthContext';
import { format, isToday, parseISO } from 'date-fns';
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
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [newCapacity, setNewCapacity] = useState('');
  const scannerRef = useRef(null);

  // Check if check-in is allowed (only on event day)
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

  // Event day restriction - Customer feedback implementation
  if (event && !isCheckInAllowed()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-2xl font-bold mb-4 text-yellow-400">Check-in Not Available</h1>
          <p className="text-gray-400 mb-4">
            Check-in is only available on the event day.
          </p>
          <div className="bg-dark-lighter rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-300">
              <span className="text-primary font-semibold">Event Date:</span><br />
              {event.startDate === event.endDate ? 
                format(parseISO(event.startDate), 'PPPP') :
                `${format(parseISO(event.startDate), 'PPP')} - ${format(parseISO(event.endDate), 'PPP')}`
              }
            </p>
            <p className="text-sm text-gray-300 mt-2">
              <span className="text-primary font-semibold">Today:</span><br />
              {format(new Date(), 'PPPP')}
            </p>
          </div>
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
      // If marking as attended (not unchecking)
      if (!currentStatus) {
        // Check if capacity limit is reached
        const attendedCount = attendees.filter(a => a.attended).length;
        if (event.capacity && attendedCount >= parseInt(event.capacity)) {
          alert(`Cannot check-in: Event capacity (${event.capacity}) has been reached. Admin can increase capacity if needed.`);
          return;
        }
      }
      
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

  const handleIncreaseCapacity = async () => {
    try {
      const currentCapacity = event.capacity ? parseInt(event.capacity) : 0;
      const newCap = parseInt(newCapacity);
      
      if (!newCap || newCap <= currentCapacity) {
        alert(`New capacity must be greater than current capacity (${currentCapacity})`);
        return;
      }
      
      // Update event capacity
      const updatedEvent = { ...event, capacity: newCap };
      await saveEvent(updatedEvent);
      
      alert(`✓ Capacity increased from ${currentCapacity} to ${newCap}`);
      setShowCapacityModal(false);
      setNewCapacity('');
      await loadData();
    } catch (error) {
      console.error('Error updating capacity:', error);
      alert('Failed to update capacity');
    }
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
            <h3 className="font-semibold text-green-400">Super Admin Access Confirmed - Event Day</h3>
          </div>
          <p className="text-sm text-gray-300">
            You have admin privileges to check-in attendees and export data.
            Check-in is available today because it's the event day.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Event Date: {event.startDate === event.endDate ? 
              format(parseISO(event.startDate), 'PPP') :
              `${format(parseISO(event.startDate), 'PPP')} - ${format(parseISO(event.endDate), 'PPP')}`
            } | Today: {format(new Date(), 'PPP')}
          </p>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
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
          <div className="bg-dark-lighter p-4 rounded text-center">
            <p className="text-3xl font-bold text-blue-500">
              {event.capacity || '∞'}
            </p>
            <p className="text-sm text-gray-400">Capacity</p>
          </div>
        </div>

        {/* Capacity Warning */}
        {event.capacity && attendees.filter(a => a.attended).length >= parseInt(event.capacity) && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <h3 className="font-semibold text-red-400">Attendance Capacity Reached</h3>
              </div>
              <button
                onClick={() => {
                  setNewCapacity(event.capacity ? (parseInt(event.capacity) + 50).toString() : '100');
                  setShowCapacityModal(true);
                }}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
              >
                <Plus size={16} />
                Increase Capacity
              </button>
            </div>
            <p className="text-sm text-gray-300">
              The attendance capacity of {event.capacity} has been reached. 
              Click "Increase Capacity" to allow more attendees to check in.
            </p>
          </div>
        )}

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
                            className="px-6 py-2 rounded font-medium bg-primary hover:bg-primary-dark text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={event.capacity && attendees.filter(a => a.attended).length >= parseInt(event.capacity)}
                          >
                            {event.capacity && attendees.filter(a => a.attended).length >= parseInt(event.capacity) ? 'Capacity Full' : 'Check-in'}
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

        {/* Capacity Increase Modal */}
        {showCapacityModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-lighter border border-gray-700 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Increase Event Capacity</h3>
              <p className="text-sm text-gray-400 mb-4">
                Current capacity: {event.capacity || 'Unlimited'}<br />
                Current attendance: {attendees.filter(a => a.attended).length}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">New Capacity</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  placeholder="Enter new capacity"
                  min={event.capacity ? parseInt(event.capacity) + 1 : 1}
                  className="w-full"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleIncreaseCapacity}
                  className="btn-primary flex-1"
                >
                  Update Capacity
                </button>
                <button
                  onClick={() => {
                    setShowCapacityModal(false);
                    setNewCapacity('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
