-- CI Test Database Schema for LinkMeU
-- Creates the minimal tables required for security and rate-limit tests
-- to run against a fresh PostgreSQL instance.

-- Users table (matches server.cjs expectations)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Listings table (matches server.cjs INSERT/SELECT/UPDATE expectations)
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50),
    purpose VARCHAR(50),
    from_date DATE,
    to_date DATE,
    title TEXT NOT NULL,
    description TEXT,
    currency VARCHAR(10) DEFAULT 'SGD',
    budget NUMERIC(15,2),
    revenue NUMERIC(15,2),
    location TEXT,
    country VARCHAR(100) DEFAULT 'Singapore',
    contact TEXT NOT NULL,
    email TEXT NOT NULL,
    seller_name VARCHAR(255),
    seller_type VARCHAR(50),
    photos TEXT[] DEFAULT '{}',
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table (matches server.cjs logAudit expectations)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_listings_owner_id ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
