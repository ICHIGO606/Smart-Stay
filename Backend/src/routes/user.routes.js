import { Router } from "express";
import {
  addFamilyMember,
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

const router = Router();

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/family").get(verifyJWT, getFamilyMembers);
router.route("/family/:memberId").get(verifyJWT, getFamilyMemberById);
router.route("/family").post(verifyJWT, addFamilyMember);
router.route("/family/:memberId").delete(verifyJWT, removeFamilyMember);
router.route("/family/:memberId").put(verifyJWT, updateFamilyMember);
router.route("/").get(verifyJWT, getCurrentUser).put(verifyJWT, updateUser);

router.route("/upload-verification").post(verifyJWT, upload.single("document"), uploadVerificationDocument);
router.post("/family/:memberId/verify", verifyJWT, upload.single("document"), uploadFamilyMemberVerificationDoc);
export default router;
