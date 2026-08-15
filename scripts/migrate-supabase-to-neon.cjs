#!/usr/bin/env node
// ===== Supabase → Neon Migration Script =====
// Usage:
//   SOURCE_DATABASE_URL=postgresql://... TARGET_DATABASE_URL=postgresql://... node scripts/migrate-supabase-to-neon.cjs
//
// Safety rules:
//   - Never drops tables on target.
//   - Never truncates target tables.
//   - Creates an ID mapping table for auditability.
//   - Produces a conflict/duplicate report.
//   - Verifies row counts, foreign keys, and sequences.

require('dotenv').config();
const { Pool } = require('pg');

const SOURCE_URL = process.env.SOURCE_DATABASE_URL;
const TARGET_URL = process.env.TARGET_DATABASE_URL;
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100');

if (!SOURCE_URL) {
    console.error('❌ SOURCE_DATABASE_URL is required');
    process.exit(1);
}
if (!TARGET_URL) {
    console.error('❌ TARGET_DATABASE_URL is required');
    process.exit(1);
}

const sourcePool = new Pool({
    connectionString: SOURCE_URL,
    ssl: { rejectUnauthorized: false }
});
const targetPool = new Pool({
    connectionString: TARGET_URL,
    ssl: { rejectUnauthorized: false }
});

// ===== Helpers =====
function log(section, message) {
    console.log(`[${section}] ${message}`);
}

