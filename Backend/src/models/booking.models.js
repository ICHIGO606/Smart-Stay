import mongoose from "mongoose";
import crypto from "crypto";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // the person who made the booking
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
    roomNumbers: {
      type: [Number], // specific room numbers assigned to this booking
      default: [],
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

    // Front-desk verification identifiers
    verificationToken: {
      type: String,
      index: true,
    },
    checkInCode: {
      type: String,
      index: true,
    },
  },
  { timestamps: true },
);

// Populate verification tokens deterministically on creation
bookingSchema.pre("save", function (next) {
  if (!this.checkInCode && this._id) {
    this.checkInCode = `STAY-${this._id.toString().slice(-6).toUpperCase()}`;
  }
  if (!this.verificationToken && this._id && this.checkInDate) {
    const payload = `${this._id}|${this.user?._id || this.user}|${this.checkInDate}`;
    this.verificationToken = crypto
      .createHash("sha256")
      .update(payload)
      .digest("hex")
      .substring(0, 16)
      .toUpperCase();
  }
  next();
});

// Indexes for performance
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ hotel: 1, room: 1, checkInDate: 1 });
bookingSchema.index({ bookingStatus: 1, paymentStatus: 1 });
bookingSchema.index({ verificationToken: 1 });
bookingSchema.index({ checkInCode: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);
