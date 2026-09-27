import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import authService from "./authService";
import adminHotelService from "./adminHotelService";
import adminService from "./adminService";
import {
  createPackage as createAdminPackage,
  deletePackage as deleteAdminPackage,
  getAllPackages as getAdminPackages,
  getPackageById as getAdminPackage,
  updatePackage as updateAdminPackage,
} from "./adminPackageService";
import { bookingService } from "./bookingService";
import {
  bookPackage,
  getAllPackages,
  getPackageById,
  searchPackages,
} from "./packageService";
import { hotelService } from "./hotelService";
import paymentService from "./paymentService";
import { userService } from "./userService";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("./api", () => ({ default: api }));

const apiResponse = { data: { data: { accessToken: "token", id: "item-1" } } };
const responseData = apiResponse.data;
const packageData = apiResponse.data.data;
const userData = { email: "guest@example.com", password: "password" };
const hotelData = {
  name: "North Hotel",
  city: "Toronto",
  description: "A city hotel",
  address: "10 Main Street",
  amenities: ["pool"],
  images: ["hotel.jpg"],
  newImages: ["new-hotel.jpg"],
};
const roomData = {
  type: "Suite",
  pricePerNight: 120,
  maxOccupancy: 2,
  description: "A suite",
  roomNumbers: [101],
  amenities: ["wifi"],
  images: ["room.jpg"],
};
const packagePayload = {
  name: "City tour",
  description: "A short tour",
  destinations: ["Toronto"],
  duration: { days: 2, nights: 1 },
  price: 100,
  images: ["package.jpg"],
  itinerary: [],
};

const serviceCases = [
  {
    name: "register",
    call: () => authService.register(userData),
    method: "post",
    url: "/auth/register",
    result: responseData,
    errors: "body",
  },
  {
    name: "login",
    call: () => authService.login(userData),
    method: "post",
    url: "/auth/login",
    result: responseData,
    errors: "body",
  },
  {
    name: "logout",
    call: () => authService.logout(),
    method: "post",
    url: "/users/logout",
    result: responseData,
    errors: "body",
  },
  {
    name: "refresh token",
    call: () => authService.refreshToken(),
    method: "post",
    url: "/auth/refresh",
    result: responseData,
    errors: "body",
  },

  {
    name: "get hotel room status",
    call: () => adminHotelService.getHotelRoomsStatus("hotel-1"),
    method: "get",
    url: "/admin/hotels/hotel-1/rooms-status",
    result: apiResponse,
  },
  {
    name: "get admin hotels",
    call: () => adminHotelService.getAdminHotels(),
    method: "get",
    url: "/admin/hotels",
    result: responseData,
    errors: "wrapped",
  },
  {
    name: "create admin hotel",
    call: () => adminHotelService.createHotel(hotelData),
    method: "post",
    url: "/admin/hotels",
    result: responseData,
    errors: "wrapped",
  },
  {
    name: "update admin hotel",
    call: () => adminHotelService.updateHotel("hotel-1", hotelData),
    method: "put",
    url: "/admin/hotels/hotel-1",
    result: responseData,
    errors: "wrapped",
  },
  {
    name: "delete admin hotel",
    call: () => adminHotelService.deleteHotel("hotel-1"),
    method: "delete",
    url: "/admin/hotels/hotel-1",
    result: responseData,
    errors: "wrapped",
  },
  {
    name: "create admin room",
    call: () => adminHotelService.createRoom("hotel-1", roomData),
    method: "post",
    url: "/admin/hotels/hotel-1/rooms",
    result: responseData,
    errors: "wrapped",
  },
  {
    name: "get admin rooms",
    call: () => adminHotelService.getHotelRooms("hotel-1"),
    method: "get",
    url: "/admin/hotels/hotel-1/rooms-status",
    result: responseData,
    errors: "wrapped",
  },
  {
    name: "update admin room",
    call: () => adminHotelService.updateRoom("hotel-1", "room-1", roomData),
    method: "put",
    url: "/admin/hotels/hotel-1/rooms/room-1",
    result: responseData,
    errors: "wrapped",
  },
  {
    name: "delete admin room",
    call: () => adminHotelService.deleteRoom("hotel-1", "room-1"),
    method: "delete",
    url: "/admin/hotels/hotel-1/rooms/room-1",
    result: responseData,
    errors: "wrapped",
  },

  {
    name: "get pending verifications",
    call: () => adminService.getPendingVerifications(),
    method: "get",
    url: "/admin/verifications/pending",
    result: apiResponse,
  },
  {
    name: "get verified users",
    call: () => adminService.getVerifiedUsers(),
    method: "get",
    url: "/admin/verifications/verified",
    result: apiResponse,
  },
  {
    name: "get verification stats",
    call: () => adminService.getVerificationStats(),
    method: "get",
    url: "/admin/verifications/stats",
    result: apiResponse,
  },
  {
    name: "get user verification",
    call: () => adminService.getUserVerification("user-1"),
    method: "get",
    url: "/admin/verifications/user/user-1",
    result: apiResponse,
  },
  {
    name: "verify user",
    call: () => adminService.verifyUser("user-1", { status: "Verified" }),
    method: "put",
    url: "/admin/verifications/verify/user-1",
    result: apiResponse,
  },
  {
    name: "create hotel through admin service",
    call: () => adminService.createHotel(hotelData),
    method: "post",
    url: "/admin/hotels",
    result: apiResponse,
  },
  {
    name: "update hotel through admin service",
    call: () => adminService.updateHotel("hotel-1", hotelData),
    method: "put",
    url: "/admin/hotels/hotel-1",
    result: apiResponse,
  },
  {
    name: "delete hotel through admin service",
    call: () => adminService.deleteHotel("hotel-1"),
    method: "delete",
    url: "/admin/hotels/hotel-1",
    result: apiResponse,
  },
  {
    name: "get hotels through admin service",
    call: () => adminService.getHotels(),
    method: "get",
    url: "/admin/hotels",
    result: apiResponse,
  },
  {
    name: "get hotel through admin service",
    call: () => adminService.getHotel("hotel-1"),
    method: "get",
    url: "/admin/hotels/hotel-1",
    result: apiResponse,
  },
  {
    name: "create room through admin service",
    call: () => adminService.createRoom("hotel-1", roomData),
    method: "post",
    url: "/admin/hotels/hotel-1/rooms",
    result: apiResponse,
  },
  {
    name: "update room through admin service",
    call: () => adminService.updateRoom("hotel-1", "room-1", roomData),
    method: "put",
    url: "/admin/hotels/hotel-1/rooms/room-1",
    result: apiResponse,
  },
  {
    name: "delete room through admin service",
    call: () => adminService.deleteRoom("hotel-1", "room-1"),
    method: "delete",
    url: "/admin/hotels/hotel-1/rooms/room-1",
    result: apiResponse,
  },
  {
    name: "get rooms through admin service",
    call: () => adminService.getRooms("hotel-1"),
    method: "get",
    url: "/admin/hotels/hotel-1/rooms",
    result: apiResponse,
  },
  {
    name: "get room through admin service",
    call: () => adminService.getRoom("hotel-1", "room-1"),
    method: "get",
    url: "/admin/hotels/hotel-1/rooms/room-1",
    result: apiResponse,
  },
  {
    name: "get hotel bookings",
    call: () => adminService.getHotelBookings("hotel-1"),
    method: "get",
    url: "/admin/hotels/hotel-1/bookings",
    result: apiResponse,
  },
  {
    name: "update booking status through admin service",
    call: () => adminService.updateBookingStatus("booking-1", "Confirmed"),
    method: "put",
    url: "/admin/bookings/booking-1/status",
    result: apiResponse,
  },
  {
    name: "get booking through admin service",
    call: () => adminService.getBooking("booking-1"),
    method: "get",
    url: "/admin/bookings/booking-1",
    result: apiResponse,
  },
  {
    name: "get dashboard stats",
    call: () => adminService.getDashboardStats(),
    method: "get",
    url: "/admin/dashboard/stats",
    result: apiResponse,
  },
  {
    name: "get recent bookings",
    call: () => adminService.getRecentBookings(),
    method: "get",
    url: "/admin/dashboard/recent-bookings",
    result: apiResponse,
  },
  {
    name: "get revenue stats",
    call: () => adminService.getRevenueStats(),
    method: "get",
    url: "/admin/dashboard/revenue",
    result: apiResponse,
  },

  {
    name: "get admin packages",
    call: () => getAdminPackages(),
    method: "get",
    url: "/packages",
    result: apiResponse,
  },
  {
    name: "get admin package",
    call: () => getAdminPackage("package-1"),
    method: "get",
    url: "/packages/package-1",
    result: apiResponse,
  },
  {
    name: "create admin package",
    call: () => createAdminPackage(packagePayload),
    method: "post",
    url: "/packages",
    result: apiResponse,
  },
  {
    name: "update admin package",
    call: () => updateAdminPackage("package-1", packagePayload),
    method: "put",
    url: "/packages/package-1",
    result: apiResponse,
  },
  {
    name: "delete admin package",
    call: () => deleteAdminPackage("package-1"),
    method: "delete",
    url: "/packages/package-1",
    result: apiResponse,
  },

  {
    name: "create booking",
    call: () => bookingService.createBooking({ hotelId: "hotel-1" }),
    method: "post",
    url: "/bookings",
    result: responseData,
    errors: "body",
  },
  {
    name: "get user bookings through booking service",
    call: () => bookingService.getUserBookings(),
    method: "get",
    url: "/bookings/me",
    result: responseData,
    errors: "body",
  },
  {
    name: "get booking by ID",
    call: () => bookingService.getBookingById("booking-1"),
    method: "get",
    url: "/bookings/booking-1",
    result: responseData,
    errors: "body",
  },
  {
    name: "update booking status",
    call: () =>
      bookingService.updateBookingStatus("booking-1", {
        bookingStatus: "Confirmed",
      }),
    method: "put",
    url: "/bookings/booking-1",
    result: responseData,
    errors: "body",
  },
  {
    name: "cancel booking",
    call: () => bookingService.cancelBooking("booking-1"),
    method: "delete",
    url: "/bookings/booking-1",
    result: responseData,
    errors: "body",
  },
  {
    name: "get all bookings",
    call: () => bookingService.getAllBookings({ page: 2 }),
    method: "get",
    url: "/bookings",
    result: responseData,
    errors: "body",
  },

  {
    name: "get public packages",
    call: () => getAllPackages(),
    method: "get",
    url: "/packages",
    result: packageData,
    errors: "raw",
  },
  {
    name: "get public package",
    call: () => getPackageById("package-1"),
    method: "get",
    url: "/packages/package-1",
    result: packageData,
    errors: "raw",
  },
  {
    name: "search packages",
    call: () => searchPackages({ destination: "Toronto" }),
    method: "get",
    url: "/packages",
    result: packageData,
    errors: "raw",
  },
  {
    name: "book package",
    call: () => bookPackage("package-1", { guests: 2 }),
    method: "post",
    url: "/bookings/package-1",
    result: packageData,
  },

  {
    name: "get location suggestions",
    call: () => hotelService.getLocationSuggestions("New York"),
    method: "get",
    url: "/hotels/locations/suggestions?query=New%20York",
    result: responseData,
    errors: "body",
  },
  {
    name: "search hotels",
    call: () => hotelService.searchHotels("New York"),
    method: "get",
    url: "/hotels/hotels?city=New%20York",
    result: responseData,
    errors: "body",
  },
  {
    name: "get hotel rooms",
    call: () => hotelService.getHotelRooms("hotel-1"),
    method: "get",
    url: "/hotels/hotels/hotel-1/rooms",
    result: responseData,
    errors: "body",
  },
  {
    name: "book hotel room",
    call: () => hotelService.bookRoom("hotel-1", "room-1", { guests: 2 }),
    method: "post",
    url: "/hotels/hotels/hotel-1/rooms/room-1/book",
    result: responseData,
    errors: "body",
  },
  {
    name: "get bookings through hotel service",
    call: () => hotelService.getUserBookings(),
    method: "get",
    url: "/bookings",
    result: responseData,
    errors: "body",
  },
  {
    name: "get booking details",
    call: () => hotelService.getBookingDetails("booking-1"),
    method: "get",
    url: "/bookings/booking-1",
    result: responseData,
    errors: "body",
  },
  {
    name: "cancel booking through hotel service",
    call: () => hotelService.cancelBooking("booking-1"),
    method: "delete",
    url: "/bookings/booking-1",
    result: responseData,
    errors: "body",
  },
  {
    name: "get hotel reviews",
    call: () => hotelService.getHotelReviews("hotel-1"),
    method: "get",
    url: "/reviews/hotel/hotel-1",
    result: responseData,
    errors: "body",
  },
  {
    name: "get hotel details",
    call: () => hotelService.getHotelDetails("hotel-1"),
    method: "get",
    url: "/hotels/hotels/hotel-1",
    result: responseData,
    errors: "body",
  },
  {
    name: "add hotel review",
    call: () => hotelService.addReview("hotel-1", { rating: 5 }),
    method: "post",
    url: "/reviews/hotel/hotel-1",
    result: responseData,
    errors: "body",
  },
  {
    name: "update hotel review",
    call: () => hotelService.updateReview("review-1", { rating: 4 }),
    method: "put",
    url: "/reviews/review-1",
    result: responseData,
    errors: "body",
  },
  {
    name: "delete hotel review",
    call: () => hotelService.deleteReview("review-1"),
    method: "delete",
    url: "/reviews/review-1",
    result: responseData,
    errors: "body",
  },

  {
    name: "get payment methods",
    call: () => paymentService.getPaymentMethods("booking-1"),
    method: "get",
    url: "/payments/methods?bookingId=booking-1",
    result: responseData,
    errors: "body",
  },
  {
    name: "create payment order",
    call: () => paymentService.createPaymentOrder("booking-1", "upi"),
    method: "post",
    url: "/payments/create-order",
    result: responseData,
    errors: "body",
  },
  {
    name: "verify payment",
    call: () => paymentService.verifyPayment({ paymentId: "payment-1" }),
    method: "post",
    url: "/payments/verify",
    result: responseData,
    errors: "body",
  },

  {
    name: "get profile",
    call: () => userService.getProfile(),
    method: "get",
    url: "/users/",
    result: responseData,
    errors: "body",
  },
  {
    name: "update profile",
    call: () => userService.updateProfile({ fullName: "Guest" }),
    method: "put",
    url: "/users/",
    result: responseData,
    errors: "body",
  },
  {
    name: "upload verification",
    call: () => userService.uploadVerification(new FormData()),
    method: "post",
    url: "/users/upload-verification",
    result: responseData,
    errors: "body",
  },
  {
    name: "get family members",
    call: () => userService.getFamilyMembers(),
    method: "get",
    url: "/users/family",
    result: responseData,
    errors: "body",
  },
  {
    name: "add family member",
    call: () => userService.addFamilyMember({ fullName: "Guest" }),
    method: "post",
    url: "/users/family",
    result: responseData,
    errors: "body",
  },
  {
    name: "update family member",
    call: () =>
      userService.updateFamilyMember("member-1", { fullName: "Guest" }),
    method: "put",
    url: "/users/family/member-1",
    result: responseData,
    errors: "body",
  },
  {
    name: "upload family verification",
    call: () =>
      userService.uploadFamilyVerification("member-1", new FormData()),
    method: "post",
    url: "/users/family/member-1/verify",
    result: responseData,
    errors: "body",
  },
  {
    name: "change password",
    call: () =>
      userService.changePassword({ oldPassword: "old", newPassword: "new" }),
    method: "post",
    url: "/users/change-password",
    result: responseData,
    errors: "body",
  },
];

