-- Migration 0002: Add foreign key constraints and data quality rules

-- Link listings.owner_id to users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_listings_owner_id'
    ) THEN
        ALTER TABLE listings
        ADD CONSTRAINT fk_listings_owner_id
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Link audit_logs.actor_id to users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_audit_logs_actor_id'
    ) THEN
        ALTER TABLE audit_logs
        ADD CONSTRAINT fk_audit_logs_actor_id
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Ensure listings email is valid format (basic)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_listings_email'
    ) THEN
        ALTER TABLE listings
        ADD CONSTRAINT chk_listings_email
        CHECK (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$');
    END IF;
END
$$;

-- Ensure listings contact is not empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_listings_contact'
    ) THEN
        ALTER TABLE listings
        ADD CONSTRAINT chk_listings_contact
        CHECK (contact IS NOT NULL AND LENGTH(TRIM(contact)) > 0);
    END IF;
END
$$;

-- Ensure listings title is not empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_listings_title'
    ) THEN
        ALTER TABLE listings
        ADD CONSTRAINT chk_listings_title
        CHECK (title IS NOT NULL AND LENGTH(TRIM(title)) > 0);
    END IF;
END
$$;
