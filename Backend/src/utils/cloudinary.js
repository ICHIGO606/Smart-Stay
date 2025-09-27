import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

console.log(process.env.CLOUDINARY_CLOUD_NAME)
console.log(process.env.CLOUDINARY_API_KEY)
console.log(process.env.CLOUDINARY_API_SECRET)

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
    console.error("Cloudinary upload error:", error);
  if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
  throw new ApiError(500, "Failed to upload file to Cloudinary");
  }
};

export { uploadOnCloudinary };
