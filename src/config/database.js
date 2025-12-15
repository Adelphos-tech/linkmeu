import { neon } from '@neondatabase/serverless';

// Database configuration
const config = {
  connectionString: import.meta.env.VITE_DATABASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  maxRetries: 3,
  retryDelay: 1000
};

// Create Neon SQL connection
let sql = null;

export const initializeDatabase = () => {
  if (!config.connectionString || config.connectionString.includes('username:password')) {
    console.warn('⚠️ Neon database not configured. Using fallback mode.');
    return null;
  }

  try {
    sql = neon(config.connectionString);
    console.log('✅ Neon database connection initialized');
    return sql;
  } catch (error) {
    console.error('❌ Failed to initialize Neon database:', error);
    return null;
  }
};

// Get database connection
export const getDatabase = () => {
  if (!sql) {
    sql = initializeDatabase();
  }
  return sql;
};

// Database utility functions
export const executeQuery = async (query, params = []) => {
  const db = getDatabase();
  
  if (!db) {
    throw new Error('Database not available. Please configure Neon database connection.');
  }

  let retries = 0;
  while (retries < config.maxRetries) {
    try {
      console.log('🔍 Executing query:', query.substring(0, 100) + '...');
      
      // Use proper Neon syntax based on query type
      let result;
      if (params && params.length > 0) {
        // For parameterized queries, use template literals with proper escaping
        result = await db.unsafe(query, params);
      } else {
        // For simple queries, use unsafe for raw SQL
        result = await db.unsafe(query);
      }
      
      console.log('✅ Query executed successfully');
      return result;
    } catch (error) {
      retries++;
      console.error(`❌ Query failed (attempt ${retries}/${config.maxRetries}):`, error.message);
      
      if (retries >= config.maxRetries) {
        throw new Error(`Database query failed after ${config.maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, config.retryDelay * retries));
    }
  }
};

// Health check function
export const checkDatabaseHealth = async () => {
  try {
    const db = getDatabase();
    if (!db) {
      return { 
        healthy: false, 
        error: 'Database not configured', 
        timestamp: new Date().toISOString() 
      };
    }
    
    const result = await db`SELECT 1 as health_check`;
    return { healthy: true, timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
};

// Initialize database on module load
initializeDatabase();
