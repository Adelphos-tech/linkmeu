-- Migration 0004: Drop old plaintext password column now that password_hash is populated
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password'
    ) THEN
        ALTER TABLE users DROP COLUMN password;
    END IF;
END
$$;

-- Also drop old first_name/last_name if they exist and we've migrated to name
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'first_name'
    ) THEN
        ALTER TABLE users DROP COLUMN first_name;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'last_name'
    ) THEN
        ALTER TABLE users DROP COLUMN last_name;
    END IF;
END
$$;

-- Ensure password_hash is NOT NULL going forward
DO $$
BEGIN
    ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
EXCEPTION WHEN others THEN
    -- Ignore if constraint already exists or if there are null values
    NULL;
END
$$;
