function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${err.message}`);
    if (err.stack && process.env.NODE_ENV !== 'production') {
      console.error(err.stack);
    }
  }

  const statusCode = err.statusCode || 500;
  // If it's an operational ApiError, pass the message, otherwise mask 500s.
  const isOperational = err.isOperational !== undefined ? err.isOperational : false;
  const message = (statusCode !== 500 || isOperational) ? err.message : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;
