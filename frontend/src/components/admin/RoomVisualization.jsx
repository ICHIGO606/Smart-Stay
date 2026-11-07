import { useState, useEffect } from "react";
import adminHotelService from "../../services/adminHotelService";
import { API_BASE_URL } from "../../services/api";
import { FileSpreadsheet, RefreshCw, Radio, QrCode } from "lucide-react";
import CheckInStationModal from "./CheckInStationModal";

const RoomVisualization = ({ hotelId, onRoomSelect }) => {
  const [floors, setFloors] = useState({});
  const [selectedFloor, setSelectedFloor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  // Operational status & live sync state (Pillars 3 & 4)
  const [liveConnected, setLiveConnected] = useState(false);
  const [modalStatus, setModalStatus] = useState("Available");
  const [modalNotes, setModalNotes] = useState("");
  const [opStatusUpdating, setOpStatusUpdating] = useState(false);
  const [statusSuccessMsg, setStatusSuccessMsg] = useState("");

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await adminHotelService.getHotelRoomsStatus(hotelId);

      const data = response.data || {};
      setFloors(data.floors || {});

      const availableFloors = Object.keys(data.floors || {});
      if (availableFloors.length > 0 && !selectedFloor) {
        setSelectedFloor(availableFloors[0]);
      }
    } catch (error) {
      console.error("RoomVisualization error:", error);
      setError(error.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) fetchRooms();
  }, [hotelId]);

  // Server-Sent Events (SSE) Live Floor Sync (Pillar 4)
  useEffect(() => {
    if (!hotelId) return;

    const token = localStorage.getItem("accessToken") || "";
    let eventSource = null;

    try {
      const sseUrl = `${API_BASE_URL}/admin/hotels/${hotelId}/live-stream?token=${encodeURIComponent(token)}`;
      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.onopen = () => {
        setLiveConnected(true);
      };

      eventSource.addEventListener("connected", () => {
        setLiveConnected(true);
      });

      eventSource.addEventListener("room_status_changed", (event) => {
        try {
          const update = JSON.parse(event.data);
          setFloors((prevFloors) => {
            const updated = { ...prevFloors };
            for (const fl in updated) {
              updated[fl] = updated[fl].map((rm) => {
                if (Number(rm.roomNumber) === Number(update.roomNumber)) {
                  return {
                    ...rm,
                    operationalStatus: update.operationalStatus,
                    status:
                      update.operationalStatus === "Available"
                        ? "Available"
                        : update.operationalStatus,
                    notes: update.notes,
                    updatedAt: update.updatedAt,
                  };
                }
                return rm;
              });
            }
            return updated;
          });
        } catch (e) {
          console.error("SSE parse error:", e);
        }
      });

      const handleLiveBookingRefresh = () => {
        adminHotelService
          .getHotelRoomsStatus(hotelId)
          .then((res) => {
            if (res.data?.floors) {
              setFloors(res.data.floors);
            }
          })
          .catch(() => {});
      };

      eventSource.addEventListener("booking_created", handleLiveBookingRefresh);
      eventSource.addEventListener(
        "booking_status_updated",
        handleLiveBookingRefresh,
      );
      eventSource.addEventListener(
        "booking_cancelled",
        handleLiveBookingRefresh,
      );
      eventSource.addEventListener(
        "payment_confirmed",
        handleLiveBookingRefresh,
      );

      eventSource.onerror = () => {
        setLiveConnected(false);
      };
    } catch (err) {
      console.error("SSE connection error:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [hotelId]);

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setModalStatus(
      room.operationalStatus ||
        (room.status === "Booked" ? "Reserved" : "Available"),
    );
    setModalNotes(room.notes || "");
    setStatusSuccessMsg("");
    setShowRoomModal(true);
    if (onRoomSelect) onRoomSelect(room);
  };

  const handleUpdateOperationalStatus = async () => {
    if (!selectedRoom || !selectedRoom.roomId) return;
    try {
      setOpStatusUpdating(true);
      await adminHotelService.updateRoomOperationalStatus(
        hotelId,
        selectedRoom.roomId,
        {
          roomNumber: selectedRoom.roomNumber,
          status: modalStatus,
          notes: modalNotes,
        },
      );

      setFloors((prev) => {
        const updated = { ...prev };
        for (const fl in updated) {
          updated[fl] = updated[fl].map((r) => {
            if (Number(r.roomNumber) === Number(selectedRoom.roomNumber)) {
              return {
                ...r,
                operationalStatus: modalStatus,
                status: modalStatus === "Available" ? "Available" : modalStatus,
                notes: modalNotes,
                updatedAt: new Date(),
              };
            }
            return r;
          });
        }
        return updated;
      });

      setSelectedRoom((prev) => ({
        ...prev,
        operationalStatus: modalStatus,
        status: modalStatus === "Available" ? "Available" : modalStatus,
        notes: modalNotes,
      }));

      setStatusSuccessMsg("Operational status synced successfully!");
      setTimeout(() => setStatusSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(err.message || "Failed to update room status");
    } finally {
      setOpStatusUpdating(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await adminHotelService.exportBookingsCsv(hotelId);
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "text/csv" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `hotel-${hotelId}-bookings-${Date.now()}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Failed to export CSV:", err);
      alert("Failed to export bookings CSV");
    }
  };

  const getStatusBadge = (room) => {
    const op =
      room.operationalStatus ||
      (room.status === "Booked" ? "Reserved" : "Available");
    switch (op) {
      case "Available":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          dot: "bg-emerald-600",
          label: "Available",
        };
      case "Reserved":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          dot: "bg-blue-600",
          label: "Reserved",
        };
      case "Occupied":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          dot: "bg-amber-600",
          label: "Occupied",
        };
      case "Dirty":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          dot: "bg-rose-600",
          label: "Dirty",
        };
      case "Cleaning":
        return {
          bg: "bg-purple-50 text-purple-800 border-purple-200",
          dot: "bg-purple-600",
          label: "Cleaning",
        };
      case "Maintenance":
        return {
          bg: "bg-stone-100 text-stone-700 border-stone-300",
          dot: "bg-stone-500",
          label: "Maintenance",
        };
      default:
        return {
          bg: "bg-stone-100 text-stone-700 border-stone-200",
          dot: "bg-stone-400",
          label: op,
        };
    }
  };

  const getFilteredRooms = (floorRooms) => {
    if (filterStatus === "all") return floorRooms;
    if (filterStatus === "available")
      return floorRooms.filter(
        (r) => (r.operationalStatus || r.status) === "Available",
      );
    if (filterStatus === "booked" || filterStatus === "reserved")
      return floorRooms.filter(
        (r) => r.status === "Booked" || r.operationalStatus === "Reserved",
      );
    if (filterStatus === "occupied")
      return floorRooms.filter((r) => r.operationalStatus === "Occupied");
    if (filterStatus === "dirty")
      return floorRooms.filter((r) => r.operationalStatus === "Dirty");
    if (filterStatus === "cleaning")
      return floorRooms.filter((r) => r.operationalStatus === "Cleaning");
    if (filterStatus === "maintenance")
      return floorRooms.filter((r) => r.operationalStatus === "Maintenance");
    return floorRooms;
  };

  const getRoomStats = () => {
    const allRooms = Object.values(floors).flat();
    const total = allRooms.length;
    const booked = allRooms.filter(
      (r) =>
        r.status === "Booked" ||
        r.operationalStatus === "Occupied" ||
        r.operationalStatus === "Reserved",
    ).length;
    const available = allRooms.filter(
      (r) => (r.operationalStatus || r.status) === "Available",
    ).length;
    const occupancyRate = total > 0 ? ((booked / total) * 100).toFixed(1) : 0;

    return { total, booked, available, occupancyRate };
  };

  const renderRoomGrid = (floorRooms) => {
    const filteredRooms = getFilteredRooms(floorRooms);

    if (filteredRooms.length === 0) {
      return (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="text-gray-600">No rooms match the current filter</p>
        </div>
      );
    }

    const rows = [];
    for (let i = 0; i < filteredRooms.length; i += 6) {
      rows.push(filteredRooms.slice(i, i + 6));
    }

    return rows.map((row, rowIndex) => (
      <div key={rowIndex} className="flex justify-center gap-3 mb-3">
        {row.map((room) => {
          const badge = getStatusBadge(room);
          return (
            <div
              key={room.roomNumber}
              onClick={() => handleRoomClick(room)}
              className={`relative group w-24 h-20 rounded-control border p-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                room.status === "Booked" ||
                room.operationalStatus === "Occupied"
                  ? "bg-stone-100 border-stone-200 text-ink-muted"
                  : "bg-white border-stone-200 hover:border-stone-400 text-ink-primary shadow-subtle"
              }`}
            >
              <div className="text-sm font-semibold font-mono tabular-nums">
                № {room.roomNumber}
              </div>

              <div className="text-[10px] font-mono text-ink-muted truncate max-w-[80px] mt-0.5">
                {room.roomType}
              </div>

              <div
                className={`absolute top-2 right-2 w-2 h-2 rounded-full ${badge.dot}`}
              ></div>

              <div className="absolute bottom-full mb-2 hidden group-hover:block z-20">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                  <p className="font-semibold">
                    № {room.roomNumber} - {room.roomType}
                  </p>
                  <p className="text-gray-300 mt-1">
                    Status:{" "}
                    <span className="text-white font-mono">{badge.label}</span>
                  </p>
                  {room.notes && (
                    <p className="text-amber-300 text-[11px] mt-1 italic">
                      Note: {room.notes}
                    </p>
                  )}
                  {room.bookingDetails?.user && (
                    <p className="text-gray-300 mt-1">
                      Guest: {room.bookingDetails.user.fullName}
                    </p>
                  )}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ));
  };

  const renderListView = (floorRooms) => {
    const filteredRooms = getFilteredRooms(floorRooms);

    if (filteredRooms.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">No rooms match the current filter</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room) => {
          const badge = getStatusBadge(room);
          return (
            <div
              key={room.roomNumber}
              onClick={() => handleRoomClick(room)}
              className="card-base p-4 cursor-pointer hover:border-stone-400 transition-all bg-white"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold font-mono text-ink-primary">
                    № {room.roomNumber}
                  </h4>
                  <p className="text-xs text-ink-muted">{room.roomType}</p>
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono border ${badge.bg}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}
                  ></span>
                  <span>{badge.label}</span>
                </div>
              </div>

              {room.notes && (
                <div className="text-xs text-ink-secondary mb-2 bg-stone-50 p-2 rounded border border-stone-100">
                  <span className="font-mono text-[10px] text-ink-muted block uppercase">
                    Notes:
                  </span>
                  <span>{room.notes}</span>
                </div>
              )}

              {room.bookingDetails && (
                <div className="text-xs space-y-1 pt-3 border-t border-stone-100 text-ink-secondary">
                  <p>
                    <span className="text-ink-muted font-mono">Guest:</span>{" "}
                    {room.bookingDetails.user?.fullName || "Guest"}
                  </p>
                  <p className="text-ink-muted text-[11px] font-mono">
                    {new Date(
                      room.bookingDetails.checkInDate,
                    ).toLocaleDateString()}{" "}
                    —{" "}
                    {new Date(
                      room.bookingDetails.checkOutDate,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading room data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Rooms
            </h3>
            <p className="text-red-600 mb-6">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const availableFloors = Object.keys(floors);
  const currentFloor = selectedFloor || availableFloors[0];
  const floorRooms = floors[currentFloor] || [];
  const stats = getRoomStats();

  if (availableFloors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Rooms Available
          </h3>
          <p className="text-gray-600 mb-4">
            This hotel doesn't have any rooms configured yet.
          </p>
          <p className="text-sm text-gray-500">
            Add rooms to see the visualization here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink-primary font-serif">
              Front-Desk & Room Operations
            </h1>
            <p className="text-xs text-ink-muted">
              Live floor inventory synchronization & housekeeping lifecycle
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCheckInModal(true)}
              className="btn-primary !text-xs !py-1.5 inline-flex items-center gap-1.5"
            >
              <QrCode size={13} />
              <span>Check-In Desk</span>
            </button>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-white border border-stone-200 shadow-subtle">
              <span
                className={`w-2 h-2 rounded-full ${liveConnected ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`}
              ></span>
              <span className="text-stone-700">
                {liveConnected ? "Live Sync Active" : "Connecting..."}
              </span>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn-secondary !text-xs !py-1.5 inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet size={13} className="text-emerald-700" />
              <span>Export Bookings CSV</span>
            </button>
            <button
              type="button"
              onClick={fetchRooms}
              className="btn-secondary !text-xs !py-1.5 inline-flex items-center gap-1.5"
              title="Manual Refresh"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.available}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Booked</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.booked}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Occupancy</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.occupancyRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Floor
              </label>
              <div className="flex flex-wrap gap-2">
                {availableFloors.map((floor) => (
                  <button
                    key={floor}
                    onClick={() => setSelectedFloor(floor)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      currentFloor === floor
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Floor {floor}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-md transition-all duration-300 ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-md transition-all duration-300 ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-stone-900 focus:outline-none"
              >
                <option value="all">All Rooms</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved / Booked</option>
                <option value="occupied">Occupied</option>
                <option value="dirty">Dirty</option>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Floor {currentFloor} Layout
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({getFilteredRooms(floorRooms).length} rooms)
              </span>
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>Dirty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                <span>Cleaning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-stone-500"></span>
                <span>Maintenance</span>
              </div>
            </div>
          </div>

          {viewMode === "grid"
            ? renderRoomGrid(floorRooms)
            : renderListView(floorRooms)}
        </div>
      </div>

      {showRoomModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div
              className={`p-6 border-b ${
                selectedRoom.status === "Booked"
                  ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
                  : "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Room {selectedRoom.roomNumber}
                  </h3>
                  <p className="text-gray-600">{selectedRoom.roomType}</p>
                </div>
                <button
                  onClick={() => setShowRoomModal(false)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    selectedRoom.status === "Booked"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      selectedRoom.status === "Booked"
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                  ></div>
                  {selectedRoom.status === "Booked" ? "Booked" : "Available"}
                </div>
              </div>

              {selectedRoom.status === "Booked" &&
                selectedRoom.bookingDetails && (
                  <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      Booking Details
                    </h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-24">
                          Booking Account:
                        </span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedRoom.bookingDetails.user?.fullName ||
                            "Unknown"}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-24">
                          Email:
                        </span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedRoom.bookingDetails.user?.email || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-24">
                          Check-in:
                        </span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(
                            selectedRoom.bookingDetails.checkInDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-24">
                          Check-out:
                        </span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(
                            selectedRoom.bookingDetails.checkOutDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-24">
                          Status:
                        </span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedRoom.bookingDetails.bookingStatus}
                        </span>
                      </div>

                      {/* <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-24">
                          Payment:
                        </span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedRoom.bookingDetails.paymentStatus}
                        </span>
                      </div> */}

                      {selectedRoom.bookingDetails.guests &&
                        selectedRoom.bookingDetails.guests.length > 0 && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-600">
                              Guests:
                            </span>
                            <ul className="ml-4 list-disc mt-1 text-gray-900">
                              {selectedRoom.bookingDetails.guests.map(
                                (guest, idx) => (
                                  <li key={idx}>
                                    {guest.fullName} ({guest.age} yrs)
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                )}

              {selectedRoom.status !== "Booked" && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-4">
                  <p className="text-emerald-800 text-xs text-center font-mono">
                    This room is currently unreserved and available for guest
                    allocation.
                  </p>
                </div>
              )}

              {/* Front-Desk Operational Lifecycle Management (Pillar 3) */}
              <div className="mt-4 pt-4 border-t border-stone-200">
                <label className="block text-xs font-mono uppercase text-ink-muted mb-2 font-semibold">
                  Front-Desk Operational State
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    "Available",
                    "Reserved",
                    "Occupied",
                    "Dirty",
                    "Cleaning",
                    "Maintenance",
                  ].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalStatus(st)}
                      className={`px-2 py-1.5 text-xs font-mono rounded-control border transition-all text-center ${
                        modalStatus === st
                          ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                          : "bg-white text-ink-secondary border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-mono text-ink-muted mb-1">
                    Housekeeping / Front-Desk Notes
                  </label>
                  <textarea
                    rows={2}
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="e.g., Guest requested extra pillows, maintenance check complete"
                    className="w-full text-xs p-2 rounded-control border border-stone-200 focus:border-stone-900 focus:outline-none"
                  />
                </div>

                {statusSuccessMsg && (
                  <p className="text-xs text-emerald-700 font-medium mb-3">
                    {statusSuccessMsg}
                  </p>
                )}

                <button
                  type="button"
                  disabled={opStatusUpdating}
                  onClick={handleUpdateOperationalStatus}
                  className="btn-primary w-full !text-xs !py-2.5 inline-flex items-center justify-center gap-1.5"
                >
                  {opStatusUpdating
                    ? "Synchronizing..."
                    : "Save Operational Status"}
                </button>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRoomModal(false)}
                className="btn-secondary !text-xs !py-1.5 !px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Front-Desk Check-In Station Modal (Option 1) */}
      <CheckInStationModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onCheckInComplete={() => fetchRooms()}
      />
    </div>
  );
};

export default RoomVisualization;
