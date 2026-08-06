import { Router } from "express";
import {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
} from "../controllers/booking.controllers.js";
import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";
import { apiLimiter, strictLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.use(apiLimiter);

// User routes
router.post("/", strictLimiter, verifyJWT, createBooking);
router.get("/me", verifyJWT, getUserBookings);

// Admin routes
router.get("/", verifyJWT, isAdmin, getAllBookings);
router.put("/:bookingId", strictLimiter, verifyJWT, isAdmin, updateBookingStatus);

export default router;