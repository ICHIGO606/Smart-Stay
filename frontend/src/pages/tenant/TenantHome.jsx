import { useState, useMemo } from "react";
import { Link } from "react-router";
import { useTenant } from "../../context/TenantContext";
import { formatCurrency } from "../../utils/formatters";
import {
  MapPin,
  Star,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  BedDouble,
  ArrowRight,
  Coffee,
  Waves,
  Wifi,
} from "lucide-react";

const TenantHome = () => {
  const { tenant } = useTenant();
  const [cityFilter, setCityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const hotels = useMemo(() => tenant?.hotels || [], [tenant?.hotels]);
  const primaryColor = tenant?.branding?.primaryColor || "#14171F";
  const accentColor = tenant?.branding?.accentColor || "#8B6B4C";
  const fontFamily = tenant?.branding?.fontFamily === "sans" ? "font-sans" : "font-serif";

  // Distinct cities in this tenant's portfolio
  const availableCities = useMemo(() => {
    const list = hotels.map((h) => h.city).filter(Boolean);
    return ["all", ...new Set(list)];
  }, [hotels]);

  // Filtered properties
  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      const matchesCity = cityFilter === "all" || hotel.city?.toLowerCase() === cityFilter.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        hotel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCity && matchesSearch;
    });
  }, [hotels, cityFilter, searchQuery]);

  return (
    <div className="space-y-16">
      {/* 1. Brand Hero Section */}
      <section className="relative min-h-[580px] flex items-center justify-center text-white overflow-hidden">
        {/* Background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage: `url('${tenant?.branding?.heroBanner || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=80"}')`,
          }}
        />
        {/* Editorial overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/60 to-stone-950/40" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono tracking-widest uppercase">
            <Sparkles size={13} style={{ color: accentColor }} />
            <span>The Official Hosted Website of {tenant?.name}</span>
          </div>

          <h1 className={`${fontFamily} text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white leading-tight`}>
            {tenant?.branding?.bannerHeadline || `Welcome to ${tenant?.name}`}
          </h1>

          <p className="text-sm sm:text-base text-stone-200 max-w-2xl mx-auto font-light leading-relaxed">
            {tenant?.branding?.bannerSubheadline ||
              "Discover extraordinary stays and authentic hospitality, crafted with architectural elegance and sovereign care."}
          </p>

          {/* Quick Search Card */}
          <div className="pt-6 max-w-3xl mx-auto">
            <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-2xl text-stone-900 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
              <div className="flex items-center gap-2.5 px-3 py-2 bg-stone-50 rounded-xl border border-stone-200">
                <Search size={16} className="text-stone-400" />
                <input
                  type="text"
                  placeholder="Property name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium focus:outline-none placeholder:text-stone-400"
                />
              </div>

              <div className="flex items-center gap-2.5 px-3 py-2 bg-stone-50 rounded-xl border border-stone-200">
                <MapPin size={16} className="text-stone-400" />
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium focus:outline-none capitalize"
                >
                  <option value="all">All Locations</option>
                  {availableCities.filter((c) => c !== "all").map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <a
                href="#stays"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95"
                style={{ backgroundColor: primaryColor }}
              >
                <span>View Availability</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Properties Portfolio Showcase */}
      <section id="stays" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
              The Residences
            </span>
            <h2 className={`${fontFamily} text-3xl sm:text-4xl text-stone-900 font-normal`}>
              Our Curated Portfolio
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-stone-500">Filter location:</span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {availableCities.map((city) => (
                <button
                  key={city}
                  onClick={() => setCityFilter(city)}
                  className={`px-3 py-1 rounded-full capitalize transition-colors ${
                    cityFilter === city
                      ? "bg-stone-900 text-white font-medium"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredHotels.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
            <BedDouble size={32} className="mx-auto text-stone-400" />
            <h3 className="font-serif text-xl text-stone-800">No properties matching current criteria</h3>
            <p className="text-xs text-stone-500">Try selecting another location or clearing your search term.</p>
            <button
              onClick={() => { setCityFilter("all"); setSearchQuery(""); }}
              className="mt-2 text-xs font-mono uppercase underline text-stone-800"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHotels.map((hotel) => {
              const coverImg =
                (hotel.images && hotel.images[0]) ||
                tenant?.branding?.heroBanner ||
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

              const lowestPrice = hotel.rooms && hotel.rooms.length > 0
                ? Math.min(...hotel.rooms.map((r) => r.pricePerNight || 0))
                : null;

              return (
                <div
                  key={hotel._id}
                  className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col"
                >
                  {/* Property Image Container */}
                  <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                    <img
                      src={coverImg}
                      alt={hotel.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <MapPin size={11} className="text-stone-300" />
                      <span>{hotel.city}</span>
                    </div>

                    {hotel.starRating && (
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-stone-900 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span>{hotel.starRating}.0</span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className={`${fontFamily} text-xl text-stone-900 font-semibold group-hover:text-stone-700 transition-colors`}>
                        {hotel.name}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {hotel.description}
                      </p>
                    </div>

                    {/* Amenities chips */}
                    {hotel.amenities && hotel.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {hotel.amenities.slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="text-[10px] font-mono text-stone-600 bg-stone-50 border border-stone-200/60 px-2 py-0.5 rounded-md"
                          >
                            {amenity}
                          </span>
                        ))}
                        {hotel.amenities.length > 3 && (
                          <span className="text-[10px] font-mono text-stone-400 self-center">
                            +{hotel.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bottom Pricing & CTA */}
                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        {lowestPrice ? (
                          <>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
                              From
                            </span>
                            <span className="text-lg font-bold text-stone-900 font-sans">
                              {formatCurrency(lowestPrice)}
                            </span>
                            <span className="text-[11px] text-stone-500 font-normal"> / night</span>
                          </>
                        ) : (
                          <span className="text-xs font-mono text-stone-500">Contact for rates</span>
                        )}
                      </div>

                      <Link
                        to={`/portal/${tenant.slug}/hotels/${hotel._id}`}
                        className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-white transition-transform active:scale-95 inline-flex items-center gap-1.5 shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <span>Reserve</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Brand Story & Architectural Philosophy */}
      <section id="about" className="bg-white border-y border-stone-200/80 py-16 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-stone-500">
              The Brand Heritage
            </span>
            <h2 className={`${fontFamily} text-3xl sm:text-4xl text-stone-900 font-normal leading-tight`}>
              Authentic Hospitality, Bespoke Living
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {tenant?.description ||
                "At our core is a steadfast dedication to architectural elegance, serene privacy, and personalized concierge care. Every property in our portfolio represents a hand-selected sanctuary designed to connect travelers with indigenous heritage and contemporary comfort."}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-stone-400 uppercase text-[10px] tracking-widest block">Portfolio</span>
                <span className="text-stone-900 font-semibold text-lg">{hotels.length} Properties</span>
              </div>
              <div className="space-y-1">
                <span className="text-stone-400 uppercase text-[10px] tracking-widest block">Direct Booking</span>
                <span className="text-stone-900 font-semibold text-lg">Best Rate Guaranteed</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-4/3 bg-stone-100">
            <img
              src={
                (hotels[0]?.images && hotels[0].images[0]) ||
                tenant?.branding?.heroBanner ||
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
              }
              alt="Brand Sanctuary"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 4. Direct Booking Sovereign Guarantee */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0" style={{ color: accentColor }}>
              <ShieldCheck size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Direct Brand Privilege</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Book directly on our official hosted site for prioritized room selection and complimentary upgrades.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0" style={{ color: accentColor }}>
              <Sparkles size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Sovereign YouPI Settlement</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Direct zero-fee UPI settlement directly to our corporate VPA ({tenant?.paymentSettings?.vpa || "Direct UPI"}).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0" style={{ color: accentColor }}>
              <CheckCircle2 size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Instant QR Pass Issuance</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Receive an encrypted arrival voucher immediately on booking confirmation for front-desk touchless check-in.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TenantHome;
