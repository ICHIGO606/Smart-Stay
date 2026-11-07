import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Hotel } from "../models/hotel.models.js";
import { Room } from "../models/room.models.js";
import { Booking } from "../models/booking.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sseService } from "../services/sseService.js";
import { generateVoucherData } from "../utils/voucherGenerator.js";
import mongoose from "mongoose";

// ------------------- HOTEL CONTROLLERS ------------------- //

// Create hotel
const createHotel = asyncHandler(async (req, res) => {
  const { name, city, description, amenities, address } = req.body;
  if (!name || !city || !description)
    throw new ApiError(401, "Required fields missing");

  let imageUrls = [];
  if (req.files?.images) {
    const uploadedImages = await Promise.all(
      req.files.images.map(file => uploadOnCloudinary(file.path))
    );
    imageUrls = uploadedImages.filter(img => img).map(img => img.secure_url);
  }

  const newHotel = await Hotel.create({
    name,
    city,
    description,
    amenities,
    address,
    adminId: req.user._id,
    images: imageUrls,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newHotel, "Hotel Created Successfully"));
});

// Update hotel
const updateHotel = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const { name, city, description, amenities, address, images } = req.body;

  // CodeQL Fix: Sanitize user input
  const safeHotelId = String(hotelId);

  const hotel = await Hotel.findById(safeHotelId);
  if (!hotel) throw new ApiError(404, "Hotel not found");

  if (name) hotel.name = name;
  if (city) hotel.city = city;
  if (description) hotel.description = description;
  if (amenities) hotel.amenities = amenities;
  if (address) hotel.address = address;

  // Upload new images
  if (req.files?.images) {
    const newUrls = await Promise.all(
      req.files.images.map(file => uploadOnCloudinary(file.path))
    );
    hotel.images.push(...newUrls);
  }

  // Add/remove images from body
  if (images?.add) hotel.images.push(...images.add);
  if (images?.remove)
    hotel.images = hotel.images.filter(img => !images.remove.includes(img));

  const updatedHotel = await hotel.save();
  return res
    .status(200)
    .json(new ApiResponse(200, updatedHotel, "Hotel updated successfully"));
});

// Delete hotel
const deleteHotel = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const safeHotelId = String(hotelId);

  const hotel = await Hotel.findById(safeHotelId);
  if (!hotel) throw new ApiError(404, "Hotel not found");

  await Room.deleteMany({ hotelId: safeHotelId });
  await hotel.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Hotel deleted successfully"));
});

// Get admin hotel by ID
const getAdminHotelById = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const safeHotelId = String(hotelId);

  const hotel = await Hotel.findById(safeHotelId);
  if (!hotel) throw new ApiError(404, "Hotel not found");

  const rooms = await Room.find({ hotelId: safeHotelId });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...hotel.toObject(),
        rooms,
      },
      "Hotel fetched successfully"
    )
  );
});

// ------------------- ROOM CONTROLLERS ------------------- //

// Utility to parse room numbers
function parseRoomNumbers(input) {
  if (!input) return [];
  const str = Array.isArray(input) ? input.join(",") : String(input);
  const result = [];
  str.split(",").forEach(part => {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (!isNaN(start) && !isNaN(end) && start <= end)
        for (let i = start; i <= end; i++) result.push(i);
    } else {
      const num = Number(part.trim());
      if (!isNaN(num)) result.push(num);
    }
  });
  return result;
}

// Add or update room
const addRoom = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  let { type, pricePerNight, maxOccupancy, roomNumbers, amenities } = req.body;
  if (!type || !pricePerNight || !maxOccupancy || !roomNumbers)
    throw new ApiError(400, "All fields are required");

  // CodeQL Fix: Sanitize variables used in database queries
  const safeHotelId = String(hotelId);
  const safeType = String(type);

  const parsedNumbers = parseRoomNumbers(roomNumbers);
  if (parsedNumbers.length === 0) throw new ApiError(400, "Invalid room numbers");

  let imageUrls = [];
  if (req.files?.images) {
      imageUrls = await Promise.all(
          req.files.images.map(async (file) => {
              const result = await uploadOnCloudinary(file.path);
              return result.secure_url;
          })
      );
  }

  let existingRoom = await Room.findOne({ hotelId: safeHotelId, type: safeType });
  if (existingRoom) {
    existingRoom.roomNumbers = [...new Set([...existingRoom.roomNumbers, ...parsedNumbers])];
    existingRoom.pricePerNight = pricePerNight;
    existingRoom.maxOccupancy = maxOccupancy;
    if (amenities) existingRoom.amenities = amenities;
    if (imageUrls.length > 0) existingRoom.images.push(...imageUrls);
    await existingRoom.save();
    return res.status(200).json(new ApiResponse(200, existingRoom, "Rooms updated successfully"));
  }

  const newRoom = await Room.create({
    hotelId: safeHotelId,
    type: safeType,
    pricePerNight,
    maxOccupancy,
    roomNumbers: parsedNumbers,
    amenities,
    images: imageUrls,
  });

  return res.status(201).json(new ApiResponse(201, newRoom, "New room type added"));
});

