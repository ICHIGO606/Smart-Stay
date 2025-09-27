import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
app.use('/api/v1/auth',authRouter)
app.use('/api/v1/users',userRouter)
app.use('/api/v1/admin',adminRouter)
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/v1/hotels", hotelRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/webhooks", webhookRouter);
export  {app};