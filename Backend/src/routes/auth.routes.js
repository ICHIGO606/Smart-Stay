import { Router } from "express";
import { loginUser, registerUser } from "../controllers/auth.controllers.js";
import {
  googleLogin,
  googleLoginCallback,
} from "../controllers/googleAuth.controllers.js";
import { strictLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.route("/login").post(strictLimiter, loginUser);

router.route("/register").post(strictLimiter, registerUser);

router.route("/google").get(googleLogin);

router.route("/google/callback").get(googleLoginCallback);

export default router;