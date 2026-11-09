import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Hotel } from "../models/hotel.models.js";
import { Room } from "../models/room.models.js";
import { Booking } from "../models/booking.models.js";
import { escapeRegex } from "../utils/helpers.js";

const getLocationSuggestions = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) throw new ApiError(400, "Query parameter is required");

  const suggestions = await Hotel.distinct("city", {
    city: new RegExp(escapeRegex(query), "i"),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        suggestions,
        "Location suggestions fetched successfully",
      ),
    );
});

const getHotels = asyncHandler(async (req, res) => {
  const {
    city,
    checkIn,
    checkOut,
    guests,
    adults = 1,
    children = 0,
    minPrice,
    maxPrice,
    organizationId,
  } = req.query;

  const query = city ? { city: new RegExp(escapeRegex(city), "i") } : {};
  if (organizationId) {
    query.organizationId = organizationId;
  }
  const hotels = await Hotel.find(query).populate(
    "organizationId",
    "name slug branding theme",
  );

  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;
  const totalGuests =
    parseInt(guests) || parseInt(adults) + parseInt(children) || 1;

  const hotelsWithPrices = await Promise.all(
    hotels.map(async (hotel) => {
      let rooms = await Room.find({ hotelId: hotel._id });

      // If dates provided, calculate available rooms during requested window
      let availableRooms = rooms;
      if (checkInDate && checkOutDate) {
        availableRooms = rooms.filter((room) => {
          const allNumbers = room.roomNumbers || [];
          const bookedNumbers = (room.bookedRoomNumbers || [])
            .filter((booking) => {
              const bCheckIn = new Date(booking.checkInDate);
              const bCheckOut = new Date(booking.checkOutDate);
              return checkInDate < bCheckOut && checkOutDate > bCheckIn;
            })
            .map((b) => b.roomNumber);

          const freeNumbers = allNumbers.filter(
            (num) => !bookedNumbers.includes(num),
          );
          return (
            freeNumbers.length > 0 &&
            (room.maxOccupancy ? room.maxOccupancy >= totalGuests : true)
          );
        });
      }

      // Filter by minPrice / maxPrice if provided
      if (minPrice || maxPrice) {
        availableRooms = availableRooms.filter((r) => {
          const price = r.pricePerNight || 0;
          if (minPrice && price < parseFloat(minPrice)) return false;
          if (maxPrice && price > parseFloat(maxPrice)) return false;
          return true;
        });
      }

      const lowestPrice =
        availableRooms.length > 0
          ? Math.min(...availableRooms.map((room) => room.pricePerNight || 0))
          : rooms.length > 0
            ? Math.min(...rooms.map((r) => r.pricePerNight || 0))
            : 0;

      // Nights calculation for total estimated trip price
      let totalStayPrice = lowestPrice;
      let nights = 1;
      if (checkInDate && checkOutDate) {
        const diffTime = Math.abs(checkOutDate - checkInDate);
        nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        totalStayPrice = lowestPrice * nights;
      }

      return {
        ...hotel.toObject(),
        lowestPrice,
        totalStayPrice,
        nights,
        hasRooms: rooms.length > 0,
        availableRoomsCount: availableRooms.length,
        isAvailableForDates:
          checkInDate && checkOutDate ? availableRooms.length > 0 : true,
      };
    }),
  );

  // If specific dates were searched, filter out hotels with zero vacancy
  let filteredHotels = hotelsWithPrices;
  if (checkInDate && checkOutDate) {
    filteredHotels = hotelsWithPrices.filter((h) => h.isAvailableForDates);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, filteredHotels, "Hotels fetched successfully"));
});

// Get rooms for a hotel
const getRooms = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const rooms = await Room.find({ hotelId });
  if (!rooms.length) throw new ApiError(404, "No rooms found for this hotel");
  return res
    .status(200)
    .json(new ApiResponse(200, rooms, "Rooms fetched successfully"));
});

// Get hotel details by ID
const getHotelDetails = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const hotel = await Hotel.findById(hotelId).populate(
    "organizationId",
    "name slug branding theme contact",
  );
  if (!hotel) throw new ApiError(404, "Hotel not found");

  // Get rooms for this hotel
  const rooms = await Room.find({ hotelId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...hotel.toObject(),
        rooms: rooms,
      },
      "Hotel details fetched successfully",
    ),
  );
});

// User booking
const assignBooking = asyncHandler(async (req, res) => {
  const { hotelId, roomId } = req.params;
  const room = await Room.findOne({ _id: roomId, hotelId });
  if (!room) throw new ApiError(404, "Room not found in this hotel");

  const {
    checkInDate,
    checkOutDate,
    numberOfAdults,
    numberOfChildren,
    guests,
    totalAmount,
    paymentStatus,
    bookingStatus,
  } = req.body;

  const overlap = await Booking.findOne({
    roomId,
    hotelId,
    bookingStatus: "Confirmed",
    $or: [
      {
        checkInDate: { $lt: new Date(checkOutDate) },
        checkOutDate: { $gt: new Date(checkInDate) },
      },
    ],
  });
  if (overlap)
    throw new ApiError(400, "Room is already booked for the given dates");

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
    bookingStatus,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking done successfully"));
});

export {
  getHotels,
  getRooms,
  assignBooking,
  getLocationSuggestions,
  getHotelDetails,
};
