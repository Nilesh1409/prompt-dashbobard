class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleDatabaseError = (error) => {
  const errorMappings = {
    '23505': { message: 'Duplicate entry found', statusCode: 409 },
    '23503': { message: 'Foreign key constraint violation', statusCode: 400 },
    '23502': { message: 'Required field is missing', statusCode: 400 },
    '42P01': { message: 'Table does not exist', statusCode: 404 },
    '42703': { message: 'Column does not exist', statusCode: 404 },
    '42601': { message: 'SQL syntax error', statusCode: 400 },
  };

  const mapping = errorMappings[error.code];
  
  if (mapping) {
    return new AppError(mapping.message, mapping.statusCode, error.detail);
  }

  return new AppError('Database error occurred', 500, error.message);
};

const handleOpenAIError = (error) => {
  if (error.status === 401) {
    return new AppError('Invalid OpenAI API key', 401);
  }
  
  if (error.status === 429) {
    return new AppError('OpenAI rate limit exceeded', 429);
  }
  
  if (error.status === 500) {
    return new AppError('OpenAI service error', 502);
  }

  return new AppError('Failed to generate SQL query', 500, error.message);
};

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Handle different error types
  if (err.code) {
    error = handleDatabaseError(err);
  } else if (err.response?.status) {
    error = handleOpenAIError(err);
  } else if (!err.isOperational) {
    error = new AppError('Internal server error', 500);
  }

  // Log error for debugging
  console.error('Error:', {
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message,
    details: error.details || undefined,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};

module.exports = {
  AppError,
  errorMiddleware,
  handleDatabaseError,
  handleOpenAIError,
};

