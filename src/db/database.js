import Dexie from 'dexie';
import * as DatabaseAdapter from './databaseAdapter.js';

// Define the IndexedDB database (kept as fallback)
export const db = new Dexie('EventsXDatabase');

db.version(1).stores({
  users: '++id, email, role',
  events: '++id, title, startDate, endDate, ownerId',
  attendees: '++id, eventId, name, email, contact, attended',
});

// Initialize super admin and sample events on first load
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

  // Sample events disabled for production
  // Uncomment below to enable demo/seed data for testing:
  // const eventCount = await db.events.count();
  // if (eventCount === 0) {
  //   await seedSampleEvents();
  // }
});

// Seed sample events for demonstration
const seedSampleEvents = async () => {
  const sampleEvents = [
    {
      id: 1,
      title: 'Tech Conference 2025',
      description: 'Annual technology conference featuring the latest innovations in AI, blockchain, and web development.',
      startDate: '2025-03-15',
      endDate: '2025-03-17',
      venue: 'Singapore Convention Centre',
      capacity: 500,
      ownerId: 1,
      organisers: [
        { name: 'TechCorp Singapore', detail: 'Leading technology company' }
      ],
      speakers: [
        { name: 'Dr. Sarah Chen', title: 'AI Research Director', photo: null },
        { name: 'Mike Johnson', title: 'Blockchain Expert', photo: null }
      ],
      sponsors: [
        { name: 'TechCorp', logo: null },
        { name: 'InnovateLab', logo: null }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Digital Marketing Summit',
      description: 'Learn the latest digital marketing strategies and network with industry professionals.',
      startDate: '2025-04-20',
      endDate: '2025-04-20',
      venue: 'Marina Bay Sands',
      capacity: 300,
      ownerId: 1,
      organisers: [
        { name: 'Marketing Pro', detail: 'Digital marketing agency' }
      ],
      speakers: [
        { name: 'Lisa Wong', title: 'Social Media Strategist', photo: null },
        { name: 'David Kim', title: 'SEO Specialist', photo: null }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      title: 'Startup Pitch Night',
      description: 'Watch innovative startups pitch their ideas to investors and vote for your favorite.',
      startDate: '2025-05-10',
      endDate: '2025-05-10',
      venue: 'The Hive Singapore',
      capacity: 150,
      ownerId: 1,
      organisers: [
        { name: 'Startup Hub', detail: 'Entrepreneurship community' }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      title: 'Web Development Workshop',
      description: 'Hands-on workshop covering React, Node.js, and modern web development practices.',
      startDate: '2025-06-05',
      endDate: '2025-06-07',
      venue: 'NUS School of Computing',
      capacity: 100,
      ownerId: 1,
      organisers: [
        { name: 'CodeCraft Academy', detail: 'Programming education center' }
      ],
      speakers: [
        { name: 'Alex Tan', title: 'Full Stack Developer', photo: null }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 5,
      title: 'Cybersecurity Awareness Seminar',
      description: 'Essential cybersecurity knowledge for businesses and individuals in the digital age.',
      startDate: '2025-07-12',
      endDate: '2025-07-12',
      venue: 'Raffles City Convention Centre',
      capacity: 250,
      ownerId: 1,
      organisers: [
        { name: 'SecureNet Solutions', detail: 'Cybersecurity consultancy' }
      ],
      speakers: [
        { name: 'Jennifer Lee', title: 'Security Analyst', photo: null },
        { name: 'Robert Zhang', title: 'Ethical Hacker', photo: null }
      ],
      sponsors: [
        { name: 'CyberGuard', logo: null }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  for (const event of sampleEvents) {
    await db.events.put(event);
  }

  console.log('Sample events seeded successfully');
};

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

// ==================== PRODUCTION DATABASE ADAPTER ====================
// Export adapter functions that automatically switch between Neon and IndexedDB

// Export production database functions
export const {
  getEventAnalytics,
  getDashboardStats,
  getDatabaseMode,
  getDatabaseStatus,
  migrateFromIndexedDBToNeon
} = DatabaseAdapter;

// Note: Main functions are automatically overridden by the adapter
// The adapter will use Neon when available, IndexedDB as fallback
