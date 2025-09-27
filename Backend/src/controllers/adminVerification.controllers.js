import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";

// Get all users with pending verification
const getPendingVerifications = asyncHandler(async (req, res) => {
  const users = await User.find({
    "verification.status": "Pending",
    role: "user"
  }).select("fullName email age gender verification");

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Pending verifications fetched successfully"));
});

// Get user verification details
const getUserVerification = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select("fullName email age gender verification familyMembers");
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User verification details fetched successfully"));
});

// Verify a user (only one admin needs to verify)
const verifyUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, remarks } = req.body;

  if (!["Verified", "Rejected"].includes(status)) {
    throw new ApiError(400, "Invalid status. Must be 'Verified' or 'Rejected'");
  }

  const user = await User.findById(userId);
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.verification.status !== "Pending") {
    throw new ApiError(400, "User verification is not in pending status");
  }

  // Update verification status and track which admin verified
  user.verification.status = status;
  user.verification.verifiedBy = req.user._id;
  user.verification.verifiedAt = new Date();
  
  if (remarks) {
    user.verification.remarks = remarks;
  }

  await user.save({validateBeforeSave:false});

  return res
    .status(200)
    .json(new ApiResponse(200, user, `User ${status.toLowerCase()} successfully`));
});

// Get all verified users
const getVerifiedUsers = asyncHandler(async (req, res) => {
  const users = await User.find({
    "verification.status": "Verified",
    role: "user"
  }).select("fullName email age gender verification")
    .populate("verification.verifiedBy", "fullName email");

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Verified users fetched successfully"));
});

// Get verification statistics
const getVerificationStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $match: { role: "user" }
    },
    {
      $group: {
        _id: "$verification.status",
        count: { $sum: 1 }
      }
    }
  ]);

  const formattedStats = {
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    unverified: 0
  };

  stats.forEach(stat => {
    formattedStats.total += stat.count;
    switch (stat._id) {
      case "Verified":
        formattedStats.verified = stat.count;
        break;
      case "Pending":
        formattedStats.pending = stat.count;
        break;
      case "Rejected":
        formattedStats.rejected = stat.count;
        break;
      case "Unverified":
        formattedStats.unverified = stat.count;
        break;
    }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, formattedStats, "Verification statistics fetched successfully"));
});

export {
  getPendingVerifications,
  getUserVerification,
  verifyUser,
  getVerifiedUsers,
  getVerificationStats
};