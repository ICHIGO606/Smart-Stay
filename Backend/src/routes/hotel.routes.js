import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getHotels, getRooms, assignBooking, getLocationSuggestions, getHotelDetails } from "../controllers/hotel.controllers.js";

const router = Router();

// Get location suggestions
router.get("/locations/suggestions", getLocationSuggestions);

// Get hotels (optionally by city)
router.get("/hotels", getHotels);

// Get hotel details by ID
router.get("/hotels/:hotelId", getHotelDetails);

// Get rooms of a hotel
router.get("/hotels/:hotelId/rooms", verifyJWT, getRooms);

// Book a room
router.post("/hotels/:hotelId/rooms/:roomId/book", verifyJWT, assignBooking);

export default router;
