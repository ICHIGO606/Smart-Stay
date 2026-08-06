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
import { apiLimiter, strictLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.use(apiLimiter);

router.post("/", strictLimiter, verifyJWT, isAdmin, upload.array("images"), createPackage);
router.put("/:packageId", strictLimiter, verifyJWT, isAdmin, upload.array("images"), updatePackage);
router.delete("/:packageId", strictLimiter, verifyJWT, isAdmin, deletePackage);

router.get("/", getAllPackages);
router.get("/:packageId", getPackageById);

export default router;