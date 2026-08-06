import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { ApiError } from "./ApiError.js";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    if (localFilePath.indexOf('\0') !== -1 || localFilePath.includes('..')) {
      throw new ApiError(400, "Invalid file path detected");
    }
    const safePath = path.normalize(localFilePath);

    const response = await cloudinary.uploader.upload(safePath, {
      resource_type: "auto"
    });

    fs.unlinkSync(safePath);
    return response; 
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    if (localFilePath && localFilePath.indexOf('\0') === -1 && !localFilePath.includes('..')) {
      const safePath = path.normalize(localFilePath);
      if (fs.existsSync(safePath)) {
        fs.unlinkSync(safePath);
      }
    }
    
    throw new ApiError(500, "Failed to upload file to Cloudinary");
  }
};

export { uploadOnCloudinary };