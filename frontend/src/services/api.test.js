import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const callbacks = {
    request: {},
    response: {},
  };
  const client = vi.fn();
  client.interceptors = {
    request: {
      use: vi.fn((fulfilled, rejected) => {
        callbacks.request = { fulfilled, rejected };
      }),
    },
    response: {
      use: vi.fn((fulfilled, rejected) => {
        callbacks.response = { fulfilled, rejected };
      }),
    },
  };

  return {
    callbacks,
    client,
    create: vi.fn(() => client),
    get: vi.fn(),
    post: vi.fn(),
  };
});

vi.mock("axios", () => ({
  default: {
    create: mocks.create,
    get: mocks.get,
    post: mocks.post,
  },
}));

import api from "./api";
const apiConfiguration = mocks.create.mock.calls[0]?.[0];

describe("API client interceptors", () => {
  const storage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
  const location = { href: "" };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue({ data: { csrfToken: "csrf-token" } });
    storage.getItem.mockReturnValue("access-token");
    location.href = "";
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("window", { location });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates the API client with the configured base URL and credentials", () => {
    expect(apiConfiguration).toEqual({
      baseURL: "http://localhost:8000/api/v1",
      withCredentials: true,
    });
    expect(api).toBe(mocks.client);
  });

  it("adds a bearer token to requests when one exists", async () => {
    const config = { headers: {} };

    await expect(mocks.callbacks.request.fulfilled(config)).resolves.toBe(config);
    expect(config.headers.Authorization).toBe("Bearer access-token");
  });

  it("leaves the authorization header unset when there is no token", async () => {
    storage.getItem.mockReturnValue(null);
    const config = { headers: {} };

    await mocks.callbacks.request.fulfilled(config);

    expect(config.headers.Authorization).toBeUndefined();
  });

  it("adds a CSRF token to state-changing requests", async () => {
    const config = { method: "post", headers: {} };

    await expect(mocks.callbacks.request.fulfilled(config)).resolves.toBe(config);

    expect(config.headers["x-csrf-token"]).toBe("csrf-token");
    expect(mocks.get).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/csrf-token",
      { withCredentials: true },
    );
  });

  it("rejects request interceptor errors", async () => {
    const error = new Error("request failed");

    await expect(mocks.callbacks.request.rejected(error)).rejects.toBe(error);
  });

  it("returns successful responses unchanged", () => {
    const response = { data: "ok" };

    expect(mocks.callbacks.response.fulfilled(response)).toBe(response);
  });

  it("rejects non-401 response errors unchanged", async () => {
    const error = { config: { headers: {} }, response: { status: 500 } };

    await expect(mocks.callbacks.response.rejected(error)).rejects.toBe(error);
  });

  it("fetches a fresh CSRF token and retries a rejected state-changing request", async () => {
    const request = { headers: { "x-csrf-token": "expired-token" } };
    const retryResponse = { data: "retried" };
    mocks.client.mockResolvedValue(retryResponse);

    await expect(
      mocks.callbacks.response.rejected({
        config: request,
        response: { status: 403, data: "ForbiddenError: invalid csrf token" },
      }),
    ).resolves.toBe(retryResponse);

    expect(request._csrfRetry).toBe(true);
    expect(request.headers["x-csrf-token"]).toBe("csrf-token");
    expect(mocks.get).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/csrf-token",
      { withCredentials: true },
    );
    expect(mocks.client).toHaveBeenCalledWith(request);
  });

  it("refreshes a token and retries an unauthorized request once", async () => {
    const request = { headers: {} };
    const retryResponse = { data: "retried" };
    mocks.post.mockResolvedValue({
      data: { data: { accessToken: "new-token" } },
    });
    mocks.client.mockResolvedValue(retryResponse);

    await expect(
      mocks.callbacks.response.rejected({
        config: request,
        response: { status: 401 },
      }),
    ).resolves.toBe(retryResponse);

    expect(request._retry).toBe(true);
    expect(request.headers.Authorization).toBe("Bearer new-token");
    expect(storage.setItem).toHaveBeenCalledWith("accessToken", "new-token");
    expect(mocks.client).toHaveBeenCalledWith(request);
  });

  it("clears credentials and redirects when token refresh fails", async () => {
    const refreshError = new Error("refresh failed");
    mocks.post.mockRejectedValue(refreshError);

    await expect(
      mocks.callbacks.response.rejected({
        config: { headers: {} },
        response: { status: 401 },
      }),
    ).rejects.toBe(refreshError);

    expect(storage.removeItem).toHaveBeenCalledWith("accessToken");
    expect(location.href).toBe("/login");
  });

  it("does not retry an unauthorized request more than once", async () => {
    const error = {
      config: { headers: {}, _retry: true },
      response: { status: 401 },
    };

    await expect(mocks.callbacks.response.rejected(error)).rejects.toBe(error);
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