// Update room
const updateRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { type, pricePerNight, maxOccupancy, roomNumbers, amenities, images } = req.body;

  // CodeQL Fix: Sanitize user input
  const safeRoomId = String(roomId);

  const room = await Room.findById(safeRoomId);
  if (!room) throw new ApiError(404, "Room not found");

  if (type) room.type = type;
  if (pricePerNight) room.pricePerNight = pricePerNight;
  if (maxOccupancy) room.maxOccupancy = maxOccupancy;
  if (amenities) room.amenities = amenities;

  if (roomNumbers) {
    const parsedNumbers = parseRoomNumbers(roomNumbers);
    if (parsedNumbers.length > 0) room.roomNumbers = [...new Set([...room.roomNumbers, ...parsedNumbers])];
  }

  // Upload new images
  if (req.files?.images) {
    const newUrls = await Promise.all(req.files.images.map(file => uploadOnCloudinary(file.path)));
    room.images.push(...newUrls);
  }

  // Add/remove images from body
  if (images?.add) room.images.push(...images.add);
  if (images?.remove) room.images = room.images.filter(img => !images.remove.includes(img));

  const updatedRoom = await room.save();
  return res.status(200).json(new ApiResponse(200, updatedRoom, "Room updated successfully"));
});

// Delete room
const deleteRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { roomNumber } = req.body;
  
  // CodeQL Fix: Sanitize user input
  const safeRoomId = String(roomId);
  
  const room = await Room.findById(safeRoomId);
  if (!room) throw new ApiError(404, "Room type not found");

  if (roomNumber) {
    const parsedNumbers = parseRoomNumbers(roomNumber);
    room.roomNumbers = room.roomNumbers.filter(num => !parsedNumbers.includes(num));
    await room.save();
    return res.status(200).json(new ApiResponse(200, room, `Removed room numbers ${parsedNumbers.join(", ")}`));
  } else {
    await room.deleteOne();
    return res.status(200).json(new ApiResponse(200, {}, "Room type deleted successfully"));
  }
});

const getAdminHotels = asyncHandler(async (req, res) => {
  const adminId = req.user._id;

  // Find hotels belonging to this admin
  let hotels = await Hotel.find({ adminId });

  // If none found for this specific adminId, and user has admin role (or sadmin/admin), check for all hotels
  if ((!hotels || hotels.length === 0) && (req.user.username === "sadmin" || req.user.username === "admin" || req.user.role === "admin")) {
    const allHotels = await Hotel.find({});
    if (allHotels && allHotels.length > 0) {
      hotels = allHotels;
    }
  }

  // If no hotels found, return 200 with empty array (NOT 404!)
  if (!hotels || hotels.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Hotels fetched successfully"));
  }

  // Populate rooms for each hotel
  const hotelsWithRooms = await Promise.all(
    hotels.map(async (hotel) => {
      const rooms = await Room.find({ hotelId: hotel._id });
      return {
        ...hotel.toObject(),
        rooms: rooms
      };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, hotelsWithRooms, "Hotels fetched successfully"));
});

// Get bookings for a specific hotel (Admin)
const getHotelBookings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;

  // CodeQL Fix: Sanitize user input
  const safeHotelId = String(hotelId);

  // Check if hotel exists and belongs to this admin or admin is superadmin
  const hotel = await Hotel.findById(safeHotelId);
  if (!hotel) throw new ApiError(404, "Hotel not found");

  if (
    hotel.adminId?.toString() !== req.user._id?.toString() &&
    req.user.username !== "sadmin" &&
    req.user.username !== "admin"
  ) {
    throw new ApiError(403, "Hotel not accessible by this admin");
  }

  // Fetch all bookings for this hotel
  const bookings = await Booking.find({ hotelId: safeHotelId })
    .populate("roomId", "type roomNumbers")
    .populate("user", "fullName email");

  return res
    .status(200)
    .json(new ApiResponse(200, bookings, "Bookings fetched successfully"));
});

