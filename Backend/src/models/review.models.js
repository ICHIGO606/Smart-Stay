import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetModel: {
      type: String,
      enum: ["Hotel", "Package"],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true } 
);


reviewSchema.index({ user: 1, targetId: 1, targetModel: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
