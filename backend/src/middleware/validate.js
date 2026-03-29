/**
 * validate.js — Request validation middleware.
 * Uses standalone helpers to avoid circular dependency on authService.
 */

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, error: message });
}

// ── validateLogin ─────────────────────────────────────────────────────────────
// username: required, min 1 char
// password: required, min 1 char
const validateLogin = (req, res, next) => {
  const { username, password } = req.body || {};

  if (!username || typeof username !== 'string' || username.trim().length < 1) {
    return fail(res, 'Username is required');
  }
  if (!password || typeof password !== 'string' || password.length < 1) {
    return fail(res, 'Password is required');
  }

  req.body.username = username.trim();
  next();
};

// ── validateSurvey ────────────────────────────────────────────────────────────
// title: required
// questions: if present, must be array; no minimum enforced here (service validates)
const validateSurvey = (req, res, next) => {
  const { title } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim().length < 1) {
    return fail(res, 'Survey title is required');
  }
  if (title.trim().length > 300) {
    return fail(res, 'Survey title must be 300 characters or less');
  }

  req.body.title = title.trim();
  next();
};

// ── validateResponse ──────────────────────────────────────────────────────────
// answers: must be an array (can be empty for optional-only surveys)
const validateResponse = (req, res, next) => {
  const { answers } = req.body || {};

  if (!Array.isArray(answers)) {
    return fail(res, 'Answers must be an array');
  }

  next();
};

module.exports = { validateLogin, validateSurvey, validateResponse };
