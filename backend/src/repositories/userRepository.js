const db = require('../../database');

function findByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function findById(id) {
  return db.prepare('SELECT id, username, requires_password_reset, created_at FROM users WHERE id = ?').get(id);
}

function createUser({ username, hashedPassword }) {
  const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
  return findById(result.lastInsertRowid);
}

function updatePassword(userId, newHashedPassword) {
  return db.prepare('UPDATE users SET password = ?, requires_password_reset = 0 WHERE id = ?').run(newHashedPassword, userId);
}

function deleteUser(userId) {
  return db.prepare('DELETE FROM users WHERE id = ?').run(userId);
}

module.exports = { findByUsername, findById, createUser, updatePassword, deleteUser };
