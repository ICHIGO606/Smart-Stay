import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Organization } from "../models/organization.models.js";
import { User } from "../models/user.models.js";
import { Hotel } from "../models/hotel.models.js";
import { Room } from "../models/room.models.js";

const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "www",
  "portal",
  "onboard",
  "orgs",
  "organizations",
  "hotels",
  "packages",
  "login",
  "register",
  "user",
  "checkout",
  "help",
  "support",
  "terms",
  "privacy",
]);

/**
 * Validate and sanitize slug format
 */
const sanitizeSlug = (slug) => {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

// ------------------- SLUG AVAILABILITY ------------------- //

export const checkSlugAvailability = asyncHandler(async (req, res) => {
  const rawSlug = req.params.slug || req.query.slug;
  const cleanSlug = sanitizeSlug(rawSlug);

  if (!cleanSlug || cleanSlug.length < 3) {
    return res.status(200).json(
      new ApiResponse(200, {
        available: false,
        slug: cleanSlug,
        reason: "Slug must be at least 3 alphanumeric characters",
      }, "Slug checked successfully"),
    );
  }

  if (RESERVED_SLUGS.has(cleanSlug)) {
    return res.status(200).json(
      new ApiResponse(200, {
        available: false,
        slug: cleanSlug,
        reason: "This subdomain slug is reserved for system services",
      }, "Slug checked successfully"),
    );
  }

  const existingOrg = await Organization.findOne({
    $or: [{ slug: cleanSlug }, { subdomain: cleanSlug }],
  });

  return res.status(200).json(
    new ApiResponse(200, {
      available: !existingOrg,
      slug: cleanSlug,
      reason: existingOrg ? "Subdomain slug is already in use by another brand" : "Slug is available",
    }, "Slug availability checked"),
  );
});

// ------------------- AUTOMATED ONBOARDING ENGINE ------------------- //

export const onboardOrganization = asyncHandler(async (req, res) => {
  const {
    organization: orgInput = {},
    owner: ownerInput = {},
    flagshipHotel = null,
  } = req.body;

  const rawSlug = orgInput.slug || orgInput.name;
  const slug = sanitizeSlug(rawSlug);

  if (!orgInput.name || !slug) {
    throw new ApiError(400, "Organization name and valid subdomain slug are required");
  }

  if (RESERVED_SLUGS.has(slug)) {
    throw new ApiError(400, `Slug '${slug}' is reserved for platform infrastructure`);
  }

  // Check collision
  const existingOrg = await Organization.findOne({
    $or: [{ slug }, { subdomain: slug }],
  });
  if (existingOrg) {
    throw new ApiError(409, `Subdomain slug '${slug}' is already registered`);
  }

  // 1. Resolve or Provision Organization Owner User
  let owner = req.user;
  let newAccessToken = null;

  if (!owner) {
    if (!ownerInput.email || !ownerInput.password || !ownerInput.fullName) {
      throw new ApiError(400, "Owner full name, email, and password are required for onboarding");
    }

    const email = String(ownerInput.email).trim().toLowerCase();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "A user with this email already exists. Please sign in before onboarding.");
    }

    const username = ownerInput.username
      ? String(ownerInput.username).trim().toLowerCase()
      : `${slug}_admin_${Math.floor(1000 + Math.random() * 9000)}`;

    owner = await User.create({
      fullName: ownerInput.fullName,
      email,
      username,
      password: ownerInput.password,
      role: "admin",
      phone: ownerInput.phone || "",
      age: Number(ownerInput.age) || 30,
      gender: ownerInput.gender || "Other",
      address: ownerInput.address || {},
    });

    // Generate JWT access token for immediate automatic sign-in
    newAccessToken = owner.generateAccessToken();
  } else {
    // Elevate role to admin if user onboards an organization
    if (owner.role !== "admin") {
      owner.role = "admin";
      await owner.save();
    }
  }

  // 2. Provision Organization Document
  const defaultBanner =
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=80";

  const newOrganization = await Organization.create({
    name: orgInput.name.trim(),
    slug,
    subdomain: slug,
    customDomain: orgInput.customDomain ? String(orgInput.customDomain).trim().toLowerCase() : "",
    tagline: orgInput.tagline || `Exclusive Stays by ${orgInput.name}`,
    description: orgInput.description || `${orgInput.name} presents authentic hospitality and premier accommodations.`,
    ownerId: owner._id,
    branding: {
      logo: orgInput.branding?.logo || "",
      favicon: orgInput.branding?.favicon || "",
      primaryColor: orgInput.branding?.primaryColor || "#14171F",
      accentColor: orgInput.branding?.accentColor || "#8B6B4C",
      backgroundColor: orgInput.branding?.backgroundColor || "#FBF9F5",
      textColor: orgInput.branding?.textColor || "#1C1917",
      fontFamily: orgInput.branding?.fontFamily || "serif",
      heroBanner: orgInput.branding?.heroBanner || defaultBanner,
      bannerHeadline: orgInput.branding?.bannerHeadline || `Welcome to ${orgInput.name}`,
      bannerSubheadline:
        orgInput.branding?.bannerSubheadline ||
        "Discover extraordinary residences and authentic hospitality powered by SmartStay.",
    },
    theme: {
      template: orgInput.theme?.template || "boutique-editorial",
      showMarketplaceBadge: orgInput.theme?.showMarketplaceBadge !== false,
    },
    contact: {
      email: orgInput.contact?.email || owner.email,
      phone: orgInput.contact?.phone || owner.phone || "",
      address: orgInput.contact?.address || "",
      website: orgInput.contact?.website || "",
      socials: orgInput.contact?.socials || {},
    },
    paymentSettings: {
      vpa: orgInput.paymentSettings?.vpa || `${slug}@upi`,
      merchantName: orgInput.paymentSettings?.merchantName || orgInput.name,
      currency: orgInput.paymentSettings?.currency || "INR",
    },
    status: "active",
    hotels: [],
  });

  // Link organization to owner
  owner.organizationId = newOrganization._id;
  await owner.save();

  // 3. Provision Flagship Hotel & Initial Rooms (if provided)
  let createdHotel = null;
  if (flagshipHotel && flagshipHotel.name) {
    const hotelData = {
      name: flagshipHotel.name.trim(),
      city: flagshipHotel.city ? flagshipHotel.city.trim() : "Default City",
      description:
        flagshipHotel.description ||
        `Flagship property of ${newOrganization.name}, offering luxury accommodations and bespoke guest care.`,
      address: flagshipHotel.address || `${flagshipHotel.city || "Central"}, Prime Location`,
      amenities: Array.isArray(flagshipHotel.amenities) && flagshipHotel.amenities.length > 0
        ? flagshipHotel.amenities
        : ["WiFi", "Pool", "Fine Dining", "Air Conditioning", "Valet"],
      starRating: Number(flagshipHotel.starRating) || 5,
      images: Array.isArray(flagshipHotel.images) && flagshipHotel.images.length > 0
        ? flagshipHotel.images
        : [newOrganization.branding.heroBanner],
      adminId: owner._id,
      organizationId: newOrganization._id,
      currency: newOrganization.paymentSettings.currency || "INR",
      rooms: [],
    };

    createdHotel = await Hotel.create(hotelData);

    // Seed initial room tiers
    const initialRooms = Array.isArray(flagshipHotel.rooms) && flagshipHotel.rooms.length > 0
      ? flagshipHotel.rooms
      : [
          {
            type: "Deluxe Suite",
            pricePerNight: Number(flagshipHotel.startingPrice) || 5500,
            maxOccupancy: 2,
            roomNumbers: ["101", "102", "103"],
            amenities: ["King Bed", "Balcony", "Rain Shower", "Mini Bar", "AC"],
          },
        ];

    const roomIds = [];
    for (const roomInfo of initialRooms) {
      const roomNumbers = Array.isArray(roomInfo.roomNumbers) && roomInfo.roomNumbers.length > 0
        ? roomInfo.roomNumbers
        : ["101", "102"];

      const room = await Room.create({
        type: roomInfo.type || "Deluxe Suite",
        pricePerNight: Number(roomInfo.pricePerNight) || 5000,
        maxOccupancy: Number(roomInfo.maxOccupancy) || 2,
        hotelId: createdHotel._id,
        roomNumbers,
        amenities: roomInfo.amenities || ["WiFi", "AC", "TV"],
        operationalStatus: "Available",
        statusHistory: [
          {
            status: "Available",
            updatedAt: new Date(),
            notes: "Initial SaaS automated room provisioning",
          },
        ],
      });
      roomIds.push(room._id);
    }

    createdHotel.rooms = roomIds;
    await createdHotel.save();

    newOrganization.hotels = [createdHotel._id];
    await newOrganization.save();
  }

  // 4. Return Comprehensive SaaS Provisioning Dossier
  const responseData = {
    organization: newOrganization,
    flagshipHotel: createdHotel,
    token: newAccessToken,
    urls: {
      hostedPath: `/portal/${slug}`,
      directBookingUrl: `/portal/${slug}/hotels`,
      subdomainUrl: `https://${slug}.smartstay.com`,
      adminConsoleUrl: "/admin/organization",
    },
  };

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        responseData,
        `Organization '${newOrganization.name}' onboarded and hosted website provisioned successfully!`,
      ),
    );
});

// ------------------- GET PUBLIC TENANT PROFILE ------------------- //

export const getOrganizationBySlug = asyncHandler(async (req, res) => {
  const cleanSlug = sanitizeSlug(req.params.slug);

  const organization = await Organization.findOne({
    $or: [{ slug: cleanSlug }, { subdomain: cleanSlug }],
    status: "active",
  })
    .populate({
      path: "hotels",
      select: "name city address description amenities starRating images lowestPrice currency averageRating rooms",
      populate: {
        path: "rooms",
        select: "type pricePerNight maxOccupancy amenities operationalStatus",
      },
    })
    .lean();

  if (!organization) {
    throw new ApiError(404, `No active hospitality organization found for '${cleanSlug}'`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, organization, "Tenant profile retrieved successfully"));
});

// ------------------- PUBLIC PARTNER BRANDS DIRECTORY ------------------- //

export const getAllOrganizations = asyncHandler(async (req, res) => {
  const organizations = await Organization.find({ status: "active" })
    .select("name slug subdomain tagline description branding theme contact hotels createdAt")
    .populate({
      path: "hotels",
      select: "name city starRating",
    })
    .lean();

  const formatted = organizations.map((org) => {
    const hotels = org.hotels || [];
    const cities = [...new Set(hotels.map((h) => h.city).filter(Boolean))];
    return {
      ...org,
      hotelCount: hotels.length,
      cities,
      hostedUrl: `/portal/${org.slug}`,
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, formatted, "Partner organizations retrieved successfully"));
});

// ------------------- ORG ADMIN / OWNER MANAGEMENT ------------------- //

export const getMyOrganization = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const organization = await Organization.findOne({
    $or: [{ ownerId: req.user._id }, { _id: req.user.organizationId }],
  })
    .populate({
      path: "hotels",
      select: "name city address starRating images rooms",
      populate: {
        path: "rooms",
        select: "type pricePerNight operationalStatus",
      },
    })
    .lean();

  if (!organization) {
    throw new ApiError(404, "No organization found for current user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, organization, "My organization retrieved successfully"));
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  const organization = await Organization.findById(id);
  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  // Authorization check: must be owner or platform admin
  const isOwner = String(organization.ownerId) === String(req.user._id);
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You do not have permission to manage this organization");
  }

  // Whitelisted fields for update
  if (updateFields.name) organization.name = updateFields.name.trim();
  if (updateFields.tagline !== undefined) organization.tagline = updateFields.tagline;
  if (updateFields.description !== undefined) organization.description = updateFields.description;
  if (updateFields.customDomain !== undefined) organization.customDomain = updateFields.customDomain.trim().toLowerCase();

  if (updateFields.branding) {
    organization.branding = {
      ...organization.branding,
      ...updateFields.branding,
    };
  }

  if (updateFields.theme) {
    organization.theme = {
      ...organization.theme,
      ...updateFields.theme,
    };
  }

  if (updateFields.contact) {
    organization.contact = {
      ...organization.contact,
      ...updateFields.contact,
    };
  }

  if (updateFields.paymentSettings) {
    organization.paymentSettings = {
      ...organization.paymentSettings,
      ...updateFields.paymentSettings,
    };
  }

  await organization.save();

  return res
    .status(200)
    .json(new ApiResponse(200, organization, "Organization updated successfully"));
});
