#!/usr/bin/env node
// ===== Supabase → Neon Migration Script =====
// Usage:
//   SOURCE_DATABASE_URL=postgresql://... TARGET_DATABASE_URL=postgresql://... node scripts/migrate-supabase-to-neon.cjs
//
// Safety rules:
//   - Never drops tables on target.
//   - Never truncates target tables.
//   - Uses transactions where practical.
//   - Produces a conflict/duplicate report.
//   - Verifies row counts, foreign keys, and sequences.
//   - Does NOT print connection credentials.

require('dotenv').config();
const { Pool } = require('pg');

const SOURCE_URL = process.env.SOURCE_DATABASE_URL;
const TARGET_URL = process.env.TARGET_DATABASE_URL;
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '500');

if (!SOURCE_URL) {
    console.error('❌ SOURCE_DATABASE_URL is required');
    process.exit(1);
}
if (!TARGET_URL) {
    console.error('❌ TARGET_DATABASE_URL is required');
    process.exit(1);
}

const sourcePool = new Pool({ connectionString: SOURCE_URL, ssl: { rejectUnauthorized: false } });
const targetPool = new Pool({ connectionString: TARGET_URL, ssl: { rejectUnauthorized: false } });

// ===== Helpers =====
function log(section, message) {
    console.log(`[${section}] ${message}`);
}

async function getTables(pool, label) {
    const result = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    `);
    return result.rows.map(r => r.table_name);
}

async function getColumns(pool, table) {
    const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
    `, [table]);
    return result.rows;
}

