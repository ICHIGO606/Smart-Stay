// models/room.model.js
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true, // fast lookup for all rooms of a hotel
    },
    type: {
      type: String,
      required: true,
      trim: true, // e.g., "Deluxe Double"
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    maxOccupancy: {
      type: Number,
      required: true,
      min: 1,
    },
    images: {
      type: [String], // Cloudinary image URLs
      default: [],
    },
    status: {
      type: String,
      enum: ["Available", "Maintenance"], 
      default: "Available",
      
    },
    roomNumbers: {
      type: [Number], // e.g., [101, 102, 105]
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "At least one room number must be specified.",
      },
      index: true, // quick search for a specific room number
    },
    amenities: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Index for filters
roomSchema.index({ type: 1, pricePerNight: 1 });
roomSchema.index({ hotelId: 1, status: 1 });

export const Room = mongoose.model("Room", roomSchema);
