import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentMethods
} from "../controllers/payment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Get available payment methods for a booking
router.get("/methods", verifyJWT, getPaymentMethods);

// Create payment order
router.post("/create-order", verifyJWT, createPaymentOrder);

// Verify payment
router.post("/verify", verifyJWT, verifyPayment);

export default router;