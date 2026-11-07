import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import adminHotelService from '../../services/adminHotelService';
import HotelForm from '../../components/admin/HotelForm';
import { Building2, Plus, Trash2, ArrowRight, AlertCircle, MapPin } from 'lucide-react';

const HotelManagement = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHotelForm, setShowHotelForm] = useState(false);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminHotelService.getAdminHotels();
      if (response && response.data) {
        setHotels(Array.isArray(response.data) ? response.data : []);
      } else if (Array.isArray(response)) {
        setHotels(response);
      } else {
        setHotels([]);
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

  const handleDeleteHotel = async (hotelId) => {
    if (window.confirm('Delete this hotel property from the directory?')) {
      try {
        await adminHotelService.deleteHotel(hotelId);
        fetchHotels();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const calculateTotalRoomNumbers = (hotel) => {
    if (!hotel.rooms) return 0;
    return hotel.rooms.reduce((total, room) => {
      return total + (room.roomNumbers?.length || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <p className="text-xs font-mono text-ink-muted">Reading property registry...</p>
      </div>
    );
  }

  if (showHotelForm) {
    return (
      <div className="p-4 sm:p-6">
        <HotelForm
          onSubmit={handleCreateHotel}
          onCancel={() => setShowHotelForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-6 border-b border-stone-200/80 gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
            Directory management
          </p>
          <h1 className="font-serif text-3xl text-ink-primary font-normal">
            Hotel properties
          </h1>
        </div>

        <button
          onClick={() => setShowHotelForm(true)}
          className="btn-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
        >
          <Plus size={13} />
          <span>Add hotel</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {hotels.length === 0 ? (
        <div className="card-base text-center py-16 px-6">
          <Building2 size={24} className="text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-ink-primary">No hotel properties cataloged</p>
          <p className="text-xs text-ink-muted mt-1 mb-4">Register your first boutique property to start receiving reservations.</p>
          <button
            onClick={() => setShowHotelForm(true)}
            className="btn-primary !text-xs !py-1.5 !px-3"
          >
            Add hotel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <div 
              key={hotel._id} 
              className="card-base overflow-hidden flex flex-col justify-between hover:border-stone-300 transition-colors"
            >
              <div>
                <div className="h-44 bg-stone-100 overflow-hidden relative">
                  {hotel.images && hotel.images.length > 0 ? (
                    <img
                      src={hotel.images[0]}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-mono text-ink-muted">
                      No photo on ledger
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-tag text-[10px] font-mono text-ink-primary">
                    № {hotel._id ? hotel._id.slice(-4).toUpperCase() : 'HOTEL'}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-base font-semibold text-ink-primary mb-1">{hotel.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted font-mono mb-3">
                    <MapPin size={12} className="text-ink-secondary" />
                    <span>{hotel.city}</span>
                    {hotel.address && <span className="truncate">· {hotel.address}</span>}
                  </div>

                  <div className="flex items-center justify-between py-2 border-y border-stone-100 text-xs font-mono mb-4">
                    <span className="text-ink-secondary tabular-nums">
                      {calculateTotalRoomNumbers(hotel)} total rooms
                    </span>
                    <span className="text-ink-muted tabular-nums">
                      {hotel.rooms?.length || 0} room tiers
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/admin/hotels/${hotel._id}`)}
                  className="btn-secondary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
                >
                  <span>Manage rooms</span>
                  <ArrowRight size={12} />
                </button>
                <button
                  onClick={() => handleDeleteHotel(hotel._id)}
                  className="text-xs text-stone-400 hover:text-red-700 p-1.5 rounded-control transition-colors"
                  aria-label="Delete hotel"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HotelManagement;
