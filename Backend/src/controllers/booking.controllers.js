import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Booking } from "../models/booking.models.js";
import { Room } from "../models/room.models.js";
import { Hotel } from "../models/hotel.models.js";

// Create a booking
const createBooking = asyncHandler(async (req, res) => {
  const {
    bookingType,
    hotelId,
    roomId,
    package: packageId,
    checkInDate,
    checkOutDate,
    numberOfAdults,
    numberOfChildren,
    guests,
    totalAmount,
    paymentStatus,
    bookingStatus,
  } = req.body;

  if (!bookingType || !checkInDate || !checkOutDate || !numberOfAdults) {
    throw new ApiError(400, "Required booking fields are missing");
  }

  // Check if room exists for hotel
  if (bookingType === "Hotel") {
    const room = await Room.findOne({ _id: roomId, hotelId });
    if (!room) throw new ApiError(404, "Room not found for this hotel");

    // Check overlapping bookings
    const overlap = await Booking.findOne({
      roomId,
      bookingStatus: "Confirmed",
      $or: [
        {
          checkInDate: { $lt: new Date(checkOutDate) },
          checkOutDate: { $gt: new Date(checkInDate) },
        },
      ],
    });
    if (overlap) throw new ApiError(400, "Room already booked for these dates");
  }

  const booking = await Booking.create({
    user: req.user._id,
    bookingType,
    hotelId: bookingType === "Hotel" ? hotelId : undefined,
    roomId: bookingType === "Hotel" ? roomId : undefined,
    package: bookingType === "Package" ? packageId : undefined,
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
    .status(201)
    .json(new ApiResponse(201, booking, "Booking created successfully"));
});

// Get bookings for a user
const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate("hotelId", "name city")
    .populate("roomId", "type pricePerNight")
    .populate("package", "name price");

  return res
    .status(200)
    .json(new ApiResponse(200, bookings, "User bookings fetched successfully"));
});

// Get all bookings (Admin)
const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate("user", "fullName email")
    .populate("hotelId", "name city")
    .populate("roomId", "type pricePerNight")
    .populate("package", "name price");

  return res
    .status(200)
    .json(new ApiResponse(200, bookings, "All bookings fetched successfully"));
});

// Update booking status
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { bookingStatus, paymentStatus } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (bookingStatus) booking.bookingStatus = bookingStatus;
  if (paymentStatus) booking.paymentStatus = paymentStatus;

  await booking.save();

  return res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking updated successfully"));
});

export {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
};
