import { supabase } from '../config/supabase.js';

// =====================================================
// USER OPERATIONS
// =====================================================

export const registerUser = async (userData) => {
  const { email, password, contact, role = 'owner', firstName, lastName } = userData;
  
  // Check if user exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .ilike('email', email)
    .single();
  
  if (existing) {
    throw new Error('User with this email already exists');
  }
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password: password,
      role: role,
      contact: contact || '',
      first_name: firstName || '',
      last_name: lastName || ''
    })
    .select('id, email, role')
    .single();
  
  if (error) {
    console.error('Error registering user:', error);
    throw new Error(error.message);
  }
  
  return data.id;
};

export const loginUser = async (email, password) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, password, role, contact, first_name, last_name')
    .ilike('email', email)
    .single();
  
  if (error || !data) {
    throw new Error('User not found');
  }
  
  if (data.password !== password) {
    throw new Error('Invalid password');
  }
  
  return {
    id: data.id,
    email: data.email,
    role: data.role,
    contact: data.contact,
    firstName: data.first_name,
    lastName: data.last_name
  };
};

export const getUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, contact, first_name, last_name')
    .ilike('email', email)
    .single();
  
  if (error) return null;
  return data;
};

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, contact, first_name, last_name, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return data || [];
};

// =====================================================
// EVENT OPERATIONS
// =====================================================

export const createEvent = async (eventData) => {
  console.log('📝 Creating event in Supabase:', eventData.title);
  
  // Get or create owner
  let ownerId = eventData.ownerId || null;
  
  // Try to create/get user if email provided
  if (!ownerId && eventData.creatorEmail) {
    const email = eventData.creatorEmail;
    try {
      let user = await getUserByEmail(email);
      
      if (!user) {
        console.log('Creating new user:', email);
        ownerId = await registerUser({
          email: email,
          password: eventData.creatorPassword || 'EventsX2024!',
          contact: eventData.creatorContact || '',
          role: 'owner'
        });
      } else {
        ownerId = user.id;
      }
    } catch (e) {
      console.warn('Could not create/get user, continuing without owner:', e.message);
      ownerId = null;
    }
  }
  
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      event_type: eventData.eventType || 'conference',
      start_date: eventData.startDate || new Date().toISOString().split('T')[0],
      end_date: eventData.endDate || eventData.startDate || new Date().toISOString().split('T')[0],
      venue: eventData.venue || '',
      capacity: parseInt(eventData.capacity) || 100,
      logo: eventData.logo || null,
      image: eventData.image || null,
      owner_id: ownerId,
      organisers: eventData.organisers || [],
      speakers: eventData.speakers || [],
      sponsors: eventData.sponsors || [],
      status: 'active'
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating event:', error);
    throw new Error(error.message);
  }
  
  console.log('✅ Event created with ID:', data.id);
  
  // Return with mapped field names
  return {
    ...data,
    startDate: data.start_date,
    endDate: data.end_date,
    eventType: data.event_type,
    ownerId: data.owner_id
  };
};

export const getEvent = async (eventId) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .neq('status', 'deleted')
    .single();
  
  if (error || !data) return null;
  
  // Map to frontend format
  return {
    ...data,
    startDate: data.start_date,
    endDate: data.end_date,
    eventType: data.event_type,
    ownerId: data.owner_id,
    organisers: data.organisers || [],
    speakers: data.speakers || [],
    sponsors: data.sponsors || []
  };
};

export const getAllEvents = async () => {
  console.log('📊 Fetching all events from Supabase...');
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .neq('status', 'deleted')
    .order('start_date', { ascending: true, nullsFirst: false });
  
  if (error) {
    console.error('❌ Error fetching events:', error);
    return [];
  }
  
  console.log(`✅ Found ${data?.length || 0} events`);
  
  // Map to frontend format
  return (data || []).map(event => ({
    ...event,
    startDate: event.start_date,
    endDate: event.end_date,
    eventType: event.event_type,
    ownerId: event.owner_id,
    organisers: event.organisers || [],
    speakers: event.speakers || [],
    sponsors: event.sponsors || []
  }));
};

