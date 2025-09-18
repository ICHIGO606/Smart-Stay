import { Router } from "express";
import {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
} from "../controllers/booking.controllers.js";
import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// User routes
router.post("/", verifyJWT, createBooking);
router.get("/me", verifyJWT, getUserBookings);

// Admin routes
router.get("/", verifyJWT, isAdmin, getAllBookings);
router.put("/:bookingId", verifyJWT, isAdmin, updateBookingStatus);

export default router;
