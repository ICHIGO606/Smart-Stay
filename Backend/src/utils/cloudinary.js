import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { ApiError } from "./ApiError.js";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const UPLOAD_DIR = path.resolve("public/temp"); 

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const filename = path.basename(localFilePath);
    const safePath = path.join(UPLOAD_DIR, filename);
    if (!safePath.startsWith(UPLOAD_DIR)) {
      throw new ApiError(400, "Invalid file path detected");
    }

    const response = await cloudinary.uploader.upload(safePath, {
      resource_type: "auto"
    });

    if (fs.existsSync(safePath)) {
      fs.unlinkSync(safePath);
    }
    return response; 
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    // Securely attempt cleanup in the catch block as well
    if (localFilePath) {
      const filename = path.basename(localFilePath);
      const safePath = path.join(UPLOAD_DIR, filename);
      
      if (safePath.startsWith(UPLOAD_DIR) && fs.existsSync(safePath)) {
        fs.unlinkSync(safePath);
      }
    }
    
    throw new ApiError(500, "Failed to upload file to Cloudinary");
  }
};

export { uploadOnCloudinary };