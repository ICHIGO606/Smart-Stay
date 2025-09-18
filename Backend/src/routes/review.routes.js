import { Router } from "express";
import { addReview, getReviews } from "../controllers/review.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", verifyJWT, addReview);
router.get("/:targetModel/:targetId", getReviews);

export default router;
