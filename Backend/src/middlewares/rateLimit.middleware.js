import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true, 
  legacyHeaders: false, 
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10,
  keyGenerator: (req) => {
    const routePath = req.route?.path;
    const endpoint = routePath
      ? `${req.baseUrl}${routePath}`
      : req.path;
    return `${ipKeyGenerator(req.ip)}:${req.method}:${endpoint}`;
  },
  message: { message: "Too many attempts for this action, please try again after an hour" },
  standardHeaders: true,
  legacyHeaders: false,
});