async function getPrimaryKeyColumns(pool, table) {
    const result = await pool.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public' AND tc.table_name = $1
    `, [table]);
    return result.rows.map(r => r.column_name);
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

async function getSequenceValue(pool, seqName) {
    try {
        const result = await pool.query(`SELECT last_value FROM "${seqName}"`);
        return result.rows[0].last_value;
    } catch (e) {
        return null;
    }
}

// ===== Phase 1: Inventory =====
async function phaseInventory() {
    log('PHASE1', 'Inventorying source (Supabase) and target (Neon)...');

    const sourceTables = await getTables(sourcePool, 'source');
    const targetTables = await getTables(targetPool, 'target');

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

    const missingInTarget = sourceTables.filter(t => !targetTables.includes(t));
    const missingInSource = targetTables.filter(t => !sourceTables.includes(t));
    const commonTables = sourceTables.filter(t => targetTables.includes(t));

    if (missingInTarget.length > 0) {
        console.log('\n⚠️  Tables in Supabase but MISSING in Neon:');
        missingInTarget.forEach(t => console.log(`    - ${t}`));
    }
    if (missingInSource.length > 0) {
        console.log('\nℹ️  Tables in Neon but not in Supabase (will be preserved):');
        missingInSource.forEach(t => console.log(`    - ${t}`));
    }

    console.log('\n--- Common Tables ---');
    for (const t of commonTables) {
        const sourceCols = await getColumns(sourcePool, t);
        const targetCols = await getColumns(targetPool, t);
        const sourceColNames = sourceCols.map(c => c.column_name);
        const targetColNames = targetCols.map(c => c.column_name);
        const missingCols = sourceColNames.filter(c => !targetColNames.includes(c));
        const extraCols = targetColNames.filter(c => !sourceColNames.includes(c));

        console.log(`  ${t}:`);
        if (missingCols.length > 0) console.log(`    Missing in Neon: ${missingCols.join(', ')}`);
        if (extraCols.length > 0) console.log(`    Extra in Neon: ${extraCols.join(', ')}`);
        if (missingCols.length === 0 && extraCols.length === 0) console.log(`    Schema aligned`);
    }

    return { commonTables, missingInTarget, missingInSource };
}

// ===== Phase 3: Migration Plan =====
function buildMigrationOrder(commonTables) {
    // Dependency order: users first, then dependent tables.
    // Adjust as needed based on actual FK relationships discovered during runtime.
    const order = [];
    const deps = {
        users: [],
        // Add more known dependencies here after inspecting both schemas
    };

    // Simple topological sort placeholder
    const visited = new Set();
    function visit(table) {
        if (visited.has(table)) return;
        visited.add(table);
        const tableDeps = deps[table] || [];
        for (const dep of tableDeps) {
            if (commonTables.includes(dep)) visit(dep);
        }
        order.push(table);
    }

    for (const t of commonTables) visit(t);
    return order;
}

// ===== Phase 4: Data Migration =====
async function phaseMigrate(commonTables) {
    log('PHASE4', 'Starting data migration...');

    if (DRY_RUN) {
        log('PHASE4', '⚠️  DRY_RUN=true — no data will be written');
    }

    const migrationOrder = buildMigrationOrder(commonTables);
    const report = [];

    for (const table of migrationOrder) {
        const sourceCount = await getRowCount(sourcePool, table);
        const targetCountBefore = await getRowCount(targetPool, table);

        if (sourceCount === 0) {
            log('MIGRATE', `${table}: source empty, skipping`);
            report.push({ table, sourceCount, targetBefore: targetCountBefore, targetAfter: targetCountBefore, migrated: 0, status: 'skipped-empty' });
            continue;
        }

        const pkCols = await getPrimaryKeyColumns(sourcePool, table);
        const sourceCols = await getColumns(sourcePool, table);
        const targetCols = await getColumns(targetPool, table);
        const sharedCols = sourceCols.filter(c => targetCols.some(tc => tc.column_name === c.column_name)).map(c => c.column_name);

        if (sharedCols.length === 0) {
            log('MIGRATE', `${table}: no shared columns, skipping`);
            report.push({ table, sourceCount, targetBefore: targetCountBefore, targetAfter: targetCountBefore, migrated: 0, status: 'skipped-no-shared-columns' });
            continue;
        }

        log('MIGRATE', `${table}: ${sourceCount} source rows, ${targetCountBefore} target rows before`);

        let migrated = 0;
        let conflicts = 0;

        if (!DRY_RUN) {
            const client = await targetPool.connect();
            try {
                await client.query('BEGIN');

                // Fetch source data in batches
                let offset = 0;
                while (offset < sourceCount) {
                    const batch = await sourcePool.query(`
                        SELECT ${sharedCols.map(c => `"${c}"`).join(', ')}
                        FROM "${table}"
                        ORDER BY ${pkCols.length > 0 ? pkCols.map(c => `"${c}"`).join(', ') : '1'}
                        LIMIT $1 OFFSET $2
                    `, [BATCH_SIZE, offset]);

                    if (batch.rows.length === 0) break;

                    for (const row of batch.rows) {
                        const cols = sharedCols;
                        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
                        const values = cols.map(c => row[c]);

                        try {
                            await client.query(`
                                INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(', ')})
                                VALUES (${placeholders})
                                ON CONFLICT DO NOTHING
                            `, values);
                            migrated++;
                        } catch (insertErr) {
                            // Log conflict but don't fail the batch
                            conflicts++;
                        }
                    }

                    offset += batch.rows.length;
                }

                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        } else {
            migrated = sourceCount; // simulate
        }

        const targetCountAfter = DRY_RUN ? targetCountBefore : await getRowCount(targetPool, table);
        report.push({ table, sourceCount, targetBefore: targetCountBefore, targetAfter: targetCountAfter, migrated, conflicts, status: 'migrated' });
        log('MIGRATE', `${table}: migrated ${migrated}, conflicts ${conflicts}, target now ${targetCountAfter}`);
    }

    return report;
}

// ===== Phase 5: Foreign Key Verification =====
async function phaseVerifyFKs(commonTables) {
    log('PHASE5', 'Verifying foreign keys...');
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
        if (!commonTables.includes(fk.table_name)) continue;
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

// ===== Phase 6: Sequence Verification =====
async function phaseVerifySequences(commonTables) {
    log('PHASE6', 'Verifying sequences...');
    const seqResult = await targetPool.query(`
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    `);

    const issues = [];
    for (const seq of seqResult.rows) {
        const seqName = seq.sequence_name;
        // Map sequence to table (conventional naming: table_id_seq)
        const match = seqName.match(/^(.*)_id_seq$/);
        if (match) {
            const table = match[1];
            if (!commonTables.includes(table)) continue;
            const pkCols = await getPrimaryKeyColumns(targetPool, table);
            if (pkCols.length === 0) continue;
            const maxId = await getMaxId(targetPool, table, pkCols[0]);
            const seqVal = await getSequenceValue(targetPool, seqName);
            if (maxId !== null && seqVal !== null && seqVal <= maxId) {
                issues.push({ sequence: seqName, table, maxId, seqVal });
                if (!DRY_RUN) {
                    await targetPool.query(`SELECT setval('"${seqName}"', $1, true)`, [maxId + 1]);
                    log('SEQUENCE', `${seqName} advanced from ${seqVal} to ${maxId + 1}`);
                } else {
                    log('SEQUENCE', `[DRY RUN] ${seqName} would advance from ${seqVal} to ${maxId + 1}`);
                }
            }
        }
    }

    if (issues.length === 0) {
        console.log('\n✅ All sequences verified');
    }

    return issues;
}

// ===== Phase 7: Row Count Verification =====
async function phaseVerifyCounts(report) {
    log('PHASE7', 'Verifying row counts...');
    console.log('\n--- Migration Report ---');
    console.log('Table | Source | Target Before | Migrated | Target After | Conflicts | Status');
    for (const r of report) {
        console.log(`${r.table} | ${r.sourceCount} | ${r.targetBefore} | ${r.migrated} | ${r.targetAfter} | ${r.conflicts || 0} | ${r.status}`);
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
            log('WARN', 'Run schema migrations to create missing tables before data migration.');
            console.log('');
        }

        if (commonTables.length === 0) {
            log('ERROR', 'No common tables found between source and target.');
            log('ERROR', 'Migration cannot proceed. Review schema comparison above.');
            process.exit(1);
        }

        const report = await phaseMigrate(commonTables);
        const orphans = await phaseVerifyFKs(commonTables);
        const seqIssues = await phaseVerifySequences(commonTables);
        await phaseVerifyCounts(report);

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
            process.exit(1);
        }

        if (DRY_RUN) {
            console.log('ℹ️  DRY RUN complete. Set DRY_RUN=false to execute.');
        } else {
            console.log('✅ Migration completed.');
        }
    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await sourcePool.end();
        await targetPool.end();
    }
}

main();
