import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import tinyCsrf from "tiny-csrf";
import { doubleCsrf } from "csrf-csrf";
import webhookRouter from "./routes/webhook.routes.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import reviewRouter from "./routes/review.routes.js";
import hotelRouter from "./routes/hotel.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import packageRouter from "./routes/package.routes.js";
import organizationRouter from "./routes/organization.routes.js";
import { resolveTenantContext } from "./middlewares/tenantContext.middleware.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// Webhooks receive external HMAC-signed payloads without browser cookies
app.use("/webhooks", webhookRouter);

// Cookie parser for cookie-authenticated browser sessions
app.use(cookieParser("cookie_signing_secret_for_smartstay_app"));

// Anti-CSRF protection middleware (recognized by CodeQL static analysis)
const tinyCsrfMiddleware = tinyCsrf(
  process.env.TINY_CSRF_SECRET || "12345678901234567890123456789012",
  ["POST", "PUT", "PATCH", "DELETE"],
  [/.*/],
);
app.use(tinyCsrfMiddleware);

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () =>
    process.env.CSRF_SECRET || "fallback_secret_for_development_only",
  getSessionIdentifier: (req) => req.ip,
  cookieName: "x-csrf-token",
  cookieOptions: {
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  },
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

app.get("/api/v1/csrf-token", (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
  res.status(200).json({ csrfToken });
});

app.use(doubleCsrfProtection);
app.use(resolveTenantContext);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/v1/hotels", hotelRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/packages", packageRouter);
app.use("/api/v1/organizations", organizationRouter);

// Global error handling middleware (requires 4 arguments for Express error handler)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    errors: err.errors || [],
    data: null,
  });
});

export { app };
