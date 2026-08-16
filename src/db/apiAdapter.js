// API Adapter - Replaces Supabase with Express backend API calls
// This adapter bridges the old frontend to the current Express + Neon backend

const API_BASE = '';

// Get stored auth token
function getToken() {
  const stored = localStorage.getItem('eventsx_user');
  if (!stored) return null;
  try {
    const user = JSON.parse(stored);
    return user.token || null;
  } catch {
    return null;
  }
}

// Build headers with auth token
function buildHeaders(contentType = true) {
  const headers = {};
  if (contentType) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// Map backend user to frontend format
function mapUser(user) {
  if (!user) return null;
  const names = (user.name || '').split(' ');
  const firstName = names[0] || '';
  const lastName = names.slice(1).join(' ') || '';

  // Map roles to old frontend expectations
  let role = user.role;
  if (role === 'user') role = 'owner';
  if (role === 'super_admin') role = 'superadmin';

  return {
    id: user.id,
    email: user.email,
    role: role,
    contact: user.phone || user.contact || '',
    firstName: user.firstName || firstName,
    lastName: user.lastName || lastName,
    name: user.name,
    token: user.token
  };
}

// Map frontend user data to backend format
function unmapUser(userData) {
  return {
    ...userData,
    name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
    phone: userData.phone || userData.contact || ''
  };
}

// Map backend listing to frontend format
function mapListing(listing) {
  if (!listing) return null;
  return {
    ...listing,
    fromDate: listing.from_date,
    toDate: listing.to_date,
    budgetMin: listing.budget_min,
    budgetMax: listing.budget_max,
    ownerId: listing.owner_id,
    createdAt: listing.created_at,
    updatedAt: listing.updated_at,
    images: listing.photos || [],
    // Old frontend expects 'active' instead of 'approved'
    status: listing.status === 'approved' ? 'active' : listing.status,
    whatsapp: listing.whatsapp || listing.contact || '',
    isPaid: listing.is_paid ?? false
  };
}

// Map backend event to frontend format
function mapEvent(event) {
  if (!event) return null;
  return {
    ...event,
    startDate: event.start_date,
    endDate: event.end_date,
    eventType: event.event_type,
    ownerId: event.owner_id,
    organisers: event.organisers || [],
    speakers: event.speakers || [],
    sponsors: event.sponsors || []
  };
}

// Map backend club to frontend format
function mapClub(club) {
  if (!club) return null;
  return {
    ...club,
    contactPerson: club.contact_person || '',
    postalCode: club.postal_code || '',
    openingHours: club.opening_hours || {},
    annualFee: club.annual_fee || 0,
    createdAt: club.created_at,
    updatedAt: club.updated_at
  };
}

// Map backend club member to frontend format
function mapClubMember(member) {
  if (!member) return null;
  return {
    ...member,
    clubId: member.club_id,
    registrationDate: member.registration_date,
    membershipType: member.membership_type,
    paymentStatus: member.payment_status,
    amountPaid: member.amount_paid || 0,
    prorataFee: member.prorata_fee || 0,
    memberCategory: member.member_category || 'individual',
    rocNumber: member.roc_number || '',
    icPassport: member.ic_passport || '',
    createdAt: member.created_at,
    updatedAt: member.updated_at
  };
}

// =====================================================
// USER OPERATIONS
// =====================================================

export const registerUser = async (userData) => {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(unmapUser(userData))
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Registration failed');
  return data.user?.id;
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Login failed');

  const user = mapUser(data.user);
  user.token = data.token;

  // Store in localStorage for AuthContext
  localStorage.setItem('eventsx_user', JSON.stringify(user));

  return user;
};

export const getUserByEmail = async (email) => {
  // Backend doesn't have a direct get-by-email endpoint
  // Try to get from stored user or return null
  const stored = localStorage.getItem('eventsx_user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      if (user.email?.toLowerCase() === email.toLowerCase()) return user;
    } catch {}
  }
  return null;
};

export const getAllUsers = async () => {
  // Backend doesn't expose all users publicly
  // Return empty array for now
  return [];
};

// =====================================================
// EVENT OPERATIONS
// =====================================================

export const createEvent = async (eventData) => {
  const res = await fetch(`${API_BASE}/api/events`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(eventData)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to create event');
  return mapEvent(data.event);
};

export const getEvent = async (eventId) => {
  const res = await fetch(`${API_BASE}/api/events/${eventId}`, { headers: buildHeaders(false) });
  const data = await res.json();
  if (!data.success) return null;
  return mapEvent(data.event);
};

export const getAllEvents = async () => {
  const res = await fetch(`${API_BASE}/api/events`, { headers: buildHeaders(false) });
  const data = await res.json();
  if (!data.success) return [];
  return (data.events || []).map(mapEvent);
};

export const updateEvent = async (eventId, eventData) => {
  const res = await fetch(`${API_BASE}/api/events/${eventId}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(eventData)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to update event');
  return mapEvent(data.event);
};

export const deleteEvent = async (eventId) => {
  const res = await fetch(`${API_BASE}/api/events/${eventId}`, {
    method: 'DELETE',
    headers: buildHeaders(false)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to delete event');
};

// =====================================================
// ATTENDEE OPERATIONS
// =====================================================

export const registerAttendee = async (attendeeData) => {
  const res = await fetch(`${API_BASE}/api/events/${attendeeData.eventId}/attendees`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(attendeeData)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to register attendee');
  return data.attendee;
};

export const getAttendeesByEvent = async (eventId) => {
  const res = await fetch(`${API_BASE}/api/events/${eventId}/attendees`, { headers: buildHeaders(false) });
  const data = await res.json();
  if (!data.success) return [];
  return data.attendees || [];
};

export const updateAttendeeStatus = async (attendeeId, attended) => {
  const res = await fetch(`${API_BASE}/api/attendees/${attendeeId}/status`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify({ attended })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to update attendee');
};

export const searchAttendees = async (eventId, query) => {
  const res = await fetch(`${API_BASE}/api/attendees/search?eventId=${eventId}&q=${encodeURIComponent(query)}`, { headers: buildHeaders(false) });
  const data = await res.json();
  if (!data.success) return [];
  return data.attendees || [];
};

// =====================================================
// LISTING OPERATIONS
// =====================================================

export const createListing = async (listingData) => {
  const res = await fetch(`${API_BASE}/api/listings`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(listingData)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to create listing');
  return mapListing(data.listing);
};

export const getListing = async (listingId) => {
  const res = await fetch(`${API_BASE}/api/listings/${listingId}`, { headers: buildHeaders(false) });
  const data = await res.json();
  if (!data.success) return null;
  return mapListing(data.listing);
};

export const getListingsByCategory = async (category) => {
  const res = await fetch(`${API_BASE}/api/listings?category=${encodeURIComponent(category)}`, { headers: buildHeaders(false) });
  const data = await res.json();
  if (!data.success) return [];
  return (data.listings || []).map(mapListing);
};

export const getAllListings = async (includeAll = false) => {
  // Old frontend expects both active (approved) and pending listings
  const res = await fetch(`${API_BASE}/api/listings?limit=100`, { headers: buildHeaders(false) });
  const data = await res.json();
  if (!data.success) return [];
  return (data.listings || []).map(mapListing);
};

export const updateListing = async (listingId, listingData) => {
  const res = await fetch(`${API_BASE}/api/listings/${listingId}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(listingData)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to update listing');
  return mapListing(data.listing);
};

export const deleteListing = async (listingId) => {
  const res = await fetch(`${API_BASE}/api/listings/${listingId}`, {
    method: 'DELETE',
    headers: buildHeaders(false)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to delete listing');
};

// =====================================================
// DATABASE STATUS
// =====================================================

export const getDatabaseMode = () => 'api';

export const getDatabaseStatus = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { headers: buildHeaders(false) });
    const data = await res.json();
    return {
      mode: 'api',
      status: data.status === 'ok' ? 'connected' : 'error',
      message: data.status === 'ok' ? 'Connected to Express API' : 'API unavailable',
      timestamp: new Date().toISOString()
    };
  } catch {
    return {
      mode: 'api',
      status: 'error',
      message: 'API unavailable',
      timestamp: new Date().toISOString()
    };
  }
};

// =====================================================
// ANALYTICS
// =====================================================

export const getEventAnalytics = async (eventId) => {
  const attendees = await getAttendeesByEvent(eventId);
  return {
    total_registered: attendees.length,
    total_attended: attendees.filter(a => a.attended).length,
    pending_registrations: attendees.filter(a => !a.attended).length
  };
};

export const getDashboardStats = async (userId = null) => {
  const events = await getAllEvents();
  const filteredEvents = userId ? events.filter(e => e.ownerId === userId) : events;

  let totalAttendees = 0;
  let totalAttended = 0;

  for (const event of filteredEvents) {
    const attendees = await getAttendeesByEvent(event.id);
    totalAttendees += attendees.length;
    totalAttended += attendees.filter(a => a.attended).length;
  }

  const upcomingEvents = filteredEvents.filter(e => {
    const eventDate = new Date(e.startDate);
    return eventDate >= new Date();
  }).length;

  return {
    total_events: filteredEvents.length,
    total_attendees: totalAttendees,
    total_attended: totalAttended,
    upcoming_events: upcomingEvents
  };
};

// =====================================================
// LEAD OPERATIONS (not implemented - return empty)
// =====================================================

export const createLead = async () => ({ id: 0 });
export const getAllLeads = async () => [];
export const getLeadsByListing = async () => [];
export const updateLeadStatus = async () => {};
export const deleteLead = async () => {};

// =====================================================
// CLUB OPERATIONS
// =====================================================

export const getAllClubs = async () => {
  const res = await fetch(`${API_BASE}/api/clubs`, { headers: buildHeaders(false) });
  const data = await res.json();
  if (!data.success) return [];
  return (data.clubs || []).map(mapClub);
};

export const getClub = async (clubId) => {
  const res = await fetch(`${API_BASE}/api/clubs/${clubId}`, { headers: buildHeaders(false) });
  const data = await res.json();
  if (!data.success) return null;
  return { club: mapClub(data.club), members: (data.members || []).map(mapClubMember) };
};

export const getClubMembers = async (clubId) => {
  const res = await fetch(`${API_BASE}/api/clubs/${clubId}/members`, { headers: buildHeaders(false) });
  const data = await res.json();
  if (!data.success) return [];
  return (data.members || []).map(mapClubMember);
};

export const getAllClubMembers = async () => {
  const res = await fetch(`${API_BASE}/api/club-members`, { headers: buildHeaders(false) });
  const data = await res.json();
  if (!data.success) return [];
  return (data.members || []).map(mapClubMember);
};
