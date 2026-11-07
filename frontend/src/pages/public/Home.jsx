import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { hotelService } from '../../services/hotelService';
import { Search, MapPin, Calendar, Users, ArrowUpRight, ShieldCheck, BedDouble, Compass } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    location: '',
    checkIn: new Date(),
    checkOut: new Date(new Date().setDate(new Date().getDate() + 2)),
    adults: 2,
    children: 0,
  });
  
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/hotels', { state: searchParams });
  };

  const fetchLocationSuggestions = async (query) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await hotelService.getLocationSuggestions(query);
      setLocationSuggestions(response.data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setSearchParams(prev => ({ ...prev, location: value }));
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchLocationSuggestions(value);
    }, 250);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchParams(prev => ({ ...prev, location: suggestion }));
    setShowSuggestions(false);
  };

  const featuredDestinations = [
    { 
      id: 1, 
      name: 'Paris', 
      region: 'Île-de-France, France', 
      properties: 14, 
      rateFrom: '$310',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop' 
    },
    { 
      id: 2, 
      name: 'Kyoto', 
      region: 'Kansai, Japan', 
      properties: 9, 
      rateFrom: '$260',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop' 
    },
    { 
      id: 3, 
      name: 'Rome', 
      region: 'Lazio, Italy', 
      properties: 12, 
      rateFrom: '$285',
      image: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?q=80&w=1200&auto=format&fit=crop' 
    },
    { 
      id: 4, 
      name: 'Zürich', 
      region: 'Canton of Zürich, Switzerland', 
      properties: 8, 
      rateFrom: '$390',
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=1200&auto=format&fit=crop' 
    },
  ];

  const tourPackages = [
    { 
      id: 1, 
      name: 'Alpine Lakes & Engadin Mansions', 
      duration: '6 nights · 7 days',
      pacing: 'Leisurely',
      destinations: ['Zürich', 'St. Moritz', 'Lugano'],
      rate: '$2,480',
      image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1200&auto=format&fit=crop' 
    },
    { 
      id: 2, 
      name: 'Kyoto Machiya & Forest Ryokans', 
      duration: '5 nights · 6 days',
      pacing: 'Curated heritage',
      destinations: ['Kyoto', 'Uji', 'Nara'],
      rate: '$2,150',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop' 
    },
    { 
      id: 3, 
      name: 'Tuscan Courtyards & Chianti Estates', 
      duration: '7 nights · 8 days',
      pacing: 'Architectural route',
      destinations: ['Florence', 'Siena', 'Val d’Orcia'],
      rate: '$2,820',
      image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1200&auto=format&fit=crop' 
    },
  ];

  return (
    <div className="bg-[#FBF9F5]">
      {/* Hero Section */}
      <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-stone-200/60 overflow-hidden">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Quiet Editorial Typography */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-tag bg-stone-100 border border-stone-200/80 text-[11px] font-mono text-ink-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                <span>Curated accommodation collective</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[52px] leading-[1.08] text-ink-primary font-normal tracking-tight">
                Rooms chosen for light, proportions, and quiet craft.
              </h1>

              <p className="text-base text-ink-secondary leading-relaxed max-w-lg font-normal">
                SmartStay partners directly with independent hoteliers, historic estates, and urban sanctuaries. Reserve verified rooms with transparent rates.
              </p>

              {/* Verified Trust Strip */}
              <div className="pt-2 flex items-center gap-6 text-xs text-ink-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-ink-secondary" />
                  <span>Direct hotel ledger confirmation</span>
                </div>
                <div className="flex items-center gap-2">
                  <BedDouble size={16} className="text-ink-secondary" />
                  <span>Guaranteed quiet rooms</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual with Real World Texture & Key Moment */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-card overflow-hidden border border-stone-200/80 shadow-elevated bg-stone-100 aspect-[4/3] sm:aspect-[16/10]">
                <img 
                  src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop" 
                  alt="Minimalist sunlit hotel suite with linen and stone detail" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                {/* Signature Moment: Brass Room Key Token */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-control p-3 border border-white/40 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[6px] bg-stone-900 text-amber-200 flex items-center justify-center font-mono text-xs font-semibold">
                      №
                    </div>
                    <div>
                      <p className="text-xs font-medium text-ink-primary">Suite 408 · The Terraces</p>
                      <p className="text-[11px] text-ink-muted">Morning terrace view · King linen bed</p>
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-xs font-semibold text-ink-primary">$340</span>
                    <span className="text-[10px] text-ink-muted block">/ night</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Integrated Reservation Search Bar */}
          <div className="mt-10 bg-white rounded-card border border-stone-200 shadow-elevated p-3 sm:p-4">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              
              {/* Destination Field */}
              <div className="md:col-span-4 relative p-2 rounded-control hover:bg-stone-50 transition-colors border border-transparent focus-within:border-stone-300">
                <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                  <MapPin size={12} className="text-ink-secondary" />
                  <span>Destination</span>
                </label>
                <input
                  type="text"
                  placeholder="City, region, or landmark"
                  className="w-full bg-transparent text-sm font-medium text-ink-primary placeholder:text-stone-400 focus:outline-none"
                  value={searchParams.location}
                  onChange={handleLocationChange}
                  onFocus={() => searchParams.location.length >= 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  required
                />
                
                {/* Suggestions dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-stone-200 rounded-card shadow-elevated mt-2 max-h-56 overflow-y-auto z-50 py-1">
                    {loadingSuggestions ? (
                      <div className="p-3 text-xs text-ink-muted font-mono">Querying directory...</div>
                    ) : locationSuggestions.length > 0 ? (
                      locationSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-stone-50 cursor-pointer text-xs text-ink-primary flex items-center gap-2"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <MapPin size={12} className="text-ink-muted" />
                          <span>{suggestion}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-ink-muted">No locations cataloged</div>
                    )}
                  </div>
                )}
              </div>

              {/* Check-in Date */}
              <div className="md:col-span-3 p-2 rounded-control hover:bg-stone-50 transition-colors border border-transparent focus-within:border-stone-300">
                <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                  <Calendar size={12} className="text-ink-secondary" />
                  <span>Check in</span>
                </label>
                <DatePicker
                  selected={searchParams.checkIn}
                  onChange={(date) => setSearchParams({...searchParams, checkIn: date})}
                  minDate={new Date()}
                  dateFormat="EEE, MMM d, yyyy"
                  className="w-full bg-transparent text-sm font-medium text-ink-primary cursor-pointer focus:outline-none !p-0 !border-none"
                />
              </div>

              {/* Check-out Date */}
              <div className="md:col-span-3 p-2 rounded-control hover:bg-stone-50 transition-colors border border-transparent focus-within:border-stone-300">
                <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                  <Calendar size={12} className="text-ink-secondary" />
                  <span>Check out</span>
                </label>
                <DatePicker
                  selected={searchParams.checkOut}
                  onChange={(date) => setSearchParams({...searchParams, checkOut: date})}
                  minDate={searchParams.checkIn}
                  dateFormat="EEE, MMM d, yyyy"
                  className="w-full bg-transparent text-sm font-medium text-ink-primary cursor-pointer focus:outline-none !p-0 !border-none"
                />
              </div>

              {/* Search Action */}
              <div className="md:col-span-2 flex items-center">
                <button 
                  type="submit" 
                  className="w-full h-11 btn-primary flex items-center justify-center gap-2 !rounded-control text-xs uppercase tracking-wider font-mono"
                >
                  <Search size={14} />
                  <span>Search</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      </section>
      
      {/* Featured Destinations */}
      <section className="py-16 sm:py-20 border-b border-stone-200/60">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Curated territories
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl text-ink-primary font-normal">
                Featured destinations
              </h2>
            </div>
            <Link 
              to="/hotels" 
              className="text-xs font-medium text-ink-secondary hover:text-ink-primary inline-flex items-center gap-1 transition-colors group"
            >
              <span>Explore all destinations</span>
              <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredDestinations.map((destination) => (
              <div 
                key={destination.id} 
                onClick={() => navigate('/hotels', { state: { location: destination.name } })}
                className="group cursor-pointer card-base overflow-hidden hover:border-stone-300 transition-colors"
              >
                <div className="h-44 overflow-hidden relative bg-stone-100">
                  <img 
                    src={destination.image} 
                    alt={destination.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-tag text-[10px] font-mono tabular-nums">
                    {destination.properties} properties
                  </div>
                </div>
                <div className="p-3.5">
                  <h3 className="text-sm font-semibold text-ink-primary group-hover:text-accent transition-colors flex items-center justify-between">
                    <span>{destination.name}</span>
                    <span className="text-xs font-mono font-normal text-ink-muted tabular-nums">from {destination.rateFrom}</span>
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5 truncate">{destination.region}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Popular Tour Packages */}
      <section className="py-16 sm:py-20">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Multi-day itineraries
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl text-ink-primary font-normal">
                Curated travel packages
              </h2>
            </div>
            <Link 
              to="/packages" 
              className="text-xs font-medium text-ink-secondary hover:text-ink-primary inline-flex items-center gap-1 transition-colors group"
            >
              <span>View all itineraries</span>
              <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tourPackages.map((pkg) => (
              <div 
                key={pkg.id} 
                className="card-base overflow-hidden flex flex-col justify-between hover:border-stone-300 transition-colors"
              >
                <div>
                  <div className="h-52 overflow-hidden relative bg-stone-100">
                    <img 
                      src={pkg.image} 
                      alt={pkg.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-ink-primary px-2.5 py-1 rounded-tag text-[11px] font-mono">
                      {pkg.duration}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                      {pkg.pacing}
                    </p>
                    <h3 className="text-base font-semibold text-ink-primary mb-2 line-clamp-1">
                      {pkg.name}
                    </h3>

                    {/* Route breadcrumbs */}
                    <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-4 font-mono">
                      {pkg.destinations.map((city, idx) => (
                        <span key={city} className="flex items-center gap-1.5">
                          <span>{city}</span>
                          {idx < pkg.destinations.length - 1 && <span className="text-stone-300">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 flex items-center justify-between border-t border-stone-100 pt-3">
                  <div>
                    <span className="text-xs text-ink-muted block">Total package</span>
                    <span className="text-base font-semibold text-ink-primary tabular-nums">{pkg.rate}</span>
                  </div>
                  <Link 
                    to="/packages" 
                    className="btn-secondary !text-xs !py-1.5 !px-3"
                  >
                    View itinerary
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