export const updateEvent = async (eventId, eventData) => {
  const updateData = {};
  
  if (eventData.title !== undefined) updateData.title = eventData.title;
  if (eventData.description !== undefined) updateData.description = eventData.description;
  if (eventData.startDate !== undefined) updateData.start_date = eventData.startDate;
  if (eventData.endDate !== undefined) updateData.end_date = eventData.endDate;
  if (eventData.venue !== undefined) updateData.venue = eventData.venue;
  if (eventData.capacity !== undefined) updateData.capacity = eventData.capacity;
  if (eventData.logo !== undefined) updateData.logo = eventData.logo;
  if (eventData.image !== undefined) updateData.image = eventData.image;
  if (eventData.organisers !== undefined) updateData.organisers = eventData.organisers;
  if (eventData.speakers !== undefined) updateData.speakers = eventData.speakers;
  if (eventData.sponsors !== undefined) updateData.sponsors = eventData.sponsors;
  
  updateData.updated_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating event:', error);
    throw new Error(error.message);
  }
  
  return data;
};

export const deleteEvent = async (eventId) => {
  const { error } = await supabase
    .from('events')
    .update({ status: 'deleted' })
    .eq('id', eventId);
  
  if (error) {
    console.error('Error deleting event:', error);
    throw new Error(error.message);
  }
};

// =====================================================
// ATTENDEE OPERATIONS
// =====================================================

export const registerAttendee = async (attendeeData) => {
  const { data, error } = await supabase
    .from('attendees')
    .insert({
      event_id: attendeeData.eventId,
      name: attendeeData.name,
      email: attendeeData.email,
      contact: attendeeData.contact || '',
      notes: attendeeData.notes || '',
      attended: false
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error registering attendee:', error);
    throw new Error(error.message);
  }
  
  return data;
};

export const getAttendeesByEvent = async (eventId) => {
  const { data, error } = await supabase
    .from('attendees')
    .select('*')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching attendees:', error);
    return [];
  }
  
  return data || [];
};

export const updateAttendeeStatus = async (attendeeId, attended) => {
  const { error } = await supabase
    .from('attendees')
    .update({ 
      attended: attended,
      check_in_time: attended ? new Date().toISOString() : null
    })
    .eq('id', attendeeId);
  
  if (error) {
    console.error('Error updating attendee:', error);
    throw new Error(error.message);
  }
};

export const searchAttendees = async (eventId, query) => {
  const { data, error } = await supabase
    .from('attendees')
    .select('*')
    .eq('event_id', eventId)
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('name');
  
  if (error) {
    console.error('Error searching attendees:', error);
    return [];
  }
  
  return data || [];
};

// =====================================================
// LISTING OPERATIONS (Marketplace)
// =====================================================

export const createListing = async (listingData) => {
  console.log('📝 Creating listing in Supabase:', listingData.title);
  
  // Get or create owner
  let ownerId = null;
  
  if (listingData.email) {
    try {
      let user = await getUserByEmail(listingData.email);
      
      if (!user) {
        console.log('Creating new user for listing:', listingData.email);
        ownerId = await registerUser({
          email: listingData.email,
          password: listingData.password || 'LinkMeU2024!',
          contact: listingData.contact || '',
          role: 'owner'
        });
      } else {
        ownerId = user.id;
      }
    } catch (e) {
      console.warn('Could not create/get user for listing:', e.message);
    }
  }
  
  // Check for duplicate listing (same title and email)
  const { data: existingListing } = await supabase
    .from('listings')
    .select('id')
    .eq('title', listingData.title || 'Untitled Listing')
    .eq('email', listingData.email || '')
    .neq('status', 'deleted')
    .single();
  
  if (existingListing) {
    throw new Error('A listing with this title already exists for your account. Please use a different title.');
  }
  
  const { data, error } = await supabase
    .from('listings')
    .insert({
      category: listingData.category,
      title: listingData.title || 'Untitled Listing',
      description: listingData.description || '',
      from_date: listingData.fromDate || null,
      to_date: listingData.toDate || null,
      budget_min: parseFloat(listingData.budgetMin) || null,
      budget_max: parseFloat(listingData.budgetMax) || null,
      currency: listingData.currency || 'SGD',
      revenue: listingData.revenue || '',
      location: listingData.location || 'Singapore',
      contact: listingData.contact || '',
      whatsapp: listingData.whatsapp || listingData.contact || '',
      email: listingData.email || '',
      images: listingData.images || [],
      owner_id: ownerId,
      status: 'pending' // Requires admin approval before listing is visible
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating listing:', error);
    throw new Error(error.message);
  }
  
  console.log('✅ Listing created with ID:', data.id);
  return mapListingToFrontend(data);
};

export const getListing = async (listingId) => {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .neq('status', 'deleted')
    .single();
  
  if (error || !data) return null;
  return mapListingToFrontend(data);
};

export const getListingsByCategory = async (category) => {
  console.log('📊 Fetching listings for category:', category);
  
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('category', category)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching listings:', error);
    return [];
  }
  
  console.log(`✅ Found ${data?.length || 0} listings for ${category}`);
  return (data || []).map(mapListingToFrontend);
};