const getHotelRoomsStatus = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;

  if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
    return res.status(400).json({ message: "Valid Hotel ID is required." });
  }

  // CodeQL Fix: Sanitize user input just to be perfectly safe
  const safeHotelId = String(hotelId);

  // Fetch all rooms for the hotel
  const rooms = await Room.find({ hotelId: safeHotelId }).lean();

  if (!rooms.length) {
    return res.status(200).json({
      hotelId: safeHotelId,
      floors: {},
    });
  }

  // Fetch bookings for these rooms that are active or future
  const roomIds = rooms.map((room) => room._id);
  const bookings = await Booking.find({
    roomId: { $in: roomIds },
    checkOutDate: { $gte: new Date() }, // active or future bookings
  })
    .populate({
      path: "user",
      select: "fullName email",
    })
    .lean();

  // Arrange rooms by floor
  const floorWiseRooms = {};

  rooms.forEach((room) => {
    (room.roomNumbers || []).forEach((roomNumber) => {
      const floor = Math.floor(roomNumber / 100); // 101 → floor 1

      if (!floorWiseRooms[floor]) floorWiseRooms[floor] = [];

      // Check if this roomNumber has a booking
      const booking = bookings.find(
        (b) =>
          b.roomId.toString() === room._id.toString() &&
          b.roomNumbers.includes(roomNumber)
      );

      // Check operational lifecycle status
      const opEntry = (room.operationalStatuses || []).find(
        (op) => Number(op.roomNumber) === Number(roomNumber)
      );

      const operationalStatus = opEntry?.status || (booking ? "Reserved" : "Available");

      floorWiseRooms[floor].push({
        roomId: room._id,
        roomType: room.type,
        pricePerNight: room.pricePerNight,
        maxOccupancy: room.maxOccupancy,
        roomNumber,
        status: booking ? "Booked" : (operationalStatus === "Available" ? "Available" : operationalStatus),
        operationalStatus,
        notes: opEntry?.notes || "",
        updatedAt: opEntry?.updatedAt || null,
        bookingDetails: booking
          ? {
              bookingId: booking._id,
              user: booking.user || null,
              checkInDate: booking.checkInDate,
              checkOutDate: booking.checkOutDate,
              bookingStatus: booking.bookingStatus,
              paymentStatus: booking.paymentStatus,
              guests: booking.guests || [],
            }
          : null,
      });
    });
  });

  // Sort rooms inside each floor
  for (const floor in floorWiseRooms) {
    floorWiseRooms[floor].sort((a, b) => a.roomNumber - b.roomNumber);
  }

  return res.status(200).json({
    hotelId: safeHotelId,
    floors: floorWiseRooms,
  });
});

const getHotelRooms = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  
  // CodeQL Fix: Sanitize user input
  const safeHotelId = String(hotelId);
  
  const rooms = await Room.find({ hotelId: safeHotelId });
  return res.status(200).json(new ApiResponse(200, rooms, "Rooms fetched successfully"));
});

