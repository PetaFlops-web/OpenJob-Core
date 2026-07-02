const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:3000",
];

const DEFAULT_ALLOWED_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
];

const DEFAULT_ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "X-Request-Id",
];


const getAllowedOrigins = () => {

  const envOrigins = process.env.CORS_ALLOWED_ORIGINS;

  if (envOrigins) {
    return envOrigins.split(",").map((o) => o.trim());
  }
  
  return DEFAULT_ALLOWED_ORIGINS;
};


const corsMiddleware = (req, res, next) => {
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (allowedOrigins.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", DEFAULT_ALLOWED_METHODS.join(","));
  
  res.setHeader("Access-Control-Allow-Headers", DEFAULT_ALLOWED_HEADERS.join(","));
  
  res.setHeader("Access-Control-Max-Age", "86400"); 

  if (process.env.CORS_ALLOW_CREDENTIALS === "true") {
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
};

export default corsMiddleware;
