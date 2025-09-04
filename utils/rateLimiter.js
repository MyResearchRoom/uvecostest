// rateLimiter.js
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

// Smart key generator
const getRateLimitKey = (req) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // If token is valid, use user id
      return `user-${decoded.id}`;
    } catch (error) {
      // Token invalid, fallback to IP + user-agent
      const userAgent = req.headers["user-agent"] || "unknown";
      return `ip-${req.ip}-${userAgent}`;
    }
  } else {
    // No token, fallback to IP + user-agent
    const userAgent = req.headers["user-agent"] || "unknown";
    return `ip-${req.ip}-${userAgent}`;
  }
};

// Create the rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each user to 100 requests per windowMs
  keyGenerator: getRateLimitKey,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the old `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this user/device. Please try again later.",
  },
});

const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes window
  max: 5, // Limit each user to 5 requests per windowMs
  keyGenerator: getRateLimitKey,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the old `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this user/device. Please try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes window
  max: 5, // Limit each user to 5 requests per windowMs
  keyGenerator: getRateLimitKey,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the old `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this user/device. Please try again later.",
  },
});

const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // Limit each user to 20 requests per windowMs
  keyGenerator: getRateLimitKey,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the old `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this user/device. Please try again later.",
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // Limit each user to 5 requests per windowMs
  keyGenerator: getRateLimitKey,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the old `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this user/device. Please try again later.",
  },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // Limit each user to 5 requests per windowMs
  keyGenerator: getRateLimitKey,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the old `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this user/device. Please try again later.",
  },
});

module.exports = {
  limiter,
  registerLimiter,
  loginLimiter,
  refreshTokenLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
};
