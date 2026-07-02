import { randomUUID } from "crypto";
import log from "../utils/logger.js";

const logger = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || `req-${randomUUID()}`;
  const startTime = Date.now();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const logEntry = {
    level: "info",
    type: "http_request",
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: req.query,
    userAgent: req.headers["user-agent"],
    ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    contentLength: req.headers["content-length"],
  };

  const skipPaths = ["/docs", "/docs.json", "/health"];
  if (skipPaths.some((p) => req.path.startsWith(p))) {
    return next();
  }

  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;

    let level = "info";
    if (res.statusCode >= 500) level = "error";
    else if (res.statusCode >= 400) level = "warn";

    const responseLog = {
      ...logEntry,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseLength: res.getHeader("content-length") || 0,
    };

    if (level === "error") {
      log.error(JSON.stringify(responseLog));
    } else if (level === "warn") {
      log.warn(JSON.stringify(responseLog));
    } else {
      log.log(JSON.stringify(responseLog));
    }

    return originalEnd.apply(res, args);
  };

  next();
};

export default logger;
