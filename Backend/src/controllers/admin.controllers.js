import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Hotel } from "../models/hotel.models.js";
import { Room } from "../models/room.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

  const hotel = await Hotel.findById(hotelId);
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

  let existingRoom = await Room.findOne({ hotelId, type });
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
    hotelId,
    type,
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

  const room = await Room.findById(roomId);
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
  const room = await Room.findById(roomId);
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

  const hotels = await Hotel.find({ adminId });
  if (!hotels || hotels.length === 0) {
    throw new ApiError(404, "No hotels found for this admin");
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

  // Check if hotel belongs to this admin
  const hotel = await Hotel.findOne({ _id: hotelId, adminId: req.user._id });
  if (!hotel) throw new ApiError(404, "Hotel not found or not accessible by this admin");

  // Fetch all bookings for this hotel
  const bookings = await Booking.find({ hotelId })
    .populate("roomId", "type roomNumbers")
    .populate("user", "fullName email");

  return res
    .status(200)
    .json(new ApiResponse(200, bookings, "Bookings fetched successfully"));
});

// Get all rooms with their booked status (Admin)
const getHotelRoomsStatus = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;

  // Check if hotel belongs to this admin
  const hotel = await Hotel.findOne({ _id: hotelId, adminId: req.user._id });
  if (!hotel) throw new ApiError(404, "Hotel not found or not accessible by this admin");

  const rooms = await Room.find({ hotelId });

  // For each room, check which roomNumbers are booked
  const roomsWithStatus = await Promise.all(
    rooms.map(async (room) => {
      // Fetch confirmed bookings for this room
      const bookings = await Booking.find({
        roomId: room._id,
        bookingStatus: "Confirmed",
      });

      // Flatten all booked roomNumbers
      const bookedRoomNumbers = bookings.flatMap(b => b.roomNumbers);

      const availableRoomNumbers = room.roomNumbers.filter(
        rn => !bookedRoomNumbers.includes(rn)
      );

      return {
        ...room.toObject(),
        bookedRoomNumbers,
        availableRoomNumbers,
      };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, roomsWithStatus, "Rooms status fetched successfully"));
});




export { createHotel, updateHotel, addRoom, updateRoom, deleteRoom,getAdminHotels,getHotelBookings, getHotelRoomsStatus  };
