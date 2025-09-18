import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Hotel } from "../models/hotel.models.js";
import { Room } from "../models/room.models.js";
import { Booking } from "../models/booking.models.js";

// Get location suggestions based on hotel cities
const getLocationSuggestions = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) throw new ApiError(400, "Query parameter is required");
  
  const suggestions = await Hotel.distinct("city", {
    city: new RegExp(query, "i")
  });
  
  return res.status(200).json(new ApiResponse(200, suggestions, "Location suggestions fetched successfully"));
});

// Get all hotels (optionally filter by city)
const getHotels = asyncHandler(async (req, res) => {
  const { city } = req.query;
  const query = city ? { city: new RegExp(city, "i") } : {};
  const hotels = await Hotel.find(query);
  
  // Calculate lowest price for each hotel
  const hotelsWithPrices = await Promise.all(
    hotels.map(async (hotel) => {
      const rooms = await Room.find({ hotelId: hotel._id });
      const lowestPrice = rooms.length > 0 
        ? Math.min(...rooms.map(room => room.pricePerNight || 0))
        : 0;
      
      return {
        ...hotel.toObject(),
        lowestPrice: lowestPrice,
        hasRooms: rooms.length > 0
      };
    })
  );
  
  return res.status(200).json(new ApiResponse(200, hotelsWithPrices, "Hotels fetched successfully"));
});

// Get rooms for a hotel
const getRooms = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const rooms = await Room.find({ hotelId });
  if (!rooms.length) throw new ApiError(404, "No rooms found for this hotel");
  return res.status(200).json(new ApiResponse(200, rooms, "Rooms fetched successfully"));
});

// Get hotel details by ID
const getHotelDetails = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw new ApiError(404, "Hotel not found");
  
  // Get rooms for this hotel
  const rooms = await Room.find({ hotelId });
  
  return res.status(200).json(new ApiResponse(200, {
    ...hotel.toObject(),
    rooms: rooms
  }, "Hotel details fetched successfully"));
});

// User booking
const assignBooking = asyncHandler(async (req, res) => {
  const { hotelId, roomId } = req.params;
  const room = await Room.findOne({ _id: roomId, hotelId });
  if (!room) throw new ApiError(404, "Room not found in this hotel");

  const { checkInDate, checkOutDate, numberOfAdults, numberOfChildren, guests, totalAmount, paymentStatus, bookingStatus } = req.body;

  const overlap = await Booking.findOne({
    roomId,
    hotelId,
    bookingStatus: "Confirmed",
    $or: [
      { checkInDate: { $lt: new Date(checkOutDate) }, checkOutDate: { $gt: new Date(checkInDate) } }
    ]
  });
  if (overlap) throw new ApiError(400, "Room is already booked for the given dates");

  const booking = await Booking.create({
    user: req.user._id,
    hotelId,
    roomId,
    bookingType: "Hotel",
    checkInDate,
    checkOutDate,
    numberOfAdults,
    numberOfChildren,
    guests,
    totalAmount,
    paymentStatus,
    bookingStatus
  });

  return res.status(200).json(new ApiResponse(200, booking, "Booking done successfully"));
});

export { getHotels, getRooms, assignBooking, getLocationSuggestions, getHotelDetails };
