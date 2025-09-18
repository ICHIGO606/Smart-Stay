import { Router } from "express";
import { isAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyHotelAdmin } from "../middlewares/verifyHotelAdmin.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createHotel,
  updateHotel,
  addRoom,
  updateRoom,
  deleteRoom,
  getAdminHotels,
  getHotelRoomsStatus,
  getHotelBookings,
} from "../controllers/admin.controllers.js";

const router = Router();
router.get("/hotels", verifyJWT, isAdmin, getAdminHotels);
// Create hotel
router.post(
  "/hotels",
  verifyJWT,
  isAdmin,
  upload.fields([{ name: "images", maxCount: 10 }]),
  createHotel
);

// Update hotel
router.put(
  "/hotels/:hotelId",
  verifyJWT,
  verifyHotelAdmin,
  upload.fields([{ name: "images", maxCount: 10 }]),
  updateHotel
);

// Add room to a hotel
router.post(
  "/hotels/:hotelId/rooms",
  verifyJWT,
  verifyHotelAdmin,
  upload.fields([{ name: "images", maxCount: 10 }]),
  addRoom
);

// Update a room
router.put(
  "/hotels/:hotelId/rooms/:roomId",
  verifyJWT,
  verifyHotelAdmin,
  upload.fields([{ name: "images", maxCount: 10 }]),
  updateRoom
);

// Delete a room
router.delete(
  "/hotels/:hotelId/rooms/:roomId",
  verifyJWT,
  verifyHotelAdmin,
  deleteRoom
);
router.get("/hotels/:hotelId/bookings", verifyJWT, verifyHotelAdmin, getHotelBookings);

// Get all rooms with booked/available info (Admin)
router.get("/hotels/:hotelId/rooms-status", verifyJWT, verifyHotelAdmin, getHotelRoomsStatus);

export default router;
