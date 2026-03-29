const db = require('./database');

// Each migration is individually wrapped in try/catch.
// SQLite throws "duplicate column name" for existing columns — silently ignored.
const migrations = [
  `ALTER TABLE questions ADD COLUMN logic_rules TEXT DEFAULT NULL`,
  `ALTER TABLE surveys ADD COLUMN mode TEXT DEFAULT 'standard'`,
  `ALTER TABLE responses ADD COLUMN quality_score INTEGER DEFAULT 100`,
  `ALTER TABLE responses ADD COLUMN quality_flags TEXT DEFAULT '[]'`,
  `ALTER TABLE responses ADD COLUMN quality_label TEXT DEFAULT 'good'`,
  `ALTER TABLE responses ADD COLUMN completion_time_ms INTEGER DEFAULT NULL`,
];

function runMigrations() {
  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch (e) {
      // Silently ignore "duplicate column name" errors from SQLite
      if (!e.message.includes('duplicate column name')) {
        console.warn('[migrations] Unexpected migration error:', e.message);
      }
    }
  }
  console.log('[migrations] Migrations complete');
}

module.exports = { runMigrations };
