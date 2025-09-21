import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import hotelService from '../../services/hotelService';
import userService from '../../services/userService';

const BookingPage = () => {
  const { hotelId, roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState({ fullName: '', age: '', relationship: '' });
  const [bookingData, setBookingData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guests: {
      adults: 1,
      children: 0,
      infants: 0
    },
    guestDetails: [
      { fullName: '', age: '' }
    ],
    specialRequests: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch hotel details
        const hotelResponse = await hotelService.getHotelDetails(hotelId);
        setHotel(hotelResponse.data);
        
        // Find the specific room
        const selectedRoom = hotelResponse.data.rooms.find(r => r._id === roomId);
        if (!selectedRoom) {
          setError('Room not found');
          return;
        }
        setRoom(selectedRoom);
        
        // Fetch family members if user is logged in
        if (user) {
          try {
            const familyResponse = await userService.getFamilyMembers();
            setFamilyMembers(familyResponse.data || []);
          } catch (err) {
            console.error('Error fetching family members:', err);
          }
        }
        
      } catch (err) {
        setError('Failed to fetch booking details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (hotelId && roomId) {
      fetchData();
    }
  }, [hotelId, roomId, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuestChange = (type, value) => {
    setBookingData(prev => ({
      ...prev,
      guests: {
        ...prev.guests,
        [type]: parseInt(value)
      }
    }));
  };

  const handleGuestDetailChange = (index, field, value) => {
    setBookingData(prev => ({
      ...prev,
      guestDetails: prev.guestDetails.map((guest, i) => 
        i === index ? { ...guest, [field]: value } : guest
      )
    }));
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addGuest = () => {
    setBookingData(prev => ({
      ...prev,
      guestDetails: [...prev.guestDetails, { fullName: '', age: '' }]
    }));
  };

  const removeGuest = (index) => {
    if (bookingData.guestDetails.length > 1) {
      setBookingData(prev => ({
        ...prev,
        guestDetails: prev.guestDetails.filter((_, i) => i !== index)
      }));
    }
  };

  const selectFamilyMember = (member, index) => {
    setBookingData(prev => ({
      ...prev,
      guestDetails: prev.guestDetails.map((guest, i) => 
        i === index ? { fullName: member.fullName, age: member.age } : guest
      )
    }));
  };

  const addNewFamilyMember = async () => {
    try {
      const response = await userService.addFamilyMember({
        fullName: newUserData.fullName,
        age: parseInt(newUserData.age),
        relationship: newUserData.relationship || 'Family Member'
      });
      
      setFamilyMembers(prev => [...prev, response.data]);
      setNewUserData({ fullName: '', age: '', relationship: '' });
      setShowNewUserForm(false);
      
      // Auto-fill the last guest slot with the new member
      const lastIndex = bookingData.guestDetails.length - 1;
      selectFamilyMember(response.data, lastIndex);
      
    } catch (err) {
      setError('Failed to add family member');
      console.error('Error adding family member:', err);
    }
  };

  const calculateTotal = () => {
    if (!room || !bookingData.checkInDate || !bookingData.checkOutDate) return 0;
    
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    return nights * room.pricePerNight;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login', { state: { from: `/hotels/${hotelId}/book/${roomId}` } });
      return;
    }

    try {
      setLoading(true);
      
      const bookingPayload = {
        bookingType: "Hotel",
        hotelId: hotelId,
        roomId: roomId,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        numberOfAdults: bookingData.guests.adults,
        numberOfChildren: bookingData.guests.children + bookingData.guests.infants,
        guests: bookingData.guestDetails.map(guest => ({
          fullName: guest.fullName,
          age: parseInt(guest.age)
        })),
        specialRequests: bookingData.specialRequests,
        totalAmount: calculateTotal()
      };

      const response = await bookingService.createBooking(bookingPayload);
      
      navigate('/user/bookings', { 
        state: { 
          message: 'Booking created successfully!',
          bookingId: response.data._id 
        }
      });
      
    } catch (err) {
      setError(err.message || 'Failed to create booking');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={() => navigate(-1)}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white p-6">
            <h1 className="text-2xl font-bold mb-2">Complete Your Booking</h1>
            <p className="text-primary-light">
              {hotel?.name} - {room?.type}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Booking Form */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-in Date
                      </label>
                      <input
                        type="date"
                        name="checkInDate"
                        value={bookingData.checkInDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-out Date
                      </label>
                      <input
                        type="date"
                        name="checkOutDate"
                        value={bookingData.checkOutDate}
                        onChange={handleInputChange}
                        min={bookingData.checkInDate || new Date().toISOString().split('T')[0]}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guests
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Adults</label>
                        <select
                          value={bookingData.guests.adults}
                          onChange={(e) => handleGuestChange('adults', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          {[1, 2, 3, 4].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Children</label>
                        <select
                          value={bookingData.guests.children}
                          onChange={(e) => handleGuestChange('children', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          {[0, 1, 2, 3].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Infants</label>
                        <select
                          value={bookingData.guests.infants}
                          onChange={(e) => handleGuestChange('infants', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          {[0, 1, 2].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guest Information
                    </label>
                    <div className="space-y-3">
                      {bookingData.guestDetails.map((guest, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-3 bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Guest {index + 1}
                            </span>
                            {bookingData.guestDetails.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeGuest(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Full Name</label>
                              <input
                                type="text"
                                value={guest.fullName}
                                onChange={(e) => handleGuestDetailChange(index, 'fullName', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Full name"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Age</label>
                              <input
                                type="number"
                                value={guest.age}
                                onChange={(e) => handleGuestDetailChange(index, 'age', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Age"
                                min="1"
                                max="120"
                                required
                              />
                            </div>
                          </div>
                          
                          {/* Family Member Selection */}
                          {user && familyMembers.length > 0 && (
                            <div className="mt-2">
                              <label className="block text-xs text-gray-600 mb-1">Select Family Member</label>
                              <select
                                value=""
                                onChange={(e) => {
                                  const selectedMember = familyMembers.find(m => m._id === e.target.value);
                                  if (selectedMember) {
                                    selectFamilyMember(selectedMember, index);
                                  }
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              >
                                <option value="">Choose from family members...</option>
                                {familyMembers.map(member => (
                                  <option key={member._id} value={member._id}>
                                    {member.fullName} ({member.age} years old){member.relationship ? ` - ${member.relationship}` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addGuest}
                        className="text-primary hover:text-primary-dark text-sm font-medium"
                      >
                        + Add Another Guest
                      </button>
                      
                      {/* Add New Family Member Section */}
                      {user && (
                        <div className="mt-4 p-3 border border-dashed border-gray-300 rounded-md">
                          {!showNewUserForm ? (
                            <button
                              type="button"
                              onClick={() => setShowNewUserForm(true)}
                              className="text-primary hover:text-primary-dark text-sm font-medium"
                            >
                              + Add New Family Member
                            </button>
                          ) : (
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-gray-700">Add New Family Member</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <input
                                    type="text"
                                    name="fullName"
                                    value={newUserData.fullName}
                                    onChange={handleNewUserChange}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="Full Name"
                                    required
                                  />
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    name="age"
                                    value={newUserData.age}
                                    onChange={handleNewUserChange}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="Age"
                                    min="1"
                                    max="120"
                                    required
                                  />
                                </div>
                              </div>
                              <div>
                                <input
                                  type="text"
                                  name="relationship"
                                  value={newUserData.relationship}
                                  onChange={handleNewUserChange}
                                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="Relationship (optional)"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={addNewFamilyMember}
                                  className="bg-primary text-white px-3 py-1 rounded text-sm"
                                  disabled={!newUserData.fullName || !newUserData.age}
                                >
                                  Add Member
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowNewUserForm(false)}
                                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      name="specialRequests"
                      value={bookingData.specialRequests}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Any special requirements or preferences..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent text-white py-3 px-4 rounded-md hover:bg-accent-dark disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </form>
              </div>

              {/* Booking Summary */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
                
                {hotel && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800">{hotel.name}</h3>
                    <p className="text-sm text-gray-600">{hotel.location}</p>
                  </div>
                )}
                
                {room && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800">{room.type}</h4>
                    <p className="text-sm text-gray-600">
                      {room.capacity} guests • {room.beds} beds
                    </p>
                    <p className="text-lg font-semibold text-accent mt-2">
                      ${room.pricePerNight}/night
                    </p>
                  </div>
                )}

                {bookingData.checkInDate && bookingData.checkOutDate && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between mb-2">
                      <span>Room price</span>
                      <span>${room?.pricePerNight} × {Math.ceil((new Date(bookingData.checkOutDate) - new Date(bookingData.checkInDate)) / (1000 * 60 * 60 * 24))} nights</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-accent">${calculateTotal()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;