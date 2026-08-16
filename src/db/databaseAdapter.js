// Database Adapter - API backend for production
import * as ApiDB from './apiAdapter.js';

// Database mode - Always Supabase for production
const databaseMode = 'supabase';

console.log('🚀 Database Adapter initialized - Using Supabase');

// ==================== USER OPERATIONS ====================

export const registerUser = async (userData) => {
  return await ApiDB.registerUser(userData);
};

export const loginUser = async (email, password) => {
  return await ApiDB.loginUser(email, password);
};

export const getUserByEmail = async (email) => {
  return await ApiDB.getUserByEmail(email);
};

export const getAllUsers = async () => {
  return await ApiDB.getAllUsers();
};

// ==================== EVENT OPERATIONS ====================

export const addEvent = async (eventData) => {
  return await ApiDB.createEvent(eventData);
};

export const createEvent = async (eventData) => {
  return await ApiDB.createEvent(eventData);
};

export const getEvent = async (eventId) => {
  return await ApiDB.getEvent(eventId);
};

export const getAllEvents = async () => {
  return await ApiDB.getAllEvents();
};

export const updateEvent = async (eventId, eventData) => {
  return await ApiDB.updateEvent(eventId, eventData);
};

export const deleteEvent = async (eventId) => {
  return await ApiDB.deleteEvent(eventId);
};

// ==================== ATTENDEE OPERATIONS ====================

export const registerAttendee = async (attendeeData) => {
  return await ApiDB.registerAttendee(attendeeData);
};

export const addAttendee = async (attendeeData) => {
  return await ApiDB.registerAttendee(attendeeData);
};

export const getAttendeesByEvent = async (eventId) => {
  return await ApiDB.getAttendeesByEvent(eventId);
};

export const updateAttendeeStatus = async (attendeeId, attended) => {
  return await ApiDB.updateAttendeeStatus(attendeeId, attended);
};

export const markAttendance = async (attendeeId, attended) => {
  return await ApiDB.updateAttendeeStatus(attendeeId, attended);
};

export const searchAttendees = async (eventId, query) => {
  return await ApiDB.searchAttendees(eventId, query);
};

// ==================== LISTING OPERATIONS (Marketplace) ====================

export const createListing = async (listingData) => {
  return await ApiDB.createListing(listingData);
};

export const getListing = async (listingId) => {
  return await ApiDB.getListing(listingId);
};

export const getListingsByCategory = async (category) => {
  return await ApiDB.getListingsByCategory(category);
};

export const getAllListings = async (includeAll = false) => {
  return await ApiDB.getAllListings(includeAll);
};

// Get all listings including pending (for admin)
export const getAllListingsAdmin = async () => {
  return await ApiDB.getAllListings(true);
};

export const updateListing = async (listingId, listingData) => {
  return await ApiDB.updateListing(listingId, listingData);
};

export const deleteListing = async (listingId) => {
  return await ApiDB.deleteListing(listingId);
};

// ==================== DATABASE STATUS ====================

export const getDatabaseMode = () => {
  return databaseMode;
};

export const getDatabaseStatus = async () => {
  return await ApiDB.getDatabaseStatus();
};

// ==================== ANALYTICS (Simplified) ====================

export const getEventAnalytics = async (eventId) => {
  const attendees = await ApiDB.getAttendeesByEvent(eventId);
  return {
    total_registered: attendees.length,
    total_attended: attendees.filter(a => a.attended).length,
    pending_registrations: attendees.filter(a => !a.attended).length
  };
};

export const getDashboardStats = async (userId = null) => {
  const events = await ApiDB.getAllEvents();
  const filteredEvents = userId ? events.filter(e => e.ownerId === userId) : events;
  
  let totalAttendees = 0;
  let totalAttended = 0;
  
  for (const event of filteredEvents) {
    const attendees = await ApiDB.getAttendeesByEvent(event.id);
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

// ==================== LEAD OPERATIONS ====================

export const createLead = async (leadData) => {
  return await ApiDB.createLead(leadData);
};

export const getAllLeads = async () => {
  return await ApiDB.getAllLeads();
};

export const getLeadsByListing = async (listingId) => {
  return await ApiDB.getLeadsByListing(listingId);
};

export const updateLeadStatus = async (leadId, status, notes) => {
  return await ApiDB.updateLeadStatus(leadId, status, notes);
};

export const deleteLead = async (leadId) => {
  return await ApiDB.deleteLead(leadId);
};

// ==================== CLUB OPERATIONS ====================

export const getAllClubs = async () => {
  return await ApiDB.getAllClubs();
};

export const getClub = async (clubId) => {
  return await ApiDB.getClub(clubId);
};

export const getClubMembers = async (clubId) => {
  return await ApiDB.getClubMembers(clubId);
};

export const getAllClubMembers = async () => {
  return await ApiDB.getAllClubMembers();
};

export const createClub = async (clubData) => {
  return await ApiDB.createClub(clubData);
};

export const updateClub = async (clubId, clubData) => {
  return await ApiDB.updateClub(clubId, clubData);
};

export const deleteClub = async (clubId) => {
  return await ApiDB.deleteClub(clubId);
};

export const createClubMember = async (memberData) => {
  return await ApiDB.createClubMember(memberData);
};

export const updateClubMember = async (memberId, memberData) => {
  return await ApiDB.updateClubMember(memberId, memberData);
};

export const deleteClubMember = async (memberId) => {
  return await ApiDB.deleteClubMember(memberId);
};

export const bulkCreateClubMembers = async (membersData) => {
  return await ApiDB.bulkCreateClubMembers(membersData);
};
