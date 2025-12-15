// Database Adapter - Switches between Neon and IndexedDB based on configuration
import { checkDatabaseHealth } from '../config/database.js';

// Import Neon database functions
import * as NeonDB from './neonDatabase.js';

// Import existing IndexedDB functions as fallback
import * as IndexedDB from './database.js';

// Database mode detection
let databaseMode = 'detecting';
let neonAvailable = false;

// Check which database to use
const detectDatabaseMode = async () => {
  if (databaseMode !== 'detecting') {
    return databaseMode;
  }

  try {
    // Check if Neon database is configured and available
    const health = await checkDatabaseHealth();
    
    if (health.healthy) {
      console.log('✅ Neon database available - using production mode');
      databaseMode = 'neon';
      neonAvailable = true;
    } else {
      console.log('⚠️ Neon database not available - falling back to IndexedDB');
      databaseMode = 'indexeddb';
      neonAvailable = false;
    }
  } catch (error) {
    console.log('⚠️ Neon database check failed - using IndexedDB fallback');
    databaseMode = 'indexeddb';
    neonAvailable = false;
  }

  return databaseMode;
};

// Generic adapter function
const createAdapter = (neonFunction, indexedFunction) => {
  return async (...args) => {
    const mode = await detectDatabaseMode();
    
    try {
      if (mode === 'neon' && neonAvailable) {
        return await neonFunction(...args);
      } else {
        return await indexedFunction(...args);
      }
    } catch (error) {
      console.error(`Database operation failed in ${mode} mode:`, error);
      
      // If Neon fails, try IndexedDB as fallback
      if (mode === 'neon') {
        console.log('🔄 Neon operation failed, trying IndexedDB fallback...');
        try {
          return await indexedFunction(...args);
        } catch (fallbackError) {
          console.error('IndexedDB fallback also failed:', fallbackError);
          throw new Error(`Both database modes failed: ${error.message}`);
        }
      } else {
        throw error;
      }
    }
  };
};

// ==================== ADAPTED FUNCTIONS ====================

// User operations
export const registerUser = createAdapter(
  NeonDB.registerUser,
  IndexedDB.registerUser
);

export const loginUser = createAdapter(
  NeonDB.loginUser,
  IndexedDB.loginUser
);

export const getUserByEmail = createAdapter(
  NeonDB.getUserByEmail,
  (email) => IndexedDB.db.users.where('email').equals(email).first()
);

// Event operations
export const addEvent = createAdapter(
  NeonDB.createEvent,
  IndexedDB.addEvent
);

export const getEvent = createAdapter(
  NeonDB.getEvent,
  IndexedDB.getEvent
);

export const getAllEvents = createAdapter(
  NeonDB.getAllEvents,
  IndexedDB.getAllEvents
);

export const updateEvent = createAdapter(
  NeonDB.updateEvent,
  IndexedDB.updateEvent
);

export const deleteEvent = createAdapter(
  NeonDB.deleteEvent,
  IndexedDB.deleteEvent
);

// Attendee operations
export const registerAttendee = createAdapter(
  NeonDB.registerAttendee,
  IndexedDB.addAttendee
);

export const getAttendeesByEvent = createAdapter(
  NeonDB.getAttendeesByEvent,
  IndexedDB.getAttendeesByEvent
);

export const updateAttendeeStatus = createAdapter(
  NeonDB.updateAttendeeStatus,
  IndexedDB.updateAttendeeStatus
);

export const searchAttendees = createAdapter(
  NeonDB.searchAttendees,
  IndexedDB.searchAttendees
);

// Additional Neon-specific functions (with IndexedDB fallbacks)
export const getEventAnalytics = createAdapter(
  NeonDB.getEventAnalytics,
  async (eventId) => {
    // Fallback analytics calculation for IndexedDB
    const attendees = await IndexedDB.getAttendeesByEvent(eventId);
    return {
      total_registered: attendees.length,
      total_attended: attendees.filter(a => a.attended).length,
      pending_registrations: attendees.filter(a => !a.attended).length,
      recent_registrations: attendees.filter(a => {
        const regDate = new Date(a.registrationDate || a.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return regDate > weekAgo;
      }).length
    };
  }
);

export const getDashboardStats = createAdapter(
  NeonDB.getDashboardStats,
  async (userId = null) => {
    // Fallback dashboard stats for IndexedDB
    const events = await IndexedDB.getAllEvents();
    const filteredEvents = userId ? events.filter(e => e.ownerId === userId) : events;
    
    let totalAttendees = 0;
    let totalAttended = 0;
    
    for (const event of filteredEvents) {
      const attendees = await IndexedDB.getAttendeesByEvent(event.id);
      totalAttendees += attendees.length;
      totalAttended += attendees.filter(a => a.attended).length;
    }
    
    const upcomingEvents = filteredEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= new Date();
    }).length;
    
    return {
      total_events: filteredEvents.length,
      total_attendees: totalAttendees,
      total_attended: totalAttended,
      upcoming_events: upcomingEvents
    };
  }
);

