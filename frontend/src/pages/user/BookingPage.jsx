import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import hotelService from '../../services/hotelService';
import userService from '../../services/userService';
import PaymentGateway from '../../components/PaymentGateway';

const BookingPage = () => {
  const { hotelId, roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
  
  // Payment integration state
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

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
            
            // Handle different response formats for family members
            let members = [];
            if (Array.isArray(familyResponse)) {
              members = familyResponse;
            } else if (familyResponse && Array.isArray(familyResponse.data)) {
              members = familyResponse.data;
            } else if (familyResponse && familyResponse.familyMembers) {
              members = familyResponse.familyMembers;
            } else if (familyResponse && familyResponse.data && familyResponse.data.familyMembers) {
              members = familyResponse.data.familyMembers;
            } else if (familyResponse && typeof familyResponse === 'object') {
              members = Object.values(familyResponse).filter(item => 
                item && typeof item === 'object' && item.fullName !== undefined
              );
            }
            
            setFamilyMembers(members);
          } catch (err) {
            console.error('Error fetching family members:', err);
            setFamilyMembers([]);
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
    const newValue = parseInt(value);
    setBookingData(prev => {
      const newGuests = {
        ...prev.guests,
        [type]: newValue
      };
      
      // Update guest details array based on total guests
      const totalGuests = newGuests.adults + newGuests.children + newGuests.infants;
      const currentGuestDetails = prev.guestDetails;
      
      let newGuestDetails;
      if (totalGuests > currentGuestDetails.length) {
        // Add new guest detail entries
        newGuestDetails = [
          ...currentGuestDetails,
          ...Array(totalGuests - currentGuestDetails.length).fill({ fullName: '', age: '' })
        ];
      } else if (totalGuests < currentGuestDetails.length) {
        // Remove excess guest detail entries
        newGuestDetails = currentGuestDetails.slice(0, totalGuests);
      } else {
        newGuestDetails = currentGuestDetails;
      }
      
      return {
        ...prev,
        guests: newGuests,
        guestDetails: newGuestDetails
      };
    });
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
      
      let newMember;
      if (response && response.data) {
        newMember = response.data;
      } else if (response && typeof response === 'object') {
        newMember = response;
      } else {
        newMember = {
          _id: Date.now().toString(),
          fullName: newUserData.fullName,
          age: parseInt(newUserData.age),
          relationship: newUserData.relationship || 'Family Member',
          isVerified: false
        };
      }
      
      setFamilyMembers(prev => [...prev, newMember]);
      setNewUserData({ fullName: '', age: '', relationship: '' });
      setShowNewUserForm(false);
      
      const lastIndex = bookingData.guestDetails.length - 1;
      selectFamilyMember(newMember, lastIndex);
      
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

  const calculateNights = () => {
    if (!bookingData.checkInDate || !bookingData.checkOutDate) return 0;
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  };

  const isStep1Valid = () => {
    return bookingData.checkInDate && bookingData.checkOutDate && 
           new Date(bookingData.checkOutDate) > new Date(bookingData.checkInDate);
  };

  const isStep2Valid = () => {
    const totalGuests = bookingData.guests.adults + bookingData.guests.children + bookingData.guests.infants;
    return totalGuests > 0 && bookingData.guestDetails.every(guest => 
      guest.fullName.trim() && guest.age && parseInt(guest.age) > 0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login', { state: { from: `/hotels/${hotelId}/book/${roomId}` } });
      return;
    }

    try {
      setSubmitting(true);
      
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
      
      // Store the created booking and show payment gateway
      setCreatedBooking(response.data);
      setShowPaymentGateway(true);
      
    } catch (err) {
      setError(err.message || 'Failed to create booking');
      console.error('Booking error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate(-1)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  currentStep >= step 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-semibold">{step}</span>
                  )}
                </div>
                <div className="ml-3 text-sm">
                  <p className={`font-medium ${currentStep >= step ? 'text-blue-600' : 'text-gray-400'}`}>
                    {step === 1 ? 'Dates & Guests' : step === 2 ? 'Guest Details' : 'Review & Book'}
                  </p>
                </div>
                {step < 3 && (
                  <div className={`w-16 h-0.5 ml-8 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Complete Your Booking</h1>
                    <p className="text-blue-100 text-lg">
                      {hotel?.name} • {room?.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-sm">Starting from</p>
                    <p className="text-2xl font-bold">${room?.pricePerNight}<span className="text-lg font-normal">/night</span></p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <form onSubmit={handleSubmit}>
                  {/* Step 1: Dates & Guests */}
                  {currentStep === 1 && (
                    <div className="space-y-8 animate-fadeIn">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">When are you staying?</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Check-in Date
                          </label>
                          <input
                            type="date"
                            name="checkInDate"
                            value={bookingData.checkInDate}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300"
                            required
                          />
                        </div>
                        
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Check-out Date
                          </label>
                          <input
                            type="date"
                            name="checkOutDate"
                            value={bookingData.checkOutDate}
                            onChange={handleInputChange}
                            min={bookingData.checkInDate || new Date().toISOString().split('T')[0]}
                            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">How many guests?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { key: 'adults', label: 'Adults', desc: '13+ years', max: 4 },
                            { key: 'children', label: 'Children', desc: '2-12 years', max: 3 },
                            { key: 'infants', label: 'Infants', desc: 'Under 2 years', max: 2 }
                          ].map(({ key, label, desc, max }) => (
                            <div key={key} className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">{label}</p>
                                  <p className="text-sm text-gray-500">{desc}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <button
                                    type="button"
                                    onClick={() => handleGuestChange(key, Math.max(0, bookingData.guests[key] - 1))}
                                    className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                    disabled={key === 'adults' ? bookingData.guests[key] <= 1 : bookingData.guests[key] <= 0}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                    </svg>
                                  </button>
                                  <span className="font-bold text-lg w-8 text-center">{bookingData.guests[key]}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleGuestChange(key, Math.min(max, bookingData.guests[key] + 1))}
                                    className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                    disabled={bookingData.guests[key] >= max}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          disabled={!isStep1Valid()}
                          className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                        >
                          Continue to Guest Details
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Guest Details */}
                  {currentStep === 2 && (
                    <div className="space-y-8 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Guest Information</h2>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          ← Back to Dates
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        {bookingData.guestDetails.map((guest, index) => (
                          <div key={index} className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-200 transition-colors">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Guest {index + 1} {index === 0 && "(Primary Guest)"}
                              </h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                <input
                                  type="text"
                                  value={guest.fullName}
                                  onChange={(e) => handleGuestDetailChange(index, 'fullName', e.target.value)}
                                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300"
                                  placeholder="Enter full name"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                                <input
                                  type="number"
                                  value={guest.age}
                                  onChange={(e) => handleGuestDetailChange(index, 'age', e.target.value)}
                                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300"
                                  placeholder="Age"
                                  min="1"
                                  max="120"
                                  required
                                />
                              </div>
                            </div>
                            
                            {/* Family Member Selection */}
                            {user && familyMembers.length > 0 && (
                              <div className="border-t pt-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  Quick Fill from Family Members
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {familyMembers.map(member => (
                                    <button
                                      key={member._id}
                                      type="button"
                                      onClick={() => selectFamilyMember(member, index)}
                                      className="bg-gray-100 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 hover:border-blue-300"
                                    >
                                      {member.fullName} ({member.age}y)
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Add New Family Member */}
                        {user && (
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-300 transition-colors">
                            {!showNewUserForm ? (
                              <button
                                type="button"
                                onClick={() => setShowNewUserForm(true)}
                                className="w-full text-center py-4 text-blue-600 hover:text-blue-700 font-medium"
                              >
                                + Add New Family Member for Future Bookings
                              </button>
                            ) : (
                              <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-gray-900">Add New Family Member</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <input
                                    type="text"
                                    name="fullName"
                                    value={newUserData.fullName}
                                    onChange={handleNewUserChange}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-colors"
                                    placeholder="Full Name"
                                    required
                                  />
                                  <input
                                    type="number"
                                    name="age"
                                    value={newUserData.age}
                                    onChange={handleNewUserChange}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-colors"
                                    placeholder="Age"
                                    min="1"
                                    max="120"
                                    required
                                  />
                                </div>
                                <input
                                  type="text"
                                  name="relationship"
                                  value={newUserData.relationship}
                                  onChange={handleNewUserChange}
                                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-colors"
                                  placeholder="Relationship (optional)"
                                />
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={addNewFamilyMember}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                    disabled={!newUserData.fullName || !newUserData.age}
                                  >
                                    Add Member
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowNewUserForm(false)}
                                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:border-gray-400 transition-all duration-300 font-semibold"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          disabled={!isStep2Valid()}
                          className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                        >
                          Review Booking
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review & Special Requests */}
                  {currentStep === 3 && (
                    <div className="space-y-8 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Review Your Booking</h2>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          ← Back to Guest Details
                        </button>
                      </div>

                      {/* Booking Review */}
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Stay Duration</h4>
                            <p className="text-gray-600">
                              {new Date(bookingData.checkInDate).toLocaleDateString()} - {new Date(bookingData.checkOutDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">{calculateNights()} nights</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Guests</h4>
                            <p className="text-gray-600">
                              {bookingData.guests.adults} Adults
                              {bookingData.guests.children > 0 && `, ${bookingData.guests.children} Children`}
                              {bookingData.guests.infants > 0 && `, ${bookingData.guests.infants} Infants`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Guest Names</h4>
                          <div className="flex flex-wrap gap-2">
                            {bookingData.guestDetails.map((guest, index) => (
                              <span key={index} className="bg-white px-3 py-1 rounded-full text-sm border">
                                {guest.fullName} ({guest.age}y)
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Special Requests (Optional)
                        </label>
                        <textarea
                          name="specialRequests"
                          value={bookingData.specialRequests}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300 resize-none"
                          placeholder="Let us know about any special requirements, dietary preferences, accessibility needs, or other requests..."
                        />
                      </div>

                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:border-gray-400 transition-all duration-300 font-semibold"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Confirm Booking
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Booking Summary - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Summary</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Hotel Info */}
                  {hotel && (
                    <div className="border-b pb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {hotel.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{hotel.name}</h4>
                          <p className="text-sm text-gray-600 mb-1">{hotel.location}</p>
                          <div className="flex items-center">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 ml-2">4.8 (234 reviews)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Room Info */}
                  {room && (
                    <div className="border-b pb-4">
                      <h4 className="font-bold text-gray-900 mb-2">{room.type}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Up to {room.capacity} guests
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                          {room.beds} beds
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date Summary */}
                  {bookingData.checkInDate && bookingData.checkOutDate && (
                    <div className="border-b pb-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Check-in</span>
                          <span className="text-sm text-gray-900">{new Date(bookingData.checkInDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Check-out</span>
                          <span className="text-sm text-gray-900">{new Date(bookingData.checkOutDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Duration</span>
                          <span className="text-sm text-gray-900">{calculateNights()} nights</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Guests Summary */}
                  <div className="border-b pb-4">
                    <h5 className="font-medium text-gray-900 mb-2">Guests</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Adults</span>
                        <span className="text-gray-900">{bookingData.guests.adults}</span>
                      </div>
                      {bookingData.guests.children > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Children</span>
                          <span className="text-gray-900">{bookingData.guests.children}</span>
                        </div>
                      )}
                      {bookingData.guests.infants > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Infants</span>
                          <span className="text-gray-900">{bookingData.guests.infants}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  {room && calculateNights() > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Price Details</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            ${room.pricePerNight} × {calculateNights()} nights
                          </span>
                          <span className="text-gray-900">${room.pricePerNight * calculateNights()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service fee</span>
                          <span className="text-gray-900">$0</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-lg text-gray-900">Total</span>
                            <span className="font-bold text-2xl text-blue-600">${calculateTotal()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trust Indicators */}
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">Secure Booking</p>
                        <p className="text-xs text-green-600">Your information is protected</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Free Cancellation</p>
                        <p className="text-xs text-blue-600">Cancel up to 24 hours before check-in</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentGateway && createdBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <PaymentGateway 
              booking={createdBooking}
              onSuccess={() => {
                setShowPaymentGateway(false);
                navigate('/user', { 
                  state: { 
                    activeTab: 'bookings',
                    message: 'Booking confirmed! Payment successful.',
                    bookingId: createdBooking._id
                  }
                });
              }}
              onCancel={() => {
                setShowPaymentGateway(false);
              }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BookingPage;