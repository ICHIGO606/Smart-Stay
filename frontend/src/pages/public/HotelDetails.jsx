import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hotelService } from '../../services/hotelService';
import { useAuth } from '../../context/AuthContext';

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
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/hotels/${id}` } });
      return;
    }
    
    // Navigate to booking page
    navigate(`/hotels/${id}/book/${roomId}`);
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

  if (loading) {
    return (
      <div className="container-custom py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="container-custom py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Hotel not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Image Gallery */}
      <div className="mb-8">
        <div className="relative h-[60vh] overflow-hidden rounded-lg mb-2">
          <img 
            src={hotel.images && hotel.images.length > 0 ? hotel.images[activeImage] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop'} 
            alt={`${hotel.name} - View ${activeImage + 1}`} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {hotel.images && hotel.images.map((image, index) => (
            <div 
              key={index}
              className={`h-20 w-32 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 ${activeImage === index ? 'border-accent' : 'border-transparent'}`}
              onClick={() => setActiveImage(index)}
            >
              <img 
                src={image} 
                alt={`${hotel.name} - Thumbnail ${index + 1}`} 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Hotel Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">{hotel.name}</h1>
        <p className="text-gray-600 mb-2">{hotel.city} - {hotel.address}</p>
        <div className="flex items-center mb-4">
          {renderStars(hotel.starRating || 0)}
          <span className="ml-2 text-gray-600">({hotel.starRating || 0}/5)</span>
        </div>
        <p className="text-gray-700 mb-6">{hotel.description}</p>
        
        <h2 className="text-xl font-semibold text-primary mb-3">Amenities</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {hotel.amenities && hotel.amenities.map((amenity, index) => (
            <div key={index} className="flex items-center">
              <span className="text-accent mr-2">✓</span>
              <span>{amenity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Room Types */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-6">Available Rooms</h2>
        {hotel.rooms && hotel.rooms.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotel.rooms.map(room => (
              <div key={room._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-primary mb-2">{room.type}</h3>
                  <p className="text-gray-600 mb-4">Max Occupancy: {room.maxOccupancy} people</p>
                  <p className="text-gray-700 mb-4">{room.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-accent">${room.pricePerNight}</p>
                      <p className="text-sm text-gray-600">per night</p>
                    </div>
                    <button 
                      onClick={() => handleBookNow(room._id)}
                      className="btn-primary"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p>No rooms available for this hotel</p>
          </div>
        )}
      </div>

      {/* Reviews - Temporarily hidden since we don't have review data from API yet */}
      <div className="hidden">
        <h2 className="text-2xl font-semibold text-primary mb-6">Guest Reviews</h2>
        <div className="space-y-6">
          {hotel.reviews && hotel.reviews.map(review => (
            <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-primary">{review.user}</h3>
                <div className="flex">
                  {renderStars(review.rating)}
                </div>
              </div>
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HotelDetails;