import { useState } from 'react';
import { ArrowLeft, AlertCircle, Plus, Trash2 } from 'lucide-react';

const RoomForm = ({ hotel, onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    type: initialData?.type || '',
    pricePerNight: initialData?.pricePerNight || '',
    maxOccupancy: initialData?.maxOccupancy || '',
    description: initialData?.description || '',
    roomNumbers: Array.isArray(initialData?.roomNumbers)
      ? initialData.roomNumbers.map((number) => String(number ?? ''))
      : [''],
    amenities: initialData?.amenities || [],
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

    const validRoomNumbers = formData.roomNumbers
      .map((number) => String(number ?? '').trim())
      .filter(Boolean);
    if (validRoomNumbers.length === 0) {
      setError('Please provide at least one room key / number');
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-stone-200/80">
        <button
          onClick={onCancel}
          className="btn-secondary !text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>
        <div>
          <h2 className="font-serif text-2xl text-ink-primary font-normal">
            {initialData ? 'Edit room tier' : 'Add room tier'} · {hotel.name}
          </h2>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-control bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-base p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
              Room tier *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              className="input-base bg-white"
            >
              <option value="">Select tier</option>
              {roomTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
              Nightly tariff ($) *
            </label>
            <input
              type="number"
              name="pricePerNight"
              value={formData.pricePerNight}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="input-base tabular-nums"
              placeholder="e.g. 280"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
              Max guest occupancy *
            </label>
            <input
              type="number"
              name="maxOccupancy"
              value={formData.maxOccupancy}
              onChange={handleInputChange}
              required
              min="1"
              className="input-base tabular-nums"
              placeholder="e.g. 2"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
              Room spatial description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className="input-base resize-none"
              placeholder="Acoustic insulation, bedding materials, natural lighting..."
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
            Assigned room keys & numbers *
          </label>
          <div className="space-y-2">
            {formData.roomNumbers.map((number, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="font-mono text-xs text-ink-muted w-6">№</span>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => handleRoomNumberChange(index, e.target.value)}
                  placeholder="e.g. 101"
                  className="input-base max-w-xs"
                />
                {formData.roomNumbers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoomNumber(index)}
                    className="text-stone-400 hover:text-red-700 p-1.5 transition-colors"
                    aria-label="Remove room"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRoomNumber}
              className="btn-secondary !text-xs !py-1 !px-2.5 inline-flex items-center gap-1 mt-1"
            >
              <Plus size={12} />
              <span>Add another room number</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-2">
            Room amenities
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {roomAmenitiesOptions.map((amenity) => (
              <label 
                key={amenity} 
                className={`flex items-center gap-2 p-2 rounded-control border text-xs cursor-pointer transition-colors ${
                  formData.amenities.includes(amenity)
                    ? 'border-stone-900 bg-stone-50 font-medium text-ink-primary'
                    : 'border-stone-200 text-ink-secondary hover:border-stone-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => handleAmenityChange(amenity)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-0"
                />
                <span>{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary !text-xs !py-2 !px-4"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary !text-xs !py-2 !px-5 font-mono uppercase tracking-wider"
          >
            {loading ? 'Recording...' : (initialData ? 'Update room' : 'Create room')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomForm;
