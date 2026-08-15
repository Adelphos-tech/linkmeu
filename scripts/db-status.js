#!/usr/bin/env node
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment variables
dotenv.config();

// Database configuration for Node.js
const config = {
  connectionString: process.env.DATABASE_URL,
  timeout: parseInt(process.env.VITE_API_TIMEOUT) || 10000,
  maxRetries: 3,
  retryDelay: 1000
};

// Check database health
const checkDatabaseHealth = async () => {
  if (!config.connectionString || config.connectionString.includes('username:password')) {
    return { 
      healthy: false, 
      error: 'Database not configured. Please set DATABASE_URL in .env file.',
      mode: 'indexeddb',
      timestamp: new Date().toISOString() 
    };
  }

  try {
    const sql = neon(config.connectionString);
    const result = await sql`SELECT 1 as health_check`;
    return { 
      healthy: true, 
      mode: 'neon',
      message: 'Neon database connected successfully',
      timestamp: new Date().toISOString() 
    };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message, 
      mode: 'error',
      timestamp: new Date().toISOString() 
    };
  }
};

// Get database status
const getDatabaseStatus = async () => {
  const health = await checkDatabaseHealth();
  
  return {
    mode: health.mode,
    status: health.healthy ? 'connected' : 'error',
    message: health.healthy ? health.message : health.error,
    timestamp: health.timestamp,
    connectionString: config.connectionString ? 
      config.connectionString.replace(/:[^:@]*@/, ':***@') : 'Not configured'
  };
};

// Run status check
getDatabaseStatus()
  .then(status => {
    console.log('🔍 EventsX Database Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Mode: ${status.mode.toUpperCase()}`);
    console.log(`🔗 Status: ${status.status.toUpperCase()}`);
    console.log(`💬 Message: ${status.message}`);
    console.log(`🕒 Timestamp: ${status.timestamp}`);
    console.log(`🔐 Connection: ${status.connectionString}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (status.status === 'connected') {
      console.log('✅ Database is ready for production!');
      process.exit(0);
    } else {
      console.log('❌ Database connection failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Database status check failed:', error.message);
    process.exit(1);
  });