export const getAllListings = async (includeAll = false) => {
  console.log('📊 Fetching listings from Supabase...', includeAll ? '(all statuses)' : '(active + pending)');
  
  let query = supabase
    .from('listings')
    .select('*')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });
  
  // For public view, show active and pending listings (pending shown blurred)
  if (!includeAll) {
    query = query.in('status', ['active', 'pending']);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('❌ Error fetching listings:', error);
    console.error('Error details:', JSON.stringify(error));
    return [];
  }
  
  console.log(`✅ Found ${data?.length || 0} listings`);
  return (data || []).map(mapListingToFrontend).filter(Boolean);
};

export const updateListing = async (listingId, listingData) => {
  const updateData = {};
  
  if (listingData.title !== undefined) updateData.title = listingData.title;
  if (listingData.description !== undefined) updateData.description = listingData.description;
  if (listingData.category !== undefined) updateData.category = listingData.category;
  if (listingData.location !== undefined) updateData.location = listingData.location;
  if (listingData.fromDate !== undefined) updateData.from_date = listingData.fromDate;
  if (listingData.toDate !== undefined) updateData.to_date = listingData.toDate;
  if (listingData.budgetMin !== undefined) updateData.budget_min = listingData.budgetMin;
  if (listingData.budgetMax !== undefined) updateData.budget_max = listingData.budgetMax;
  if (listingData.revenue !== undefined) updateData.revenue = listingData.revenue;
  if (listingData.images !== undefined) updateData.images = listingData.images;
  if (listingData.status !== undefined) updateData.status = listingData.status;
  
  updateData.updated_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('listings')
    .update(updateData)
    .eq('id', listingId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating listing:', error);
    throw new Error(error.message);
  }
  
  return mapListingToFrontend(data);
};

export const deleteListing = async (listingId) => {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'deleted' })
    .eq('id', listingId);
  
  if (error) {
    console.error('Error deleting listing:', error);
    throw new Error(error.message);
  }
};

// Helper to map database fields to frontend format
const mapListingToFrontend = (listing) => {
  if (!listing) return null;
  return {
    id: listing.id,
    category: listing.category,
    title: listing.title,
    description: listing.description,
    fromDate: listing.from_date,
    toDate: listing.to_date,
    budgetMin: listing.budget_min,
    budgetMax: listing.budget_max,
    currency: listing.currency,
    revenue: listing.revenue,
    location: listing.location,
    contact: listing.contact,
    whatsapp: listing.whatsapp || listing.contact,
    email: listing.email,
    images: listing.images || [],
    ownerId: listing.owner_id,
    isPaid: listing.is_paid ?? false, // Use nullish coalescing for safety
    status: listing.status,
    createdAt: listing.created_at,
    updatedAt: listing.updated_at
  };
};

// =====================================================
// CLUB OPERATIONS
// =====================================================

export const createClub = async (clubData) => {
  console.log('📝 Creating club in Supabase:', clubData.name);
  
  const { data, error } = await supabase
    .from('clubs')
    .insert({
      name: clubData.name,
      description: clubData.description || '',
      logo: clubData.logo || null,
      contact_person: clubData.contactPerson || '',
      contact: clubData.contact || '',
      email: clubData.email,
      address: clubData.address || '',
      postal_code: clubData.postalCode || '',
      website: clubData.website || '',
      opening_hours: clubData.openingHours || {},
      annual_fee: clubData.annualFee || 120
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating club:', error);
    throw new Error(error.message);
  }
  
  console.log('✅ Club created with ID:', data.id);
  return mapClubToFrontend(data);
};

export const updateClub = async (clubId, clubData) => {
  console.log('📝 Updating club:', clubId);
  
  const { data, error } = await supabase
    .from('clubs')
    .update({
      name: clubData.name,
      description: clubData.description || '',
      logo: clubData.logo || null,
      contact_person: clubData.contactPerson || '',
      contact: clubData.contact || '',
      email: clubData.email,
      address: clubData.address || '',
      postal_code: clubData.postalCode || '',
      website: clubData.website || '',
      opening_hours: clubData.openingHours || {},
      annual_fee: clubData.annualFee || 120,
      updated_at: new Date().toISOString()
    })
    .eq('id', clubId)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error updating club:', error);
    throw new Error(error.message);
  }
  
  return mapClubToFrontend(data);
};

