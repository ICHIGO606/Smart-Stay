import { Router } from "express";
import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";
import {
  createPackage,
  updatePackage,
  deletePackage,
  getAllPackages,
  getPackageById
} from "../controllers/package.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Admin routes
router.post("/", verifyJWT, isAdmin, upload.array("images"), createPackage);
router.put("/:packageId", verifyJWT, isAdmin, upload.array("images"), updatePackage);
router.delete("/:packageId", verifyJWT, isAdmin, deletePackage);

// User routes
router.get("/", getAllPackages);
router.get("/:packageId", getPackageById);

export default router;
