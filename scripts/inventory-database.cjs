#!/usr/bin/env node
// ===== Database Inventory Tool =====
// Usage: DATABASE_URL=postgresql://... node scripts/inventory-database.cjs [label]
// Prints schema, indexes, constraints, sequences, and row counts.
// Does NOT print connection credentials.

require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL || process.env.SOURCE_DATABASE_URL || process.env.TARGET_DATABASE_URL;
const LABEL = process.argv[2] || 'database';

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL (or equivalent) is required');
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function inventory() {
    console.log(`\n========================================`);
    console.log(`  Inventory: ${LABEL}`);
    console.log(`========================================\n`);

    // Tables and columns
    const tablesResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    `);
    const tables = tablesResult.rows.map(r => r.table_name);

    for (const table of tables) {
        const colsResult = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position
        `, [table]);

        const pkResult = await pool.query(`
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public' AND tc.table_name = $1
        `, [table]);
        const pks = new Set(pkResult.rows.map(r => r.column_name));

        const fkResult = await pool.query(`
            SELECT kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' AND tc.table_name = $1
        `, [table]);
        const fks = fkResult.rows;

        const countResult = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
        const count = countResult.rows[0].count;

        console.log(`TABLE: ${table}  ROWS: ${count}`);
        for (const col of colsResult.rows) {
            const pk = pks.has(col.column_name) ? ' PK' : '';
            const fk = fks.find(f => f.column_name === col.column_name);
            const fkStr = fk ? ` FK->${fk.foreign_table}.${fk.foreign_column}` : '';
            console.log(`  ${col.column_name}: ${col.data_type} null=${col.is_nullable} default=${col.column_default || 'none'}${pk}${fkStr}`);
        }
        console.log('');
    }

    // Indexes
    const indexesResult = await pool.query(`
        SELECT tablename, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
    `);
    console.log('INDEXES:');
    for (const idx of indexesResult.rows) {
        console.log(`  ${idx.tablename}.${idx.indexname}`);
    }
    console.log('');

    // Constraints (non-index)
    const constraintsResult = await pool.query(`
        SELECT tc.table_name, tc.constraint_name, tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_type
    `);
    console.log('CONSTRAINTS:');
    for (const c of constraintsResult.rows) {
        console.log(`  ${c.table_name}: ${c.constraint_name} (${c.constraint_type})`);
    }
    console.log('');

    // Sequences
    const seqResult = await pool.query(`
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
        ORDER BY sequence_name
    `);
    console.log('SEQUENCES:', seqResult.rows.map(r => r.sequence_name).join(', ') || 'none');

    console.log(`\n========================================`);
    console.log(`  End of inventory: ${LABEL}`);
    console.log(`========================================\n`);

    await pool.end();
}

inventory().catch(err => {
    console.error('Inventory failed:', err.message);
    pool.end();
    process.exit(1);
});
