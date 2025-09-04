const { ValidationError } = require("sequelize");

const errorHandler = (err, req, res, next) => {
  console.log(err);

  if (err instanceof ValidationError) {
    const errors = err.errors.map((error) => ({
      field: error.path,
      message: error.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors,
    });
  }

  // Handle specific custom errors (optional)
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Authorization failed.",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Maximum five images can be upload at a time.",
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ success: false, message: "Maximum 2MB file size allowed." });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === "InvalidFileError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  const statusCode = err.status || 500;
  const errorMessage =
    statusCode === 500
      ? "An unexpected error occurred. Please try again later."
      : err.message;

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // Include stack trace in development
  });
};

module.exports = errorHandler;
