import {Hotel} from "../models/hotel.models.js";

export const verifyHotelAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Not an admin." });
    }

    const hotel = await Hotel.findById(req.params.hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    if (hotel.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not the admin of this hotel." });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
