import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchPackages } from '../../services/packageService';
import Spinner from '../../components/common/Spinner';

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

      // Sort packages
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

      // Extract unique destinations
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

    // Remove empty values and map numbers
    const params = Object.entries(searchParams)
      .filter(([_, value]) => value !== '')
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Travel Packages</h1>
      
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Filters grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <select
                id="destination"
                name="destination"
                value={searchParams.destination}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">All Destinations</option>
                {destinations.map((dest, idx) => <option key={idx} value={dest}>{dest}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">Min Price (₹)</label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                value={searchParams.minPrice}
                onChange={handleSearchChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹)</label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={searchParams.maxPrice}
                onChange={handleSearchChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="minDuration" className="block text-sm font-medium text-gray-700 mb-1">Min Days</label>
                <input
                  type="number"
                  id="minDuration"
                  name="minDuration"
                  value={searchParams.minDuration}
                  onChange={handleSearchChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="maxDuration" className="block text-sm font-medium text-gray-700 mb-1">Max Days</label>
                <input
                  type="number"
                  id="maxDuration"
                  name="maxDuration"
                  value={searchParams.maxDuration}
                  onChange={handleSearchChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={handleReset} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Reset</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Search</button>
          </div>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">{packages.length} {packages.length === 1 ? 'Package' : 'Packages'} Found</h2>
            <div className="flex items-center">
              <label htmlFor="sortBy" className="mr-2 text-sm font-medium text-gray-700">Sort by:</label>
              <select id="sortBy" value={sortBy} onChange={handleSortChange} className="px-3 py-2 border border-gray-300 rounded-md">
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="duration-short-long">Duration: Short to Long</option>
                <option value="duration-long-short">Duration: Long to Short</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <div key={pkg._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:scale-105 transition-transform">
                <div className="relative h-48">
                  {pkg.images?.length ? (
                    <img src={pkg.images[0]} alt={pkg.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 className="text-white font-bold text-lg">{pkg.name}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-primary font-bold text-lg">₹{pkg.price.toFixed(2)}</span>
                    <span className="text-gray-600">{pkg.duration?.days || 0} Days / {pkg.duration?.nights || 0} Nights</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pkg.destinations?.map((dest, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">{dest}</span>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">{pkg.description}</p>
                  <Link to={`/packages/${pkg._id}`} className="block w-full text-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">View Details</Link>
                </div>
              </div>
            ))}
          </div>

          {packages.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-10 rounded-md text-center">
              <p className="text-lg">No packages found matching your criteria.</p>
              <button onClick={handleReset} className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Reset Filters</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PackageSearch;
