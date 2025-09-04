class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status || 500;
    this.isOperational = true; // Indicates this is a known operational error
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