// ==================== UTILITY FUNCTIONS ====================

export const getDatabaseMode = async () => {
  return await detectDatabaseMode();
};

export const getDatabaseStatus = async () => {
  const mode = await detectDatabaseMode();
  
  if (mode === 'neon') {
    const health = await checkDatabaseHealth();
    return {
      mode: 'neon',
      status: health.healthy ? 'connected' : 'error',
      message: health.healthy ? 'Neon database connected' : health.error,
      timestamp: health.timestamp
    };
  } else {
    return {
      mode: 'indexeddb',
      status: 'connected',
      message: 'Using IndexedDB local storage',
      timestamp: new Date().toISOString()
    };
  }
};

export const switchToNeon = async () => {
  try {
    const health = await checkDatabaseHealth();
    if (health.healthy) {
      databaseMode = 'neon';
      neonAvailable = true;
      console.log('✅ Switched to Neon database');
      return { success: true, message: 'Switched to Neon database' };
    } else {
      throw new Error(health.error);
    }
  } catch (error) {
    console.error('❌ Failed to switch to Neon:', error);
    return { success: false, error: error.message };
  }
};

export const switchToIndexedDB = () => {
  databaseMode = 'indexeddb';
  neonAvailable = false;
  console.log('✅ Switched to IndexedDB');
  return { success: true, message: 'Switched to IndexedDB' };
};

// ==================== MIGRATION UTILITIES ====================

export const migrateFromIndexedDBToNeon = async () => {
  try {
    console.log('🔄 Starting migration from IndexedDB to Neon...');
    
    // Ensure Neon is available
    const neonStatus = await switchToNeon();
    if (!neonStatus.success) {
      throw new Error('Neon database not available for migration');
    }
    
    // Get all data from IndexedDB
    const indexedEvents = await IndexedDB.getAllEvents();
    const indexedUsers = await IndexedDB.db.users.toArray();
    
    console.log(`📊 Found ${indexedEvents.length} events and ${indexedUsers.length} users to migrate`);
    
    const migrationResults = {
      users: { success: 0, failed: 0 },
      events: { success: 0, failed: 0 },
      attendees: { success: 0, failed: 0 }
    };
    
    // Migrate users
    for (const user of indexedUsers) {
      try {
        await NeonDB.createUser({
          email: user.email,
          password: user.password,
          role: user.role,
          contact: user.contact,
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        });
        migrationResults.users.success++;
      } catch (error) {
        console.warn(`Failed to migrate user ${user.email}:`, error.message);
        migrationResults.users.failed++;
      }
    }
    
    // Migrate events and attendees
    for (const event of indexedEvents) {
      try {
        // Find owner in Neon database
        const owner = await NeonDB.getUserByEmail(event.ownerEmail || 'Robocorpsg@gmail.com');
        if (!owner) continue;
        
        const newEvent = await NeonDB.createEvent({
          title: event.title,
          description: event.description,
          date: event.date,
          venue: event.venue,
          ownerId: owner.id
        });
        
        migrationResults.events.success++;
        
        // Migrate attendees for this event
        const attendees = await IndexedDB.getAttendeesByEvent(event.id);
        for (const attendee of attendees) {
          try {
            await NeonDB.registerAttendee({
              eventId: newEvent.id,
              name: attendee.name,
              email: attendee.email,
              contact: attendee.contact,
              company: attendee.company || '',
              jobTitle: attendee.jobTitle || ''
            });
            
            if (attendee.attended) {
              // Update attendance status
              const newAttendees = await NeonDB.getAttendeesByEvent(newEvent.id);
              const newAttendee = newAttendees.find(a => a.email === attendee.email);
              if (newAttendee) {
                await NeonDB.updateAttendeeStatus(newAttendee.id, 'attended');
              }
            }
            
            migrationResults.attendees.success++;
          } catch (error) {
            console.warn(`Failed to migrate attendee ${attendee.email}:`, error.message);
            migrationResults.attendees.failed++;
          }
        }
        
      } catch (error) {
        console.warn(`Failed to migrate event ${event.title}:`, error.message);
        migrationResults.events.failed++;
      }
    }
    
    console.log('✅ Migration completed:', migrationResults);
    return { success: true, results: migrationResults };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error: error.message };
  }
};

// Initialize database mode detection
detectDatabaseMode();

// Export compatibility functions for existing code
export {
  // Keep all existing function names for backward compatibility
  addEvent as createEvent,
  updateAttendeeStatus as markAttendance
};
