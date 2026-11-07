import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { hotelService } from '../../services/hotelService';
import { useAuth } from '../../context/AuthContext';
import { Star, MapPin, Users, Check, ArrowLeft, Shield, Bed, ChevronRight } from 'lucide-react';

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        const response = await hotelService.getHotelDetails(id);
        if (response && response.data) {
          setHotel(response.data);
        }
      } catch (err) {
        console.error('Error fetching hotel details:', err);
        setError('Failed to load hotel details');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [id]);

  const handleBookNow = (roomId) => {
    if (!user) {
      navigate('/login', { state: { from: `/hotels/${id}` } });
      return;
    }
    navigate(`/hotels/${id}/book/${roomId}`);
  };

  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= rating ? "fill-amber-700 text-amber-700" : "fill-stone-200 text-stone-200"}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="container-custom py-20 flex flex-col justify-center items-center min-h-[50vh] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <p className="text-xs font-mono text-ink-muted">Loading property dossier...</p>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="container-custom py-16 max-w-lg">
        <div className="card-base p-6 text-center">
          <p className="text-sm font-medium text-ink-primary mb-2">{error || 'Property not found'}</p>
          <p className="text-xs text-ink-muted mb-4">The requested accommodation may be unlisted or temporarily unavailable.</p>
          <Link to="/hotels" className="btn-secondary text-xs inline-flex items-center gap-1.5">
            <ArrowLeft size={13} />
            <span>Return to directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const images = hotel.images && hotel.images.length > 0 
    ? hotel.images 
    : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop'];

  return (
    <div className="container-custom py-8">
      {/* Back button and breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-ink-muted mb-6 font-mono">
        <Link to="/hotels" className="hover:text-ink-primary transition-colors flex items-center gap-1">
          <ArrowLeft size={12} />
          <span>Hotels</span>
        </Link>
        <span>/</span>
        <span className="text-ink-secondary">{hotel.city}</span>
        <span>/</span>
        <span className="text-ink-primary truncate max-w-[200px]">{hotel.name}</span>
      </div>

      {/* Main Gallery */}
      <div className="mb-10">
        <div className="relative aspect-[16/9] md:aspect-[21/9] max-h-[500px] rounded-card overflow-hidden bg-stone-100 border border-stone-200 mb-3 shadow-subtle">
          <img 
            src={images[activeImage]} 
            alt={`${hotel.name} - View ${activeImage + 1}`} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-tag text-[11px] font-mono tabular-nums">
            {activeImage + 1} / {images.length}
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={index}
                className={`h-16 w-24 flex-shrink-0 rounded-control overflow-hidden border transition-all ${
                  activeImage === index 
                    ? 'border-stone-900 ring-1 ring-stone-900' 
                    : 'border-stone-200 opacity-70 hover:opacity-100'
                }`}
                onClick={() => setActiveImage(index)}
              >
                <img 
                  src={image} 
                  alt={`${hotel.name} thumbnail ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Property Information Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12 pb-10 border-b border-stone-200/80">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="tag-signature">№ {hotel._id ? hotel._id.slice(-4).toUpperCase() : 'STAY'}</span>
            <div className="flex items-center gap-2">
              {renderStars(hotel.starRating || 0)}
              <span className="text-xs font-mono text-ink-muted tabular-nums">({hotel.starRating || 0}.0 rating)</span>
            </div>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal">
            {hotel.name}
          </h1>

          <div className="flex items-center gap-1.5 text-xs text-ink-muted font-mono">
            <MapPin size={13} className="text-ink-secondary" />
            <span>{hotel.city}</span>
            {hotel.address && <span>· {hotel.address}</span>}
          </div>

          <p className="text-sm text-ink-secondary leading-relaxed pt-2">
            {hotel.description || 'Curated boutique hotel offering soundproof suites, natural architectural materials, and concierge service for exploring local cultural landmarks.'}
          </p>

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="pt-4">
              <h2 className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
                Property amenities
              </h2>
              <div className="flex flex-wrap gap-2">
                {hotel.amenities.map((amenity, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 text-xs text-ink-secondary bg-stone-100/90 border border-stone-200/70 px-2.5 py-1 rounded-control">
                    <Check size={12} className="text-accent" />
                    <span>{amenity}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar trust box */}
        <div className="lg:col-span-4">
          <div className="card-base p-5 space-y-4 bg-stone-50/50">
            <h3 className="text-xs font-mono uppercase tracking-wider text-ink-muted">
              Reservation protocol
            </h3>
            
            <ul className="space-y-3 text-xs text-ink-secondary">
              <li className="flex items-start gap-2.5">
                <Shield size={14} className="text-ink-secondary mt-0.5 flex-shrink-0" />
                <span>Verified identity check required at check-in</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={14} className="text-ink-secondary mt-0.5 flex-shrink-0" />
                <span>Complimentary cancellation up to 48 hours prior</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Bed size={14} className="text-ink-secondary mt-0.5 flex-shrink-0" />
                <span>Guaranteed acoustic quiet room allotment</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-stone-200/60 text-[11px] font-mono text-ink-muted">
              Direct booking · Best available rate guarantee
            </div>
          </div>
        </div>
      </div>

      {/* Available Rooms Section */}
      <div className="mb-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-serif text-2xl text-ink-primary font-normal">
            Available suites & rooms
          </h2>
          <p className="text-xs font-mono text-ink-muted tabular-nums">
            {hotel.rooms?.length || 0} room {hotel.rooms?.length === 1 ? 'tier' : 'tiers'}
          </p>
        </div>

        {hotel.rooms && hotel.rooms.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotel.rooms.map(room => (
              <div 
                key={room._id} 
                className="card-base overflow-hidden flex flex-col justify-between hover:border-stone-300 transition-colors"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="tag-signature">Tier № {room._id ? room._id.slice(-3).toUpperCase() : '01'}</span>
                    <span className="flex items-center gap-1 text-xs text-ink-muted font-mono">
                      <Users size={12} />
                      <span className="tabular-nums">Max {room.maxOccupancy}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-ink-primary mb-2">
                    {room.type}
                  </h3>

                  <p className="text-xs text-ink-secondary leading-relaxed mb-4">
                    {room.description || 'Spacious suite with custom acoustic dampening, King-sized natural linen bedding, and private bath.'}
                  </p>
                </div>

                <div className="p-5 pt-0 border-t border-stone-100 pt-3 flex items-center justify-between">
                  <div className="tabular-nums">
                    <span className="text-xs text-ink-muted block leading-none mb-1">Per night</span>
                    <span className="text-xl font-semibold text-ink-primary">${room.pricePerNight}</span>
                  </div>

                  <button 
                    onClick={() => handleBookNow(room._id)}
                    className="btn-primary !text-xs !py-1.5 !px-3.5 inline-flex items-center gap-1"
                  >
                    <span>Reserve</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-base p-8 text-center">
            <p className="text-sm font-medium text-ink-primary">No suites currently available</p>
            <p className="text-xs text-ink-muted mt-1">Please select an alternative date range or browse nearby properties.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelDetails;
