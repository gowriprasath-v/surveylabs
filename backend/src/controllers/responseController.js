const responseService = require('../services/responseService');

const submitResponse = (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    // Accept both camelCase (frontend) and snake_case (API clients)
    const completionTimeMs =
      req.body.completionTimeMs ?? req.body.completion_time_ms ?? null;

    const result = responseService.submitResponse(
      req.params.id,
      req.body.answers,
      ip,
      completionTimeMs,
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getResults = (req, res, next) => {
  try {
    const data = responseService.getResults(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitResponse, getResults };
