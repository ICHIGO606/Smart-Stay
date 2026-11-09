import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockOrgFindOne = jest.fn();
const mockOrgFind = jest.fn();
const mockOrgFindById = jest.fn();
const mockOrgCreate = jest.fn();

const mockUserFindOne = jest.fn();
const mockUserCreate = jest.fn();

const mockHotelCreate = jest.fn();
const mockRoomCreate = jest.fn();

await jest.unstable_mockModule("../models/organization.models.js", () => ({
  Organization: {
    findOne: mockOrgFindOne,
    find: mockOrgFind,
    findById: mockOrgFindById,
    create: mockOrgCreate,
  },
}));

await jest.unstable_mockModule("../models/user.models.js", () => ({
  User: {
    findOne: mockUserFindOne,
    create: mockUserCreate,
  },
}));

await jest.unstable_mockModule("../models/hotel.models.js", () => ({
  Hotel: {
    create: mockHotelCreate,
  },
}));

await jest.unstable_mockModule("../models/room.models.js", () => ({
  Room: {
    create: mockRoomCreate,
  },
}));

const {
  checkSlugAvailability,
  onboardOrganization,
  getOrganizationBySlug,
  getAllOrganizations,
  updateOrganization,
} = await import("../controllers/organization.controllers.js");

const makeResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

const invokeController = async (controller, req) => {
  const res = makeResponse();
  let error = null;
  await new Promise((resolve) => {
    const next = (err) => {
      error = err;
      resolve();
    };
    const originalJson = res.json;
    res.json = jest.fn((...args) => {
      originalJson(...args);
      resolve();
      return res;
    });
    controller(req, res, next);
  });
  const payload = res.json.mock.calls[0]?.[0];
  return { response: res, payload, error };
};

