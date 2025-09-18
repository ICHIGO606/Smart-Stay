import { useState, useEffect } from 'react';
import adminHotelService from '../../services/adminHotelService';
import HotelForm from '../../components/admin/HotelForm';
import RoomForm from '../../components/admin/RoomForm';

const HotelManagement = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await adminHotelService.getAdminHotels();
      if (response.data) {
        setHotels(response.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHotel = async (hotelData) => {
    try {
      await adminHotelService.createHotel(hotelData);
      setShowHotelForm(false);
      fetchHotels();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateRoom = async (roomData) => {
    try {
      await adminHotelService.createRoom(selectedHotel._id, roomData);
      setShowRoomForm(false);
      setSelectedHotel(null);
      fetchHotels();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (window.confirm('Are you sure you want to delete this hotel?')) {
      try {
        await adminHotelService.deleteHotel(hotelId);
        fetchHotels();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (showHotelForm) {
    return (
      <div className="p-8">
        <HotelForm
          onSubmit={handleCreateHotel}
          onCancel={() => setShowHotelForm(false)}
        />
      </div>
    );
  }

  if (showRoomForm && selectedHotel) {
    return (
      <div className="p-8">
        <RoomForm
          hotel={selectedHotel}
          onSubmit={handleCreateRoom}
          onCancel={() => {
            setShowRoomForm(false);
            setSelectedHotel(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Hotel Management</h1>
        <button
          onClick={() => setShowHotelForm(true)}
          className="btn-primary"
        >
          + Add New Hotel
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {hotels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 mb-4">No hotels found</p>
          <button
            onClick={() => setShowHotelForm(true)}
            className="btn-primary"
          >
            Create Your First Hotel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <div key={hotel._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {hotel.images && hotel.images.length > 0 && (
                <img
                  src={hotel.images[0]}
                  alt={hotel.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-primary mb-2">{hotel.name}</h3>
                <p className="text-gray-600 mb-2">{hotel.city}</p>
                <p className="text-sm text-gray-600 mb-4">{hotel.address}</p>
                
                <div className="mb-4">
                  <h4 className="font-medium text-primary mb-2">Amenities:</h4>
                  <div className="flex flex-wrap gap-1">
                    {hotel.amenities?.map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-accent font-semibold">
                    {hotel.rooms?.length || 0} Rooms
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedHotel(hotel);
                        setShowRoomForm(true);
                      }}
                      className="btn-secondary text-sm"
                    >
                      Add Room
                    </button>
                    <button
                      onClick={() => handleDeleteHotel(hotel._id)}
                      className="btn-danger text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HotelManagement;