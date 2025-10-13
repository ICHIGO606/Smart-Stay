// src/services/packageService.js
import api from "./api";

// Fetch all packages (user)
export const getAllPackages = async () => {
  try {
    const response = await api.get("/packages");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching packages:", error);
    throw error;
  }
};

// Fetch a single package by ID (user)
export const getPackageById = async (packageId) => {
  try {
    const response = await api.get(`/packages/${packageId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching package:", error);
    throw error;
  }
};

// Optional: Fetch packages with filters (search, destination, etc.)
export const searchPackages = async (filters = {}) => {
  try {
    const response = await api.get("/packages", { params: filters });
    return response.data.data;
  } catch (error) {
    console.error("Error searching packages:", error);
    throw error;
  }
};
export const bookPackage = async (packageId, bookingDetails) => {
  const { data } = await api.post(`/bookings/${packageId}`, bookingDetails);
  return data.data;
};