import { executeQuery, checkDatabaseHealth } from '../config/database.js';

// Migration utility for Neon database
export class DatabaseMigration {
  constructor() {
    this.migrations = [];
  }

  // Run initial schema setup
  async runInitialMigration() {
    try {
      console.log('🚀 Starting database migration...');
      
      // Check database health first
      const health = await checkDatabaseHealth();
      if (!health.healthy) {
        throw new Error(`Database health check failed: ${health.error}`);
      }

      // Execute schema statements (inline for browser compatibility)
      const schema = `
        -- EventsX Database Schema for Neon PostgreSQL
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'owner', 'superadmin')),
          contact VARCHAR(50),
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          last_login TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          event_date DATE NOT NULL,
          start_time TIME,
          end_time TIME,
          venue VARCHAR(255),
          address TEXT,
          max_attendees INTEGER,
          registration_deadline TIMESTAMP WITH TIME ZONE,
          owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'cancelled', 'completed')),
          image_url TEXT,
          logo_url TEXT,
          registration_fee DECIMAL(10,2) DEFAULT 0.00,
          currency VARCHAR(3) DEFAULT 'USD',
          is_public BOOLEAN DEFAULT true,
          requires_approval BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS attendees (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          contact VARCHAR(50),
          company VARCHAR(255),
          job_title VARCHAR(255),
          dietary_requirements TEXT,
          special_needs TEXT,
          registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          attended BOOLEAN DEFAULT false,
          check_in_time TIMESTAMP WITH TIME ZONE,
          check_in_by UUID REFERENCES users(id),
          qr_code_data TEXT,
          status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled', 'attended')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(event_id, email)
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_events_owner_id ON events(owner_id);
        CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
        CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
        CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);
        
        -- NOTE: No default super admin is seeded here.
        -- Create the first admin account via the application registration flow.
      `;
      
      // Split schema into individual statements
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      console.log(`📝 Executing ${statements.length} migration statements...`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            await executeQuery(statement + ';');
            console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
          } catch (error) {
            // Some statements might fail if they already exist, that's okay
            if (!error.message.includes('already exists')) {
              console.warn(`⚠️ Statement ${i + 1} warning:`, error.message);
            }
          }
        }
      }

      console.log('✅ Database migration completed successfully!');
      return { success: true, message: 'Migration completed' };

    } catch (error) {
      console.error('❌ Database migration failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify migration success
  async verifyMigration() {
    try {
      // Check if all required tables exist
      const tables = [
        'users', 'events', 'attendees', 'event_organizers', 
        'event_speakers', 'event_sponsors', 'notifications'
      ];

      const results = {};
      
      for (const table of tables) {
        try {
          const result = await executeQuery(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_name = $1
          `, [table]);
          
          results[table] = result[0]?.count > 0;
        } catch (error) {
          results[table] = false;
        }
      }

      const allTablesExist = Object.values(results).every(exists => exists);
      
      return {
        success: allTablesExist,
        tables: results,
        message: allTablesExist ? 'All tables verified' : 'Some tables missing'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Verification failed'
      };
    }
  }

  // Get database statistics
  async getDatabaseStats() {
    try {
      const stats = {};
      
      // Count records in each table
      const tables = ['users', 'events', 'attendees'];
      
      for (const table of tables) {
        try {
          const result = await executeQuery(`SELECT COUNT(*) as count FROM ${table}`);
          stats[table] = parseInt(result[0]?.count || 0);
        } catch (error) {
          stats[table] = 0;
        }
      }

      return { success: true, stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Reset database (for development only)
  async resetDatabase() {
    if (import.meta.env.PROD) {
      throw new Error('Database reset is not allowed in production');
    }

    try {
      console.log('🔄 Resetting database...');
      
      // Drop all tables in correct order (reverse of creation)
      const dropStatements = [
        'DROP TABLE IF EXISTS audit_log CASCADE',
        'DROP TABLE IF EXISTS notifications CASCADE',
        'DROP TABLE IF EXISTS session_attendance CASCADE',
        'DROP TABLE IF EXISTS event_sessions CASCADE',
        'DROP TABLE IF EXISTS attendees CASCADE',
        'DROP TABLE IF EXISTS event_sponsors CASCADE',
        'DROP TABLE IF EXISTS event_speakers CASCADE',
        'DROP TABLE IF EXISTS event_organizers CASCADE',
        'DROP TABLE IF EXISTS events CASCADE',
        'DROP TABLE IF EXISTS users CASCADE',
        'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE'
      ];

      for (const statement of dropStatements) {
        try {
          await executeQuery(statement);
        } catch (error) {
          // Ignore errors for non-existent tables
        }
      }

      console.log('✅ Database reset completed');
      return { success: true, message: 'Database reset completed' };

    } catch (error) {
      console.error('❌ Database reset failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const migration = new DatabaseMigration();

// Auto-run migration check on import
export const initializeDatabase = async () => {
  try {
    console.log('🔍 Checking database initialization...');
    
    const verification = await migration.verifyMigration();
    
    if (!verification.success) {
      console.log('📦 Database not initialized, running migration...');
      const migrationResult = await migration.runInitialMigration();
      
      if (migrationResult.success) {
        console.log('✅ Database initialized successfully');
        return { initialized: true, migrated: true };
      } else {
        console.error('❌ Database initialization failed');
        return { initialized: false, error: migrationResult.error };
      }
    } else {
      console.log('✅ Database already initialized');
      return { initialized: true, migrated: false };
    }
    
  } catch (error) {
    console.error('❌ Database initialization check failed:', error);
    return { initialized: false, error: error.message };
  }
};
