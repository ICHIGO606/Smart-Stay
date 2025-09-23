import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Booking } from "../models/booking.models.js";
import { Room } from "../models/room.models.js";
import { Hotel } from "../models/hotel.models.js";

// Helper function to get available room numbers for a specific room type and dates
const getAvailableRoomNumbers = async (roomId, checkInDate, checkOutDate) => {
  const room = await Room.findById(roomId);
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

  // Check if room exists for hotel
  if (bookingType === "Hotel") {
    const room = await Room.findOne({ _id: roomId, hotelId });
    if (!room) throw new ApiError(404, "Room not found for this hotel");

    // Check for available room numbers during the requested dates
    const availableRoomNumbers = await getAvailableRoomNumbers(roomId, checkInDate, checkOutDate);
    
    if (availableRoomNumbers.length === 0) {
      throw new ApiError(400, "No rooms available for the selected dates");
    }

    // Assign the first available room number
    const assignedRoomNumber = availableRoomNumbers[0];
    
    // Update room with booked room number information
    await Room.findByIdAndUpdate(roomId, {
      $push: {
        bookedRoomNumbers: {
          roomNumber: assignedRoomNumber,
          checkInDate: new Date(checkInDate),
          checkOutDate: new Date(checkOutDate),
          bookingId: null // Will be updated after booking creation
        }
      }
    });
    
    // Store the assigned room number for the booking
    req.body.roomNumbers = [assignedRoomNumber];
  }

  const booking = await Booking.create({
    user: req.user._id,
    bookingType,
    hotelId: bookingType === "Hotel" ? hotelId : undefined,
    roomId: bookingType === "Hotel" ? roomId : undefined,
    roomNumbers: bookingType === "Hotel" ? req.body.roomNumbers : [],
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

  // Update the booked room entry with the actual booking ID
  if (bookingType === "Hotel" && roomId && req.body.roomNumbers?.length > 0) {
    await Room.findOneAndUpdate(
      {
        _id: roomId,
        "bookedRoomNumbers.roomNumber": req.body.roomNumbers[0],
        "bookedRoomNumbers.checkInDate": new Date(checkInDate),
        "bookedRoomNumbers.checkOutDate": new Date(checkOutDate)
      },
      {
        $set: {
          "bookedRoomNumbers.$.bookingId": booking._id
        }
      }
    );
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
