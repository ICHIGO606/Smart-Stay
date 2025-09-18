import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Package } from "../models/package.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Admin creates a package
const createPackage = asyncHandler(async (req, res) => {
  const { name, description, destinations, duration, price, itinerary } = req.body;

  if (!name || !description || !destinations || !duration || !price || !itinerary) {
    throw new ApiError(400, "All package fields are required");
  }

  let images = [];
  if (req.files?.images) {
    const uploadPromises = req.files.images.map((file) =>
      uploadOnCloudinary(file.path)
    );
    images = await Promise.all(uploadPromises);
    images = images.map(img => img.secure_url);
  }

  const newPackage = await Package.create({
    name,
    description,
    destinations,
    duration,
    price,
    images,
    itinerary,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newPackage, "Package created successfully"));
});

// Admin updates a package
const updatePackage = asyncHandler(async (req, res) => {
  const { packageId } = req.params;
  const { name, description, destinations, duration, price, itinerary, images } = req.body;

  const travelPackage = await Package.findById(packageId);
  if (!travelPackage) throw new ApiError(404, "Package not found");

  if (name) travelPackage.name = name;
  if (description) travelPackage.description = description;
  if (destinations) travelPackage.destinations = destinations;
  if (duration) travelPackage.duration = duration;
  if (price) travelPackage.price = price;
  if (itinerary) travelPackage.itinerary = itinerary;

  // Handle uploaded images
  if (req.files?.images) {
    const uploadPromises = req.files.images.map((file) =>
      uploadOnCloudinary(file.path)
    );
    const newImages = await Promise.all(uploadPromises);
    travelPackage.images.push(...newImages.map(img => img.secure_url));
  }

  // Add/remove images if provided in request body
  if (images?.add) travelPackage.images.push(...images.add);
  if (images?.remove) travelPackage.images = travelPackage.images.filter(img => !images.remove.includes(img));

  const updatedPackage = await travelPackage.save();
  return res.status(200).json(new ApiResponse(200, updatedPackage, "Package updated successfully"));
});

// Admin deletes a package
const deletePackage = asyncHandler(async (req, res) => {
  const { packageId } = req.params;
  const travelPackage = await Package.findById(packageId);
  if (!travelPackage) throw new ApiError(404, "Package not found");

  await travelPackage.deleteOne();
  return res.status(200).json(new ApiResponse(200, {}, "Package deleted successfully"));
});

// User fetches packages
const getAllPackages = asyncHandler(async (req, res) => {
  const packages = await Package.find().populate("reviews");
  return res.status(200).json(new ApiResponse(200, packages, "Packages fetched successfully"));
});

// User fetches a single package by ID
const getPackageById = asyncHandler(async (req, res) => {
  const { packageId } = req.params;
  const travelPackage = await Package.findById(packageId).populate("reviews");
  if (!travelPackage) throw new ApiError(404, "Package not found");

  return res.status(200).json(new ApiResponse(200, travelPackage, "Package fetched successfully"));
});

export {
  createPackage,
  updatePackage,
  deletePackage,
  getAllPackages,
  getPackageById
};
