import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    fs.unlinkSync(localFilePath); // remove local file
    return response; // Return the full response object
  } catch (error) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    throw new ApiError(500, "Failed to upload file to Cloudinary");
  }
};

export { uploadOnCloudinary };