export const deleteClub = async (clubId) => {
  console.log('🗑️ Deleting club:', clubId);
  
  // First delete all members of this club
  await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId);
  
  const { error } = await supabase
    .from('clubs')
    .delete()
    .eq('id', clubId);
  
  if (error) {
    console.error('❌ Error deleting club:', error);
    throw new Error(error.message);
  }
  
  console.log('✅ Club deleted');
};

export const getAllClubs = async () => {
  console.log('📊 Fetching all clubs from Supabase...');
  
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching clubs:', error);
    return [];
  }
  
  console.log(`✅ Found ${data?.length || 0} clubs`);
  return (data || []).map(mapClubToFrontend);
};

export const getClub = async (clubId) => {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', clubId)
    .single();
  
  if (error || !data) return null;
  return mapClubToFrontend(data);
};

const mapClubToFrontend = (club) => {
  if (!club) return null;
  return {
    id: club.id,
    name: club.name,
    description: club.description,
    logo: club.logo,
    contactPerson: club.contact_person,
    contact: club.contact,
    email: club.email,
    address: club.address || '',
    postalCode: club.postal_code || '',
    website: club.website || '',
    openingHours: club.opening_hours || {},
    annualFee: club.annual_fee,
    createdAt: club.created_at,
    updatedAt: club.updated_at
  };
};

// =====================================================
// CLUB MEMBER OPERATIONS
// =====================================================

export const createClubMember = async (memberData) => {
  console.log('📝 Creating club member in Supabase:', memberData.name);
  
  const { data, error } = await supabase
    .from('club_members')
    .insert({
      club_id: memberData.clubId,
      name: memberData.name,
      photo: memberData.photo || null,
      contact: memberData.contact || '',
      email: memberData.email,
      comments: memberData.comments || '',
      registration_date: memberData.registrationDate,
      membership_type: memberData.membershipType || 'annual',
      payment_status: memberData.paymentStatus || 'not_paid',
      amount_paid: memberData.amountPaid || 0,
      prorata_fee: memberData.prorataFee || 0,
      member_category: memberData.memberCategory || 'individual',
      ic_passport: memberData.icPassport || '',
      nationality: memberData.nationality || '',
      roc_number: memberData.rocNumber || '',
      country: memberData.country || ''
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating club member:', error);
    throw new Error(error.message);
  }
  
  console.log('✅ Club member created with ID:', data.id);
  return mapMemberToFrontend(data);
};

export const updateClubMember = async (memberId, memberData) => {
  console.log('📝 Updating club member:', memberId);
  
  const { data, error } = await supabase
    .from('club_members')
    .update({
      club_id: memberData.clubId,
      name: memberData.name,
      photo: memberData.photo || null,
      contact: memberData.contact || '',
      email: memberData.email,
      comments: memberData.comments || '',
      registration_date: memberData.registrationDate,
      membership_type: memberData.membershipType || 'annual',
      payment_status: memberData.paymentStatus || 'not_paid',
      amount_paid: memberData.amountPaid || 0,
      prorata_fee: memberData.prorataFee || 0,
      member_category: memberData.memberCategory || 'individual',
      ic_passport: memberData.icPassport || '',
      nationality: memberData.nationality || '',
      roc_number: memberData.rocNumber || '',
      country: memberData.country || '',
      updated_at: new Date().toISOString()
    })
    .eq('id', memberId)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error updating club member:', error);
    throw new Error(error.message);
  }
  
  return mapMemberToFrontend(data);
};

export const deleteClubMember = async (memberId) => {
  console.log('🗑️ Deleting club member:', memberId);
  
  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('id', memberId);
  
  if (error) {
    console.error('❌ Error deleting club member:', error);
    throw new Error(error.message);
  }
  
  console.log('✅ Club member deleted');
};

export const getAllClubMembers = async () => {
  console.log('📊 Fetching all club members from Supabase...');
  
  const { data, error } = await supabase
    .from('club_members')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching club members:', error);
    return [];
  }
  
  console.log(`✅ Found ${data?.length || 0} club members`);
  return (data || []).map(mapMemberToFrontend);
};

export const getClubMembers = async (clubId) => {
  const { data, error } = await supabase
    .from('club_members')
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching club members:', error);
    return [];
  }
  
  return (data || []).map(mapMemberToFrontend);
};

