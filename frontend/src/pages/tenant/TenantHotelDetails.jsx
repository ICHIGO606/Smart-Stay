import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useTenant } from "../../context/TenantContext";
import { hotelService } from "../../services/hotelService";
import { formatCurrency } from "../../utils/formatters";
import {
  ArrowLeft,
  MapPin,
  Star,
  Users,
  ShieldCheck,
  Check,
  BedDouble,
  Sparkles,
  Wifi,
  Coffee,
  Calendar,
} from "lucide-react";

const TenantHotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tenant } = useTenant();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  const primaryColor = tenant?.branding?.primaryColor || "#14171F";
  const fontFamily = tenant?.branding?.fontFamily === "sans" ? "font-sans" : "font-serif";

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        setLoading(true);
        const res = await hotelService.getHotelDetails(id);
        setHotel(res.data || res);
      } catch (err) {
        console.error("Error fetching hotel details:", err);
        setError("Failed to load property details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchHotel();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-mono text-xs uppercase tracking-widest text-stone-500">
          Loading Residence Dossier...
        </p>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h3 className="font-serif text-2xl text-stone-900">Residence Not Found</h3>
        <p className="text-xs text-stone-600">{error || "Property does not exist in this brand portfolio."}</p>
        <Link
          to={`/portal/${tenant?.slug || ""}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-mono uppercase tracking-wider"
        >
          <ArrowLeft size={14} />
          <span>Return to Portfolio</span>
        </Link>
      </div>
    );
  }

  const images = hotel.images?.length > 0
    ? hotel.images
    : [tenant?.branding?.heroBanner || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"];

  const rooms = hotel.rooms || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Back button */}
      <Link
        to={`/portal/${tenant?.slug || ""}`}
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-stone-600 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to {tenant?.name || "Collection"}</span>
      </Link>

      {/* Hero Header & Gallery */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-widest">
              <MapPin size={13} className="text-stone-700" />
              <span>{hotel.address || hotel.city}</span>
            </div>
            <h1 className={`${fontFamily} text-3xl sm:text-4xl md:text-5xl font-normal text-stone-900`}>
              {hotel.name}
            </h1>
          </div>

          {hotel.starRating && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-stone-200 shadow-xs self-start md:self-auto">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              <span className="font-bold text-sm text-stone-900">{hotel.starRating}.0 Star Hotel</span>
            </div>
          )}
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 aspect-16/10 rounded-2xl overflow-hidden bg-stone-100 shadow-sm">
            <img
              src={images[selectedImage] || images[0]}
              alt={hotel.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>

          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[460px]">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`relative aspect-16/10 rounded-xl overflow-hidden border-2 transition-all shrink-0 w-24 md:w-full ${
                  selectedImage === idx ? "border-stone-900 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Description & Amenities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-6 border-t border-stone-200">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <h2 className="font-mono text-xs uppercase tracking-widest text-stone-500">
              About This Residence
            </h2>
            <p className="text-sm text-stone-700 leading-relaxed font-light">
              {hotel.description}
            </p>
          </div>

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-stone-500">
                Residence Amenities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.amenities.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-stone-200/70 text-xs text-stone-800"
                  >
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Direct Booking Privilege Card */}
        <div>
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-900">
              <Sparkles size={14} className="text-amber-600" />
              <span className="font-semibold">Direct Hosted Privilege</span>
            </div>
            <ul className="text-xs text-stone-600 space-y-2.5">
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>Zero service fees & guaranteed lowest rate</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>Encrypted digital pass on YouPI payment</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>Direct concierge contact & priority check-in</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Room Tiers Selection */}
      <div className="space-y-6 pt-8 border-t border-stone-200">
        <div className="space-y-1">
          <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
            Available Accommodations
          </span>
          <h2 className={`${fontFamily} text-3xl text-stone-900 font-normal`}>
            Select Your Suite or Tier
          </h2>
        </div>

        {rooms.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
            No room tiers currently published for this residence. Please contact concierge.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs hover:border-stone-400 transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`${fontFamily} text-xl text-stone-900 font-semibold`}>
                        {room.type}
                      </h3>
                      <div className="flex items-center gap-3 text-xs font-mono text-stone-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          <span>Max {room.maxOccupancy || 2} guests</span>
                        </span>
                        <span>·</span>
                        <span className="text-emerald-700 font-medium">Available</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-bold text-stone-900 font-sans block">
                        {formatCurrency(room.pricePerNight)}
                      </span>
                      <span className="text-[10px] font-mono text-stone-500 uppercase">per night</span>
                    </div>
                  </div>

                  {room.amenities && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {room.amenities.map((a) => (
                        <span
                          key={a}
                          className="text-[10px] font-mono text-stone-600 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-md"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-stone-500">
                    Instant confirmation
                  </span>
                  <button
                    onClick={() =>
                      navigate(
                        `/hotels/${hotel._id}/book/${room._id}`,
                        {
                          state: {
                            tenantSlug: tenant?.slug,
                            hotelName: hotel.name,
                            roomType: room.type,
                            pricePerNight: room.pricePerNight,
                          },
                        },
                      )
                    }
                    className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider text-white shadow-xs transition-transform active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Select & Book Direct
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantHotelDetails;

