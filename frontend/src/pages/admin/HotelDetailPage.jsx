import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import adminHotelService from "../../services/adminHotelService";
import { hotelService } from "../../services/hotelService";
import HotelForm from "../../components/admin/HotelForm";
import RoomForm from "../../components/admin/RoomForm";
import RoomVisualization from "../../components/admin/RoomVisualization";
import CheckInStationModal from "../../components/admin/CheckInStationModal";
import adminService from "../../services/adminService";
import { formatCurrency } from "../../utils/formatters";
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  BedDouble,
  AlertCircle,
  Check,
  Eye,
  QrCode,
} from "lucide-react";

const HotelDetailPage = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showRoomVisualization, setShowRoomVisualization] = useState(false);
  const [showCheckInStation, setShowCheckInStation] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [viewMode, setViewMode] = useState("details");

  const fetchHotelDetails = useCallback(async () => {
    try {
      setLoading(true);
      const hotelResponse = await hotelService.getHotelDetails(hotelId);
      const roomsResponse = await adminService.getRooms(hotelId);

      if (hotelResponse.data) {
        setHotel({
          ...hotelResponse.data,
          rooms: roomsResponse.data?.data || [],
        });
      } else {
        setError("Hotel not found");
      }
    } catch (err) {
      console.error("Error fetching hotel details:", err);
      setError(err.response?.data?.message || "Failed to fetch hotel details");
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchHotelDetails();
  }, [fetchHotelDetails]);

  const handleUpdateHotel = async (hotelData) => {
    try {
      await adminHotelService.updateHotel(hotelId, hotelData);
      setSuccess("Hotel dossier updated");
      setViewMode("details");
      fetchHotelDetails();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update hotel");
    }
  };

  const handleCreateRoom = async (roomData) => {
    try {
      await adminHotelService.createRoom(hotelId, roomData);
      setSuccess("Room tier created");
      setShowRoomForm(false);
      fetchHotelDetails();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
    }
  };

  const handleUpdateRoom = async (roomData) => {
    try {
      await adminHotelService.updateRoom(hotelId, selectedRoom._id, roomData);
      setSuccess("Room tier updated");
      setShowRoomForm(false);
      setSelectedRoom(null);
      fetchHotelDetails();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update room");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm("Delete this room tier from the hotel catalog?")) {
      try {
        await adminHotelService.deleteRoom(hotelId, roomId);
        setSuccess("Room tier deleted");
        fetchHotelDetails();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete room");
      }
    }
  };

  const handleEditRoom = (room) => {
    setSelectedRoom(room);
    setShowRoomForm(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <p className="text-xs font-mono text-ink-muted">
          Reading property records...
        </p>
      </div>
    );
  }

  if (error && !hotel) {
    return (
      <div className="card-base p-6 max-w-lg mx-auto text-center">
        <p className="text-sm font-medium text-ink-primary mb-2">{error}</p>
        <button
          onClick={() => navigate("/admin/hotels")}
          className="btn-secondary !text-xs inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={13} />
          <span>Return to hotels</span>
        </button>
      </div>
    );
  }

  if (showRoomForm) {
    return (
      <RoomForm
        hotel={hotel}
        initialData={selectedRoom}
        onSubmit={selectedRoom ? handleUpdateRoom : handleCreateRoom}
        onCancel={() => {
          setShowRoomForm(false);
          setSelectedRoom(null);
        }}
      />
    );
  }

  if (showRoomVisualization) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-200/80">
          <button
            onClick={() => setShowRoomVisualization(false)}
            className="btn-secondary !text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>
          <h2 className="font-serif text-2xl text-ink-primary font-normal">
            Room spatial map · {hotel.name}
          </h2>
        </div>
        <RoomVisualization hotelId={hotelId} rooms={hotel.rooms} />
      </div>
    );
  }

  if (viewMode === "edit") {
    return (
      <div className="space-y-6">
        <HotelForm
          initialData={hotel}
          onSubmit={handleUpdateHotel}
          onCancel={() => setViewMode("details")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-6 border-b border-stone-200/80 gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/hotels")}
            className="btn-secondary !text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1"
          >
            <ArrowLeft size={13} />
            <span>Hotels</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="tag-signature">
                № {hotel._id ? hotel._id.slice(-4).toUpperCase() : "PROP"}
              </span>
              <span className="text-xs font-mono text-ink-muted">
                {hotel.city}
              </span>
            </div>
            <h1 className="font-serif text-3xl text-ink-primary font-normal mt-0.5">
              {hotel.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCheckInStation(true)}
            className="btn-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
          >
            <QrCode size={12} />
            <span>Check-In Desk</span>
          </button>
          <button
            onClick={() => setViewMode("edit")}
            className="btn-secondary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
          >
            <Edit3 size={12} />
            <span>Edit hotel</span>
          </button>
          <button
            onClick={() => setShowRoomVisualization(true)}
            className="btn-secondary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
          >
            <Eye size={12} />
            <span>Spatial layout</span>
          </button>
          <button
            onClick={() => setShowRoomForm(true)}
            className="btn-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
          >
            <Plus size={12} />
            <span>Add room tier</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 rounded-control bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Check size={14} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Hotel Details Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 card-base p-6 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-ink-muted">
            Property specifications
          </h3>
          <div className="space-y-2 text-xs">
            <p>
              <span className="font-mono text-ink-muted">Address:</span>{" "}
              <span className="text-ink-primary font-medium">
                {hotel.address}
              </span>
            </p>
            <p>
              <span className="font-mono text-ink-muted">Description:</span>{" "}
              <span className="text-ink-secondary leading-relaxed">
                {hotel.description}
              </span>
            </p>
          </div>

          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="pt-2 border-t border-stone-100">
              <span className="text-[10px] font-mono uppercase text-ink-muted block mb-1.5">
                Amenities catalog
              </span>
              <div className="flex flex-wrap gap-1.5">
                {hotel.amenities.map((amenity, index) => (
                  <span key={index} className="tag-signature">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 card-base p-6">
          <h3 className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
            Property photography
          </h3>
          {hotel.images && hotel.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {hotel.images.map((image, index) => (
                <div
                  key={index}
                  className="aspect-[4/3] rounded-control overflow-hidden bg-stone-100 border border-stone-200"
                >
                  <img
                    src={image}
                    alt={`${hotel.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-mono text-ink-muted">
              No photography files registered
            </p>
          )}
        </div>
      </div>

      {/* Room Management Section */}
      <div className="card-base p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-semibold text-ink-primary">
              Room tiers & allocations
            </h3>
            <p className="text-xs text-ink-muted">
              Catalog of room types and assigned key numbers
            </p>
          </div>
          <button
            onClick={() => setShowRoomForm(true)}
            className="btn-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
          >
            <Plus size={12} />
            <span>Add room</span>
          </button>
        </div>

        {hotel.rooms && hotel.rooms.length > 0 ? (
          <div className="space-y-3">
            {hotel.rooms.map((room) => (
              <div
                key={room._id}
                className="p-4 rounded-control border border-stone-200/80 bg-stone-50/40 hover:border-stone-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="tag-signature">
                        № {room._id ? room._id.slice(-3).toUpperCase() : "01"}
                      </span>
                      <h4 className="text-sm font-semibold text-ink-primary">
                        {room.type}
                      </h4>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-ink-muted">
                      <span>
                        Rate:{" "}
                        <strong className="text-ink-primary tabular-nums">
                          {formatCurrency(room.pricePerNight)}
                        </strong>
                        /night
                      </span>
                      <span>·</span>
                      <span>
                        Max occupancy:{" "}
                        <strong className="text-ink-primary tabular-nums">
                          {room.maxOccupancy}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Keys:{" "}
                        <strong className="text-ink-secondary">
                          {[
                            ...(room.availableRoomNumbers || []),
                            ...(room.roomNumbers || []),
                          ].join(", ") || "Unassigned"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditRoom(room)}
                      className="btn-secondary !text-xs !py-1 !px-2.5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room._id)}
                      className="text-stone-400 hover:text-red-700 p-1.5 transition-colors"
                      aria-label="Delete room"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <BedDouble size={22} className="text-stone-300 mx-auto mb-2" />
            <p className="text-xs text-ink-secondary font-medium">
              No room tiers registered
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5 mb-3">
              Add standard or deluxe room inventory to receive bookings.
            </p>
            <button
              onClick={() => setShowRoomForm(true)}
              className="btn-primary !text-xs !py-1.5 !px-3"
            >
              Add first room
            </button>
          </div>
        )}
      </div>

      {/* Front-Desk Check-In Station Modal (Option 1) */}
      <CheckInStationModal
        isOpen={showCheckInStation}
        onClose={() => setShowCheckInStation(false)}
        onCheckInComplete={() => fetchHotelDetails()}
      />
    </div>
  );
};

export default HotelDetailPage;
