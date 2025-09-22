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

// Get all bookings (Admin) with pagination, sorting, and filtering
const getAllBookings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    status,
    search,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const matchStage = {};

  if (status && status !== "all") matchStage.bookingStatus = status;
  if (dateFrom || dateTo) {
    matchStage.createdAt = {};
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
    if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
  }
  if (minAmount || maxAmount) {
    matchStage.totalAmount = {};
    if (minAmount) matchStage.totalAmount.$gte = parseFloat(minAmount);
    if (maxAmount) matchStage.totalAmount.$lte = parseFloat(maxAmount);
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "hotels",
        localField: "hotelId",
        foreignField: "_id",
        as: "hotel",
      },
    },
    { $unwind: { path: "$hotel", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "rooms",
        localField: "roomId",
        foreignField: "_id",
        as: "room",
      },
    },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
  ];

  // Apply search
  if (search) {
    const regex = new RegExp(search, "i");
    pipeline.push({
      $match: {
        $or: [
          { "hotel.name": regex },
          { "user.fullName": regex },
          { "user.email": regex },
          { _id: /^[0-9a-fA-F]{24}$/.test(search) ? new mongoose.Types.ObjectId(search) : null },
        ].filter(Boolean),
      },
    });
  }

  // Count stage
  const countPipeline = [...pipeline, { $count: "totalCount" }];
  const totalResult = await Booking.aggregate(countPipeline);
  const totalCount = totalResult[0]?.totalCount || 0;

  // Pagination + sorting
  pipeline.push({ $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } });
  pipeline.push({ $skip: skip }, { $limit: limitNum });

  const bookings = await Booking.aggregate(pipeline);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookings,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
          hasNext: pageNum < Math.ceil(totalCount / limitNum),
          hasPrev: pageNum > 1,
        },
      },
      "All bookings fetched successfully"
    )
  );
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
