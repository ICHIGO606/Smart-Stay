import { Router } from "express";
import { loginUser, registerUser } from "../controllers/auth.controllers.js";
import { strictLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.route("/login").post(strictLimiter, loginUser);

router.route("/register").post(strictLimiter, registerUser);

export default router;