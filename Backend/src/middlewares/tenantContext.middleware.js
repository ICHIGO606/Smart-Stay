import { Organization } from "../models/organization.models.js";

/**
 * Resolves tenant context from request headers, route params, query, or subdomains.
 * Attaches `req.tenant` to the Express request object if an active organization is found.
 */
export const resolveTenantContext = async (req, res, next) => {
  try {
    const headerSlug = req.headers["x-tenant-slug"] || req.headers["x-tenant-id"];
    const paramSlug = req.params.tenantSlug || req.params.slug;
    const querySlug = req.query.tenant;

    // Subdomain resolution: e.g. "zostel.smartstay.com" or "zostel.localhost:3000"
    let subdomainSlug = null;
    const hostname = req.hostname || "";
    const parts = hostname.split(".");
    if (parts.length > 2 && parts[0] !== "www" && parts[0] !== "api") {
      subdomainSlug = parts[0];
    } else if (parts.length === 2 && parts[1] === "localhost" && parts[0] !== "www") {
      subdomainSlug = parts[0];
    }

    const candidate = headerSlug || paramSlug || querySlug || subdomainSlug;

    if (candidate) {
      const cleanCandidate = String(candidate).trim().toLowerCase();
      const org = await Organization.findOne({
        $or: [
          { slug: cleanCandidate },
          { subdomain: cleanCandidate },
        ],
        status: "active",
      }).lean();

      if (org) {
        req.tenant = org;
      }
    }

    next();
  } catch (error) {
    // Non-blocking tenant resolution fallback
    console.error("Tenant resolution error:", error);
    next();
  }
};

