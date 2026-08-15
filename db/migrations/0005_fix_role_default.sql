-- Migration 0005: Fix role default value
DO $$
BEGIN
    -- Change default from 'owner' to 'user' if applicable
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
EXCEPTION WHEN others THEN
    NULL;
END
$$;

-- Also fix any remaining 'owner' values
UPDATE users SET role = 'user' WHERE role = 'owner';