const errorCases = serviceCases.filter((serviceCase) => serviceCase.errors);

describe("frontend service layer", () => {
  const storage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", storage);
    for (const method of ["get", "post", "put", "delete"]) {
      api[method].mockResolvedValue(apiResponse);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(serviceCases)(
    "$name returns the expected response",
    async (serviceCase) => {
      await expect(serviceCase.call()).resolves.toEqual(serviceCase.result);
      expect(api[serviceCase.method]).toHaveBeenCalled();
      expect(api[serviceCase.method].mock.calls.at(-1)[0]).toBe(
        serviceCase.url,
      );
    },
  );

  it.each(errorCases)("$name forwards API errors", async (serviceCase) => {
    const requestError = { response: { data: { message: "Request failed" } } };
    api[serviceCase.method].mockRejectedValue(requestError);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const expectedError =
      serviceCase.errors === "body"
        ? requestError.response.data
        : serviceCase.errors === "wrapped"
          ? new Error("Request failed")
          : requestError;

    await expect(serviceCase.call()).rejects.toEqual(expectedError);
  });

  it("stores tokens after login and refresh when returned", async () => {
    await authService.login(userData);
    await authService.refreshToken();

    expect(storage.setItem).toHaveBeenCalledWith("accessToken", "token");
    expect(storage.setItem).toHaveBeenCalledTimes(2);
  });

  it("does not store an absent token", async () => {
    api.post.mockResolvedValue({ data: { data: {} } });

    await authService.login(userData);
    await authService.refreshToken();

    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("clears the access token when logout fails", async () => {
    api.post.mockRejectedValue(new Error("offline"));

    await expect(authService.logout()).rejects.toThrow("offline");
    expect(storage.removeItem).toHaveBeenCalledWith("accessToken");
  });

  it("serializes multipart data for hotel and package uploads", async () => {
    await adminHotelService.createHotel(hotelData);
    const hotelForm = api.post.mock.calls.at(-1)[1];
    expect(hotelForm.get("name")).toBe("North Hotel");
    expect(hotelForm.getAll("amenities")).toEqual(["pool"]);
    expect(hotelForm.getAll("images")).toEqual(["hotel.jpg"]);

    await adminHotelService.updateHotel("hotel-1", {
      newImages: ["replacement.jpg"],
    });
    expect(api.put.mock.calls.at(-1)[1].getAll("images")).toEqual([
      "replacement.jpg",
    ]);

    await adminHotelService.createRoom("hotel-1", roomData);
    const roomForm = api.post.mock.calls.at(-1)[1];
    expect(roomForm.get("type")).toBe("Suite");
    expect(roomForm.getAll("roomNumbers")).toEqual(["101"]);

    await createAdminPackage(packagePayload);
    const packageForm = api.post.mock.calls.at(-1)[1];
    expect(packageForm.get("duration")).toBe(
      JSON.stringify(packagePayload.duration),
    );
    expect(packageForm.getAll("images")).toEqual(["package.jpg"]);
  });

  it("skips optional multipart fields when they are absent", async () => {
    await adminHotelService.updateHotel("hotel-1", {});
    const formData = api.put.mock.calls.at(-1)[1];
    expect([...formData.keys()]).toEqual([]);

    await adminHotelService.createRoom("hotel-1", {
      ...roomData,
      images: undefined,
    });
    expect(api.post.mock.calls.at(-1)[1].getAll("images")).toEqual([]);
  });

  it("creates a Razorpay script when the SDK is not present", async () => {
    const script = {};
    const appendChild = vi.fn((element) => element.onload());
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      createElement: vi.fn(() => script),
      body: { appendChild },
    });

    await expect(paymentService.loadRazorpayScript()).resolves.toBeUndefined();
    expect(script.src).toBe("https://checkout.razorpay.com/v1/checkout.js");
    expect(appendChild).toHaveBeenCalledWith(script);
  });

  it("resolves immediately when Razorpay is already available", async () => {
    vi.stubGlobal("window", { Razorpay: function Razorpay() {} });
    const appendChild = vi.fn();
    vi.stubGlobal("document", { body: { appendChild } });

    await expect(paymentService.loadRazorpayScript()).resolves.toBeUndefined();
    expect(appendChild).not.toHaveBeenCalled();
  });
});
