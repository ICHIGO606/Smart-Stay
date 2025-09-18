import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { hotelService } from '../../services/hotelService';

const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    location: '',
    checkIn: new Date(),
    checkOut: new Date(new Date().setDate(new Date().getDate() + 1)),
    adults: 1,
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
    
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      fetchLocationSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchParams(prev => ({ ...prev, location: suggestion }));
    setShowSuggestions(false);
  };

  const featuredDestinations = [
    { id: 1, name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop' },
    { id: 2, name: 'New York', image: 'https://images.unsplash.com/photo-1522083165195-3424ed129620?q=80&w=2060&auto=format&fit=crop' },
    { id: 3, name: 'Tokyo', image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=2036&auto=format&fit=crop' },
    { id: 4, name: 'Rome', image: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?q=80&w=2076&auto=format&fit=crop' },
  ];

  const tourPackages = [
    { id: 1, name: 'European Adventure', image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=2070&auto=format&fit=crop' },
    { id: 2, name: 'Asian Expedition', image: 'https://images.unsplash.com/photo-1464817739973-0128fe77aaa1?q=80&w=2070&auto=format&fit=crop' },
    { id: 3, name: 'American Road Trip', image: 'https://images.unsplash.com/photo-1515876305430-f06edab8282a?q=80&w=2070&auto=format&fit=crop' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[600px]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-primary bg-opacity-50"></div>
        </div>
        
        <div className="relative container-custom h-full flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl">
            <h1 className="text-3xl font-bold text-primary mb-6 text-center">Find Your Perfect Stay</h1>
            
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Where are you going?"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={searchParams.location}
                    onChange={handleLocationChange}
                    onFocus={() => searchParams.location.length >= 2 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    required
                  />
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                      {loadingSuggestions ? (
                        <div className="p-3 text-gray-500">Loading suggestions...</div>
                      ) : locationSuggestions.length > 0 ? (
                        locationSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-gray-500">No locations found</div>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                  <DatePicker
                    selected={searchParams.checkIn}
                    onChange={(date) => setSearchParams({...searchParams, checkIn: date})}
                    className="w-full p-2 border border-gray-300 rounded"
                    minDate={new Date()}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                  <DatePicker
                    selected={searchParams.checkOut}
                    onChange={(date) => setSearchParams({...searchParams, checkOut: date})}
                    className="w-full p-2 border border-gray-300 rounded"
                    minDate={searchParams.checkIn}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                  <div className="flex space-x-2">
                    <select
                      className="w-1/2 p-2 border border-gray-300 rounded"
                      value={searchParams.adults}
                      onChange={(e) => setSearchParams({...searchParams, adults: parseInt(e.target.value)})}
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num} Adult{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                    
                    <select
                      className="w-1/2 p-2 border border-gray-300 rounded"
                      value={searchParams.children}
                      onChange={(e) => setSearchParams({...searchParams, children: parseInt(e.target.value)})}
                    >
                      {[0, 1, 2, 3, 4].map(num => (
                        <option key={num} value={num}>{num} Child{num !== 1 ? 'ren' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="mt-6 w-full bg-accent text-white py-3 rounded-md font-semibold hover:bg-opacity-90 transition-all"
              >
                Search Hotels
              </button>
            </form>
          </div>
        </div>
      </section>
      
      {/* Featured Destinations */}
      <section className="py-16 bg-background">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-primary mb-8">Featured Destinations</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDestinations.map((destination) => (
              <div key={destination.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={destination.image} 
                    alt={destination.name} 
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-primary">{destination.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Tour Packages */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-primary mb-8">Popular Tour Packages</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tourPackages.map((pkg) => (
              <div key={pkg.id} className="bg-background rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="h-56 overflow-hidden">
                  <img 
                    src={pkg.image} 
                    alt={pkg.name} 
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-primary mb-2">{pkg.name}</h3>
                  <p className="text-text mb-4">Experience the journey of a lifetime with our carefully curated packages.</p>
                  <button className="btn-primary">View Details</button>
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