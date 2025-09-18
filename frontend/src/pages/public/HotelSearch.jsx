import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { hotelService } from '../../services/hotelService';

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

  // Fetch real hotels from backend API
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        let response;
        
        if (searchParams.location) {
          // Search hotels by city if location is provided
          response = await hotelService.searchHotels(searchParams.location);
        } else {
          // Get all hotels if no specific location
          response = await hotelService.searchHotels('');
        }
        
        if (response && response.data) {
          setHotels(response.data);
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        // Fallback to empty array if API call fails
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [searchParams.location]); // Only depend on searchParams.location, not the entire searchParams object

  // Apply filters whenever hotels or filters change
  useEffect(() => {
    const applyFilters = () => {
      let result = hotels;
      
      // Apply price range filter
      result = result.filter(hotel => {
        const minPrice = hotel.rooms && hotel.rooms.length > 0 
          ? Math.min(...hotel.rooms.map(room => room.pricePerNight || 0))
          : 0;
        return minPrice >= filters.priceRange[0] && minPrice <= filters.priceRange[1];
      });
      
      // Apply star rating filter
      if (filters.starRating.length > 0) {
        result = result.filter(hotel => 
          filters.starRating.includes(hotel.starRating)
        );
      }
      
      // Apply amenities filter
      if (filters.amenities.length > 0) {
        result = result.filter(hotel => 
          filters.amenities.every(amenity => 
            hotel.amenities && hotel.amenities.includes(amenity)
          )
        );
      }
      
      setFilteredHotels(result);
    };
    
    applyFilters();
  }, [hotels, filters]);

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? "text-accent" : "text-gray-300"}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">
        {searchParams.location 
          ? `Hotels in ${searchParams.location}` 
          : 'Search Results'}
      </h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full md:w-1/4">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
            <h2 className="text-xl font-semibold text-primary mb-6">Filters</h2>
            
            {/* Price Range */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-primary mb-3">Price Range</h3>
              <div className="flex items-center justify-between mb-2">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={filters.priceRange[1]}
                onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
            </div>
            
            {/* Star Rating */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-primary mb-3">Star Rating</h3>
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`star-${star}`}
                    checked={filters.starRating.includes(star)}
                    onChange={() => {
                      const newRatings = filters.starRating.includes(star)
                        ? filters.starRating.filter(s => s !== star)
                        : [...filters.starRating, star];
                      handleFilterChange('starRating', newRatings);
                    }}
                    className="mr-2"
                  />
                  <label htmlFor={`star-${star}`} className="flex">
                    {renderStars(star)}
                  </label>
                </div>
              ))}
            </div>
            
            {/* Amenities */}
            <div>
              <h3 className="text-lg font-medium text-primary mb-3">Amenities</h3>
              {['WiFi', 'Pool', 'Parking', 'Restaurant', 'Gym'].map(amenity => (
                <div key={amenity} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`amenity-${amenity}`}
                    checked={filters.amenities.includes(amenity)}
                    onChange={() => {
                      const newAmenities = filters.amenities.includes(amenity)
                        ? filters.amenities.filter(a => a !== amenity)
                        : [...filters.amenities, amenity];
                      handleFilterChange('amenities', newAmenities);
                    }}
                    className="mr-2"
                  />
                  <label htmlFor={`amenity-${amenity}`}>{amenity}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Hotel Results */}
        <div className="w-full md:w-3/4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredHotels.length === 0 && hotels.length > 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-gray-600">No hotels match your filters</p>
                  <button 
                    onClick={() => setFilters({ priceRange: [0, 1000], starRating: [], amenities: [] })}
                    className="mt-4 btn-primary"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                filteredHotels.map(hotel => (
                  <div key={hotel._id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row">
                  <div className="md:w-1/3 h-48 md:h-auto">
                    <img 
                      src={hotel.images && hotel.images.length > 0 ? hotel.images[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop'} 
                      alt={hotel.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 md:w-2/3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-primary mb-1">{hotel.name}</h3>
                      <p className="text-gray-600 mb-2">{hotel.city}</p>
                      <div className="mb-4">
                        {renderStars(hotel.starRating)}
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-2xl font-bold text-accent">${hotel.lowestPrice > 0 ? hotel.lowestPrice : 'No rooms'}</p>
                        <p className="text-sm text-gray-600">Starting from</p>
                      </div>
                      <Link 
                        to={`/hotels/${hotel._id}`} 
                        className="btn-primary"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              )))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelSearch;