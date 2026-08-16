import { executeQuery } from '../config/database.js';
import { initializeDatabase } from './migrations.js';

// Initialize database on module load
let dbInitialized = false;
const initPromise = initializeDatabase().then(result => {
  dbInitialized = result.initialized;
  return result;
});

// Ensure database is initialized before operations
const ensureInitialized = async () => {
  if (!dbInitialized) {
    await initPromise;
  }
};

// ==================== USER OPERATIONS ====================

export const createUser = async (userData) => {
  await ensureInitialized();
  
  const { email, password, role = 'user', contact, firstName, lastName } = userData;
  
  const query = `
    INSERT INTO users (email, password_hash, role, contact, first_name, last_name)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, role, contact, first_name, last_name, created_at
  `;
  
  const result = await executeQuery(query, [email, password, role, contact, firstName, lastName]);
  return result[0];
};

export const getUserByEmail = async (email) => {
  await ensureInitialized();
  
  const query = `
    SELECT id, email, password_hash, role, contact, first_name, last_name, 
           is_active, email_verified, last_login, created_at
    FROM users 
    WHERE email = $1 AND is_active = true
  `;
  
  const result = await executeQuery(query, [email]);
  return result[0] || null;
};

export const updateUserLastLogin = async (userId) => {
  await ensureInitialized();
  
  const query = `
    UPDATE users 
    SET last_login = NOW() 
    WHERE id = $1
  `;
  
  await executeQuery(query, [userId]);
};

export const getAllUsers = async () => {
  await ensureInitialized();
  
  const query = `
    SELECT id, email, role, contact, first_name, last_name, 
           is_active, email_verified, last_login, created_at
    FROM users 
    WHERE is_active = true
    ORDER BY created_at DESC
  `;
  
  const result = await executeQuery(query);
  return result;
};

// ==================== EVENT OPERATIONS ====================

export const createEvent = async (eventData) => {
  await ensureInitialized();
  
  const {
    title, description, date, venue, ownerId, startTime, endTime,
    maxAttendees, registrationDeadline, imageUrl, logoUrl, registrationFee
  } = eventData;
  
  const query = `
    INSERT INTO events (
      title, description, event_date, venue, owner_id, start_time, end_time,
      max_attendees, registration_deadline, image_url, logo_url, registration_fee
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;
  
  const result = await executeQuery(query, [
    title, description, date, venue, ownerId, startTime, endTime,
    maxAttendees, registrationDeadline, imageUrl, logoUrl, registrationFee
  ]);
  
  return result[0];
};

export const getEvent = async (eventId) => {
  await ensureInitialized();
  
  const query = `
    SELECT e.*, u.email as owner_email, u.first_name as owner_first_name, u.last_name as owner_last_name
    FROM events e
    JOIN users u ON e.owner_id = u.id
    WHERE e.id = $1 AND e.status != 'deleted'
  `;
  
  const result = await executeQuery(query, [eventId]);
  if (!result[0]) return null;
  
  const event = result[0];
  
  // Get organizers
  const organizersQuery = `
    SELECT name, detail, contact_email, contact_phone
    FROM event_organizers
    WHERE event_id = $1
  `;
  const organizers = await executeQuery(organizersQuery, [eventId]);
  
  // Get speakers
  const speakersQuery = `
    SELECT name, title, bio, photo_url, linkedin_url, twitter_url
    FROM event_speakers
    WHERE event_id = $1
  `;
  const speakers = await executeQuery(speakersQuery, [eventId]);
  
  // Get sponsors
  const sponsorsQuery = `
    SELECT name, logo_url, website_url, sponsor_level
    FROM event_sponsors
    WHERE event_id = $1
  `;
  const sponsors = await executeQuery(sponsorsQuery, [eventId]);
  
  return {
    ...event,
    organizers: organizers || [],
    speakers: speakers || [],
    sponsors: sponsors || []
  };
};

export const getAllEvents = async () => {
  await ensureInitialized();
  
  const query = `
    SELECT e.*, u.email as owner_email, u.first_name as owner_first_name, u.last_name as owner_last_name,
           COUNT(a.id) as attendee_count
    FROM events e
    JOIN users u ON e.owner_id = u.id
    LEFT JOIN attendees a ON e.id = a.event_id AND a.status != 'cancelled'
    WHERE e.status != 'deleted' AND e.is_public = true
    GROUP BY e.id, u.email, u.first_name, u.last_name
    ORDER BY e.event_date ASC
  `;
  
  const result = await executeQuery(query);
  return result;
};

export const updateEvent = async (eventId, eventData) => {
  await ensureInitialized();
  
  const fields = [];
  const values = [];
  let paramCount = 1;
  
  Object.entries(eventData).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });
  
  if (fields.length === 0) return null;
  
  const query = `
    UPDATE events 
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount}
    RETURNING *
  `;
  
  values.push(eventId);
  const result = await executeQuery(query, values);
  return result[0];
};

export const deleteEvent = async (eventId) => {
  await ensureInitialized();
  
  const query = `
    UPDATE events 
    SET status = 'deleted', updated_at = NOW()
    WHERE id = $1
  `;
  
  await executeQuery(query, [eventId]);
};

// ==================== ATTENDEE OPERATIONS ====================

export const registerAttendee = async (attendeeData) => {
  await ensureInitialized();
  
  const {
    eventId, name, email, contact, company, jobTitle,
    dietaryRequirements, specialNeeds, userId
  } = attendeeData;
  
  const query = `
    INSERT INTO attendees (
      event_id, user_id, name, email, contact, company, job_title,
      dietary_requirements, special_needs, qr_code_data
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  // Generate QR code data (could be email or unique identifier)
  const qrCodeData = `${email}-${eventId}-${Date.now()}`;
  
  const result = await executeQuery(query, [
    eventId, userId, name, email, contact, company, jobTitle,
    dietaryRequirements, specialNeeds, qrCodeData
  ]);
  
  return result[0];
};

export const getAttendeesByEvent = async (eventId) => {
  await ensureInitialized();
  
  const query = `
    SELECT a.*, u.email as user_email
    FROM attendees a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.event_id = $1 AND a.status != 'cancelled'
    ORDER BY a.registration_date DESC
  `;
  
  const result = await executeQuery(query, [eventId]);
  return result;
};

export const updateAttendeeStatus = async (attendeeId, status, checkInBy = null) => {
  await ensureInitialized();
  
  const query = `
    UPDATE attendees 
    SET status = $1, 
        attended = $2,
        check_in_time = CASE WHEN $2 = true THEN NOW() ELSE check_in_time END,
        check_in_by = $3,
        updated_at = NOW()
    WHERE id = $4
    RETURNING *
  `;
  
  const attended = status === 'attended';
  const result = await executeQuery(query, [status, attended, checkInBy, attendeeId]);
  return result[0];
};

export const searchAttendees = async (eventId, searchTerm) => {
  await ensureInitialized();
  
  const query = `
    SELECT *
    FROM attendees
    WHERE event_id = $1 
      AND status != 'cancelled'
      AND (
        name ILIKE $2 OR 
        email ILIKE $2 OR 
        contact ILIKE $2 OR
        qr_code_data = $3
      )
    ORDER BY name ASC
  `;
  
  const searchPattern = `%${searchTerm}%`;
  const result = await executeQuery(query, [eventId, searchPattern, searchTerm]);
  return result;
};

// ==================== EVENT ORGANIZERS, SPEAKERS, SPONSORS ====================

export const addEventOrganizer = async (eventId, organizerData) => {
  await ensureInitialized();
  
  const { name, detail, contactEmail, contactPhone } = organizerData;
  
  const query = `
    INSERT INTO event_organizers (event_id, name, detail, contact_email, contact_phone)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const result = await executeQuery(query, [eventId, name, detail, contactEmail, contactPhone]);
  return result[0];
};

export const addEventSpeaker = async (eventId, speakerData) => {
  await ensureInitialized();
  
  const { name, title, bio, photoUrl, linkedinUrl, twitterUrl } = speakerData;
  
  const query = `
    INSERT INTO event_speakers (event_id, name, title, bio, photo_url, linkedin_url, twitter_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const result = await executeQuery(query, [eventId, name, title, bio, photoUrl, linkedinUrl, twitterUrl]);
  return result[0];
};

export const addEventSponsor = async (eventId, sponsorData) => {
  await ensureInitialized();
  
  const { name, logoUrl, websiteUrl, sponsorLevel } = sponsorData;
  
  const query = `
    INSERT INTO event_sponsors (event_id, name, logo_url, website_url, sponsor_level)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const result = await executeQuery(query, [eventId, name, logoUrl, websiteUrl, sponsorLevel]);
  return result[0];
};

// ==================== ANALYTICS & REPORTING ====================

export const getEventAnalytics = async (eventId) => {
  await ensureInitialized();
  
  const query = `
    SELECT 
      COUNT(*) as total_registered,
      COUNT(CASE WHEN attended = true THEN 1 END) as total_attended,
      COUNT(CASE WHEN status = 'registered' THEN 1 END) as pending_registrations,
      COUNT(CASE WHEN registration_date >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_registrations
    FROM attendees
    WHERE event_id = $1 AND status != 'cancelled'
  `;
  
  const result = await executeQuery(query, [eventId]);
  return result[0];
};

export const getDashboardStats = async (userId = null) => {
  await ensureInitialized();
  
  let eventFilter = '';
  let params = [];
  
  if (userId) {
    eventFilter = 'WHERE e.owner_id = $1';
    params = [userId];
  }
  
  const query = `
    SELECT 
      COUNT(DISTINCT e.id) as total_events,
      COUNT(DISTINCT a.id) as total_attendees,
      COUNT(DISTINCT CASE WHEN a.attended = true THEN a.id END) as total_attended,
      COUNT(DISTINCT CASE WHEN e.event_date >= CURRENT_DATE THEN e.id END) as upcoming_events
    FROM events e
    LEFT JOIN attendees a ON e.id = a.event_id AND a.status != 'cancelled'
    ${eventFilter}
  `;
  
  const result = await executeQuery(query, params);
  return result[0];
};

// ==================== COMPATIBILITY FUNCTIONS ====================
// These maintain compatibility with the existing IndexedDB interface

export const registerUser = async (userData) => {
  return await createUser(userData);
};

export const loginUser = async (email, password) => {
  const user = await getUserByEmail(email);
  if (user && user.password_hash === password) { // In production, use proper password hashing
    await updateUserLastLogin(user.id);
    return user;
  }
  return null;
};

// Export all functions for backward compatibility
export {
  // Keep existing function names for compatibility
  createEvent as addEvent,
  updateAttendeeStatus as markAttendance
};
