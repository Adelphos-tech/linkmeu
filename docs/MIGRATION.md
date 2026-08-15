# LinkMeU Database Migration Guide

## Supabase → Neon PostgreSQL

---

## Overview

This guide documents the migration of LinkMeU production data from **Supabase** (source) to the existing **Neon PostgreSQL** database (target).

**Migration direction:** Supabase → Neon  
**Neon is the FINAL production database.**  
**Supabase becomes legacy only and is NOT deleted during this task.**

---

## Prerequisites

### Required Environment Variables

Configure these as shell environment variables or in a `.env.migrate` file (do not commit it):

| Variable | Description |
|----------|-------------|
| `SOURCE_DATABASE_URL` | Supabase PostgreSQL connection string |
| `TARGET_DATABASE_URL` | Neon PostgreSQL connection string |

Example (do not use real values here):

```bash
export SOURCE_DATABASE_URL=postgresql://user:pass@db.project.supabase.co:5432/postgres?sslmode=require
export TARGET_DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require
```

### Safety Checklist

Before running any migration:

- [ ] Neon database backup verified
- [ ] Supabase data export confirmed accessible
- [ ] Migration script reviewed (not blindly executed)
- [ ] `DRY_RUN=true` test completed first
- [ ] No destructive operations planned without approval

---

## Migration Scripts

### 1. Inventory Tool

```bash
# Inventory the source database
SOURCE_DATABASE_URL="$SOURCE_DATABASE_URL" node scripts/inventory-database.cjs SOURCE

# Inventory the target (Neon) database
TARGET_DATABASE_URL="$TARGET_DATABASE_URL" node scripts/inventory-database.cjs TARGET
```

This prints tables, columns, indexes, constraints, sequences, and row counts **without exposing credentials**.

### 2. Schema Comparison

Run the inventory tool against both databases and compare the output. Look for:

- Tables present in Supabase but missing in Neon
- Column differences (missing columns, type mismatches)
- Index differences
- Constraint differences
- Sequence differences

### 3. Migration Script

```bash
# Step 1: Dry run (no data written)
SOURCE_DATABASE_URL="$SOURCE_DATABASE_URL" \
TARGET_DATABASE_URL="$TARGET_DATABASE_URL" \
DRY_RUN=true \
node scripts/migrate-supabase-to-neon.cjs

# Step 2: Execute migration (only after dry run review)
SOURCE_DATABASE_URL="$SOURCE_DATABASE_URL" \
TARGET_DATABASE_URL="$TARGET_DATABASE_URL" \
DRY_RUN=false \
node scripts/migrate-supabase-to-neon.cjs
```

The script performs:
1. Inventory of both databases
2. Schema comparison
3. Data migration in dependency order
4. Foreign key verification
5. Sequence verification and correction
6. Row count verification

---

## Current Neon State (as of inventory run)

### Tables

| Table | Rows | Origin |
|-------|------|--------|
| `users` | 18 | LinkMeU (production users) |
| `listings` | 3 | LinkMeU (production listings) |
| `audit_logs` | 19 | LinkMeU (application audit trail) |
| `events` | 1 | Legacy EventsX (test/demo data) |
| `attendees` | 0 | Legacy EventsX (empty) |
| `playing_with_neon` | 10 | Neon demo/test data |
| `schema_migrations` | 5 | Migration tracking |

### Key Schema Notes

- `users` table uses `SERIAL` primary keys (integer), not UUID
- `listings` has foreign key `owner_id → users.id`
- `audit_logs` has foreign key `actor_id → users.id`
- Five migrations have been applied (0001–0005)
- The `events` and `attendees` tables are from the previous EventsX application

---

## Migration Strategy

### If Supabase Schema Matches Neon

1. Run `DRY_RUN=true` to preview migration
2. Review conflict report
3. Run `DRY_RUN=false` to execute
4. Verify counts, FKs, and sequences

### If Supabase Has Additional Tables

1. Create new migrations in `db/migrations/` for missing tables
2. Run `npm run db:migrate` against Neon
3. Then run the data migration script

### If Supabase and Neon Schemas Differ

