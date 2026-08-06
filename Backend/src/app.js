import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
const app = express();

app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import authRouter from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js'
import adminRouter from './routes/admin.routes.js'
import bookingRouter from './routes/booking.routes.js'
import reviewRouter from './routes/review.routes.js'
import hotelRouter from './routes/hotel.routes.js'
import paymentRouter from './routes/payment.routes.js'
import webhookRouter from './routes/webhook.routes.js'
import packageRouter from './routes/package.routes.js'

app.use("/webhooks", webhookRouter);

const {
  doubleCsrfProtection,
  generateToken
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "fallback_secret_for_development_only", 
  cookieName: "x-csrf-token",
  cookieOptions: {
    sameSite: "lax", 
    path: "/",
    secure: process.env.NODE_ENV === "production", 
  },
  getTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

app.use(doubleCsrfProtection);

app.get("/api/v1/csrf-token", (req, res) => {
  const csrfToken = generateToken(req, res);
  res.status(200).json({ csrfToken });
});

app.use('/api/v1/auth',authRouter)
app.use('/api/v1/users',userRouter)
app.use('/api/v1/admin',adminRouter)
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/v1/hotels", hotelRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/packages", packageRouter);
export  {app};