import { useState } from 'react';

const RoomForm = ({ hotel, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: '',
    pricePerNight: '',
    maxOccupancy: '',
    description: '',
    roomNumbers: [''],
    amenities: [],
    images: []
  });
  
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roomTypes = [
    'Standard', 'Deluxe', 'Superior', 'Executive', 'Suite',
    'Family', 'Presidential', 'Business', 'Ocean View', 'Mountain View'
  ];

  const roomAmenitiesOptions = [
    'TV', 'AC', 'Mini Bar', 'Safe', 'Hair Dryer',
    'Coffee Maker', 'Iron', 'Desk', 'Balcony', 'Bathtub',
    'Shower', 'Toiletries', 'Slippers', 'Bathrobe'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoomNumberChange = (index, value) => {
    const newRoomNumbers = [...formData.roomNumbers];
    newRoomNumbers[index] = value;
    setFormData(prev => ({
      ...prev,
      roomNumbers: newRoomNumbers
    }));
  };

  const addRoomNumber = () => {
    setFormData(prev => ({
      ...prev,
      roomNumbers: [...prev.roomNumbers, '']
    }));
  };

  const removeRoomNumber = (index) => {
    if (formData.roomNumbers.length > 1) {
      const newRoomNumbers = formData.roomNumbers.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        roomNumbers: newRoomNumbers
      }));
    }
  };

  const handleAmenityChange = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    setFormData(prev => ({
      ...prev,
      images: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate room numbers
    const validRoomNumbers = formData.roomNumbers.filter(num => num.trim() !== '');
    if (validRoomNumbers.length === 0) {
      setError('Please add at least one room number');
      setLoading(false);
      return;
    }

    try {
      await onSubmit({
        ...formData,
        roomNumbers: validRoomNumbers,
        pricePerNight: parseFloat(formData.pricePerNight),
        maxOccupancy: parseInt(formData.maxOccupancy)
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-primary mr-4"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-primary">
          Add Room to {hotel.name}
        </h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select room type</option>
              {roomTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Per Night ($) *
            </label>
            <input
              type="number"
              name="pricePerNight"
              value={formData.pricePerNight}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter price"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Occupancy *
            </label>
            <input
              type="number"
              name="maxOccupancy"
              value={formData.maxOccupancy}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter max guests"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Room description and features"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room Numbers *
          </label>
          <div className="space-y-2">
            {formData.roomNumbers.map((number, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={number}
                  onChange={(e) => handleRoomNumberChange(index, e.target.value)}
                  placeholder="Room number"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => removeRoomNumber(index)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRoomNumber}
              className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              + Add Another Room Number
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room Amenities
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {roomAmenitiesOptions.map((amenity) => (
              <label key={amenity} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => handleAmenityChange(amenity)}
                  className="mr-2"
                />
                <span className="text-sm">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {selectedImages.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {selectedImages.length} image(s) selected
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomForm;