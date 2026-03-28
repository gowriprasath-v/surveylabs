const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'survey_platform_jwt_secret_2024_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function login(username, password) {
  if (!username || !password) {
    throw createError('Username and password are required');
  }

  const user = userRepository.findByUsername(username);
  if (!user) {
    throw createError('Invalid credentials', 401);
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    throw createError('Invalid credentials', 401);
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: { id: user.id, username: user.username },
  };
}

function register(username, password) {
  if (!username || !password) {
    throw createError('Username and password are required');
  }

  if (username.length < 3) {
    throw createError('Username must be at least 3 characters');
  }

  if (password.length < 6) {
    throw createError('Password must be at least 6 characters');
  }

  const existing = userRepository.findByUsername(username);
  if (existing) {
    throw createError('Username already taken', 409);
  }

  const hashedPassword = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  return userRepository.createUser({ username, hashedPassword });
}

module.exports = { login, register };