1. Document all differences
2. Create ALTER TABLE migrations for Neon
3. Review data type compatibility
4. Then proceed with data migration

---

## Verification Checklist

After migration, verify:

- [ ] **Row counts**: Supabase count matches Neon count (per table)
- [ ] **Foreign keys**: Zero orphaned records
- [ ] **Sequences**: Next value > highest existing ID
- [ ] **Application health**: `GET /api/health` returns `status: ok`
- [ ] **Application version**: `GET /api/version` shows deployed commit
- [ ] **Registration**: Can create a new user
- [ ] **Login**: Existing users can log in
- [ ] **Listings**: Can create, read, update, delete listings
- [ ] **Admin**: Admin endpoints are protected
- [ ] **Audit logs**: Actions are logged
- [ ] **Security tests**: All tests pass

---

## Rollback Procedure

### Before Cutover

If migration produces bad data, rollback is simple: **do nothing.** Neon already contains its previous data. The migration script uses `INSERT ... ON CONFLICT DO NOTHING`, so duplicate prevention is in place.

However, if partial data was written and needs to be removed:

1. Identify which tables were affected
2. Determine the safe cleanup strategy (DELETE vs TRUNCATE)
3. **Never TRUNCATE tables with foreign keys**
4. Delete in reverse dependency order
5. Re-run migration after fixing root cause

### After Cutover

If production is switched to Neon and issues are discovered:

1. Revert application to point back at Supabase (if connection string was changed)
2. Or fix Neon data directly using SQL
3. Document the issue for post-mortem

---

## Neon Backup

Before running any migration:

```bash
# Create a pg_dump backup (run from a machine with psql/pg_dump)
pg_dump "$TARGET_DATABASE_URL" > linkmeu_neon_backup_$(date +%Y%m%d_%H%M%S).sql
```

Store the backup file securely. Do not commit it to the repository.

---

## Sequence Repair

If migrated rows have IDs that exceed the current sequence value, future INSERTs may fail.

The migration script automatically detects and repairs this by running:

```sql
SELECT setval('table_id_seq', (SELECT MAX(id) FROM table) + 1, true);
```

If you need to repair manually:

```sql
-- Example for users table
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);
```

---

## Security

- **Never commit `SOURCE_DATABASE_URL` or `TARGET_DATABASE_URL`**
- **Never log connection strings**
- **Never print passwords in CI logs**
- **Do not use `VITE_` prefix for server-only database URLs**

---

## Files Created

| File | Purpose |
|------|---------|
| `scripts/inventory-database.cjs` | Schema inventory tool for any PostgreSQL database |
| `scripts/migrate-supabase-to-neon.cjs` | Safe migration script with dry-run support |
| `docs/MIGRATION.md` | This guide |

---

## Known Limitations

1. **Supabase credentials required**: The migration script requires `SOURCE_DATABASE_URL`. No Supabase credentials are present in the repository.
2. **Schema differences unknown**: Until Supabase is inventoried, schema differences cannot be determined.
3. **EventsX legacy data**: The `events` and `attendees` tables in Neon are from the previous application. Decide whether to migrate or archive them separately.
4. **UUID vs SERIAL**: If Supabase uses UUIDs and Neon uses SERIAL integers, an explicit ID mapping table is required.

---

## Recommended Next Steps

1. **Configure `SOURCE_DATABASE_URL`** as an environment variable
2. **Run the inventory tool** against Supabase
3. **Compare** Supabase and Neon schemas
4. **Create any missing schema migrations** in `db/migrations/`
5. **Run `DRY_RUN=true`** migration
6. **Review conflict report**
7. **Run `DRY_RUN=false` migration**
8. **Verify** using the checklist above
9. **Switch production** to use Neon exclusively
10. **Monitor** application logs for errors

---

## Supabase Decommission Checklist

**DO NOT delete Supabase until ALL of the following are true:**

- [ ] All required data verified in Neon
- [ ] Production running against Neon for at least 7 days without issues
- [ ] Neon backup verified restorable
- [ ] Rollback decision documented
- [ ] Business approval obtained
