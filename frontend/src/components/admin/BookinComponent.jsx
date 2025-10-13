// src/components/admin/BookingDetails.jsx
import React from "react";

const BookingDetails = ({ selectedRoom }) => {
  if (selectedRoom.status !== 'Booked' || !selectedRoom.bookingDetails) return null;

  const { bookingDetails } = selectedRoom;

  return (
    <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
      <h4 className="font-semibold text-gray-900 text-lg">Booking Details</h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center">
          <span className="font-medium text-gray-600 w-24">Guest:</span>
          <span className="ml-2 font-medium text-gray-900">
            {bookingDetails.user?.fullName || 'Unknown'}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-medium text-gray-600 w-24">Email:</span>
          <span className="ml-2 font-medium text-gray-900">
            {bookingDetails.user?.email || 'N/A'}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-medium text-gray-600 w-24">Check-in:</span>
          <span className="ml-2 font-medium text-gray-900">
            {new Date(bookingDetails.checkInDate).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-medium text-gray-600 w-24">Check-out:</span>
          <span className="ml-2 font-medium text-gray-900">
            {new Date(bookingDetails.checkOutDate).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-medium text-gray-600 w-24">Status:</span>
          <span className="ml-2 font-medium text-gray-900">
            {bookingDetails.bookingStatus}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-medium text-gray-600 w-24">Payment:</span>
          <span className="ml-2 font-medium text-gray-900">
            {bookingDetails.paymentStatus}
          </span>
        </div>

        {bookingDetails.guests && bookingDetails.guests.length > 0 && (
          <div className="mt-2">
            <span className="font-medium text-gray-600">Additional Guests:</span>
            <ul className="ml-4 list-disc mt-1 text-gray-900">
              {bookingDetails.guests.map((guest, idx) => (
                <li key={idx}>
                  {guest.fullName} ({guest.age} yrs)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetails;
