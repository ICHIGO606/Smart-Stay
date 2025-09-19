import { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getUserBookings();
      setBookings(response.data || []);
    } catch (err) {
      setError('Failed to fetch your bookings');
      console.error('Error fetching user bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setCancellingId(bookingId);
      await bookingService.cancelBooking(bookingId);
      
      // Update the booking status locally
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      );
      
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
      console.error('Error cancelling booking:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancelBooking = (booking) => {
    const bookingDate = new Date(booking.checkInDate);
    const today = new Date();
    const daysUntilBooking = Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24));
    
    return booking.status === 'confirmed' && daysUntilBooking > 1;
  };

  useEffect(() => {
    fetchUserBookings();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-primary">My Bookings</h2>
        <button
          onClick={fetchUserBookings}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
        >
          Refresh
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-600 mb-4">No Bookings Yet</h3>
          <p className="text-gray-500 mb-6">You haven't made any bookings yet. Start exploring our hotels!</p>
          <a
            href="/hotels"
            className="px-6 py-3 bg-accent text-white rounded-md hover:bg-opacity-90 transition-colors"
          >
            Browse Hotels
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    {booking.hotelId?.name || 'Hotel'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Room: {booking.roomId?.type || 'Room'} • Booking ID: {booking._id}
                  </p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Check-in</p>
                  <p className="font-medium">
                    {new Date(booking.checkInDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check-out</p>
                  <p className="font-medium">
                    {new Date(booking.checkOutDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Guests</p>
                  <p className="font-medium">
                    {booking.numberOfAdults} Adult{booking.numberOfAdults !== 1 ? 's' : ''}
                    {booking.numberOfChildren > 0 && `, ${booking.numberOfChildren} Child${booking.numberOfChildren !== 1 ? 'ren' : ''}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-medium text-accent">
                    ₹{booking.totalAmount?.toLocaleString()}
                  </p>
                </div>
              </div>

              {booking.guests && booking.guests.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Guest Details:</p>
                  <div className="space-y-2">
                    {booking.guests.map((guest, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{guest.fullName}</span>
                        {guest.age && `, ${guest.age} years old`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {booking.specialRequests && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Special Requests:</p>
                  <p className="text-sm">{booking.specialRequests}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                {canCancelBooking(booking) && (
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    disabled={cancellingId === booking._id}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}
                
                {booking.status === 'cancelled' && (
                  <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md">
                    Cancelled
                  </span>
                )}
                
                {booking.status === 'completed' && (
                  <span className="px-4 py-2 bg-green-200 text-green-600 rounded-md">
                    Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserBookings;