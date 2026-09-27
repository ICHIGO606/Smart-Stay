import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockFindHotelById = jest.fn();

await jest.unstable_mockModule("../models/hotel.models.js", () => ({
  Hotel: { findById: mockFindHotelById },
}));

const { verifyHotelAdmin } =
  await import("../middlewares/verifyHotelAdmin.middleware.js");

const makeResponse = () => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return response;
};

describe("verifyHotelAdmin middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects non-admin users before querying the hotel", async () => {
    const response = makeResponse();
    const next = jest.fn();

    await verifyHotelAdmin(
      { user: { role: "user" }, params: { hotelId: "hotel-1" } },
      response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      message: "Access denied. Not an admin.",
    });
    expect(mockFindHotelById).not.toHaveBeenCalled();
  });

  it("returns not found when the hotel does not exist", async () => {
    mockFindHotelById.mockResolvedValue(null);
    const response = makeResponse();

    await verifyHotelAdmin(
      { user: { role: "admin" }, params: { hotelId: "missing" } },
      response,
      jest.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ message: "Hotel not found." });
  });

  it("rejects admins who do not own the hotel", async () => {
    mockFindHotelById.mockResolvedValue({ adminId: "owner-1" });
    const response = makeResponse();

    await verifyHotelAdmin(
      {
        user: { role: "admin", _id: "user-2" },
        params: { hotelId: "hotel-1" },
      },
      response,
      jest.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      message: "You are not the admin of this hotel.",
    });
  });

  it("continues for the hotel owner", async () => {
    mockFindHotelById.mockResolvedValue({ adminId: "user-1" });
    const next = jest.fn();

    await verifyHotelAdmin(
      {
        user: { role: "admin", _id: "user-1" },
        params: { hotelId: "hotel-1" },
      },
      makeResponse(),
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("converts lookup errors into a server response", async () => {
    mockFindHotelById.mockRejectedValue(new Error("database unavailable"));
    const response = makeResponse();

    await verifyHotelAdmin(
      { user: { role: "admin" }, params: { hotelId: "hotel-1" } },
      response,
      jest.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      message: "Server error",
      error: "database unavailable",
    });
  });
});
