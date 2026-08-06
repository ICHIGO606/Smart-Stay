import { Router } from "express";
import { addReview, getReviews } from "../controllers/review.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { apiLimiter, strictLimiter } from "../middlewares/rateLimit.middleware.js";
const router = Router();
router.use(apiLimiter);
router.post("/", strictLimiter, verifyJWT, addReview);
router.get("/:targetModel/:targetId", getReviews);

export default router;
