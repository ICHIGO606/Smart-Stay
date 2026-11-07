import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router';
import { hotelService } from '../../services/hotelService';
import { Star, MapPin, SlidersHorizontal, ArrowRight, ShieldCheck, Wifi, Waves, Car, Utensils, Dumbbell } from 'lucide-react';

const HotelSearch = () => {
  const location = useLocation();
  const searchParams = location.state || {};
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    starRating: [],
    amenities: []
  });

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const queryParams = {};
        if (searchParams.checkIn) queryParams.checkIn = searchParams.checkIn;
        if (searchParams.checkOut) queryParams.checkOut = searchParams.checkOut;
        if (searchParams.adults) queryParams.adults = searchParams.adults;
        if (searchParams.children) queryParams.children = searchParams.children;

        const response = await hotelService.searchHotels(
          searchParams.location || '',
          queryParams
        );
        
        if (response && response.data) {
          setHotels(response.data);
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [searchParams.location]);

  useEffect(() => {
    let result = hotels;
    
    result = result.filter(hotel => {
      const minPrice = hotel.rooms && hotel.rooms.length > 0 
        ? Math.min(...hotel.rooms.map(room => room.pricePerNight || 0))
        : 0;
      return minPrice >= filters.priceRange[0] && minPrice <= filters.priceRange[1];
    });
    
    if (filters.starRating.length > 0) {
      result = result.filter(hotel => 
        filters.starRating.includes(hotel.starRating)
      );
    }
    
    if (filters.amenities.length > 0) {
      result = result.filter(hotel => 
        filters.amenities.every(amenity => 
          hotel.amenities && hotel.amenities.includes(amenity)
        )
      );
    }
    
    setFilteredHotels(result);
  }, [hotels, filters]);

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const renderStars = (rating) => {
    return (
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
  };

  const amenityIcons = {
    WiFi: <Wifi size={13} />,
    Pool: <Waves size={13} />,
    Parking: <Car size={13} />,
    Restaurant: <Utensils size={13} />,
    Gym: <Dumbbell size={13} />,
  };

  return (
    <div className="container-custom py-10">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-6 mb-8 border-b border-stone-200/80 gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
            Directory & availability
          </p>
          <h1 className="font-serif text-3xl text-ink-primary font-normal">
            {searchParams.location 
              ? `Accommodations in ${searchParams.location}` 
              : 'All properties'}
          </h1>
        </div>
        <p className="text-xs font-mono text-ink-muted tabular-nums">
          {filteredHotels.length} {filteredHotels.length === 1 ? 'property' : 'properties'} cataloged
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="card-base p-5 sticky top-20 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-xs font-mono uppercase tracking-wider text-ink-secondary flex items-center gap-2">
                <SlidersHorizontal size={13} />
                <span>Filters</span>
              </h2>
              {(filters.starRating.length > 0 || filters.amenities.length > 0 || filters.priceRange[1] < 1000) && (
                <button
                  onClick={() => setFilters({ priceRange: [0, 1000], starRating: [], amenities: [] })}
                  className="text-[11px] font-mono text-accent hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            
            {/* Price Range */}
            <div>
              <div className="flex items-center justify-between text-xs text-ink-secondary mb-2 font-mono tabular-nums">
                <span>Maximum rate</span>
                <span className="font-medium text-ink-primary">${filters.priceRange[1]}</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={filters.priceRange[1]}
                onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                className="w-full accent-stone-900 bg-stone-200 h-1 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-ink-muted mt-1 tabular-nums">
                <span>$50</span>
                <span>$1,000</span>
              </div>
            </div>
            
            {/* Star Rating */}
            <div className="pt-4 border-t border-stone-100">
              <h3 className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
                Rating
              </h3>
              <div className="space-y-2">
                {[5, 4, 3].map(star => (
                  <label key={star} className="flex items-center gap-2.5 text-xs text-ink-secondary cursor-pointer hover:text-ink-primary">
                    <input
                      type="checkbox"
                      checked={filters.starRating.includes(star)}
                      onChange={() => {
                        const newRatings = filters.starRating.includes(star)
                          ? filters.starRating.filter(s => s !== star)
                          : [...filters.starRating, star];
                        handleFilterChange('starRating', newRatings);
                      }}
                      className="rounded border-stone-300 text-stone-900 focus:ring-0"
                    />
                    <div className="flex items-center gap-1.5">
                      {renderStars(star)}
                      <span className="text-[11px] font-mono text-ink-muted tabular-nums">({star} star)</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Amenities */}
            <div className="pt-4 border-t border-stone-100">
              <h3 className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
                Amenities
              </h3>
              <div className="space-y-2">
                {['WiFi', 'Pool', 'Parking', 'Restaurant', 'Gym'].map(amenity => (
                  <label key={amenity} className="flex items-center gap-2.5 text-xs text-ink-secondary cursor-pointer hover:text-ink-primary">
                    <input
                      type="checkbox"
                      checked={filters.amenities.includes(amenity)}
                      onChange={() => {
                        const newAmenities = filters.amenities.includes(amenity)
                          ? filters.amenities.filter(a => a !== amenity)
                          : [...filters.amenities, amenity];
                        handleFilterChange('amenities', newAmenities);
                      }}
                      className="rounded border-stone-300 text-stone-900 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5">
                      {amenityIcons[amenity]}
                      <span>{amenity}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>
        
        {/* Hotel Results */}
        <main className="w-full md:flex-1">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
              <p className="text-xs font-mono text-ink-muted">Reading property ledger...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHotels.length === 0 ? (
                <div className="card-base text-center py-16 px-6">
                  <p className="text-sm font-medium text-ink-primary">No properties match these criteria</p>
                  <p className="text-xs text-ink-muted mt-1">Try expanding maximum rate or removing specific amenity filters.</p>
                  <button 
                    onClick={() => setFilters({ priceRange: [0, 1000], starRating: [], amenities: [] })}
                    className="mt-4 btn-secondary text-xs"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                filteredHotels.map(hotel => {
                  const lowestPrice = hotel.lowestPrice > 0 
                    ? hotel.lowestPrice 
                    : (hotel.rooms && hotel.rooms.length > 0 ? Math.min(...hotel.rooms.map(r => r.pricePerNight || 0)) : null);

                  return (
                    <div 
                      key={hotel._id} 
                      className="card-base overflow-hidden flex flex-col sm:flex-row hover:border-stone-300 transition-colors group"
                    >
                      {/* Image Thumbnail */}
                      <div className="sm:w-72 h-52 sm:h-auto relative bg-stone-100 flex-shrink-0">
                        <img 
                          src={hotel.images && hotel.images.length > 0 ? hotel.images[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop'} 
                          alt={hotel.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-tag text-[10px] font-mono text-ink-primary">
                          № {hotel._id ? hotel._id.slice(-3).toUpperCase() : '01'}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <h3 className="text-base font-semibold text-ink-primary group-hover:text-accent transition-colors">
                              {hotel.name}
                            </h3>
                            {renderStars(hotel.starRating || 0)}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-3 font-mono">
                            <MapPin size={12} className="text-ink-secondary" />
                            <span>{hotel.city}</span>
                            {hotel.address && <span>· {hotel.address}</span>}
                          </div>

                          <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed mb-4">
                            {hotel.description || 'Architectural property offering tailored guest services, acoustic quiet rooms, and curated dining.'}
                          </p>

                          {/* Amenity tags */}
                          {hotel.amenities && hotel.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {hotel.amenities.slice(0, 4).map((amenity, idx) => (
                                <span key={idx} className="tag-signature">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Price & Action Row */}
                        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                          <div className="tabular-nums">
                            <span className="text-xs text-ink-muted block leading-none mb-1">
                              {hotel.nights > 1 ? `Stay for ${hotel.nights} nights` : 'From'}
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-semibold text-ink-primary">
                                {lowestPrice ? `$${lowestPrice}` : 'Inquire'}
                              </span>
                              {lowestPrice && <span className="text-xs text-ink-muted font-mono">/ night</span>}
                              {hotel.totalStayPrice && hotel.nights > 1 && (
                                <span className="text-xs text-ink-muted font-mono">
                                  (${hotel.totalStayPrice} total)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {hotel.isAvailableForDates && searchParams.checkIn && (
                              <span className="hidden sm:inline-block text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-tag border border-emerald-200">
                                Available
                              </span>
                            )}
                            <Link 
                              to={`/hotels/${hotel._id}`} 
                              state={searchParams}
                              className="btn-primary !text-xs !py-1.5 !px-3.5 inline-flex items-center gap-1.5"
                            >
                              <span>Inspect rooms</span>
                              <ArrowRight size={13} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HotelSearch;
