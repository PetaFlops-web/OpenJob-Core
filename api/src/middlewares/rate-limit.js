import rateLimit from "express-rate-limit";

const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const GLOBAL_RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 10000);
const API_RATE_LIMIT_MAX = Number(process.env.API_RATE_LIMIT_MAX_REQUESTS || 5000);
const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 100);

const globalRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: GLOBAL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
  skip: (req) => req.path === "/health",
});

const authRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
});

const apiRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests. Please slow down.",
  },
});

export { globalRateLimit, authRateLimit, apiRateLimit };
