import { describe, expect, it, jest } from "@jest/globals";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { escapeRegex } from "../utils/helpers.js";

describe("API response utilities", () => {
  it("creates a successful response with the default message", () => {
    const response = new ApiResponse(200, { id: "item-1" });

    expect(response).toMatchObject({
      statusCode: 200,
      data: { id: "item-1" },
      message: "Success",
      success: true,
    });
  });

  it("marks error responses as unsuccessful", () => {
    expect(new ApiResponse(400, null, "Invalid input").success).toBe(false);
  });

  it("creates API errors with defaults and custom stack traces", () => {
    const defaultError = new ApiError(500);
    const customError = new ApiError(
      400,
      "Bad request",
      ["field"],
      "custom stack",
    );

    expect(defaultError).toMatchObject({
      statusCode: 500,
      message: "Something went Wrong",
      data: null,
      success: false,
      errors: [],
    });
    expect(customError.message).toBe("Bad request");
    expect(customError.errors).toEqual(["field"]);
    expect(customError.stack).toBe("custom stack");
  });
});

describe("request helpers", () => {
  it("escapes regex metacharacters for literal matching", () => {
    const escaped = escapeRegex("Hotel (North) + Spa.");

    expect(new RegExp(escaped).test("Hotel (North) + Spa.")).toBe(true);
    expect(new RegExp(escaped).test("Hotel North Spa")).toBe(false);
  });

  it("passes request arguments to wrapped handlers", () => {
    const handler = jest.fn();
    const req = { body: { value: 1 } };
    const res = {};
    const next = jest.fn();

    asyncHandler(handler)(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
  });

  it("forwards asynchronous handler errors to next", async () => {
    const error = new Error("handler failed");
    const wrapped = asyncHandler(async () => {
      throw error;
    });
    const forwardedError = new Promise((resolve) => {
      wrapped({}, {}, resolve);
    });

    await expect(forwardedError).resolves.toBe(error);
  });
});
