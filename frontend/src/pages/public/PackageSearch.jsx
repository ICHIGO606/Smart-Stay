import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { searchPackages } from '../../services/packageService';
import { Search, Compass, Calendar, ArrowRight, SlidersHorizontal, MapPin } from 'lucide-react';

const PackageSearch = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({
    destination: '',
    minPrice: '',
    maxPrice: '',
    minDuration: '',
    maxDuration: ''
  });
  
  const [destinations, setDestinations] = useState([]);
  const [sortBy, setSortBy] = useState('price-low-high');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async (params = {}) => {
    try {
      setLoading(true);
      const packagesData = await searchPackages(params); 

      let sortedPackages = [...packagesData];
      switch (sortBy) {
        case 'price-low-high':
          sortedPackages.sort((a, b) => a.price - b.price);
          break;
        case 'price-high-low':
          sortedPackages.sort((a, b) => b.price - a.price);
          break;
        case 'duration-short-long':
          sortedPackages.sort((a, b) => (a.duration?.days || 0) - (b.duration?.days || 0));
          break;
        case 'duration-long-short':
          sortedPackages.sort((a, b) => (b.duration?.days || 0) - (a.duration?.days || 0));
          break;
        default:
          break;
      }

      setPackages(sortedPackages);

      if (packagesData.length > 0) {
        const allDestinations = packagesData.flatMap(pkg => pkg.destinations || []);
        const uniqueDestinations = [...new Set(allDestinations)];
        setDestinations(uniqueDestinations);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Failed to load packages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    const sortedPackages = [...packages];

    switch (e.target.value) {
      case 'price-low-high':
        sortedPackages.sort((a, b) => a.price - b.price);
        break;
      case 'price-high-low':
        sortedPackages.sort((a, b) => b.price - a.price);
        break;
      case 'duration-short-long':
        sortedPackages.sort((a, b) => (a.duration?.days || 0) - (b.duration?.days || 0));
        break;
      case 'duration-long-short':
        sortedPackages.sort((a, b) => (b.duration?.days || 0) - (a.duration?.days || 0));
        break;
      default:
        break;
    }

    setPackages(sortedPackages);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = Object.entries(searchParams)
      .filter(([, value]) => value !== '')
      .reduce((obj, [key, value]) => {
        const numberKeys = ['minPrice', 'maxPrice', 'minDuration', 'maxDuration'];
        obj[key] = numberKeys.includes(key) ? Number(value) : value;
        return obj;
      }, {});

    fetchPackages(params);
  };

  const handleReset = () => {
    setSearchParams({
      destination: '',
      minPrice: '',
      maxPrice: '',
      minDuration: '',
      maxDuration: ''
    });
    fetchPackages();
  };

  return (
    <div className="container-custom py-10">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-6 mb-8 border-b border-stone-200/80 gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
            Curated itineraries
          </p>
          <h1 className="font-serif text-3xl text-ink-primary font-normal">
            Multi-day travel packages
          </h1>
        </div>
        <p className="text-xs font-mono text-ink-muted tabular-nums">
          {packages.length} {packages.length === 1 ? 'journey' : 'journeys'} available
        </p>
      </div>
      
      {/* Search Filter Bar */}
      <div className="card-base p-4 sm:p-5 mb-8 shadow-subtle">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="destination" className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Destination
              </label>
              <select
                id="destination"
                name="destination"
                value={searchParams.destination}
                onChange={handleSearchChange}
                className="input-base bg-white"
              >
                <option value="">All destinations</option>
                {destinations.map((dest, idx) => <option key={idx} value={dest}>{dest}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="minPrice" className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Min price ($)
              </label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                value={searchParams.minPrice}
                onChange={handleSearchChange}
                min="0"
                placeholder="500"
                className="input-base tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="maxPrice" className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Max price ($)
              </label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={searchParams.maxPrice}
                onChange={handleSearchChange}
                min="0"
                placeholder="4000"
                className="input-base tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="minDuration" className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                  Min days
                </label>
                <input
                  type="number"
                  id="minDuration"
                  name="minDuration"
                  value={searchParams.minDuration}
                  onChange={handleSearchChange}
                  placeholder="3"
                  className="input-base tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="maxDuration" className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                  Max days
                </label>
                <input
                  type="number"
                  id="maxDuration"
                  name="maxDuration"
                  value={searchParams.maxDuration}
                  onChange={handleSearchChange}
                  placeholder="14"
                  className="input-base tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <button 
              type="button" 
              onClick={handleReset} 
              className="text-xs font-mono text-ink-secondary hover:text-ink-primary transition-colors"
            >
              Reset filters
            </button>
            <button 
              type="submit" 
              className="btn-primary !text-xs !py-1.5 !px-4 inline-flex items-center gap-1.5"
            >
              <Search size={13} />
              <span>Filter catalog</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Header */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
          <p className="text-xs font-mono text-ink-muted">Reading itinerary ledgers...</p>
        </div>
      ) : error ? (
        <div className="card-base p-6 border-red-200 bg-red-50/50 text-xs text-red-800">
          {error}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6 pb-2">
            <span className="text-xs font-mono text-ink-muted">
              {packages.length} curated {packages.length === 1 ? 'itinerary' : 'itineraries'}
            </span>
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="sortBy" className="text-ink-muted font-mono uppercase tracking-wider text-[11px]">
                Sort:
              </label>
              <select 
                id="sortBy" 
                value={sortBy} 
                onChange={handleSortChange} 
                className="bg-white border border-stone-200 rounded-control px-2.5 py-1 text-xs text-ink-primary focus:outline-none"
              >
                <option value="price-low-high">Price: low to high</option>
                <option value="price-high-low">Price: high to low</option>
                <option value="duration-short-long">Duration: short to long</option>
                <option value="duration-long-short">Duration: long to short</option>
              </select>
            </div>
          </div>

          {packages.length === 0 ? (
            <div className="card-base text-center py-16 px-6">
              <p className="text-sm font-medium text-ink-primary">No packages match the specified criteria</p>
              <p className="text-xs text-ink-muted mt-1">Try resetting price or duration parameters.</p>
              <button 
                onClick={handleReset} 
                className="mt-4 btn-secondary text-xs"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map(pkg => (
                <div 
                  key={pkg._id} 
                  className="card-base overflow-hidden flex flex-col justify-between hover:border-stone-300 transition-colors group"
                >
                  <div>
                    <div className="relative h-48 bg-stone-100 overflow-hidden">
                      {pkg.images?.length ? (
                        <img 
                          src={pkg.images[0]} 
                          alt={pkg.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-mono text-ink-muted">
                          Archival photography
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-ink-primary px-2 py-0.5 rounded-tag text-[10px] font-mono">
                        {pkg.duration?.days || 0}D / {pkg.duration?.nights || 0}N
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-base font-semibold text-ink-primary group-hover:text-accent transition-colors mb-2 line-clamp-1">
                        {pkg.name}
                      </h3>

                      {/* Route destinations */}
                      {pkg.destinations?.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-ink-muted font-mono mb-3">
                          <MapPin size={12} className="text-ink-secondary" />
                          <span className="truncate">{pkg.destinations.join(' → ')}</span>
                        </div>
                      )}

                      <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed mb-4">
                        {pkg.description || 'Comprehensive regional itinerary featuring boutique accommodations, private transfers, and architectural excursions.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-stone-100 pt-3 flex items-center justify-between">
                    <div className="tabular-nums">
                      <span className="text-[10px] uppercase font-mono text-ink-muted block leading-none mb-1">Total package</span>
                      <span className="text-lg font-semibold text-ink-primary">
                        ${Math.round(pkg.price).toLocaleString()}
                      </span>
                    </div>

                    <Link 
                      to={`/packages/${pkg._id}`} 
                      className="btn-secondary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
                    >
                      <span>Itinerary</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PackageSearch;
