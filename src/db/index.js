// Main Database Interface - Production Ready with Neon + IndexedDB Fallback
import * as DatabaseAdapter from './databaseAdapter.js';

// ==================== MAIN DATABASE INTERFACE ====================
// This file provides a clean interface that automatically switches between
// Neon (production) and IndexedDB (fallback) based on availability

// User Operations
export const registerUser = DatabaseAdapter.registerUser;
export const loginUser = DatabaseAdapter.loginUser;
export const getUserByEmail = DatabaseAdapter.getUserByEmail;

// Event Operations  
export const addEvent = DatabaseAdapter.addEvent;
export const getEvent = DatabaseAdapter.getEvent;
export const getAllEvents = DatabaseAdapter.getAllEvents;
export const updateEvent = DatabaseAdapter.updateEvent;
export const deleteEvent = DatabaseAdapter.deleteEvent;

// Attendee Operations
export const addAttendee = DatabaseAdapter.registerAttendee;
export const registerAttendee = DatabaseAdapter.registerAttendee;
export const getAttendeesByEvent = DatabaseAdapter.getAttendeesByEvent;
export const updateAttendeeStatus = DatabaseAdapter.updateAttendeeStatus;
export const searchAttendees = DatabaseAdapter.searchAttendees;

// Analytics & Reporting (Neon-enhanced)
export const getEventAnalytics = DatabaseAdapter.getEventAnalytics;
export const getDashboardStats = DatabaseAdapter.getDashboardStats;

// Database Management
export const getDatabaseMode = DatabaseAdapter.getDatabaseMode;
export const getDatabaseStatus = DatabaseAdapter.getDatabaseStatus;
export const migrateFromIndexedDBToNeon = DatabaseAdapter.migrateFromIndexedDBToNeon;

// ==================== UTILITY FUNCTIONS ====================

export const initializeProductionDatabase = async () => {
  try {
    console.log('🚀 Initializing EventsX Production Database...');
    
    const status = await getDatabaseStatus();
    console.log(`📊 Database Status:`, status);
    
    if (status.mode === 'neon') {
      console.log('✅ Production mode: Using Neon PostgreSQL');
    } else {
      console.log('⚠️ Development mode: Using IndexedDB fallback');
    }
    
    return status;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

export const getSystemInfo = async () => {
  const dbStatus = await getDatabaseStatus();
  const mode = await getDatabaseMode();
  
  return {
    database: {
      mode,
      status: dbStatus.status,
      message: dbStatus.message,
      timestamp: dbStatus.timestamp
    },
    environment: {
      production: import.meta.env.PROD,
      development: import.meta.env.DEV,
      baseUrl: import.meta.env.BASE_URL
    },
    features: {
      neonEnabled: mode === 'neon',
      analyticsEnabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      notificationsEnabled: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true'
    }
  };
};

// ==================== BACKWARD COMPATIBILITY ====================
// Maintain compatibility with existing code

export const saveAttendee = registerAttendee;
export const markAttendance = updateAttendeeStatus;

// ==================== INITIALIZATION ====================
// Auto-initialize when module is imported
initializeProductionDatabase().catch(console.error);
