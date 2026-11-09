import { useState, useEffect } from "react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import { bookingService } from "../services/bookingService";
import {
  Calendar,
  Users,
  RefreshCw,
  ArrowRight,
  BedDouble,
  AlertCircle,
  Ticket,
} from "lucide-react";

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getUserBookings();
      setBookings(response.data || []);
    } catch (err) {
      setError("Failed to fetch your bookings");
      console.error("Error fetching user bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setCancellingId(bookingId);
      await bookingService.cancelBooking(bookingId);

      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: "cancelled" }
            : booking,
        ),
      );
      setError("");
    } catch (err) {
      setError(err.message || "Failed to cancel booking");
      console.error("Error cancelling booking:", err);
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenVoucher = async (bookingId) => {
    try {
      const response = await bookingService.getBookingVoucher(bookingId, "html");
      const blob = new Blob([response], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, "_blank", "noopener,noreferrer");
      if (!newWin) {
        toast.error("Pop-up blocked. Please allow pop-ups for this site.");
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Failed to load voucher pass:", err);
      toast.error("Failed to load voucher pass");
    }
  };

  const renderStatus = (status) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Confirmed</span>
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            <span>Pending</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-stone-100 text-stone-600 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
            <span>Cancelled</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-blue-50 text-blue-800 border border-blue-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span>Completed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-stone-100 text-stone-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  const canCancelBooking = (booking) => {
    const bookingDate = new Date(booking.checkInDate);
    const today = new Date();
    const daysUntilBooking = Math.ceil(
      (bookingDate - today) / (1000 * 60 * 60 * 24),
    );
    const s = (booking.bookingStatus || booking.status || "").toLowerCase();
    return (s === "confirmed" || s === "pending") && daysUntilBooking > 1;
  };

  useEffect(() => {
    fetchUserBookings();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <p className="text-xs font-mono text-ink-muted">
          Querying reservation ledger...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-sm font-semibold text-ink-primary">
            My reservations
          </h2>
          <p className="text-xs text-ink-muted">
            Historical and scheduled stays
          </p>
        </div>
        <button
          onClick={fetchUserBookings}
          className="btn-secondary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
        >
          <RefreshCw size={12} className="text-ink-secondary" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="card-base p-4 border-red-200 bg-red-50/60 flex items-center gap-3 text-xs text-red-800">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="card-base p-12 text-center">
          <BedDouble size={24} className="text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-ink-primary mb-1">
            No reservations on file
          </h3>
          <p className="text-xs text-ink-muted mb-4 max-w-sm mx-auto">
            You do not have any active or past hotel bookings. Search our
            curated properties to plan your visit.
          </p>
          <Link
            to="/hotels"
            className="btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <span>Browse directory</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="card-base p-5 hover:border-stone-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-stone-100 gap-2">
                <div className="flex items-center gap-3">
                  <span className="tag-signature">
                    №{" "}
                    {booking._id ? booking._id.slice(-6).toUpperCase() : "RES"}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink-primary">
                      {booking.hotelId?.name || "Property accommodation"}
                    </h3>
                    <p className="text-xs text-ink-muted">
                      {booking.roomId?.type || "Standard suite"}
                    </p>
                  </div>
                </div>

                <div>{renderStatus(booking.status)}</div>
              </div>

              {/* Grid metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono mb-4">
                <div>
                  <span className="text-[10px] uppercase text-ink-muted block mb-0.5">
                    Check in
                  </span>
                  <span className="text-ink-primary font-medium tabular-nums">
                    {new Date(booking.checkInDate).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "short", day: "numeric" },
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-ink-muted block mb-0.5">
                    Check out
                  </span>
                  <span className="text-ink-primary font-medium tabular-nums">
                    {new Date(booking.checkOutDate).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "short", day: "numeric" },
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-ink-muted block mb-0.5">
                    Guests
                  </span>
                  <span className="text-ink-primary font-medium tabular-nums">
                    {booking.numberOfAdults} Adult
                    {booking.numberOfAdults !== 1 ? "s" : ""}
                    {booking.numberOfChildren > 0
                      ? `, ${booking.numberOfChildren} Ch`
                      : ""}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-ink-muted block mb-0.5">
                    Amount billed
                  </span>
                  <span className="text-ink-primary font-semibold tabular-nums">
                    ₹{booking.totalAmount?.toLocaleString()}
                  </span>
                </div>
              </div>

              {booking.specialRequests && (
                <div className="p-2.5 rounded-control bg-stone-50 text-xs text-ink-secondary mb-4 border border-stone-200/50">
                  <span className="font-mono text-[10px] text-ink-muted block uppercase">
                    Notes for host:
                  </span>
                  <span>{booking.specialRequests}</span>
                </div>
              )}

              {/* Action row */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => handleOpenVoucher(booking._id)}
                  className="btn-secondary !text-xs !py-1 inline-flex items-center gap-1.5 text-ink-primary hover:border-ink-primary"
                >
                  <Ticket size={13} className="text-stone-500" />
                  <span>Voucher Pass</span>
                </button>

                <div className="flex items-center gap-2">
                  {canCancelBooking(booking) && (
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      disabled={cancellingId === booking._id}
                      className="btn-secondary !text-xs !py-1 text-red-700 hover:bg-red-50 hover:border-red-200"
                    >
                      {cancellingId === booking._id
                        ? "Processing..."
                        : "Cancel reservation"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserBookings;
