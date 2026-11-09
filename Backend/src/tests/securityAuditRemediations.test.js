import { describe, expect, test } from "@jest/globals";
import path from "path";
import { generateVoucherHtml, generateVoucherData } from "../utils/voucherGenerator.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { googleLogin } from "../controllers/googleAuth.controllers.js";

describe("Security Audit Remediations", () => {
  describe("smartstay-sec-004: XSS sanitization in voucher generator", () => {
    test("escapes HTML in guest details to prevent stored XSS", () => {
      const maliciousBooking = {
        _id: "64a000000000000000000001",
        user: {
          _id: "64a000000000000000000002",
          fullName: "<script>alert('xss')</script>",
          email: "guest@example.com",
          phone: "+91-9999999999",
        },
        hotelId: {
          _id: "64a000000000000000000003",
          name: "Luxury <img src=x onerror=alert(1)> Resort",
          city: "Metropolis",
          address: "123 'or' 1=1 Avenue",
        },
        roomId: {
          type: "Deluxe <b onmouseover=alert(1)>Suite</b>",
          pricePerNight: 5000,
        },
        checkInDate: new Date("2026-12-01"),
        checkOutDate: new Date("2026-12-05"),
        numberOfAdults: 2,
        numberOfChildren: 0,
        totalAmount: 20000,
        roomNumbers: [101],
      };

      const voucherData = generateVoucherData(maliciousBooking);
      const html = generateVoucherHtml(voucherData);

      expect(html).not.toContain("<script>alert('xss')</script>");
      expect(html).toContain("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
      expect(html).not.toContain("<img src=x onerror=alert(1)>");
      expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
      expect(html).not.toContain("<b onmouseover=alert(1)>Suite</b>");
    });
  });

  describe("smartstay-sec-005: Multer temporary storage directory", () => {
    test("uses storage/temp and not public/temp to prevent direct exposure", () => {
      const expectedStorageDir = path.resolve("storage/temp");
      let destinationDir = null;
      upload.storage.getDestination({}, {}, (err, dest) => {
        destinationDir = dest;
      });

      expect(destinationDir).toBe(expectedStorageDir);
      expect(destinationDir).not.toContain("public/temp");
    });

    test("generates unique UUID-based filenames", () => {
      let generatedFilename = null;
      upload.storage.getFilename(
        {},
        { originalname: "user-id-doc.jpg" },
        (err, filename) => {
          generatedFilename = filename;
        },
      );

      expect(generatedFilename).not.toBe("user-id-doc.jpg");
      expect(generatedFilename).toMatch(/^[0-9]+-[0-9a-f-]+\.jpg$/i);
    });
  });

  describe("smartstay-sec-007: Reject access tokens in URL query strings", () => {
    test("rejects request if token is only present in req.query", async () => {
      const req = {
        cookies: {},
        header: () => null,
        query: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy" },
      };
      const res = {};
      let nextError = null;

      await new Promise((resolve) => {
        verifyJWT(req, res, (err) => {
          nextError = err;
          resolve();
        });
      });

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(401);
      expect(nextError.message).toMatch(/Unauthorized request/i);
    });
  });

  describe("smartstay-sec-008: Voucher deterministic code and indexing attributes", () => {
    test("generateVoucherData returns checkInCode and verificationToken", () => {
      const booking = {
        _id: "64a000000000000000000001",
        user: { _id: "64a000000000000000000002" },
        checkInDate: new Date("2026-12-01"),
        checkOutDate: new Date("2026-12-05"),
      };

      const voucher = generateVoucherData(booking);
      expect(voucher.checkInCode).toBe("STAY-000001");
      expect(voucher.verificationToken).toHaveLength(16);
    });
  });

  describe("CodeQL alert 119 & 120: Google OAuth state cookie security flags", () => {
    test("sets state cookie with httpOnly: true, secure: true, and restricted path", async () => {
      process.env.GOOGLE_CLIENT_ID = "test-client-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";

      let cookieCall = null;
      let redirectUrl = null;

      const req = {};
      const res = {
        cookie: (name, value, options) => {
          cookieCall = { name, value, options };
          return res;
        },
        redirect: (url) => {
          redirectUrl = url;
          return res;
        },
      };

      await new Promise((resolve) => {
        googleLogin(req, res, () => resolve());
        if (redirectUrl) resolve();
      });

      expect(cookieCall).toBeDefined();
      expect(cookieCall.name).toBe("googleOAuthState");
      expect(cookieCall.options.httpOnly).toBe(true);
      expect(cookieCall.options.secure).toBe(true);
      expect(cookieCall.options.path).toBe("/api/v1/auth/google");
      expect(redirectUrl).toContain("accounts.google.com");
    });
  });
});
