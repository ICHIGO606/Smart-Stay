import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Review from "../models/review.models.js";

// Add review
const addReview = asyncHandler(async (req, res) => {
  const { targetId, targetModel, rating, comment } = req.body;
  if (!targetId || !targetModel || !rating || !comment) {
    throw new ApiError(400, "All fields are required for review");
  }

  const review = await Review.findOne({
    user: req.user._id,
    targetId,
    targetModel,
  });

  if (review) throw new ApiError(409, "You already submitted a review");

  const newReview = await Review.create({
    user: req.user._id,
    targetId,
    targetModel,
    rating,
    comment,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newReview, "Review added successfully"));
});

// Get reviews for a hotel/package
const getReviews = asyncHandler(async (req, res) => {
  const { targetId, targetModel } = req.params;

  const reviews = await Review.find({ targetId, targetModel })
    .populate("user", "fullName");

  return res
    .status(200)
    .json(new ApiResponse(200, reviews, "Reviews fetched successfully"));
});

export { addReview, getReviews };