// Update operational lifecycle status of a room (Pillar 3)
const updateRoomOperationalStatus = asyncHandler(async (req, res) => {
  const { hotelId, roomId } = req.params;
  const { roomNumber, status, notes } = req.body;

  if (!roomNumber || !status) {
    throw new ApiError(400, "Room number and operational status are required");
  }

  const validStatuses = ["Available", "Reserved", "Occupied", "Dirty", "Cleaning", "Maintenance"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid operational status. Must be one of: ${validStatuses.join(", ")}`);
  }

  const safeHotelId = String(hotelId);
  const safeRoomId = String(roomId);

  const room = await Room.findOne({ _id: safeRoomId, hotelId: safeHotelId });
  if (!room) throw new ApiError(404, "Room not found for this hotel");

  if (!room.roomNumbers.includes(Number(roomNumber))) {
    throw new ApiError(400, `Room number ${roomNumber} does not exist in room type ${room.type}`);
  }

  // Update or append operational status
  if (!room.operationalStatuses) room.operationalStatuses = [];

  const opIndex = room.operationalStatuses.findIndex(
    (item) => Number(item.roomNumber) === Number(roomNumber)
  );

  const updatedEntry = {
    roomNumber: Number(roomNumber),
    status,
    notes: notes !== undefined ? notes : (opIndex >= 0 ? room.operationalStatuses[opIndex].notes : ""),
    updatedAt: new Date(),
  };

  if (opIndex >= 0) {
    room.operationalStatuses[opIndex] = updatedEntry;
  } else {
    room.operationalStatuses.push(updatedEntry);
  }

  await room.save();

  // Broadcast real-time SSE event to all front-desk staff watching this property
  sseService.broadcast(safeHotelId, "room_status_changed", {
    hotelId: safeHotelId,
    roomId: safeRoomId,
    roomNumber: Number(roomNumber),
    operationalStatus: status,
    notes: updatedEntry.notes,
    updatedAt: updatedEntry.updatedAt,
  });

  return res.status(200).json(
    new ApiResponse(200, updatedEntry, `Room ${roomNumber} status updated to ${status}`)
  );
});

// Stream real-time events via Server-Sent Events (SSE) (Pillar 4)
const streamHotelLiveUpdates = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const safeHotelId = String(hotelId);

  // Check if hotel exists
  const hotel = await Hotel.findById(safeHotelId);
  if (!hotel) throw new ApiError(404, "Hotel not found");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  sseService.registerClient(safeHotelId, res);
});

// Export bookings CSV (Pillar 5)
const exportBookingsCsv = asyncHandler(async (req, res) => {
  const { hotelId } = req.query;
  const query = {};
  if (hotelId) query.hotelId = String(hotelId);

  const bookings = await Booking.find(query)
    .populate("hotelId", "name city")
    .populate("roomId", "type pricePerNight")
    .populate("user", "fullName email")
    .sort({ createdAt: -1 });

  const headers = [
    "Booking ID",
    "Guest Name",
    "Guest Email",
    "Property Name",
    "Room Type",
    "Room Numbers",
    "Check-In Date",
    "Check-Out Date",
    "Total Amount (INR)",
    "Payment Status",
    "Booking Status",
    "Created At",
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = bookings.map((b) => [
    b._id,
    b.user?.fullName || "Guest",
    b.user?.email || "N/A",
    b.hotelId?.name || "SmartStay Property",
    b.roomId?.type || "Standard Suite",
    (b.roomNumbers || []).join("; "),
    b.checkInDate ? new Date(b.checkInDate).toISOString().split("T")[0] : "",
    b.checkOutDate ? new Date(b.checkOutDate).toISOString().split("T")[0] : "",
    b.totalAmount || 0,
    b.paymentStatus || "Pending",
    b.bookingStatus || "Pending",
    b.createdAt ? new Date(b.createdAt).toISOString() : "",
  ]);

  const csvContent = [headers.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="smartstay-bookings-${Date.now()}.csv"`);
  return res.status(200).send(csvContent);
});

// Admin Platform & Hospitality Analytics with ADR & RevPAR (Pillar 5)
const getAdminAnalyticsStats = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const isSuper = req.user.username === "sadmin" || req.user.username === "admin";

  let hotelFilter = {};
  if (!isSuper) {
    const hotels = await Hotel.find({ adminId }).select("_id");
    hotelFilter = { hotelId: { $in: hotels.map((h) => h._id) } };
  }

  const allBookings = await Booking.find(hotelFilter).lean();
  const confirmedBookings = allBookings.filter(
    (b) => b.bookingStatus === "Confirmed" || b.paymentStatus === "Completed"
  );

  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Calculate occupied room nights
  let totalOccupiedNights = 0;
  confirmedBookings.forEach((b) => {
    const checkIn = new Date(b.checkInDate);
    const checkOut = new Date(b.checkOutDate);
    const nights = Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const roomsCount = b.roomNumbers?.length || 1;
    totalOccupiedNights += nights * roomsCount;
  });

  // ADR: Average Daily Rate = Total Room Revenue / Occupied Room Nights
  const adr = totalOccupiedNights > 0 ? Math.round(totalRevenue / totalOccupiedNights) : 0;

  // RevPAR: Revenue Per Available Room = Total Revenue / Total Room Inventory
  const rooms = await Room.find(isSuper ? {} : hotelFilter).lean();
  const totalRoomUnits = rooms.reduce((sum, r) => sum + (r.roomNumbers?.length || 1), 0);
  const revPar = totalRoomUnits > 0 ? Math.round(totalRevenue / totalRoomUnits) : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalBookings: allBookings.length,
        confirmedBookings: confirmedBookings.length,
        pendingBookings: allBookings.filter((b) => b.bookingStatus === "Pending").length,
        cancelledBookings: allBookings.filter((b) => b.bookingStatus === "Cancelled").length,
        totalRevenue,
        totalOccupiedNights,
        adr,
        revPar,
        totalRoomUnits,
      },
      "Hospitality analytics metrics calculated successfully"
    )
  );
});

