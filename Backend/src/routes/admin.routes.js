import { Router } from "express";
import { isAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyHotelAdmin } from "../middlewares/verifyHotelAdmin.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { apiLimiter, strictLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  createHotel,
  updateHotel,
  addRoom,
  updateRoom,
  deleteRoom,
  getAdminHotels,
  getHotelRoomsStatus,
  getHotelBookings,
  getHotelRooms
} from "../controllers/admin.controllers.js";
import {
  getPendingVerifications,
  getUserVerification,
  verifyUser,
  getVerifiedUsers,
  getVerificationStats
} from "../controllers/adminVerification.controllers.js";

const router = Router();

router.use(apiLimiter);

router.get("/hotels", verifyJWT, isAdmin, getAdminHotels);

router.post(
  "/hotels",
  strictLimiter,
  verifyJWT,
  isAdmin,
  upload.fields([{ name: "images", maxCount: 10 }]),
  createHotel
);

router.put(
  "/hotels/:hotelId",
  strictLimiter,
  verifyJWT,
  verifyHotelAdmin,
  upload.fields([{ name: "images", maxCount: 10 }]),
  updateHotel
);

router.post(
  "/hotels/:hotelId/rooms",
  strictLimiter,
  verifyJWT,
  verifyHotelAdmin,
  upload.fields([{ name: "images", maxCount: 10 }]),
  addRoom
);

router.put(
  "/hotels/:hotelId/rooms/:roomId",
  strictLimiter,
  verifyJWT,
  verifyHotelAdmin,
  upload.fields([{ name: "images", maxCount: 10 }]),
  updateRoom
);

router.delete(
  "/hotels/:hotelId/rooms/:roomId",
  strictLimiter,
  verifyJWT,
  verifyHotelAdmin,
  deleteRoom
);

router.get("/hotels/:hotelId/bookings", verifyJWT, verifyHotelAdmin, getHotelBookings);


router.get("/hotels/:hotelId/rooms-status", verifyJWT, verifyHotelAdmin, getHotelRoomsStatus);
router.get("/hotels/:hotelId/rooms", verifyJWT, verifyHotelAdmin, getHotelRooms);

router.get("/verifications/pending", verifyJWT, isAdmin, getPendingVerifications);
router.get("/verifications/verified", verifyJWT, isAdmin, getVerifiedUsers);
router.get("/verifications/stats", verifyJWT, isAdmin, getVerificationStats);
router.get("/verifications/user/:userId", verifyJWT, isAdmin, getUserVerification);

router.put("/verifications/verify/:userId", strictLimiter, verifyJWT, isAdmin, verifyUser);

export default router;