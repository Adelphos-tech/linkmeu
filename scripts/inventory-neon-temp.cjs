require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function inventory() {
  console.log('=== NEON DATABASE INVENTORY ===');
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name");
  for (const t of tables.rows) {
    const count = await pool.query('SELECT COUNT(*) FROM "' + t.table_name + '"');
    console.log(t.table_name + ': ' + count.rows[0].count + ' rows');
  }
  const migrations = await pool.query('SELECT filename FROM schema_migrations ORDER BY id');
  console.log('\nMigrations applied: ' + migrations.rows.map(r => r.filename).join(', '));
  await pool.end();
}

inventory();
