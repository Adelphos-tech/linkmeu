import Dexie from 'dexie';

export const db = new Dexie('EventsXDB');

db.version(1).stores({
  users: '++id, email, role',
  events: '++id, title, date, ownerId',
  attendees: '++id, eventId, name, email, contact, attended',
});

// Initialize super admin on first load
db.on('ready', async () => {
  const superAdmin = await db.users.where('email').equals('Robocorpsg@gmail.com').first();
  if (!superAdmin) {
    await db.users.add({
      email: 'Robocorpsg@gmail.com',
      password: '[REDACTED]', // In production, this should be hashed
      role: 'superadmin',
      contact: '+65 0000 0000',
      createdAt: new Date().toISOString()
    });
  }
});

// Helper functions
export const saveEvent = async (eventData) => {
  try {
    const id = await db.events.put(eventData);
    return id;
  } catch (error) {
    console.error('Error saving event:', error);
    throw error;
  }
};

export const getEvent = async (id) => {
  try {
    return await db.events.get(id);
  } catch (error) {
    console.error('Error getting event:', error);
    throw error;
  }
};

export const getAllEvents = async () => {
  try {
    return await db.events.toArray();
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    await db.attendees.where('eventId').equals(id).delete();
    await db.events.delete(id);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

export const saveAttendee = async (attendeeData) => {
  try {
    const id = await db.attendees.add(attendeeData);
    return id;
  } catch (error) {
    console.error('Error saving attendee:', error);
    throw error;
  }
};

export const getAttendeesByEvent = async (eventId) => {
  try {
    return await db.attendees.where('eventId').equals(eventId).toArray();
  } catch (error) {
    console.error('Error getting attendees:', error);
    throw error;
  }
};

export const updateAttendeeStatus = async (id, attended) => {
  try {
    await db.attendees.update(id, { attended });
  } catch (error) {
    console.error('Error updating attendee:', error);
    throw error;
  }
};

export const searchAttendees = async (eventId, query) => {
  try {
    const attendees = await db.attendees.where('eventId').equals(eventId).toArray();
    const lowerQuery = query.toLowerCase();
    return attendees.filter(a => 
      a.name.toLowerCase().includes(lowerQuery) ||
      a.email.toLowerCase().includes(lowerQuery) ||
      (a.contact && a.contact.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error('Error searching attendees:', error);
    throw error;
  }
};

// User authentication functions
export const registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await db.users.where('email').equals(userData.email).first();
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    const id = await db.users.add({
      ...userData,
      role: 'owner',
      createdAt: new Date().toISOString()
    });
    return id;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const user = await db.users.where('email').equals(email).first();
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.password !== password) {
      throw new Error('Invalid password');
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    return await db.users.get(id);
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const getEventsByOwner = async (ownerId) => {
  try {
    return await db.events.where('ownerId').equals(ownerId).toArray();
  } catch (error) {
    console.error('Error getting events by owner:', error);
    throw error;
  }
};
