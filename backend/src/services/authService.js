const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

function login(username, password) {
  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required');
  }

  const user = userRepository.findByUsername(username);
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const payload = { id: user.id, username: user.username };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, username: user.username, requires_password_reset: user.requires_password_reset === 1 },
  };
}

function register(username, password) {
  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username)) {
    throw new ApiError(400, 'Invalid email format');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long');
  }

  const existing = userRepository.findByUsername(username);
  if (existing) {
    throw new ApiError(409, 'Username already taken');
  }

  const hashedPassword = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  return userRepository.createUser({ username, hashedPassword });
}

function refresh(token) {
  if (!token) {
    throw new ApiError(401, 'Refresh token required');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    const user = userRepository.findById(decoded.id);
    if (!user) throw new ApiError(401, 'User no longer exists');

    const payload = { id: user.id, username: user.username };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
}

function resetInitialPassword(userId, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters long');
  }
  const user = userRepository.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.requires_password_reset === 0) {
    throw new ApiError(400, 'Password reset not required for this user');
  }
  
  const hashedPassword = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
  userRepository.updatePassword(user.id, hashedPassword);
  return { success: true };
}

function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Both current and new password are required');
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters long');
  }
  const user = userRepository.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = bcrypt.compareSync(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const hashedPassword = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
  userRepository.updatePassword(user.id, hashedPassword);
  return { success: true };
}

function deleteAccount(userId) {
  const user = userRepository.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  
  userRepository.deleteUser(userId);
  return { success: true };
}

module.exports = { login, register, refresh, resetInitialPassword, changePassword, deleteAccount };
