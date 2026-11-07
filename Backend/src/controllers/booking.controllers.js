import mongoose from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Booking } from "../models/booking.models.js";
import { Room } from "../models/room.models.js";
import { Hotel } from "../models/hotel.models.js";
import { escapeRegex } from "../utils/helpers.js";
import { generateVoucherData, generateVoucherHtml } from "../utils/voucherGenerator.js";
import { sseService } from "../services/sseService.js";
import { notificationService } from "../services/notificationService.js";

// Helper function to get available room numbers for a specific room type and dates
const getAvailableRoomNumbers = async (roomId, checkInDate, checkOutDate) => {
  // CodeQL Fix: Sanitize user input
  const safeRoomId = String(roomId);
  
  const room = await Room.findById(safeRoomId);
  if (!room) return [];

  const allRoomNumbers = room.roomNumbers;
  
  // Get currently booked room numbers for the overlapping dates
  const bookedRoomNumbers = room.bookedRoomNumbers
    .filter(booking => {
      const bookingCheckIn = new Date(booking.checkInDate);
      const bookingCheckOut = new Date(booking.checkOutDate);
      const requestedCheckIn = new Date(checkInDate);
      const requestedCheckOut = new Date(checkOutDate);
      
      // Check for date overlap
      return (
        (requestedCheckIn < bookingCheckOut && requestedCheckOut > bookingCheckIn) ||
        (bookingCheckIn < requestedCheckOut && bookingCheckOut > requestedCheckIn)
      );
    })
    .map(booking => booking.roomNumber);

  // Filter out booked room numbers
  const availableRoomNumbers = allRoomNumbers.filter(
    roomNumber => !bookedRoomNumbers.includes(roomNumber)
  );

  return availableRoomNumbers;
};

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

  // CodeQL Fixes: Pre-sanitize IDs for database operations
  const safeHotelId = hotelId ? String(hotelId) : undefined;
  const safeRoomId = roomId ? String(roomId) : undefined;
  const safePackageId = packageId ? String(packageId) : undefined;

  // Check if room exists for hotel
  if (bookingType === "Hotel") {
    const room = await Room.findOne({ _id: safeRoomId, hotelId: safeHotelId });
    if (!room) throw new ApiError(404, "Room not found for this hotel");

    // Check for available room numbers during the requested dates
    const availableRoomNumbers = await getAvailableRoomNumbers(safeRoomId, checkInDate, checkOutDate);
    
    if (availableRoomNumbers.length === 0) {
      throw new ApiError(400, "No rooms available for the selected dates");
    }

    const parsedCheckIn = new Date(checkInDate);
    const parsedCheckOut = new Date(checkOutDate);

    // Concurrency Lock: Atomically find and lock a candidate room number
    let assignedRoomNumber = null;

    for (const candidate of availableRoomNumbers) {
      const lockResult = await Room.findOneAndUpdate(
        {
          _id: safeRoomId,
          bookedRoomNumbers: {
            $not: {
              $elemMatch: {
                roomNumber: candidate,
                checkInDate: { $lt: parsedCheckOut },
                checkOutDate: { $gt: parsedCheckIn }
              }
            }
          }
        },
        {
          $push: {
            bookedRoomNumbers: {
              roomNumber: candidate,
              checkInDate: parsedCheckIn,
              checkOutDate: parsedCheckOut,
              bookingId: null // will update with actual booking ID below
            }
          }
        },
        { new: true }
      );

      if (lockResult) {
        assignedRoomNumber = candidate;
        break;
      }
    }

    if (!assignedRoomNumber) {
      throw new ApiError(
        409,
        "The selected room was just reserved by another guest. Please choose another date or room type."
      );
    }
    
    // Store the assigned room number for the booking
    req.body.roomNumbers = [assignedRoomNumber];
  }

  const booking = await Booking.create({
    user: req.user._id,
    bookingType,
    hotelId: bookingType === "Hotel" ? safeHotelId : undefined,
    roomId: bookingType === "Hotel" ? safeRoomId : undefined,
    roomNumbers: bookingType === "Hotel" ? req.body.roomNumbers : [],
    package: bookingType === "Package" ? safePackageId : undefined,
    checkInDate,
    checkOutDate,
    numberOfAdults,
    numberOfChildren,
    guests,
    totalAmount,
    paymentStatus,
    bookingStatus,
  });

  // Update the booked room entry with the actual booking ID
  if (bookingType === "Hotel" && safeRoomId && req.body.roomNumbers?.length > 0) {
    
    // CodeQL Fix: Explicitly cast the remaining tainted body properties before using them in the query
    const safeRoomNumber = Number(req.body.roomNumbers[0]);
    const safeCheckIn = String(checkInDate);
    const safeCheckOut = String(checkOutDate);

    await Room.findOneAndUpdate(
      {
        _id: safeRoomId,
        "bookedRoomNumbers.roomNumber": safeRoomNumber,
        "bookedRoomNumbers.checkInDate": new Date(safeCheckIn),
        "bookedRoomNumbers.checkOutDate": new Date(safeCheckOut)
      },
      {
        $set: {
          "bookedRoomNumbers.$.bookingId": booking._id
        }
      }
    );
  }

  // Broadcast to front-desk dashboards
  if (bookingType === "Hotel" && safeHotelId) {
    sseService.broadcast(safeHotelId, "booking_created", {
      bookingId: booking._id,
      roomNumber: req.body.roomNumbers?.[0] || null,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
    });
  }

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
    const sanitizedSearch = escapeRegex(search); 
    const regex = new RegExp(sanitizedSearch, "i"); 
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

  // CodeQL Fix: Sanitize user input
  const safeBookingId = String(bookingId);

  const booking = await Booking.findById(safeBookingId);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (bookingStatus) booking.bookingStatus = bookingStatus;
  if (paymentStatus) booking.paymentStatus = paymentStatus;

  await booking.save();

  // If cancelled, release room inventory
  if (bookingStatus === "Cancelled" && booking.roomId) {
    await Room.findByIdAndUpdate(booking.roomId, {
      $pull: {
        bookedRoomNumbers: { bookingId: booking._id }
      }
    });
  }

  if (booking.hotelId) {
    sseService.broadcast(booking.hotelId, "booking_status_updated", {
      bookingId: booking._id,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking updated successfully"));
});

// Self-cancellation by guest
const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const safeBookingId = String(bookingId);

  const booking = await Booking.findOne({
    _id: safeBookingId,
    user: req.user._id,
  });

  if (!booking) throw new ApiError(404, "Booking not found or unauthorized");

  if (booking.bookingStatus === "Cancelled") {
    throw new ApiError(400, "Booking is already cancelled");
  }

  booking.bookingStatus = "Cancelled";
  await booking.save();

  // Free room inventory immediately
  if (booking.roomId) {
    await Room.findByIdAndUpdate(booking.roomId, {
      $pull: {
        bookedRoomNumbers: { bookingId: booking._id }
      }
    });
  }

  if (booking.hotelId) {
    sseService.broadcast(booking.hotelId, "booking_cancelled", {
      bookingId: booking._id,
      roomId: booking.roomId,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, booking, "Reservation cancelled and inventory released"));
});

