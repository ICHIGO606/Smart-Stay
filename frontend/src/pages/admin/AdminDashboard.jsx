import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import adminHotelService from '../../services/adminHotelService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalRooms: 0,
    bookedRooms: 0,
    availableRooms: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    occupancyRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch hotels and rooms data
      const hotelsResponse = await adminHotelService.getAdminHotels();
      const hotels = hotelsResponse.data || [];
      
      // Calculate hotel and room statistics
      const totalHotels = hotels.length;
      const totalRooms = hotels.reduce((sum, hotel) => sum + (hotel.rooms?.reduce((roomSum, room) => roomSum + (room.roomNumbers?.length || 0), 0) || 0), 0);
      const bookedRooms = hotels.reduce((sum, hotel) => {
        const hotelBookedRooms = hotel.rooms?.filter(room => room.status === 'booked').reduce((roomSum, room) => roomSum + (room.roomNumbers?.length || 0), 0) || 0;
        return sum + hotelBookedRooms;
      }, 0);
      const availableRooms = totalRooms - bookedRooms;
      const occupancyRate = totalRooms > 0 ? (bookedRooms / totalRooms) * 100 : 0;

      // Fetch all bookings data using pagination
      let allBookings = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const bookingsResponse = await bookingService.getAllBookings({ page, limit });
        const bookingsPage = bookingsResponse.data?.bookings || [];
        allBookings = allBookings.concat(bookingsPage);

        // If the number of bookings returned is less than the limit, we've reached the last page
        hasMore = bookingsPage.length === limit;
        page += 1;
      }

      // Calculate booking statistics
      const totalBookings = allBookings.length;
      const pendingBookings = allBookings.filter(b => b.bookingStatus === 'Pending').length;
      const confirmedBookings = allBookings.filter(b => b.bookingStatus === 'Confirmed').length;
      const cancelledBookings = allBookings.filter(b => b.bookingStatus === 'Cancelled').length;
      const totalRevenue = allBookings
        .filter(b => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Completed')
        .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      
      // Calculate monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const monthlyRevenue = allBookings
        .filter(b => (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Completed') && 
                    new Date(b.createdAt) >= thirtyDaysAgo)
        .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

      setStats({
        totalHotels,
        totalRooms,
        bookedRooms,
        availableRooms,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue,
        monthlyRevenue,
        occupancyRate: Math.round(occupancyRate)
      });

    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, link, subtitle }) => (
    <Link 
      to={link} 
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome to your SmartStay administration panel</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {/* Hotels Statistics */}
        <StatCard
          title="Total Hotels"
          value={stats.totalHotels}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9m0 12h4m-4 0V9"/>
            </svg>
          }
          color="bg-blue-100"
          link="/admin/hotels"
        />

        <StatCard
          title="Total Rooms"
          value={stats.totalRooms}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-4l-2-2H7a2 2 0 00-2 2z"/>
            </svg>
          }
          color="bg-green-100"
          link="/admin/hotels"
        />

        <StatCard
          title="Booked Rooms"
          value={stats.bookedRooms}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
          }
          color="bg-purple-100"
          link="/admin/bookings"
        />

        <StatCard
          title="Available Rooms"
          value={stats.availableRooms}
          icon={
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
          color="bg-teal-100"
          link="/admin/hotels"
        />

        {/* Bookings Statistics */}
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          }
          color="bg-indigo-100"
          link="/admin/bookings"
        />

        <StatCard
          title="Pending Bookings"
          value={stats.pendingBookings}
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
          color="bg-yellow-100"
          link="/admin/bookings?status=pending"
        />

        <StatCard
          title="Confirmed Bookings"
          value={stats.confirmedBookings}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
            </svg>
          }
          color="bg-green-100"
          link="/admin/bookings?status=confirmed"
        />

        <StatCard
          title="Cancelled Bookings"
          value={stats.cancelledBookings}
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          }
          color="bg-red-100"
          link="/admin/bookings?status=cancelled"
        />

        {/* Revenue Statistics */}
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
            </svg>
          }
          color="bg-emerald-100"
          link="/admin/bookings"
        />

        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          }
          color="bg-blue-100"
          link="/admin/bookings"
          subtitle="Last 30 days"
        />

        <StatCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          }
          color="bg-orange-100"
          link="/admin/hotels"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/hotels"
            className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9m0 12h4m-4 0V9"/>
            </svg>
            Manage Hotels
          </Link>

          <Link
            to="/admin/bookings"
            className="flex items-center justify-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            View Bookings
          </Link>

          <Link
            to="/admin/hotels?action=create"
            className="flex items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Add New Hotel
          </Link>

          <Link
            to="/admin/bookings?status=pending"
            className="flex items-center justify-center p-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Pending Approvals
          </Link>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <button
            onClick={fetchDashboardStats}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
        </div>
        
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <p className="text-gray-500">Recent activity feed will be displayed here</p>
          <p className="text-sm text-gray-400 mt-1">This section can show latest bookings, hotel updates, etc.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;