async function getTables(pool) {
    const result = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    `);
    return result.rows.map(r => r.table_name);
}

async function getRowCount(pool, table) {
    const result = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
    return parseInt(result.rows[0].count);
}

async function getMaxId(pool, table, idCol) {
    try {
        const result = await pool.query(`SELECT MAX("${idCol}") AS max_id FROM "${table}"`);
        return result.rows[0].max_id || 0;
    } catch (e) {
        return null;
    }
}

// ===== Phase 1: Inventory =====
async function phaseInventory() {
    log('PHASE1', 'Inventorying source (Supabase) and target (Neon)...');

    const sourceTables = await getTables(sourcePool);
    const targetTables = await getTables(targetPool);

    console.log('\n--- Source Tables ---');
    for (const t of sourceTables) {
        const count = await getRowCount(sourcePool, t);
        console.log(`  ${t}: ${count} rows`);
    }

    console.log('\n--- Target Tables ---');
    for (const t of targetTables) {
        const count = await getRowCount(targetPool, t);
        console.log(`  ${t}: ${count} rows`);
    }

    return { sourceTables, targetTables };
}

// ===== Phase 2: Schema Comparison =====
async function phaseSchemaCompare(sourceTables, targetTables) {
    log('PHASE2', 'Comparing schemas...');

    const commonTables = sourceTables.filter(t => targetTables.includes(t));
    const missingInTarget = sourceTables.filter(t => !targetTables.includes(t));
    const missingInSource = targetTables.filter(t => !sourceTables.includes(t));

    if (missingInTarget.length > 0) {
        console.log('\n⚠️  Tables in Supabase but MISSING in Neon:');
        missingInTarget.forEach(t => console.log(`    - ${t}`));
    }
    if (missingInSource.length > 0) {
        console.log('\nℹ️  Tables in Neon but not in Supabase (will be preserved):');
        missingInSource.forEach(t => console.log(`    - ${t}`));
    }

    return { commonTables, missingInTarget, missingInSource };
}

// ===== Phase 3: Setup ID Mapping Table =====
async function setupIdMappingTable() {
    log('SETUP', 'Creating id_mapping table if not exists...');
    await targetPool.query(`
        CREATE TABLE IF NOT EXISTS id_mapping (
            id SERIAL PRIMARY KEY,
            source_table VARCHAR(100) NOT NULL,
            source_id INTEGER NOT NULL,
            target_id INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(source_table, source_id)
        )
    `);
}

async function getMappedId(table, sourceId) {
    if (!sourceId) return null;
    const result = await targetPool.query(
        `SELECT target_id FROM id_mapping WHERE source_table = $1 AND source_id = $2`,
        [table, sourceId]
    );
    return result.rows.length > 0 ? result.rows[0].target_id : null;
}

async function recordMapping(client, table, sourceId, targetId) {
    await client.query(
        `INSERT INTO id_mapping (source_table, source_id, target_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (source_table, source_id) DO UPDATE SET target_id = EXCLUDED.target_id`,
        [table, sourceId, targetId]
    );
}

// ===== Phase 4: Migrate Users =====
async function migrateUsers(report) {
    log('MIGRATE', '=== Migrating users ===');
    const { rows: sourceUsers } = await sourcePool.query('SELECT * FROM users ORDER BY id');
    const sourceCount = sourceUsers.length;

    let migrated = 0;
    let skipped = 0;
    let conflicts = 0;

    const client = await targetPool.connect();
    try {
        await client.query('BEGIN');

        for (const user of sourceUsers) {
            // Check if user already exists in Neon by email
            const existingResult = await client.query(
                'SELECT id FROM users WHERE email = $1',
                [user.email]
            );

            if (existingResult.rows.length > 0) {
                // User already exists - record mapping
                const neonId = existingResult.rows[0].id;
                await recordMapping(client, 'users', user.id, neonId);
                log('MIGRATE', `User ${user.email} already exists in Neon (ID ${neonId}), mapping Supabase ${user.id} -> Neon ${neonId}`);
                skipped++;
                continue;
            }

            // Generate new ID in Neon
            const maxIdResult = await client.query('SELECT MAX(id) FROM users');
            const newId = (parseInt(maxIdResult.rows[0].max) || 0) + 1;

            // Map Supabase schema to Neon schema
            const name = user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`.trim()
                : user.first_name || user.last_name || 'User';

            // Normalize role
            let role = user.role || 'user';
            if (role === 'superadmin') role = 'super_admin';
            if (!['user', 'moderator', 'admin', 'super_admin'].includes(role)) role = 'user';

            // Hash password if plaintext
            const bcrypt = require('bcryptjs');
            const passwordHash = user.password && !user.password.startsWith('$2')
                ? await bcrypt.hash(user.password, 12)
                : user.password || await bcrypt.hash('changeme', 12);

            if (!DRY_RUN) {
                await client.query(`
                    INSERT INTO users (id, email, password_hash, name, role, contact, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    newId,
                    user.email,
                    passwordHash,
                    name,
                    role,
                    user.contact,
                    user.created_at,
                    user.updated_at
                ]);
                await recordMapping(client, 'users', user.id, newId);
                migrated++;
            } else {
                log('DRYRUN', `Would insert user ${user.email} as ID ${newId}`);
                migrated++;
            }
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

    report.push({ table: 'users', sourceCount, migrated, skipped, conflicts, status: 'migrated' });
    log('MIGRATE', `Users: ${migrated} migrated, ${skipped} skipped (already exist)`);
}

// ===== Phase 5: Migrate Listings =====
async function migrateListings(report) {
    log('MIGRATE', '=== Migrating listings ===');
    const { rows: sourceListings } = await sourcePool.query('SELECT * FROM listings ORDER BY id');
    const sourceCount = sourceListings.length;

    let migrated = 0;
    let skipped = 0;

    const client = await targetPool.connect();
    try {
        await client.query('BEGIN');

        for (const listing of sourceListings) {
            // Map owner_id
            let ownerId = null;
            if (listing.owner_id) {
                ownerId = await getMappedId('users', listing.owner_id);
                if (!ownerId) {
                    log('WARN', `Listing ${listing.id}: owner_id ${listing.owner_id} not mapped, setting to null`);
                }
            }

            // Generate new ID
            const maxIdResult = await client.query('SELECT MAX(id) FROM listings');
            const newId = (parseInt(maxIdResult.rows[0].max) || 0) + 1;

            // Map images to photos
            let photos = null;
            if (listing.images && Array.isArray(listing.images)) {
                photos = listing.images;
            } else if (listing.images) {
                try {
                    photos = JSON.parse(listing.images);
                } catch (e) {
                    photos = [listing.images];
                }
            }

            // Map budget_min/budget_max to budget
            let budget = listing.budget_min || listing.budget_max || null;
            if (budget !== null) {
                budget = String(budget);
            }

            // Map seller_name from contact or title
            const sellerName = listing.contact || 'Unknown';

            // Set defaults for missing Neon columns
            const purpose = 'sale'; // default
            const sellerType = 'owner';
            const country = 'Singapore';
            const urgency = 'normal';
            const status = listing.status === 'active' ? 'approved' : listing.status || 'pending';

            if (!DRY_RUN) {
                await client.query(`
                    INSERT INTO listings (
                        id, category, purpose, from_date, to_date, title, description,
                        currency, budget, revenue, location, country, contact, email,
                        seller_name, seller_type, photos, owner_id, status, urgency, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                `, [
                    newId,
                    listing.category,
                    purpose,
                    listing.from_date,
                    listing.to_date,
                    listing.title,
                    listing.description,
                    listing.currency || 'SGD',
                    budget,
                    listing.revenue,
                    listing.location,
                    country,
                    listing.contact,
                    listing.email,
                    sellerName,
                    sellerType,
                    photos,
                    ownerId,
                    status,
                    urgency,
                    listing.created_at,
                    listing.updated_at
                ]);
                await recordMapping(client, 'listings', listing.id, newId);
                migrated++;
            } else {
                migrated++;
            }
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

    report.push({ table: 'listings', sourceCount, migrated, skipped, status: 'migrated' });
    log('MIGRATE', `Listings: ${migrated} migrated`);
}

// ===== Phase 6: Migrate Events =====
async function migrateEvents(report) {
    log('MIGRATE', '=== Migrating events ===');
    const { rows: sourceEvents } = await sourcePool.query('SELECT * FROM events ORDER BY id');
    const sourceCount = sourceEvents.length;

    let migrated = 0;

    const client = await targetPool.connect();
    try {
        await client.query('BEGIN');

        for (const event of sourceEvents) {
            // Map owner_id
            let ownerId = null;
            if (event.owner_id) {
                ownerId = await getMappedId('users', event.owner_id);
            }

            // Generate new ID
            const maxIdResult = await client.query('SELECT MAX(id) FROM events');
            const newId = (parseInt(maxIdResult.rows[0].max) || 0) + 1;

            if (!DRY_RUN) {
                await client.query(`
                    INSERT INTO events (
                        id, title, description, event_type, start_date, end_date, venue, capacity,
                        logo, image, owner_id, organisers, speakers, sponsors, status, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                `, [
                    newId,
                    event.title,
                    event.description,
                    event.event_type || 'conference',
                    event.start_date,
                    event.end_date,
                    event.venue,
                    event.capacity || 100,
                    event.logo,
                    event.image,
                    ownerId,
                    event.organisers || '[]',
                    event.speakers || '[]',
                    event.sponsors || '[]',
                    event.status || 'active',
                    event.created_at,
                    event.updated_at
                ]);
                await recordMapping(client, 'events', event.id, newId);
                migrated++;
            } else {
                migrated++;
            }
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

    report.push({ table: 'events', sourceCount, migrated, status: 'migrated' });
    log('MIGRATE', `Events: ${migrated} migrated`);
}

// ===== Phase 7: Migrate Attendees =====
async function migrateAttendees(report) {
    log('MIGRATE', '=== Migrating attendees ===');
    const { rows: sourceAttendees } = await sourcePool.query('SELECT * FROM attendees ORDER BY id');
    const sourceCount = sourceAttendees.length;

    let migrated = 0;

    const client = await targetPool.connect();
    try {
        await client.query('BEGIN');

        for (const attendee of sourceAttendees) {
            // Map event_id
            let eventId = null;
            if (attendee.event_id) {
                eventId = await getMappedId('events', attendee.event_id);
                if (!eventId) {
                    log('WARN', `Attendee ${attendee.id}: event_id ${attendee.event_id} not mapped, skipping`);
                    continue;
                }
            }

            // Generate new ID
            const maxIdResult = await client.query('SELECT MAX(id) FROM attendees');
            const newId = (parseInt(maxIdResult.rows[0].max) || 0) + 1;

            if (!DRY_RUN) {
                await client.query(`
                    INSERT INTO attendees (id, event_id, name, email, contact, notes, attended, registered_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    newId,
                    eventId,
                    attendee.name,
                    attendee.email,
                    attendee.contact,
                    attendee.notes,
                    attendee.attended || false,
                    attendee.registered_at || attendee.created_at
                ]);
                await recordMapping(client, 'attendees', attendee.id, newId);
                migrated++;
            } else {
                migrated++;
            }
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

    report.push({ table: 'attendees', sourceCount, migrated, status: 'migrated' });
    log('MIGRATE', `Attendees: ${migrated} migrated`);
}

// ===== Phase 8: Verify Foreign Keys =====
async function verifyForeignKeys() {
    log('VERIFY', 'Checking foreign key integrity...');
    const fkResult = await targetPool.query(`
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    `);

    const orphans = [];
    for (const fk of fkResult.rows) {
        const result = await targetPool.query(`
            SELECT COUNT(*) AS orphan_count
            FROM "${fk.table_name}" t
            LEFT JOIN "${fk.foreign_table_name}" r ON t."${fk.column_name}" = r."${fk.foreign_column_name}"
            WHERE t."${fk.column_name}" IS NOT NULL AND r."${fk.foreign_column_name}" IS NULL
        `);
        const count = parseInt(result.rows[0].orphan_count);
        if (count > 0) {
            orphans.push({ table: fk.table_name, column: fk.column_name, references: `${fk.foreign_table_name}.${fk.foreign_column_name}`, count });
        }
    }

    if (orphans.length > 0) {
        console.log('\n⚠️  ORPHANED FOREIGN KEYS FOUND:');
        for (const o of orphans) {
            console.log(`    ${o.table}.${o.column} -> ${o.references}: ${o.count} orphans`);
        }
    } else {
        console.log('\n✅ No orphaned foreign keys found');
    }

    return orphans;
}

// ===== Phase 9: Verify Sequences =====
async function verifySequences() {
    log('VERIFY', 'Checking sequence alignment...');
    const seqResult = await targetPool.query(`
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    `);

    const issues = [];
    for (const seq of seqResult.rows) {
        const seqName = seq.sequence_name;
        const match = seqName.match(/^(.*)_id_seq$/);
        if (match) {
            const table = match[1];
            try {
                const pkResult = await targetPool.query(`
                    SELECT kcu.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public' AND tc.table_name = $1
                `, [table]);
                if (pkResult.rows.length === 0) continue;

                const idCol = pkResult.rows[0].column_name;
                const maxIdResult = await targetPool.query(`SELECT MAX("${idCol}") FROM "${table}"`);
                const maxId = maxIdResult.rows[0].max || 0;

                const seqValResult = await targetPool.query(`SELECT last_value FROM "${seqName}"`);
                const seqVal = seqValResult.rows[0].last_value;

                if (seqVal <= maxId) {
                    issues.push({ sequence: seqName, table, maxId, seqVal });
                    if (!DRY_RUN) {
                        await targetPool.query(`SELECT setval('"${seqName}"', $1, true)`, [maxId + 1]);
                        log('SEQUENCE', `${seqName} advanced from ${seqVal} to ${maxId + 1}`);
                    } else {
                        log('SEQUENCE', `[DRY RUN] ${seqName} would advance from ${seqVal} to ${maxId + 1}`);
                    }
                }
            } catch (e) {
                // Ignore errors for tables that might not exist or have issues
            }
        }
    }

    return issues;
}

// ===== Phase 10: Verify Counts =====
async function verifyCounts(report) {
    log('VERIFY', 'Verifying row counts...');
    console.log('\n--- Migration Report ---');
    console.log('Table        | Source | Migrated | Status');
    console.log('-------------|--------|----------|-------');
    for (const r of report) {
        console.log(`${r.table.padEnd(12)} | ${String(r.sourceCount).padStart(6)} | ${String(r.migrated).padStart(8)} | ${r.status}`);
    }

    // Final Neon counts
    console.log('\n--- Final Neon Counts ---');
    const tables = ['users', 'listings', 'events', 'attendees', 'audit_logs'];
    for (const t of tables) {
        try {
            const count = await getRowCount(targetPool, t);
            console.log(`  ${t}: ${count} rows`);
        } catch (e) {
            console.log(`  ${t}: ERROR (${e.message})`);
        }
    }
}

// ===== Main =====
async function main() {
    console.log('========================================');
    console.log('  Supabase → Neon Migration Tool');
    console.log(`  DRY_RUN: ${DRY_RUN}`);
    console.log('========================================\n');

    try {
        const { sourceTables, targetTables } = await phaseInventory();
        const { commonTables, missingInTarget, missingInSource } = await phaseSchemaCompare(sourceTables, targetTables);

        if (missingInTarget.length > 0) {
            log('WARN', 'Some tables exist in Supabase but not in Neon.');
            log('WARN', 'Migration will skip these tables.');
        }

        if (commonTables.length === 0) {
            log('ERROR', 'No common tables found between source and target.');
            process.exit(1);
        }

        // Setup ID mapping table
        await setupIdMappingTable();

        const report = [];

        // Migrate in dependency order: users -> listings/events -> attendees
        await migrateUsers(report);
        await migrateListings(report);
        await migrateEvents(report);
        await migrateAttendees(report);

        // Verify
        const orphans = await verifyForeignKeys();
        const seqIssues = await verifySequences();
        await verifyCounts(report);

        console.log('\n========================================');
        console.log('  Migration Summary');
        console.log('========================================');
        console.log(`Tables migrated: ${report.filter(r => r.status === 'migrated').length}`);
        console.log(`Orphaned FKs: ${orphans.length}`);
        console.log(`Sequence issues fixed: ${seqIssues.length}`);
        console.log(`DRY_RUN: ${DRY_RUN}`);
        console.log('========================================\n');

        if (orphans.length > 0) {
            console.log('⚠️  WARNING: Orphaned foreign keys detected. Review before cutover.');
        }

        if (DRY_RUN) {
            console.log('ℹ️  DRY RUN complete. Set DRY_RUN=false to execute.');
        } else {
            console.log('✅ Migration completed.');
            console.log('ℹ️  ID mappings stored in id_mapping table for audit.');
        }
    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    } finally {
        await sourcePool.end();
        await targetPool.end();
    }
}

main();
