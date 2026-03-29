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

// GET /api/auth/me — verify token and return current user
const me = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

module.exports = { login, register, me };
