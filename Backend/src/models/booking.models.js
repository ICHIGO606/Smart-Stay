import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",   // the person who made the booking
      required: true,
    },
    bookingType: {
      type: String,
      enum: ["Hotel", "Package"],
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel", // required if Hotel booking
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room", // required if Hotel booking
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package", // required if Package booking
    },


    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },

    numberOfAdults: { type: Number, required: true, min: 1 },
    numberOfChildren: { type: Number, default: 0, min: 0 },

    guests: [
      {
        fullName: { type: String, required: true },
        age: { type: Number, required: true },
      },
    ],


    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },


    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },


    bookingStatus: {
      type: String,
      enum: ["Confirmed", "Pending", "Cancelled"],
      default: "Pending",
    },

    specialRequests: { type: String }, 
  },
  { timestamps: true }
);

// Indexes for performance
bookingSchema.index({ user: 1, createdAt: -1 });  
bookingSchema.index({ hotel: 1, room: 1, checkInDate: 1 }); 
bookingSchema.index({ bookingStatus: 1, paymentStatus: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);
