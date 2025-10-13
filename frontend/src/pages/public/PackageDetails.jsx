import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPackageById, bookPackage } from '../../services/packageService';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [participants, setParticipants] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPackageDetails();
  }, [id]);

  const fetchPackageDetails = async () => {
    try {
      setLoading(true);
      const response = await getPackageById(id);
      setPackageData(response);
      setError(null);
    } catch (err) {
      setError('Failed to load package details. Please try again later.');
      console.error('Error fetching package details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to book this package');
      navigate('/login', { state: { from: `/packages/${id}` } });
      return;
    }
    
    if (!bookingDate) {
      toast.error('Please select a start date');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const bookingData = {
        startDate: bookingDate,
        participants: participants,
        userId: user._id
      };
      
      await bookPackage(id, bookingData);
      toast.success('Package booked successfully!');
      navigate('/user/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book package');
      console.error('Error booking package:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error || 'Package not found'}
        </div>
        <button
          onClick={() => navigate('/packages')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
        >
          Back to Packages
        </button>
      </div>
    );
  }

  // Calculate minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Package Header */}
        <div className="relative h-64 bg-gray-200">
          {packageData.images && packageData.images.length > 0 ? (
            <img 
              src={packageData.images[0]} 
              alt={packageData.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="p-6 text-white">
              <h1 className="text-3xl font-bold">{packageData.name}</h1>
              <p className="text-lg">{packageData.duration?.days || 0} Days / {packageData.duration?.nights || 0} Nights</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {packageData.destinations?.map((destination, index) => (
                  <span key={index} className="bg-primary/80 text-white text-xs px-2 py-1 rounded-full">
                    {destination}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Package Content */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column - Package Details */}
            <div className="flex-grow">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">About This Package</h2>
                <p className="text-gray-700">{packageData.description}</p>
              </div>
              
              {/* Image Gallery */}
              {packageData.images && packageData.images.length > 1 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-primary mb-3">Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {packageData.images.slice(1).map((image, index) => (
                      <img 
                        key={index} 
                        src={image} 
                        alt={`${packageData.name} - Image ${index + 2}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Itinerary */}
              {packageData.itinerary && packageData.itinerary.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-primary mb-3">Itinerary</h3>
                  <div className="space-y-4">
                    {packageData.itinerary.map((day, index) => (
                      <div key={index} className="border-l-2 border-primary pl-4 pb-4">
                        <h4 className="font-semibold text-lg">Day {day.day}: {day.title}</h4>
                        <p className="text-gray-700 mt-1">{day.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Reviews */}
              {packageData.reviews && packageData.reviews.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-primary mb-3">Reviews</h3>
                  <div className="space-y-4">
                    {packageData.reviews.map((review, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <div className="font-medium">{review.user?.fullName || 'Anonymous'}</div>
                          <div className="ml-2 text-yellow-500">{'★'.repeat(review.rating)}</div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column - Booking Form */}
            <div className="w-full md:w-80 flex-shrink-0">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 sticky top-6">
                <h3 className="text-xl font-semibold text-primary mb-4">Book This Package</h3>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-primary">₹{packageData.price}</div>
                  <div className="text-sm text-gray-600">per person</div>
                </div>
                
                <form onSubmit={handleBooking} className="space-y-4">
                  <div>
                    <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="bookingDate"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={minDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Participants
                    </label>
                    <input
                      type="number"
                      id="participants"
                      value={participants}
                      onChange={(e) => setParticipants(Math.max(1, parseInt(e.target.value)))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-lg font-semibold text-gray-800 mb-2">
                      Total: ${(packageData.price * participants).toFixed(2)}
                    </p>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center">
                          <Spinner size="sm" className="mr-2" />
                          Booking...
                        </span>
                      ) : (
                        'Book Now'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetails;