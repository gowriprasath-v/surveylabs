const responseService = require('../services/responseService');

const submitResponse = (req, res, next) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null)
      || req.socket?.remoteAddress
      || 'unknown';
    // Accept both camelCase (frontend) and snake_case (API clients)
    const completionTimeMs =
      req.body.completionTimeMs ?? req.body.completion_time_ms ?? null;

    const result = responseService.submitResponse(
      req.params.id,
      req.body.answers,
      ip,
      completionTimeMs,
    );
    
    // Broadcast WS event for live feed
    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({ type: 'response:new', surveyId: req.params.id, data: result }));
        }
      });
    }

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
