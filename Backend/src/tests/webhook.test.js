import { createHmac } from "crypto";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

const mockFindOne = jest.fn();

await jest.unstable_mockModule("../models/booking.models.js", () => ({
  Booking: { findOne: mockFindOne },
}));

const { handlePaymentWebhook } =
  await import("../controllers/webhook.controllers.js");

const makeBooking = () => ({
  _id: "booking-1",
  paymentStatus: "Pending",
  bookingStatus: "Pending",
  paymentDetails: { refunds: [] },
  save: jest.fn().mockResolvedValue(undefined),
});

const makeResponse = () => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return response;
};

const makeRequest = (body, signature = signBody(body)) => ({
  body,
  headers: { "x-razorpay-signature": signature },
});

const signBody = (body) =>
  createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest("hex");

const paymentEvent = (event, entity) => ({
  event,
  payload: { payment: { entity } },
});

describe("payment webhook", () => {
  let booking;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-test-secret";
    booking = makeBooking();
    mockFindOne.mockResolvedValue(booking);
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("requires a signature and configured secret", async () => {
    const missingSignatureResponse = makeResponse();
    await handlePaymentWebhook(
      { body: {}, headers: {} },
      missingSignatureResponse,
    );
    expect(missingSignatureResponse.status).toHaveBeenCalledWith(400);

    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    const missingSecretResponse = makeResponse();
    await handlePaymentWebhook(
      makeRequest({ event: "ignored" }, "test-signature"),
      missingSecretResponse,
    );
    expect(missingSecretResponse.status).toHaveBeenCalledWith(400);
  });

  it("rejects invalid signatures", async () => {
    const body = { event: "ignored" };
    const response = makeResponse();

    await handlePaymentWebhook(makeRequest(body, "invalid"), response);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid webhook signature",
    });
  });

  it("acknowledges unhandled events with a valid signature", async () => {
    const body = { event: "subscription.activated" };
    const response = makeResponse();

    await handlePaymentWebhook(makeRequest(body), response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      message: "Webhook processed",
    });
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it("marks captured payments complete and confirms the booking", async () => {
    const body = paymentEvent("payment.captured", {
      order_id: "order-1",
      id: "payment-1",
      method: "card",
    });
    const response = makeResponse();

    await handlePaymentWebhook(makeRequest(body), response);

    expect(mockFindOne).toHaveBeenCalledWith({
      "paymentDetails.razorpayOrderId": "order-1",
    });
    expect(booking.paymentStatus).toBe("Completed");
    expect(booking.bookingStatus).toBe("Confirmed");
    expect(booking.paymentDetails.razorpayPaymentId).toBe("payment-1");
    expect(booking.save).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("marks failed payments on the booking", async () => {
    const body = paymentEvent("payment.failed", {
      order_id: "order-2",
      id: "payment-2",
      method: "upi",
      error_description: "declined",
    });

    await handlePaymentWebhook(makeRequest(body), makeResponse());

    expect(booking.paymentStatus).toBe("Failed");
    expect(booking.paymentDetails.errorDescription).toBe("declined");
    expect(booking.save).toHaveBeenCalled();
  });

  it("records processed refunds", async () => {
    const body = {
      event: "refund.processed",
      payload: {
        refund: {
          entity: {
            payment_id: "payment-3",
            id: "refund-1",
            amount: 2500,
            currency: "INR",
            status: "processed",
          },
        },
      },
    };

    await handlePaymentWebhook(makeRequest(body), makeResponse());

    expect(mockFindOne).toHaveBeenCalledWith({
      "paymentDetails.razorpayPaymentId": "payment-3",
    });
    expect(booking.paymentStatus).toBe("Refunded");
    expect(booking.paymentDetails.refunds[0]).toMatchObject({
      refundId: "refund-1",
      amount: 25,
      currency: "INR",
      status: "processed",
    });
    expect(booking.save).toHaveBeenCalled();
  });

  it("handles missing bookings and lookup failures without rejecting the webhook", async () => {
    mockFindOne.mockResolvedValue(null);
    await handlePaymentWebhook(
      makeRequest(paymentEvent("payment.captured", { order_id: "missing" })),
      makeResponse(),
    );

    mockFindOne.mockRejectedValue(new Error("database unavailable"));
    const response = makeResponse();
    await handlePaymentWebhook(
      makeRequest(paymentEvent("payment.failed", { order_id: "error" })),
      response,
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(console.error).toHaveBeenCalled();
  });

  it("returns a server error for malformed event payloads", async () => {
    const response = makeResponse();

    await handlePaymentWebhook(
      makeRequest({ event: "payment.captured" }),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error",
    });
  });
});
