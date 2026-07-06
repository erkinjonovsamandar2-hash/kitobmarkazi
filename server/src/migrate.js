/* ===== KITOBMARKAZI — Migration Runner ===== */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  // 1. Create migrations table if not exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Get list of files
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // 3. Get applied migrations
  const applied = await db.prepare('SELECT name FROM _migrations').all();
  const appliedNames = applied.map(r => r.name);

  // 4. Run pending
  let count = 0;
  for (const file of files) {
    if (appliedNames.includes(file)) continue;

    console.log(`  ⌛ Applying: ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    try {
      await db.query(sql);
      await db.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      console.log(`  ✅ Success!`);
      count++;
    } catch (e) {
      console.error(`  ❌ Failed: ${file}`);
      console.error(`     Error: ${e.message}`);
      process.exit(1);
    }
  }

  if (count === 0) {
    console.log('  ✨ Database is already up to date.');
  } else {
    console.log(`\n🎉 Migration complete! ${count} script(s) applied.`);
  }
  process.exit(0);
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
