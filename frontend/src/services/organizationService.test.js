import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import organizationService from "./organizationService";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("./api", () => ({ default: api }));

describe("organizationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("checkSlugAvailability calls GET /organizations/check-slug/:slug", async () => {
    const mockData = { available: true, slug: "heritage-palace" };
    api.get.mockResolvedValueOnce({ data: mockData });

    const result = await organizationService.checkSlugAvailability("heritage-palace");

    expect(api.get).toHaveBeenCalledWith("/organizations/check-slug/heritage-palace");
    expect(result).toEqual(mockData);
  });

  it("onboardOrganization calls POST /organizations/onboard with payload", async () => {
    const payload = {
      organization: { name: "Boutique Stays", slug: "boutique-stays" },
      flagshipHotel: { name: "Boutique Palace", city: "Jaipur" },
    };
    const mockData = { success: true, data: { organization: payload.organization } };
    api.post.mockResolvedValueOnce({ data: mockData });

    const result = await organizationService.onboardOrganization(payload);

    expect(api.post).toHaveBeenCalledWith("/organizations/onboard", payload);
    expect(result).toEqual(mockData);
  });

  it("getOrganizationBySlug calls GET /organizations/by-slug/:slug", async () => {
    const mockData = { data: { name: "Zostel", slug: "zostel", hotels: [] } };
    api.get.mockResolvedValueOnce({ data: mockData });

    const result = await organizationService.getOrganizationBySlug("zostel");

    expect(api.get).toHaveBeenCalledWith("/organizations/by-slug/zostel");
    expect(result).toEqual(mockData);
  });

  it("getAllOrganizations calls GET /organizations", async () => {
    const mockData = { data: [{ name: "Aman" }, { name: "Oberoi" }] };
    api.get.mockResolvedValueOnce({ data: mockData });

    const result = await organizationService.getAllOrganizations();

    expect(api.get).toHaveBeenCalledWith("/organizations");
    expect(result).toEqual(mockData);
  });

  it("getMyOrganization calls GET /organizations/my-organization", async () => {
    const mockData = { data: { name: "My Brand" } };
    api.get.mockResolvedValueOnce({ data: mockData });

    const result = await organizationService.getMyOrganization();

    expect(api.get).toHaveBeenCalledWith("/organizations/my-organization");
    expect(result).toEqual(mockData);
  });

  it("updateOrganization calls PATCH /organizations/:id with payload", async () => {
    const payload = { branding: { primaryColor: "#1B4D3E" } };
    const mockData = { data: { branding: payload.branding } };
    api.patch.mockResolvedValueOnce({ data: mockData });

    const result = await organizationService.updateOrganization("org-123", payload);

    expect(api.patch).toHaveBeenCalledWith("/organizations/org-123", payload);
    expect(result).toEqual(mockData);
  });
});

