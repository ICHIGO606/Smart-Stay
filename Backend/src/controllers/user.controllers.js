import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Fetched Successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logout Successfully"));
});
const addFamilyMember = asyncHandler(async (req, res) => {
  const { fullName, relationship, age } = req.body;
  if (!fullName || !relationship || !age) {
    return new ApiError(
      401,
      "All the details are required to add the family member"
    );
  }
  const updateUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $push: {
        familyMembers: {
          fullName,
          relationship,
          age,
        },
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateUser.familyMembers,
        "Family Member added successfully"
      )
    );
});

const removeFamilyMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        familyMembers: { _id: memberId },
      },
    },
    { new: true }
  );
  if (!updatedUser) {
    throw new ApiError(404, "Family Member not found");
  }
  const user = await User.findById(updatedUser._id).select(
    "-password -refreshToken"
  );
  res
    .status(200)
    .json(new ApiResponse(200, user, "Family Member Removed Successfully"));
});

const getFamilyMembers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("familyMembers");
  if (!user) {
    throw new ApiError(404, "user not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "Family Members fetched Successfully"));
});

const getFamilyMemberById = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const user = await User.findOne(
    { _id: req.user._id, "familyMembers._id": memberId },
    { "familyMembers.$": 1 }
  );
  if (!user || !user.familyMembers.length) {
    throw new ApiError(404, "Family member not found");
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.familyMembers[0],
        "Family Member fetched successfully"
      )
    );
});

const updateFamilyMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const { fullName, relationship, age } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: req.user._id, "familyMembers._id": memberId },
    {
      $set: {
        "familyMembers.$.fullName": fullName,
        "familyMembers.$.relationship": relationship,
        "familyMembers.$.age": age,
      },
    },
    { new: true }
  );
  if (!user) {
    return new ApiError(404, "Family Member not found");
  }
  const returnUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, returnUser, "Family Member updated Successfully")
    );
});

const updateUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { fullName, age, gender, phone, address } = req.body;
  const user = await User.findById(userId).select("-password -refreshToken");
  
  user.age = age;
  user.gender = gender;
  user.fullName = fullName;
  user.phone = phone || '';
  
  if (address) {
    user.address = {
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      country: address.country || ''
    };
  }
  
  const updatedUser = await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated Successfully"));
});
const uploadVerificationDocument = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // multer attaches file info in req.file
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  // upload to cloudinary
  const uploadResponse = await uploadOnCloudinary(req.file.path);

  if (!uploadResponse) {
    throw new ApiError(500, "Error uploading file to Cloudinary");
  }

  // update the user with the document URL + status = "Pending"
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "verification.documentUrl": uploadResponse.secure_url,
        "verification.status": "Pending",
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        "Verification document uploaded successfully"
      )
    );
});

const uploadFamilyMemberVerificationDoc = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  if (!req.file) throw new ApiError(400, "Document file is required");

  const uploadResponse = await uploadOnCloudinary(req.file.path);
  if (!uploadResponse) throw new ApiError(500, "File upload failed");

  const user = await User.findOneAndUpdate(
    { _id: req.user._id, "familyMembers._id": memberId },
    {
      $set: {
        "familyMembers.$.verification.documentUrl": uploadResponse.secure_url,
        "familyMembers.$.verification.status": "Pending",
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) throw new ApiError(404, "Family member not found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "Family member verification document uploaded successfully"
      )
    );
});

export {
  logoutUser,
  getCurrentUser,
  changePassword,
  addFamilyMember,
  removeFamilyMember,
  getFamilyMemberById,
  getFamilyMembers,
  updateFamilyMember,
  updateUser,
  uploadVerificationDocument,
  uploadFamilyMemberVerificationDoc,
};