describe("Organization & SaaS Onboarding Controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkSlugAvailability", () => {
    it("reports an available slug when not taken", async () => {
      mockOrgFindOne.mockResolvedValue(null);
      const { response, payload } = await invokeController(checkSlugAvailability, {
        params: { slug: "heritage-palace" },
        query: {},
      });

      expect(response.status).toHaveBeenCalledWith(200);
      expect(payload.data.available).toBe(true);
      expect(payload.data.slug).toBe("heritage-palace");
    });

    it("rejects reserved system slugs", async () => {
      const { response, payload } = await invokeController(checkSlugAvailability, {
        params: { slug: "admin" },
        query: {},
      });

      expect(response.status).toHaveBeenCalledWith(200);
      expect(payload.data.available).toBe(false);
      expect(payload.data.reason).toMatch(/reserved/i);
    });

    it("reports unavailable for already registered slugs", async () => {
      mockOrgFindOne.mockResolvedValue({ _id: "org-123", slug: "zostel" });
      const { response, payload } = await invokeController(checkSlugAvailability, {
        params: { slug: "zostel" },
        query: {},
      });

      expect(response.status).toHaveBeenCalledWith(200);
      expect(payload.data.available).toBe(false);
      expect(payload.data.reason).toMatch(/already in use/i);
    });
  });

  describe("onboardOrganization", () => {
    it("successfully onboards organization and provisions flagship hotel & rooms", async () => {
      mockOrgFindOne.mockResolvedValue(null);
      mockUserFindOne.mockResolvedValue(null);

      const mockOwner = {
        _id: "user-owner-1",
        email: "owner@boutique.com",
        role: "admin",
        save: jest.fn().mockResolvedValue(true),
        generateAccessToken: jest.fn().mockReturnValue("mock-token-xyz"),
      };
      mockUserCreate.mockResolvedValue(mockOwner);

      const mockOrg = {
        _id: "org-1",
        name: "Boutique Group",
        slug: "boutique-group",
        subdomain: "boutique-group",
        branding: {
          heroBanner: "https://example.com/banner.jpg",
          primaryColor: "#0F5132",
        },
        paymentSettings: { currency: "INR" },
        save: jest.fn().mockResolvedValue(true),
      };
      mockOrgCreate.mockResolvedValue(mockOrg);

      const mockHotel = {
        _id: "hotel-1",
        name: "Boutique Palace",
        rooms: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockHotelCreate.mockResolvedValue(mockHotel);

      mockRoomCreate.mockResolvedValue({ _id: "room-101" });

      const req = {
        body: {
          organization: {
            name: "Boutique Group",
            slug: "boutique-group",
            branding: { primaryColor: "#0F5132" },
          },
          owner: {
            fullName: "Alice Owner",
            email: "owner@boutique.com",
            password: "SecretPassword123!",
          },
          flagshipHotel: {
            name: "Boutique Palace",
            city: "Jaipur",
            startingPrice: 6500,
            rooms: [
              {
                type: "Royal Suite",
                pricePerNight: 6500,
                maxOccupancy: 2,
                roomNumbers: ["101", "102"],
              },
            ],
          },
        },
      };

      const { response, payload } = await invokeController(onboardOrganization, req);

      expect(response.status).toHaveBeenCalledWith(201);
      expect(payload.success).toBe(true);
      expect(payload.data.organization.slug).toBe("boutique-group");
      expect(payload.data.urls.hostedPath).toBe("/portal/boutique-group");
      expect(payload.data.urls.subdomainUrl).toBe("https://boutique-group.smartstay.com");
      expect(mockHotelCreate).toHaveBeenCalled();
      expect(mockRoomCreate).toHaveBeenCalled();
    });

    it("rejects onboarding when slug is reserved", async () => {
      const req = {
        body: {
          organization: { name: "Portal Stays", slug: "portal" },
          owner: { fullName: "Bob", email: "bob@test.com", password: "pwd" },
        },
      };

      const { error } = await invokeController(onboardOrganization, req);
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(400);
      expect(error.message).toMatch(/reserved/i);
    });
  });

  describe("getOrganizationBySlug", () => {
    it("returns active tenant profile and hotels", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: "org-1",
          name: "Taj Collection",
          slug: "taj-collection",
          status: "active",
          hotels: [{ name: "Taj Lake Palace", city: "Udaipur" }],
        }),
      };
      mockOrgFindOne.mockReturnValue(mockQuery);

      const { response, payload } = await invokeController(getOrganizationBySlug, {
        params: { slug: "taj-collection" },
      });

      expect(response.status).toHaveBeenCalledWith(200);
      expect(payload.data.slug).toBe("taj-collection");
      expect(payload.data.hotels).toHaveLength(1);
    });

    it("returns 404 if organization does not exist", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      mockOrgFindOne.mockReturnValue(mockQuery);

      const { error } = await invokeController(getOrganizationBySlug, {
        params: { slug: "nonexistent-org" },
      });

      expect(error).toBeDefined();
      expect(error.statusCode).toBe(404);
    });
  });

  describe("getAllOrganizations", () => {
    it("returns partner organizations with property metrics", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            name: "Zostel Stays",
            slug: "zostel",
            hotels: [{ name: "Zostel Jaipur", city: "Jaipur" }],
          },
        ]),
      };
      mockOrgFind.mockReturnValue(mockQuery);

      const { response, payload } = await invokeController(getAllOrganizations, {});

      expect(response.status).toHaveBeenCalledWith(200);
      expect(payload.data).toHaveLength(1);
      expect(payload.data[0].hotelCount).toBe(1);
      expect(payload.data[0].cities).toContain("Jaipur");
    });
  });

  describe("updateOrganization", () => {
    it("updates branding colors and theme configuration", async () => {
      const mockOrg = {
        _id: "org-1",
        ownerId: "user-123",
        name: "Old Name",
        branding: { primaryColor: "#000000" },
        theme: { template: "luxury-minimal" },
        save: jest.fn().mockResolvedValue(true),
      };
      mockOrgFindById.mockResolvedValue(mockOrg);

      const req = {
        params: { id: "org-1" },
        user: { _id: "user-123", role: "admin" },
        body: {
          branding: { primaryColor: "#1B4D3E" },
          theme: { template: "boutique-editorial" },
        },
      };

      const { response, payload } = await invokeController(updateOrganization, req);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(payload.data.branding.primaryColor).toBe("#1B4D3E");
      expect(mockOrg.save).toHaveBeenCalled();
    });

    it("forbids non-owner from updating organization", async () => {
      const mockOrg = {
        _id: "org-1",
        ownerId: "user-123",
      };
      mockOrgFindById.mockResolvedValue(mockOrg);

      const req = {
        params: { id: "org-1" },
        user: { _id: "intruder-456", role: "user" },
        body: { name: "Hacked" },
      };

      const { error } = await invokeController(updateOrganization, req);
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(403);
    });
  });
});