// Front-desk QR check-in & room occupation (Option 1)
const checkInGuestByToken = asyncHandler(async (req, res) => {
  const { token, notes } = req.body;
  if (!token) throw new ApiError(400, "Voucher token or reservation code is required");

  const safeToken = String(token).trim().toUpperCase();

  // Find confirmed or pending bookings
  const bookings = await Booking.find({
    bookingStatus: { $in: ["Confirmed", "Pending"] },
  })
    .populate("hotelId")
    .populate("roomId")
    .populate("user", "fullName email phone");

  const booking = bookings.find((b) => {
    const data = generateVoucherData(b);
    return (
      data.verificationToken === safeToken ||
      data.checkInCode === safeToken ||
      b._id.toString().toUpperCase().endsWith(safeToken.replace(/[^A-Z0-9]/g, ""))
    );
  });

  if (!booking) {
    throw new ApiError(404, `No active reservation found matching token "${safeToken}"`);
  }

  // Authorize: Admin must be superadmin or own this hotel
  if (
    booking.hotelId?.adminId?.toString() !== req.user._id?.toString() &&
    req.user.username !== "sadmin" &&
    req.user.username !== "admin"
  ) {
    throw new ApiError(403, "Not authorized to check in guests for this property");
  }

  booking.bookingStatus = "Confirmed";
  await booking.save();

  let roomNumberAssigned = null;

  // Advance assigned room to Occupied
  if (booking.roomId) {
    const room = await Room.findById(booking.roomId._id || booking.roomId);
    if (room) {
      if (!room.operationalStatuses) room.operationalStatuses = [];

      roomNumberAssigned = booking.roomNumbers?.[0] || room.roomNumbers?.[0];

      if (roomNumberAssigned) {
        const opIndex = room.operationalStatuses.findIndex(
          (o) => Number(o.roomNumber) === Number(roomNumberAssigned)
        );

        const checkInNote = notes || `Checked in via Voucher Pass № ${safeToken}`;
        const entry = {
          roomNumber: Number(roomNumberAssigned),
          status: "Occupied",
          notes: checkInNote,
          updatedAt: new Date(),
        };

        if (opIndex >= 0) {
          room.operationalStatuses[opIndex] = entry;
        } else {
          room.operationalStatuses.push(entry);
        }

        await room.save();

        const propertyId = booking.hotelId?._id || booking.hotelId;
        sseService.broadcast(propertyId, "room_status_changed", {
          hotelId: propertyId,
          roomId: room._id,
          roomNumber: Number(roomNumberAssigned),
          operationalStatus: "Occupied",
          notes: checkInNote,
          updatedAt: entry.updatedAt,
        });
      }
    }
  }

  const voucherData = generateVoucherData(booking);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookingId: booking._id,
        guestName: booking.user?.fullName || "Guest",
        hotelName: booking.hotelId?.name || "Boutique Hotel",
        roomType: booking.roomId?.type || "Standard Suite",
        roomNumber: roomNumberAssigned,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        paymentStatus: booking.paymentStatus,
        operationalStatus: "Occupied",
        voucherData,
      },
      `Guest ${booking.user?.fullName || "Guest"} checked in successfully. Room ${roomNumberAssigned || ""} is now Occupied.`
    )
  );
});

export {
  createHotel,
  updateHotel,
  deleteHotel,
  getAdminHotelById,
  addRoom,
  updateRoom,
  deleteRoom,
  getAdminHotels,
  getHotelBookings,
  getHotelRoomsStatus,
  getHotelRooms,
  updateRoomOperationalStatus,
  streamHotelLiveUpdates,
  exportBookingsCsv,
  getAdminAnalyticsStats,
  checkInGuestByToken
};