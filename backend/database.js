const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'survey.db');
const db = new Database(dbPath);

// Performance pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 5000');
db.pragma('temp_store = memory');

// All 5 core tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE TABLE IF NOT EXISTS surveys (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    mode        TEXT NOT NULL DEFAULT 'standard',
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_by  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id          TEXT PRIMARY KEY,
    survey_id   TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK(type IN ('mcq','text_short','text_long','rating','text')),
    label       TEXT NOT NULL,
    options     TEXT DEFAULT NULL,
    required    INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0,
    logic_rules TEXT DEFAULT NULL,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE TABLE IF NOT EXISTS responses (
    id                 TEXT PRIMARY KEY,
    survey_id          TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    respondent_ip      TEXT,
    quality_score      INTEGER DEFAULT 100,
    quality_flags      TEXT DEFAULT '[]',
    quality_label      TEXT DEFAULT 'good',
    completion_time_ms INTEGER DEFAULT NULL,
    submitted_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE TABLE IF NOT EXISTS answers (
    id           TEXT PRIMARY KEY,
    response_id  TEXT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    question_id  TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_surveys_user_id       ON surveys(created_by);
  CREATE INDEX IF NOT EXISTS idx_surveys_is_active     ON surveys(is_active);
  CREATE INDEX IF NOT EXISTS idx_questions_survey_id   ON questions(survey_id);
  CREATE INDEX IF NOT EXISTS idx_responses_survey_id   ON responses(survey_id);
  CREATE INDEX IF NOT EXISTS idx_responses_submitted   ON responses(submitted_at);
  CREATE INDEX IF NOT EXISTS idx_answers_response_id   ON answers(response_id);
  CREATE INDEX IF NOT EXISTS idx_answers_question_id   ON answers(question_id);
`);

// Seed default admin with a bcrypt-hashed password
const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)').run('admin', hashedPassword);
  console.log('[DB] Default admin user seeded (admin / admin123)');
}

module.exports = db;
