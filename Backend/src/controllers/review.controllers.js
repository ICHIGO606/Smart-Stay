import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Review from "../models/review.models.js";
import { Hotel } from "../models/hotel.models.js";
import { Package } from "../models/package.models.js";

// Add review
const addReview = asyncHandler(async (req, res) => {
  const { targetId, targetModel, rating, comment } = req.body;
  if (!targetId || !targetModel || !rating || !comment) {
    throw new ApiError(400, "All fields are required for review");
  }

  // CodeQL Fix: Sanitize user input to prevent NoSQL Injection
  const safeTargetId = String(targetId);
  const safeTargetModel = String(targetModel);

  const review = await Review.findOne({
    user: req.user._id,
    targetId: safeTargetId,
    targetModel: safeTargetModel,
  });

  if (review) throw new ApiError(409, "You already submitted a review");

  const newReview = await Review.create({
    user: req.user._id,
    targetId: safeTargetId,
    targetModel: safeTargetModel,
    rating,
    comment,
  });

  // Synchronize review ID and recalculate star rating on target entity
  if (safeTargetModel === "Hotel") {
    const hotel = await Hotel.findById(safeTargetId);
    if (hotel) {
      if (!Array.isArray(hotel.reviews)) hotel.reviews = [];
      hotel.reviews.push(newReview._id);

      const allReviews = await Review.find({ targetId: safeTargetId, targetModel: "Hotel" });
      const totalScore = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      hotel.starRating = allReviews.length > 0 ? Math.round((totalScore / allReviews.length) * 10) / 10 : Number(rating);
      await hotel.save();
    }
  } else if (safeTargetModel === "Package") {
    const travelPackage = await Package.findById(safeTargetId);
    if (travelPackage) {
      if (!Array.isArray(travelPackage.reviews)) travelPackage.reviews = [];
      travelPackage.reviews.push(newReview._id);
      await travelPackage.save();
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newReview, "Review added successfully"));
});

// Get reviews for a hotel/package
const getReviews = asyncHandler(async (req, res) => {
  const { targetId, targetModel } = req.params;

  // CodeQL Fix: Sanitize user input from params
  const safeTargetId = String(targetId);
  const safeTargetModel = String(targetModel);

  const reviews = await Review.find({ 
    targetId: safeTargetId, 
    targetModel: safeTargetModel 
  }).populate("user", "fullName");

  return res
    .status(200)
    .json(new ApiResponse(200, reviews, "Reviews fetched successfully"));
});

export { addReview, getReviews };