// Get downloadable/printable voucher for confirmed reservation
const getBookingVoucher = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { format } = req.query;
  const safeBookingId = String(bookingId);

  const booking = await Booking.findById(safeBookingId)
    .populate("hotelId")
    .populate("roomId")
    .populate("user", "fullName email phone");

  if (!booking) throw new ApiError(404, "Booking not found");

  // Only the booking owner or an admin can access the voucher
  const isOwner = booking.user?._id?.toString() === req.user._id?.toString();
  const isAdminUser = req.user.role === "admin";
  if (!isOwner && !isAdminUser) {
    throw new ApiError(403, "Not authorized to access this reservation voucher");
  }

  const voucherData = generateVoucherData(booking);

  if (format === "html") {
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(generateVoucherHtml(voucherData));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, voucherData, "Voucher fetched successfully"));
});

// Front-desk QR check-in verification
const verifyVoucherToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const safeToken = String(token).toUpperCase();

  const bookings = await Booking.find({
    bookingStatus: { $in: ["Confirmed", "Pending"] },
  })
    .populate("hotelId")
    .populate("roomId")
    .populate("user", "fullName email phone");

  const matchingBooking = bookings.find((b) => {
    const data = generateVoucherData(b);
    return data.verificationToken === safeToken || data.checkInCode === safeToken;
  });

  if (!matchingBooking) {
    throw new ApiError(404, "Invalid or expired check-in voucher token");
  }

  const voucherData = generateVoucherData(matchingBooking);
  return res
    .status(200)
    .json(new ApiResponse(200, voucherData, "Check-in voucher verified"));
});

export {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  getBookingVoucher,
  verifyVoucherToken,
};