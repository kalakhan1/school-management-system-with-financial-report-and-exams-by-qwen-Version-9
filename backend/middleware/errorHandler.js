const errorHandler = (err, req, res, next) => {
  console.error('💥 Global Error Handler:', err.stack || err.message);

  // Mongoose Bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({ success: false, error: 'Resource not found' });
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    return res.status(400).json({ success: false, error: 'Duplicate field value entered' });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({ success: false, error: message });
  }

  // Default Error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error',
    code: 'INTERNAL_SERVER_ERROR'
  });
};

// Handle 404 Not Found
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  res.status(404).json({ success: false, error: error.message, code: 'ROUTE_NOT_FOUND' });
};

module.exports = { errorHandler, notFound };