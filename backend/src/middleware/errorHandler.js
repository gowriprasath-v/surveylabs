function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${err.message}`);
    if (err.stack && process.env.NODE_ENV !== 'production') {
      console.error(err.stack);
    }
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;
