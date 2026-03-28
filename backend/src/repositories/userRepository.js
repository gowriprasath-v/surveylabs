const db = require('../../database');

function findByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function findById(id) {
  return db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(id);
}

function createUser({ username, hashedPassword }) {
  const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
  return findById(result.lastInsertRowid);
}

module.exports = { findByUsername, findById, createUser };
