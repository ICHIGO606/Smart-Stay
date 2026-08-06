import { Router } from "express";
import {
  addFamilyMember,
  changePassword,
  getFamilyMemberById,
  getFamilyMembers,
  logoutUser,
  removeFamilyMember,
  updateFamilyMember,
  updateUser,
  uploadVerificationDocument,
  uploadFamilyMemberVerificationDoc,
  getCurrentUser
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"; 
import { apiLimiter, strictLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.use(apiLimiter);

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/family").get(verifyJWT, getFamilyMembers);
router.route("/family/:memberId").get(verifyJWT, getFamilyMemberById);
router.route("/family").post(verifyJWT, addFamilyMember);
router.route("/family/:memberId").delete(verifyJWT, removeFamilyMember);
router.route("/family/:memberId").put(verifyJWT, updateFamilyMember);
router.route("/").get(verifyJWT, getCurrentUser).put(verifyJWT, updateUser);

router.route("/change-password").post(strictLimiter, verifyJWT, changePassword);

router.route("/upload-verification").post(strictLimiter, verifyJWT, upload.single("document"), uploadVerificationDocument);
router.post("/family/:memberId/verify", strictLimiter, verifyJWT, upload.single("document"), uploadFamilyMemberVerificationDoc);

export default router;