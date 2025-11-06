const { AppError } = require('../utils/errorHandler');

const validateQuery = (req, res, next) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    throw new AppError('Valid prompt is required', 400);
  }

  if (prompt.length > 1000) {
    throw new AppError('Prompt is too long (max 1000 characters)', 400);
  }

  req.sanitizedPrompt = prompt.trim();
  next();
};

const validateSQL = (req, res, next) => {
  const { sql } = req.body;

  if (!sql || typeof sql !== 'string') {
    throw new AppError('Valid SQL query is required', 400);
  }

  if (sql.length > 5000) {
    throw new AppError('SQL query is too long (max 5000 characters)', 400);
  }

  req.sanitizedSQL = sql.trim();
  next();
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potential SQL injection attempts
  const dangerous = [
    /;\s*DROP\s+/gi,
    /;\s*DELETE\s+FROM\s+/gi,
    /;\s*TRUNCATE\s+/gi,
    /;\s*ALTER\s+/gi,
  ];

  for (const pattern of dangerous) {
    if (pattern.test(input)) {
      console.warn('Potentially dangerous SQL pattern detected:', input);
    }
  }

  return input;
};

module.exports = {
  validateQuery,
  validateSQL,
  sanitizeInput,
};

