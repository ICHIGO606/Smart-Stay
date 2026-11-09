import { Router } from "express";
import {
  checkSlugAvailability,
  onboardOrganization,
  getOrganizationBySlug,
  getAllOrganizations,
  getMyOrganization,
  updateOrganization,
} from "../controllers/organization.controllers.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import {
  apiLimiter,
  strictLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = Router();
router.use(apiLimiter);

// Public check & lookup endpoints
router.get("/check-slug/:slug", checkSlugAvailability);
router.get("/by-slug/:slug", getOrganizationBySlug);
router.get("/", getAllOrganizations);

// Automated onboarding (guest or authenticated)
router.post("/onboard", strictLimiter, optionalVerifyJWT, onboardOrganization);

// Authenticated owner endpoints
router.get("/my-organization", verifyJWT, getMyOrganization);
router.patch("/:id", verifyJWT, updateOrganization);

export default router;
