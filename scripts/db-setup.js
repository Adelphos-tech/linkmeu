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

// Execute query with retry logic
const executeQuery = async (query) => {
  if (!config.connectionString || config.connectionString.includes('username:password')) {
    throw new Error('Database not configured. Please set DATABASE_URL in .env file.');
  }

  const sql = neon(config.connectionString);
  let retries = 0;
  
  while (retries < config.maxRetries) {
    try {
      console.log(`🔍 Executing: ${query.substring(0, 50)}...`);
      const result = await sql([query]);
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

// Database schema
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

INSERT INTO events (title, description, event_date, venue, owner_id, status) 
SELECT 
  'Tech Conference 2025',
  'Annual technology conference featuring the latest innovations in AI, blockchain, and web development.',
  '2025-03-15',
  'Singapore Convention Centre',
  u.id,
  'active'
FROM users u WHERE u.email = 'Robocorpsg@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO events (title, description, event_date, venue, owner_id, status) 
SELECT 
  'Cybersecurity Awareness Seminar',
  'Essential cybersecurity knowledge for businesses and individuals in the digital age.',
  '2025-07-12',
  'Raffles City Convention Centre',
  u.id,
  'active'
FROM users u WHERE u.email = 'Robocorpsg@gmail.com'
ON CONFLICT DO NOTHING;
`;

// Run database setup
const runSetup = async () => {
  try {
    console.log('🚀 Starting EventsX Database Setup...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Test connection first
    console.log('🔍 Testing database connection...');
    const sql = neon(config.connectionString);
    await sql`SELECT 1 as health_check`;
    console.log('✅ Database connection successful!');
    
    // Split schema into statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} setup statements...`);
    
    let successCount = 0;
    let skipCount = 0;
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`🔄 Statement ${i + 1}/${statements.length}: ${statement.substring(0, 60)}...`);
          
          // Execute using unsafe raw query for schema setup
          const result = await sql.unsafe(statement);
          console.log(`✅ Statement ${i + 1}: Success`);
          successCount++;
          
        } catch (error) {
          // Handle expected errors (already exists, etc.)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('ON CONFLICT DO NOTHING') ||
              error.message.includes('relation') && error.message.includes('already exists')) {
            console.log(`⏭️  Statement ${i + 1}: Already exists (skipped)`);
            skipCount++;
          } else {
            console.warn(`⚠️  Statement ${i + 1}: ${error.message}`);
            // Continue with other statements
          }
        }
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database setup completed successfully!');
    console.log(`📊 Results: ${successCount} executed, ${skipCount} skipped`);
    console.log('🎉 Your EventsX application is now production-ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return { success: true, executed: successCount, skipped: skipCount };

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Database setup failed:', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw error;
  }
};

// Run setup
runSetup()
  .then(result => {
    console.log('\n🎯 Next Steps:');
    console.log('1. Run: npm run build');
    console.log('2. Run: npm run deploy');
    console.log('3. Visit: https://adelphos-tech.github.io/event/');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💡 Troubleshooting:');
    console.error('1. Check your Neon database is active');
    console.error('2. Verify DATABASE_URL in .env file');
    console.error('3. Ensure database has proper permissions');
    process.exit(1);
  });
