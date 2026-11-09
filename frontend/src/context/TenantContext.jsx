import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "react-router";
import organizationService from "../services/organizationService";

const TenantContext = createContext(null);

export const TenantProvider = ({ children, initialSlug = null }) => {
  const params = useParams();
  const location = useLocation();

  // Resolution hierarchy:
  // 1. Explicit initialSlug prop
  // 2. React Router param: :slug from /portal/:slug
  // 3. URL query param: ?tenant=<slug>
  // 4. Subdomain: <slug>.smartstay.com or <slug>.localhost
  const resolveCurrentSlug = useCallback(() => {
    if (initialSlug) return initialSlug;
    if (params.slug) return params.slug;

    // Check query param
    const searchParams = new URLSearchParams(location.search);
    const querySlug = searchParams.get("tenant");
    if (querySlug) return querySlug;

    // Check path /portal/<slug>
    const match = location.pathname.match(/^\/portal\/([^/]+)/);
    if (match && match[1]) return match[1];

    // Check hostname
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname || "";
      const parts = hostname.split(".");
      if (parts.length > 2 && parts[0] !== "www" && parts[0] !== "api") {
        return parts[0];
      }
      if (parts.length === 2 && parts[1] === "localhost" && parts[0] !== "www") {
        return parts[0];
      }
    }

    return null;
  }, [initialSlug, params.slug, location.search, location.pathname]);

  const [activeSlug, setActiveSlug] = useState(resolveCurrentSlug());
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(Boolean(activeSlug));
  const [error, setError] = useState(null);

  const fetchTenant = useCallback(async (slug) => {
    if (!slug) {
      setTenant(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await organizationService.getOrganizationBySlug(slug);
      const orgData = response.data || response;
      setTenant(orgData);

      // Dynamically inject CSS Custom Properties for tenant's brand styling
      if (orgData.branding && typeof document !== "undefined") {
        const root = document.documentElement;
        if (orgData.branding.primaryColor) {
          root.style.setProperty("--tenant-primary", orgData.branding.primaryColor);
        }
        if (orgData.branding.accentColor) {
          root.style.setProperty("--tenant-accent", orgData.branding.accentColor);
        }
        if (orgData.branding.backgroundColor) {
          root.style.setProperty("--tenant-bg", orgData.branding.backgroundColor);
        }
        if (orgData.branding.textColor) {
          root.style.setProperty("--tenant-text", orgData.branding.textColor);
        }
      }
    } catch (err) {
      console.error("Failed to resolve tenant:", err);
      setError(err.message || "Failed to load brand website");
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const detected = resolveCurrentSlug();
    if (detected !== activeSlug) {
      setActiveSlug(detected);
    }
  }, [resolveCurrentSlug, activeSlug]);

  useEffect(() => {
    fetchTenant(activeSlug);

    // Cleanup injected styles on unmount or navigation away
    return () => {
      if (typeof document !== "undefined") {
        const root = document.documentElement;
        root.style.removeProperty("--tenant-primary");
        root.style.removeProperty("--tenant-accent");
        root.style.removeProperty("--tenant-bg");
        root.style.removeProperty("--tenant-text");
      }
    };
  }, [activeSlug, fetchTenant]);

  const isTenantSite = Boolean(tenant && activeSlug);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        isTenantSite,
        loading,
        error,
        activeSlug,
        refreshTenant: () => fetchTenant(activeSlug),
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    return {
      tenant: null,
      isTenantSite: false,
      loading: false,
      error: null,
      activeSlug: null,
      refreshTenant: () => {},
    };
  }
  return context;
};

export default TenantContext;

