import { useState, useEffect } from "react";
import adminHotelService from "../../services/adminHotelService";

const RoomVisualization = ({ hotelId, onRoomSelect }) => {
  const [floors, setFloors] = useState({});
  const [selectedFloor, setSelectedFloor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await adminHotelService.getHotelRoomsStatus(hotelId);

        const data = response.data || {};
        setFloors(data.floors || {});

        const availableFloors = Object.keys(data.floors || {});
        if (availableFloors.length > 0) {
          setSelectedFloor(availableFloors[0]);
        }
      } catch (error) {
        console.error("RoomVisualization error:", error);
        setError(error.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    if (hotelId) fetchRooms();
  }, [hotelId]);

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setShowRoomModal(true);
    if (onRoomSelect) onRoomSelect(room);
  };

  const getFilteredRooms = (floorRooms) => {
    if (filterStatus === "all") return floorRooms;
    if (filterStatus === "available")
      return floorRooms.filter((r) => r.status !== "Booked");
    if (filterStatus === "booked")
      return floorRooms.filter((r) => r.status === "Booked");
    return floorRooms;
  };

  const getRoomStats = () => {
    const allRooms = Object.values(floors).flat();
    const total = allRooms.length;
    const booked = allRooms.filter((r) => r.status === "Booked").length;
    const available = total - booked;
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
        {row.map((room) => (
          <div
            key={room.roomNumber}
            onClick={() => handleRoomClick(room)}
            className={`relative group w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              room.status === "Booked"
                ? "bg-gradient-to-br from-red-50 to-red-100 border-red-300 hover:border-red-400"
                : "bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:border-green-400"
            }`}
          >
            <div
              className={`text-lg font-bold ${
                room.status === "Booked" ? "text-red-700" : "text-green-700"
              }`}
            >
              {room.roomNumber}
            </div>

            <div
              className={`text-xs font-medium mt-1 ${
                room.status === "Booked" ? "text-red-600" : "text-green-600"
              }`}
            >
              {room.roomType}
            </div>

            <div
              className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                room.status === "Booked" ? "bg-red-500" : "bg-green-500"
              }`}
            ></div>

            <div className="absolute bottom-full mb-2 hidden group-hover:block">
              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                <p className="font-semibold">
                  {room.roomNumber} - {room.roomType}
                </p>
                <p className="text-gray-300 mt-1">
                  {room.status === "Booked" ? "Booked" : "Available"}
                </p>
                {room.status === "Booked" && room.bookingDetails && (
                  <p className="text-gray-300 mt-1">
                    {room.bookingDetails.user?.fullName || "Guest"}
                  </p>
                )}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
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
        {filteredRooms.map((room) => (
          <div
            key={room.roomNumber}
            onClick={() => handleRoomClick(room)}
            className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
              room.status === "Booked"
                ? "bg-red-50 border-red-200 hover:border-red-300"
                : "bg-green-50 border-green-200 hover:border-green-300"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4
                  className={`text-xl font-bold ${
                    room.status === "Booked" ? "text-red-700" : "text-green-700"
                  }`}
                >
                  {room.roomNumber}
                </h4>
                <p className="text-sm text-gray-600">{room.roomType}</p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  room.status === "Booked"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {room.status === "Booked" ? "Booked" : "Available"}
              </div>
            </div>

            {room.status === "Booked" && room.bookingDetails && (
              <div className="text-sm space-y-1 pt-3 border-t border-gray-200">
                <p className="text-gray-700">
                  <span className="font-medium">Guest:</span>{" "}
                  {room.bookingDetails.user?.fullName || "Unknown"}
                </p>
                <p className="text-gray-600 text-xs">
                  {new Date(
                    room.bookingDetails.checkInDate
                  ).toLocaleDateString()}{" "}
                  -{" "}
                  {new Date(
                    room.bookingDetails.checkOutDate
                  ).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        ))}
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Room Management
          </h1>

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
                  <p className="text-sm font-medium text-gray-600">
                    Total Rooms
                  </p>
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
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Rooms</option>
                <option value="available">Available Only</option>
                <option value="booked">Booked Only</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Floor {currentFloor} Layout
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({getFilteredRooms(floorRooms).length} rooms)
              </span>
            </h2>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded mr-2"></div>
                <span className="text-sm text-gray-700">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded mr-2"></div>
                <span className="text-sm text-gray-700">Booked</span>
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
                          {selectedRoom.bookingDetails.user?.fullName || "Unknown"}
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
                            selectedRoom.bookingDetails.checkInDate
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-24">
                          Check-out:
                        </span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(
                            selectedRoom.bookingDetails.checkOutDate
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
                              {selectedRoom.bookingDetails.guests.map((guest, idx) => (
                                <li key={idx}>
                                  {guest.fullName} ({guest.age} yrs)
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                )}

              {selectedRoom.status !== "Booked" && (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-green-800 text-center">
                    This room is currently available for booking.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t">
              <button
                onClick={() => setShowRoomModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomVisualization;
