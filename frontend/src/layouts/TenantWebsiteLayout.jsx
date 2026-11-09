import { Link, Outlet } from "react-router";
import { useTenant } from "../context/TenantContext";
import {
  Compass,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const TenantWebsiteLayout = () => {
  const { tenant, loading, error, activeSlug } = useTenant();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-stone-500">
          Loading Brand Experience...
        </p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-600">
            <Compass size={24} />
          </div>
          <h2 className="font-serif text-2xl text-stone-900">Brand Site Not Found</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            The hosted organization website for <span className="font-mono text-stone-900 font-semibold">{activeSlug || "this brand"}</span> could not be resolved or is currently offline.
          </p>
          <div className="pt-2">
            <Link
              to="/orgs"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-stone-800 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Explore Partner Brands</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryColor = tenant.branding?.primaryColor || "#14171F";
  const accentColor = tenant.branding?.accentColor || "#8B6B4C";
  const fontFamily = tenant.branding?.fontFamily === "sans" ? "font-sans" : "font-serif";

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      {/* 1. Global SaaS Engine Pill / Marketplace Bar */}
      <div className="bg-stone-900 text-stone-300 text-[11px] font-mono py-1.5 px-4 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide">
              Verified Brand Website · Hosted by <strong className="text-white">SmartStay SaaS Engine</strong>
            </span>
          </div>
          <Link
            to="/orgs"
            className="text-stone-300 hover:text-white inline-flex items-center gap-1 transition-colors hover:underline"
          >
            <span>All Partner Brands</span>
            <ExternalLink size={11} />
          </Link>
        </div>
      </div>

      {/* 2. Tenant Branded Header & Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo & Name */}
            <Link
              to={`/portal/${tenant.slug}`}
              className="flex items-center gap-3.5 group transition-transform active:scale-98"
            >
              {tenant.branding?.logo ? (
                <img
                  src={tenant.branding.logo}
                  alt={tenant.name}
                  className="h-10 w-auto object-contain max-w-[160px]"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs transition-transform group-hover:scale-105"
                  style={{ backgroundColor: primaryColor }}
                >
                  {tenant.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className={`${fontFamily} text-xl tracking-tight text-stone-900 font-semibold leading-tight`}>
                  {tenant.name}
                </span>
                {tenant.tagline && (
                  <span className="text-[11px] font-mono text-stone-500 uppercase tracking-widest line-clamp-1">
                    {tenant.tagline}
                  </span>
                )}
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-stone-600">
              <Link
                to={`/portal/${tenant.slug}`}
                className="hover:text-stone-900 transition-colors py-1 border-b-2 border-transparent hover:border-stone-900"
              >
                Our Stays
              </Link>
              <a
                href="#about"
                className="hover:text-stone-900 transition-colors py-1 border-b-2 border-transparent hover:border-stone-900"
              >
                Philosophy
              </a>
              <a
                href="#contact"
                className="hover:text-stone-900 transition-colors py-1 border-b-2 border-transparent hover:border-stone-900"
              >
                Concierge
              </a>
            </nav>

            {/* Direct Action Button */}
            <div className="flex items-center gap-3">
              <a
                href="#stays"
                className="px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider text-white shadow-xs transition-all hover:opacity-95 active:scale-95 flex items-center gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                <Sparkles size={13} style={{ color: accentColor }} />
                <span>Reserve Stay</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 4. Branded Footer */}
      <footer id="contact" className="bg-stone-900 text-stone-400 text-xs border-t border-stone-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-4">
              <h3 className={`${fontFamily} text-2xl text-white font-normal`}>
                {tenant.name}
              </h3>
              <p className="text-stone-400 text-xs max-w-md leading-relaxed">
                {tenant.description || "Distinctive stays and architectural hospitality curated with sovereign care and authentic spirit."}
              </p>
              <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-stone-500">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Verified Independent Brand Partner</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-widest text-white">Concierge & Inquiries</h4>
              <ul className="space-y-2 text-stone-400 text-xs font-mono">
                {tenant.contact?.email && (
                  <li className="flex items-center gap-2">
                    <Mail size={13} className="text-stone-500" />
                    <span>{tenant.contact.email}</span>
                  </li>
                )}
                {tenant.contact?.phone && (
                  <li className="flex items-center gap-2">
                    <Phone size={13} className="text-stone-500" />
                    <span>{tenant.contact.phone}</span>
                  </li>
                )}
                {tenant.contact?.address && (
                  <li className="flex items-start gap-2">
                    <MapPin size={13} className="text-stone-500 mt-0.5" />
                    <span className="line-clamp-2">{tenant.contact.address}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-widest text-white">Platform Credentials</h4>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Hosted via SmartStay Multi-Tenant Cloud. All reservations protected by automated inventory concurrency locks and instant guest passes.
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="text-xs font-mono text-stone-300 hover:text-white inline-flex items-center gap-1 transition-colors"
                >
                  <span>Powered by SmartStay SaaS</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-10 mt-10 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-stone-500">
            <p>© {new Date().getFullYear()} {tenant.name}. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Sovereign Direct Booking Gateway · YouPI Enabled</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TenantWebsiteLayout;
