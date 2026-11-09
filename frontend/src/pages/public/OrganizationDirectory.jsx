import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import organizationService from "../../services/organizationService";
import {
  Building2,
  Globe,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Search,
  MapPin,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

const OrganizationDirectory = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setLoading(true);
        const res = await organizationService.getAllOrganizations();
        setOrganizations(res.data || res || []);
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError("Failed to load partner brands directory");
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const filteredOrgs = useMemo(() => {
    if (!searchQuery) return organizations;
    const q = searchQuery.toLowerCase();
    return organizations.filter(
      (org) =>
        org.name?.toLowerCase().includes(q) ||
        org.tagline?.toLowerCase().includes(q) ||
        org.cities?.some((city) => city.toLowerCase().includes(q)),
    );
  }, [organizations, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Directory Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-mono text-stone-700 uppercase tracking-wider">
            <Sparkles size={12} className="text-amber-600" />
            <span>SaaS Hospitality Network</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
            Partner Hotel Brands & Collections
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl font-light">
            Discover independent boutique chains, palace collections, and luxury groups powered by the SmartStay multi-tenant SaaS platform.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[280px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search brands or cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none bg-white"
            />
          </div>
          <Link
            to="/onboard"
            className="px-4 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-stone-800 transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <span>Onboard Brand</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500">
            Loading Partner Directory...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-red-700 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-4">
          <Building2 size={36} className="mx-auto text-stone-400" />
          <h3 className="font-serif text-xl text-stone-900">No partner brands found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            No brands matched your search. Be the first to onboard your brand onto the SmartStay SaaS platform.
          </p>
          <Link
            to="/onboard"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-mono uppercase tracking-wider"
          >
            <span>Launch Your Brand Website</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredOrgs.map((org) => {
            const primaryColor = org.branding?.primaryColor || "#14171F";
            const coverBanner =
              org.branding?.heroBanner ||
              "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80";

            return (
              <div
                key={org._id}
                className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Brand Hero Cover */}
                  <div className="relative aspect-16/9 bg-stone-100 overflow-hidden">
                    <img
                      src={coverBanner}
                      alt={org.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />

                    {/* Logo Pill */}
                    <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
                      {org.branding?.logo ? (
                        <img
                          src={org.branding.logo}
                          alt={org.name}
                          className="h-9 w-auto max-w-[120px] object-contain bg-white/90 backdrop-blur-md p-1 rounded-lg shadow-sm"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {org.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="text-white">
                        <span className="font-serif text-lg font-semibold block leading-tight">
                          {org.name}
                        </span>
                        <span className="text-[10px] font-mono text-stone-300 uppercase tracking-widest block">
                          {org.slug}.smartstay.com
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {org.tagline || org.description || "Distinctive boutique accommodations curated with sovereign care."}
                    </p>

                    {/* Property counts & cities */}
                    <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-stone-100">
                      <span className="text-stone-500">
                        {org.hotelCount} {org.hotelCount === 1 ? "Property" : "Properties"}
                      </span>
                      {org.cities && org.cities.length > 0 && (
                        <span className="text-stone-700 flex items-center gap-1">
                          <MapPin size={11} className="text-stone-400" />
                          <span>{org.cities.slice(0, 2).join(", ")}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action Links */}
                <div className="p-6 pt-0 border-t border-stone-100 flex items-center justify-between gap-3">
                  <Link
                    to={`/portal/${org.slug}`}
                    className="flex-1 py-2 px-3 rounded-xl text-center text-xs font-mono uppercase tracking-wider text-white shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>Visit Hosted Site</span>
                    <ExternalLink size={12} />
                  </Link>

                  <Link
                    to={`/hotels?organizationId=${org._id}`}
                    className="py-2 px-3 rounded-xl border border-stone-200 text-xs font-mono uppercase tracking-wider text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    Stays
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onboard CTA Banner */}
      <section className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-mono uppercase tracking-wider text-stone-300">
            <Sparkles size={12} className="text-amber-400" />
            <span>Launch Your Sovereign Hotel Website</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal leading-tight">
            Empower Your Brand with Dedicated Cloud Booking
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
            No technical overhead. Our automated onboarding generates your dedicated brand website in seconds, with custom colors, sovereign YouPI settlements, and listing on the SmartStay global marketplace.
          </p>
          <div className="pt-2">
            <Link
              to="/onboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-900 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold hover:bg-stone-100 shadow-md transition-all active:scale-95"
            >
              <span>Start Automated Onboarding</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OrganizationDirectory;

