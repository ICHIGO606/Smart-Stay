import api from "./api";

// Get all packages
export const getAllPackages = async () => {
  return api.get("/packages");
};

// Get package by ID
export const getPackageById = async (packageId) => {
  return api.get(`/packages/${packageId}`);
};

// Create a new package
export const createPackage = async (packageData) => {
  const formData = new FormData();

  // Append basic fields
  formData.append("name", packageData.name);
  formData.append("description", packageData.description);
  formData.append("price", packageData.price);

  // Append duration as JSON string
  formData.append("duration", JSON.stringify(packageData.duration));

  // Append destinations as JSON string
  formData.append("destinations", JSON.stringify(packageData.destinations));

  // Append itinerary as JSON string
  formData.append("itinerary", JSON.stringify(packageData.itinerary));

  // Append images if they exist
  if (packageData.images && packageData.images.length > 0) {
    packageData.images.forEach((image) => {
      formData.append("images", image);
    });
  }

  const response = await api.post("/packages", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response;
};

// Update an existing package
export const updatePackage = async (packageId, packageData) => {
  const formData = new FormData();

  // Append basic fields
  formData.append("name", packageData.name);
  formData.append("description", packageData.description);
  formData.append("price", packageData.price);

  // Append duration as JSON string
  formData.append("duration", JSON.stringify(packageData.duration));

  // Append destinations as JSON string
  formData.append("destinations", JSON.stringify(packageData.destinations));

  // Append itinerary as JSON string
  formData.append("itinerary", JSON.stringify(packageData.itinerary));

  // Append images if they exist
  if (packageData.images && packageData.images.length > 0) {
    packageData.images.forEach((image) => {
      formData.append("images", image);
    });
  }

  const response = await api.put(`/packages/${packageId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response;
};

// Delete a package
export const deletePackage = async (packageId) => {
  return api.delete(`/packages/${packageId}`);
};
