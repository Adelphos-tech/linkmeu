// ===== Database Migration Runner =====
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function initMigrationsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

async function getAppliedMigrations() {
    const result = await pool.query('SELECT filename FROM schema_migrations ORDER BY id');
    return new Set(result.rows.map(r => r.filename));
}

async function applyMigration(filename, sql) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
        console.log(`  ✅ Applied: ${filename}`);
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

async function runMigrations() {
    try {
        await initMigrationsTable();
        const applied = await getAppliedMigrations();

        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort();

        let ran = 0;
        for (const file of files) {
            if (applied.has(file)) {
                console.log(`  ⏭️  Skipped (already applied): ${file}`);
                continue;
            }
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
            await applyMigration(file, sql);
            ran++;
        }

        if (ran === 0) {
            console.log('✅ All migrations up to date');
        } else {
            console.log(`✅ Applied ${ran} migration(s)`);
        }
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
