import api from "./api";

export const organizationService = {
  // Check if a subdomain slug is available
  checkSlugAvailability: async (slug) => {
    try {
      const response = await api.get(`/organizations/check-slug/${encodeURIComponent(slug)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Automated self-service onboarding engine
  onboardOrganization: async (payload) => {
    try {
      const response = await api.post("/organizations/onboard", payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Fetch public tenant profile and scoped inventory for hosted website
  getOrganizationBySlug: async (slug) => {
    try {
      const response = await api.get(`/organizations/by-slug/${encodeURIComponent(slug)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Public catalog of partner brands on the marketplace
  getAllOrganizations: async () => {
    try {
      const response = await api.get("/organizations");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Owner dashboard organization data
  getMyOrganization: async () => {
    try {
      const response = await api.get("/organizations/my-organization");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update brand colors, logo, tagline, and theme
  updateOrganization: async (id, payload) => {
    try {
      const response = await api.patch(`/organizations/${id}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default organizationService;