export const bulkCreateClubMembers = async (members) => {
  console.log('📝 Bulk creating club members:', members.length);
  
  const membersToInsert = members.map(m => ({
    club_id: m.clubId,
    name: m.name,
    contact: m.contact || '',
    email: m.email,
    comments: m.comments || '',
    registration_date: m.registrationDate,
    membership_type: m.membershipType || 'annual',
    payment_status: m.paymentStatus || 'not_paid',
    amount_paid: m.amountPaid || 0,
    prorata_fee: m.prorataFee || 0
  }));
  
  const { data, error } = await supabase
    .from('club_members')
    .insert(membersToInsert)
    .select();
  
  if (error) {
    console.error('❌ Error bulk creating club members:', error);
    throw new Error(error.message);
  }
  
  console.log(`✅ Created ${data?.length || 0} club members`);
  return (data || []).map(mapMemberToFrontend);
};

const mapMemberToFrontend = (member) => {
  if (!member) return null;
  return {
    id: member.id,
    clubId: member.club_id,
    name: member.name,
    photo: member.photo || '',
    contact: member.contact,
    email: member.email,
    comments: member.comments,
    registrationDate: member.registration_date,
    membershipType: member.membership_type,
    paymentStatus: member.payment_status,
    amountPaid: member.amount_paid,
    prorataFee: member.prorata_fee,
    memberCategory: member.member_category || 'individual',
    icPassport: member.ic_passport || '',
    nationality: member.nationality || '',
    rocNumber: member.roc_number || '',
    country: member.country || '',
    createdAt: member.created_at,
    updatedAt: member.updated_at
  };
};

// =====================================================
// DATABASE STATUS
// =====================================================

export const getDatabaseStatus = async () => {
  try {
    const { data, error } = await supabase.from('events').select('count').limit(1);
    
    return {
      mode: 'supabase',
      connected: !error,
      message: error ? error.message : 'Connected to Supabase'
    };
  } catch (e) {
    return {
      mode: 'supabase',
      connected: false,
      message: e.message
    };
  }
};

// =====================================================
// LEAD CAPTURE OPERATIONS
// =====================================================

export const createLead = async (leadData) => {
  console.log('📝 Creating lead:', JSON.stringify(leadData, null, 2));
  
  // Validate required fields
  if (!leadData.listingId) {
    console.error('❌ Missing listingId in leadData');
    throw new Error('Listing ID is required');
  }
  if (!leadData.contact) {
    console.error('❌ Missing contact in leadData');
    throw new Error('Contact is required');
  }
  
  const insertData = {
    listing_id: leadData.listingId,
    listing_title: leadData.listingTitle || '',
    name: leadData.name || 'Guest',
    contact: leadData.contact,
    email: leadData.email || '',
    event_date: leadData.eventDate || null,
    status: 'new',
    notes: leadData.notes || ''
  };
  
  console.log('📤 Inserting into leads table:', JSON.stringify(insertData, null, 2));
  
  const { data, error } = await supabase
    .from('leads')
    .insert(insertData)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Supabase error creating lead:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error details:', error.details);
    console.error('❌ Error hint:', error.hint);
    throw new Error(error.message || 'Failed to create lead');
  }
  
  if (!data) {
    console.error('❌ No data returned from insert');
    throw new Error('No data returned from lead creation');
  }
  
  console.log('✅ Lead created successfully:', data.id);
  return mapLeadToFrontend(data);
};

export const getAllLeads = async () => {
  console.log('📊 Fetching all leads...');
  
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching leads:', error);
    return [];
  }
  
  console.log(`✅ Found ${data?.length || 0} leads`);
  return (data || []).map(mapLeadToFrontend);
};

export const getLeadsByListing = async (listingId) => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching leads for listing:', error);
    return [];
  }
  
  return (data || []).map(mapLeadToFrontend);
};

export const updateLeadStatus = async (leadId, status, notes = '') => {
  const { data, error } = await supabase
    .from('leads')
    .update({ status, notes, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating lead:', error);
    throw new Error(error.message);
  }
  
  return mapLeadToFrontend(data);
};

export const deleteLead = async (leadId) => {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId);
  
  if (error) {
    console.error('Error deleting lead:', error);
    throw new Error(error.message);
  }
  
  return true;
};

const mapLeadToFrontend = (lead) => {
  if (!lead) return null;
  return {
    id: lead.id,
    listingId: lead.listing_id,
    listingTitle: lead.listing_title,
    name: lead.name,
    contact: lead.contact,
    email: lead.email,
    eventDate: lead.event_date,
    status: lead.status,
    notes: lead.notes,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at
  };
};
