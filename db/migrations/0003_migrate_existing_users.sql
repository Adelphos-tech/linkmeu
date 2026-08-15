-- Migration 0003: Adapt existing users table to new schema
-- The users table already exists from a previous iteration with different columns

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verified_at') THEN
        ALTER TABLE users ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END
$$;

-- Migrate existing users: combine first_name + last_name into name
UPDATE users SET name = COALESCE(TRIM(CONCAT(first_name, ' ', last_name)), 'User') WHERE name IS NULL;

-- Migrate existing users: copy password to password_hash (will be hashed by application later)
UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL;

-- Update role values to match new enum
UPDATE users SET role = 'super_admin' WHERE role = 'superadmin';
UPDATE users SET role = 'user' WHERE role NOT IN ('user', 'moderator', 'admin', 'super_admin');

-- Add CHECK constraint on role
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_users_role'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_role
        CHECK (role IN ('user', 'moderator', 'admin', 'super_admin'));
    END IF;
END
$$;

-- Make email unique (if not already)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_email_key' OR constraint_name = 'idx_users_email_unique'
    ) THEN
        CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
    END IF;
END
$$;
