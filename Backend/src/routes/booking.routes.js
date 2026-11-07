import { Router } from "express";
import {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  getBookingVoucher,
  verifyVoucherToken,
} from "../controllers/booking.controllers.js";
import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";
import {
  apiLimiter,
  strictLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.use(apiLimiter);

// User routes
router.post("/", strictLimiter, verifyJWT, createBooking);
router.get("/me", verifyJWT, getUserBookings);
router.post("/:bookingId/cancel", strictLimiter, verifyJWT, cancelBooking);
router.delete("/:bookingId", strictLimiter, verifyJWT, cancelBooking);
router.get("/:bookingId/voucher", verifyJWT, getBookingVoucher);
router.get("/verify-token/:token", verifyJWT, verifyVoucherToken);

// Admin routes
router.get("/", verifyJWT, isAdmin, getAllBookings);
router.put(
  "/:bookingId",
  strictLimiter,
  verifyJWT,
  isAdmin,
  updateBookingStatus,
);

export default router;
