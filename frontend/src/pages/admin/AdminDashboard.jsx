import { useState, useEffect } from "react";
import { Link } from "react-router";
import bookingService from "../../services/bookingService";
import adminHotelService from "../../services/adminHotelService";
import {
  Building2,
  Calendar,
  DollarSign,
  Percent,
  ArrowUpRight,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

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
    occupancyRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const hotelsResponse = await adminHotelService
        .getAdminHotels()
        .catch(() => ({ data: [] }));
      const hotels = Array.isArray(hotelsResponse?.data)
        ? hotelsResponse.data
        : Array.isArray(hotelsResponse)
          ? hotelsResponse
          : [];

      const totalHotels = hotels.length;
      const totalRooms = hotels.reduce(
        (sum, hotel) =>
          sum +
          (hotel.rooms?.reduce(
            (roomSum, room) => roomSum + (room.roomNumbers?.length || 0),
            0,
          ) || 0),
        0,
      );
      const bookedRooms = hotels.reduce((sum, hotel) => {
        const hotelBookedRooms =
          hotel.rooms
            ?.filter((room) => room.status === "booked")
            .reduce(
              (roomSum, room) => roomSum + (room.roomNumbers?.length || 0),
              0,
            ) || 0;
        return sum + hotelBookedRooms;
      }, 0);
      const availableRooms = totalRooms - bookedRooms;
      const occupancyRate =
        totalRooms > 0 ? (bookedRooms / totalRooms) * 100 : 0;

      let allBookings = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const bookingsResponse = await bookingService.getAllBookings({
          page,
          limit,
        });
        const bookingsPage = bookingsResponse.data?.bookings || [];
        allBookings = allBookings.concat(bookingsPage);
        hasMore = bookingsPage.length === limit;
        page += 1;
      }

      const totalBookings = allBookings.length;
      const pendingBookings = allBookings.filter(
        (b) => b.bookingStatus === "Pending",
      ).length;
      const confirmedBookings = allBookings.filter(
        (b) => b.bookingStatus === "Confirmed",
      ).length;
      const cancelledBookings = allBookings.filter(
        (b) => b.bookingStatus === "Cancelled",
      ).length;
      const totalRevenue = allBookings
        .filter(
          (b) =>
            b.bookingStatus === "Confirmed" || b.bookingStatus === "Completed",
        )
        .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const monthlyRevenue = allBookings
        .filter(
          (b) =>
            (b.bookingStatus === "Confirmed" ||
              b.bookingStatus === "Completed") &&
            new Date(b.createdAt) >= thirtyDaysAgo,
        )
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
        occupancyRate: Math.round(occupancyRate),
      });
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <p className="text-xs font-mono text-ink-muted">
          Compiling portfolio metrics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="card-base p-6 border-red-200 bg-red-50/50">
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="mt-3 btn-secondary !text-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Retry query</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-6 border-b border-stone-200/80 gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
            Operations summary
          </p>
          <h1 className="font-serif text-3xl text-ink-primary font-normal">
            Property & booking ledger
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardStats}
            className="btn-secondary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={12} className="text-ink-secondary" />
            <span>Sync</span>
          </button>
          <Link
            to="/admin/hotels?action=create"
            className="btn-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Add hotel</span>
          </Link>
        </div>
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy Rate */}
        <div className="card-base p-5">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2 font-mono">
            <span>Room occupancy</span>
            <Percent size={13} className="text-ink-secondary" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-semibold text-ink-primary tabular-nums">
              {stats.occupancyRate}%
            </span>
            <span className="text-xs text-ink-muted font-mono">
              portfolio average
            </span>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-stone-900 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-ink-muted mt-2 font-mono tabular-nums">
            {stats.bookedRooms} booked of {stats.totalRooms} rooms
          </p>
        </div>

        {/* Monthly Revenue */}
        <div className="card-base p-5">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2 font-mono">
            <span>30-day revenue</span>
            <DollarSign size={13} className="text-ink-secondary" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-semibold text-ink-primary tabular-nums">
              ${stats.monthlyRevenue.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-ink-muted mt-4 font-mono tabular-nums">
            Lifetime: ${stats.totalRevenue.toLocaleString()}
          </p>
        </div>

        {/* Total Bookings */}
        <div className="card-base p-5">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2 font-mono">
            <span>Total bookings</span>
            <Calendar size={13} className="text-ink-secondary" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-semibold text-ink-primary tabular-nums">
              {stats.totalBookings}
            </span>
            <span className="text-xs text-ink-muted font-mono">
              reservations
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-ink-muted mt-4 font-mono">
            <span className="text-emerald-700">
              {stats.confirmedBookings} confirmed
            </span>
            <span>·</span>
            <span className="text-amber-700">
              {stats.pendingBookings} pending
            </span>
          </div>
        </div>

        {/* Total Properties */}
        <div className="card-base p-5">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2 font-mono">
            <span>Managed properties</span>
            <Building2 size={13} className="text-ink-secondary" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-semibold text-ink-primary tabular-nums">
              {stats.totalHotels}
            </span>
            <span className="text-xs text-ink-muted font-mono">
              hotels cataloged
            </span>
          </div>
          <p className="text-[11px] text-ink-muted mt-4 font-mono tabular-nums">
            {stats.availableRooms} rooms currently vacant
          </p>
        </div>
      </div>

      {/* Booking Status Distribution & Quick Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Booking breakdown table */}
        <div className="lg:col-span-8 card-base p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-sm font-semibold text-ink-primary">
                Booking lifecycle breakdown
              </h2>
              <p className="text-xs text-ink-muted">
                Status distribution across all active and archived stays
              </p>
            </div>
            <Link
              to="/admin/bookings"
              className="text-xs font-mono text-ink-secondary hover:text-ink-primary flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {/* Confirmed Row */}
            <div className="flex items-center justify-between p-3 rounded-control bg-stone-50 border border-stone-200/60">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-emerald-700" />
                <div>
                  <p className="text-xs font-medium text-ink-primary">
                    Confirmed reservations
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    Deposited and verified guests
                  </p>
                </div>
              </div>
              <div className="text-right tabular-nums">
                <span className="text-sm font-semibold text-ink-primary">
                  {stats.confirmedBookings}
                </span>
                <span className="text-[10px] text-ink-muted block font-mono">
                  {stats.totalBookings > 0
                    ? Math.round(
                        (stats.confirmedBookings / stats.totalBookings) * 100,
                      )
                    : 0}
                  % of total
                </span>
              </div>
            </div>

            {/* Pending Row */}
            <div className="flex items-center justify-between p-3 rounded-control bg-stone-50 border border-stone-200/60">
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-amber-700" />
                <div>
                  <p className="text-xs font-medium text-ink-primary">
                    Pending verification & approvals
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    Awaiting room confirmation
                  </p>
                </div>
              </div>
              <div className="text-right tabular-nums">
                <span className="text-sm font-semibold text-ink-primary">
                  {stats.pendingBookings}
                </span>
                <span className="text-[10px] text-ink-muted block font-mono">
                  {stats.totalBookings > 0
                    ? Math.round(
                        (stats.pendingBookings / stats.totalBookings) * 100,
                      )
                    : 0}
                  % of total
                </span>
              </div>
            </div>

            {/* Cancelled Row */}
            <div className="flex items-center justify-between p-3 rounded-control bg-stone-50 border border-stone-200/60">
              <div className="flex items-center gap-3">
                <XCircle size={16} className="text-stone-400" />
                <div>
                  <p className="text-xs font-medium text-ink-primary">
                    Cancelled stays
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    Voided by guest or operator
                  </p>
                </div>
              </div>
              <div className="text-right tabular-nums">
                <span className="text-sm font-semibold text-ink-primary">
                  {stats.cancelledBookings}
                </span>
                <span className="text-[10px] text-ink-muted block font-mono">
                  {stats.totalBookings > 0
                    ? Math.round(
                        (stats.cancelledBookings / stats.totalBookings) * 100,
                      )
                    : 0}
                  % of total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Operations Console */}
        <div className="lg:col-span-4 card-base p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink-primary mb-1">
              Direct management
            </h2>
            <p className="text-xs text-ink-muted mb-4">
              Fast actions for property updates
            </p>

            <div className="space-y-2">
              <Link
                to="/admin/hotels"
                className="w-full flex items-center justify-between p-3 rounded-control border border-stone-200 hover:bg-stone-50 text-xs text-ink-primary font-medium transition-colors"
              >
                <span>Browse & edit properties</span>
                <ArrowUpRight size={13} className="text-ink-muted" />
              </Link>

              <Link
                to="/admin/bookings?status=pending"
                className="w-full flex items-center justify-between p-3 rounded-control border border-stone-200 hover:bg-stone-50 text-xs text-ink-primary font-medium transition-colors"
              >
                <span>Review pending bookings ({stats.pendingBookings})</span>
                <ArrowUpRight size={13} className="text-ink-muted" />
              </Link>

              <Link
                to="/admin/verifications"
                className="w-full flex items-center justify-between p-3 rounded-control border border-stone-200 hover:bg-stone-50 text-xs text-ink-primary font-medium transition-colors"
              >
                <span>Guest ID verifications</span>
                <ArrowUpRight size={13} className="text-ink-muted" />
              </Link>

              <Link
                to="/admin/packages"
                className="w-full flex items-center justify-between p-3 rounded-control border border-stone-200 hover:bg-stone-50 text-xs text-ink-primary font-medium transition-colors"
              >
                <span>Curated package catalog</span>
                <ArrowUpRight size={13} className="text-ink-muted" />
              </Link>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 text-[11px] font-mono text-ink-muted">
            All property actions are audit-logged.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
