import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminHotelService from '../../services/adminHotelService';
import { hotelService } from '../../services/hotelService';
import HotelForm from '../../components/admin/HotelForm';
import RoomForm from '../../components/admin/RoomForm';
import RoomVisualization from '../../components/admin/RoomVisualization';
import adminService from '../../services/adminService';

const HotelDetailPage = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showRoomVisualization, setShowRoomVisualization] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [viewMode, setViewMode] = useState('details'); // 'details', 'edit', 'rooms'

  useEffect(() => {
    fetchHotelDetails();
  }, [hotelId]);

  const fetchHotelDetails = async () => {
  try {
    setLoading(true);

    const hotelResponse = await hotelService.getHotelDetails(hotelId);
    const roomsResponse = await adminService.getRooms(hotelId);

    console.log("Rooms response:", roomsResponse);

    if (hotelResponse.data) {
      setHotel({
        ...hotelResponse.data,
        rooms: roomsResponse.data?.data || []  // Updated to access data correctly
      });
    } else {
      setError('Hotel not found');
    }
  } catch (err) {
    console.error("Error fetching hotel details:", err);
    setError(err.response?.data?.message || 'Failed to fetch hotel details');
  } finally {
    setLoading(false);
  }
};


  const handleUpdateHotel = async (hotelData) => {
    try {
      await adminHotelService.updateRoom(hotelId, selectedRoom._id, roomData);
      setSuccess('Hotel updated successfully');
      setViewMode('details');
      fetchHotelDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update hotel');
    }
  };

  const handleCreateRoom = async (roomData) => {
    try {
      await adminHotelService.createRoom(hotelId, roomData);
      setSuccess('Room created successfully');
      setShowRoomForm(false);
      fetchHotelDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  const handleUpdateRoom = async (roomData) => {
    try {
      await adminHotelService.updateRoom(selectedRoom._id, roomData);
      setSuccess('Room updated successfully');
      setShowRoomForm(false);
      setSelectedRoom(null);
      fetchHotelDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update room');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await adminHotelService.deleteRoom(hotelId, roomId);
        setSuccess('Room deleted successfully');
        fetchHotelDetails();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete room');
      }
    }
  };

  const handleEditRoom = (room) => {
    setSelectedRoom(room);
    setShowRoomForm(true);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error && !hotel) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => navigate('/admin/hotels')}
          className="mt-4 btn-secondary"
        >
          ← Back to Hotels
        </button>
      </div>
    );
  }

  if (showRoomForm) {
    return (
      <div className="p-8">
        <RoomForm
          hotel={hotel}
          initialData={selectedRoom}
          onSubmit={selectedRoom ? handleUpdateRoom : handleCreateRoom}
          onCancel={() => {
            setShowRoomForm(false);
            setSelectedRoom(null);
          }}
        />
      </div>
    );
  }

  if (showRoomVisualization) {
    return (
      <div className="p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setShowRoomVisualization(false)}
            className="text-gray-600 hover:text-primary mr-4"
          >
            ← Back to Hotel
          </button>
          <h2 className="text-2xl font-bold text-primary">
            Room Visualization - {hotel.name}
          </h2>
        </div>
        <RoomVisualization hotelId={hotelId} rooms={hotel.rooms} />

      </div>
    );
  }

  if (viewMode === 'edit') {
    return (
      <div className="p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setViewMode('details')}
            className="text-gray-600 hover:text-primary mr-4"
          >
            ← Back to Details
          </button>
          <h2 className="text-2xl font-bold text-primary">
            Edit Hotel - {hotel.name}
          </h2>
        </div>
        <HotelForm
          initialData={hotel}
          onSubmit={handleUpdateHotel}
          onCancel={() => setViewMode('details')}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/hotels')}
            className="text-gray-600 hover:text-primary mr-4"
          >
            ← Back to Hotels
          </button>
          <h1 className="text-3xl font-bold text-primary">{hotel.name}</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('edit')}
            className="btn-secondary"
          >
            Edit Hotel
          </button>
          <button
            onClick={() => setShowRoomVisualization(true)}
            className="btn-primary"
          >
            View Room Layout
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Hotel Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-primary mb-4">Hotel Information</h3>
          <div className="space-y-3">
            <p><span className="font-medium">City:</span> {hotel.city}</p>
            <p><span className="font-medium">Address:</span> {hotel.address}</p>
            <p><span className="font-medium">Description:</span> {hotel.description}</p>
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div>
                <span className="font-medium">Amenities:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {hotel.amenities.map((amenity, index) => (
                    <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-primary mb-4">Hotel Images</h3>
          {hotel.images && hotel.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {hotel.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${hotel.name} ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No images available</p>
          )}
        </div>
      </div>

      {/* Room Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-primary">Room Management</h3>
          <button
            onClick={() => setShowRoomForm(true)}
            className="btn-primary"
          >
            + Add Room
          </button>
        </div>

        {hotel.rooms && hotel.rooms.length > 0 ? (
          <div className="space-y-4">
            {hotel.rooms.map((room) => (
              <div key={room._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-primary">{room.type}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <span className="font-medium">Price:</span> ${room.pricePerNight}/night
                      </div>
                      <div>
                        <span className="font-medium">Max Occupancy:</span> {room.maxOccupancy}
                      </div>
                      <div>
                        <span className="font-medium">Room Numbers:</span> {
                          [...(room.availableRoomNumbers || []), ...(room.roomNumbers || [])].join(', ') || 'None'
                        }
                      </div>
                    </div>
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="mt-2">
                        <span className="font-medium">Amenities:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {room.amenities.map((amenity, index) => (
                            <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {room.images && room.images.length > 0 && (
                      <div className="mt-2">
                        <span className="font-medium">Images:</span>
                        <div className="flex gap-2 mt-1">
                          {room.images.slice(0, 3).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`${room.type} ${index + 1}`}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ))}
                          {room.images.length > 3 && (
                            <span className="text-sm text-gray-500">
                              +{room.images.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEditRoom(room)}
                      className="btn-secondary text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room._id)}
                      className="btn-danger text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No rooms added yet.</p>
            <button
              onClick={() => setShowRoomForm(true)}
              className="btn-primary mt-4"
            >
              Add Your First Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelDetailPage;