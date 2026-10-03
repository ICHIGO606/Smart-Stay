import { randomBytes, timingSafeEqual } from "node:crypto";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const stateCookieName = "googleOAuthState";
const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:3000";
const redirectUri = () =>
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:8000/api/v1/auth/google/callback";

const stateCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/api/v1/auth/google",
});

const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

const googleCredentials = () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

const googleLogin = asyncHandler(async (_req, res) => {
  const { clientId } = googleCredentials();
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(
      `${frontendUrl()}/login?googleError=google_oauth_not_configured`
    );
  }

  const state = randomBytes(32).toString("hex");
  res.cookie(stateCookieName, state, stateCookieOptions());

  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  return res.redirect(authorizationUrl.toString());
});

const googleLoginCallback = asyncHandler(async (req, res) => {
  const fail = (reason) => {
    res.clearCookie(stateCookieName, stateCookieOptions());
    return res.redirect(
      `${frontendUrl()}/login?googleError=${encodeURIComponent(reason)}`
    );
  };

  if (req.query.error || !req.query.code || !req.query.state) {
    return fail("google_auth_failed");
  }

  const expectedState = req.cookies?.[stateCookieName];
  const providedState = String(req.query.state);
  const expectedBuffer = Buffer.from(expectedState || "");
  const providedBuffer = Buffer.from(providedState);
  if (
    expectedBuffer.length === 0 ||
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return fail("google_auth_failed");
  }

  res.clearCookie(stateCookieName, stateCookieOptions());

  try {
    const { clientId, clientSecret } = googleCredentials();
    if (!clientId || !clientSecret) {
      return fail("google_oauth_not_configured");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(req.query.code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri(),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Google token exchange failed (${tokenResponse.status})`);
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error("Google token response did not contain an access token");
    }

    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    if (!profileResponse.ok) {
      throw new Error(`Google profile request failed (${profileResponse.status})`);
    }

    const profile = await profileResponse.json();
    const email = profile.email?.trim().toLowerCase();
    if (!email || profile.verified_email !== true || !profile.name?.trim()) {
      return fail("google_email_not_verified");
    }

    let user = await User.findOne({ email });
    if (!user) {
      const usernameBase = email.split("@")[0].replace(/[^a-z0-9_-]/g, "") || "google";
      user = await User.create({
        fullName: profile.name.trim(),
        age: 18,
        gender: "other",
        username: `${usernameBase}-${randomBytes(4).toString("hex")}`,
        email,
        password: randomBytes(32).toString("hex"),
      });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return res
      .cookie("accessToken", accessToken, authCookieOptions())
      .cookie("refreshToken", refreshToken, authCookieOptions())
      .redirect(`${frontendUrl()}/login?google=success`);
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return fail("google_auth_failed");
  }
});

export { googleLogin, googleLoginCallback };
