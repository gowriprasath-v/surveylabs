const authService = require('../services/authService');

const login = (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = authService.login(username, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const register = (req, res, next) => {
  try {
    const data = authService.register(req.body.username, req.body.password);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const refresh = (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const data = authService.refresh(refreshToken);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const resetInitialPassword = (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const data = authService.resetInitialPassword(req.user.id, newPassword);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me — verify token and return current user
const me = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

// POST /api/auth/change-password
const changePassword = (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const data = authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/auth/me — permanently delete the current user's account
const deleteAccount = (req, res, next) => {
  try {
    authService.deleteAccount(req.user.id);
    res.json({ success: true, message: 'Account permanently deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, register, refresh, resetInitialPassword, me, changePassword, deleteAccount };
