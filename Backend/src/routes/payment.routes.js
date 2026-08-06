import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentMethods
} from "../controllers/payment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { apiLimiter, strictLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.use(apiLimiter);

router.get("/methods", verifyJWT, getPaymentMethods);

router.post("/create-order", strictLimiter, verifyJWT, createPaymentOrder);

router.post("/verify", strictLimiter, verifyJWT, verifyPayment);

export default router;