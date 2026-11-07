import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import bookingService from "../../services/bookingService";
import hotelService from "../../services/hotelService";
import userService from "../../services/userService";
import PaymentGateway from "../../components/PaymentGateway";
import { formatCurrency } from "../../utils/formatters";
import {
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Check,
  BedDouble,
  Users,
  AlertCircle,
} from "lucide-react";

const BookingPage = () => {
  const { hotelId, roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const prefilled = location.state || {};

  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    checkInDate: prefilled.checkIn || "",
    checkOutDate: prefilled.checkOut || "",
    guests: {
      adults: Number(prefilled.adults) || 1,
      children: Number(prefilled.children) || 0,
      infants: 0,
    },
    guestDetails: [{ fullName: "", age: "" }],
    specialRequests: "",
  });

  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const hotelResponse = await hotelService.getHotelDetails(hotelId);
        setHotel(hotelResponse.data);

        const selectedRoom = hotelResponse.data.rooms.find(
          (r) => r._id === roomId,
        );
        if (!selectedRoom) {
          setError("Room not found");
          return;
        }
        setRoom(selectedRoom);

        if (user) {
          try {
            const familyResponse = await userService.getFamilyMembers();
            let members = [];
            if (Array.isArray(familyResponse)) {
              members = familyResponse;
            } else if (familyResponse && Array.isArray(familyResponse.data)) {
              members = familyResponse.data;
            } else if (familyResponse && familyResponse.familyMembers) {
              members = familyResponse.familyMembers;
            } else if (
              familyResponse &&
              familyResponse.data &&
              familyResponse.data.familyMembers
            ) {
              members = familyResponse.data.familyMembers;
            }
            setFamilyMembers(members);
          } catch (err) {
            console.error("Error fetching family members:", err);
            setFamilyMembers([]);
          }
        }
      } catch (err) {
        setError("Failed to fetch booking details");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (hotelId && roomId) {
      fetchData();
    }
  }, [hotelId, roomId, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGuestChange = (type, value) => {
    setBookingData((prev) => {
      const updatedGuests = {
        ...prev.guests,
        [type]: value,
      };

      const totalGuests =
        updatedGuests.adults + updatedGuests.children + updatedGuests.infants;
      const currentDetails = [...prev.guestDetails];

      if (totalGuests > currentDetails.length) {
        for (let i = currentDetails.length; i < totalGuests; i++) {
          currentDetails.push({ fullName: "", age: "" });
        }
      } else if (totalGuests < currentDetails.length) {
        currentDetails.splice(totalGuests);
      }

      return {
        ...prev,
        guests: updatedGuests,
        guestDetails: currentDetails,
      };
    });
  };

  const handleGuestDetailChange = (index, field, value) => {
    setBookingData((prev) => {
      const updatedDetails = [...prev.guestDetails];
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: value,
      };
      return {
        ...prev,
        guestDetails: updatedDetails,
      };
    });
  };

  const selectFamilyMember = (member, index) => {
    handleGuestDetailChange(index, "fullName", member.fullName);
    handleGuestDetailChange(index, "age", member.age);
  };

  const calculateTotal = () => {
    if (!room || !bookingData.checkInDate || !bookingData.checkOutDate)
      return 0;
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights * room.pricePerNight : 0;
  };

  const calculateNights = () => {
    if (!bookingData.checkInDate || !bookingData.checkOutDate) return 0;
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const isStep1Valid = () => {
    return (
      bookingData.checkInDate &&
      bookingData.checkOutDate &&
      new Date(bookingData.checkOutDate) > new Date(bookingData.checkInDate)
    );
  };

  const isStep2Valid = () => {
    const totalGuests =
      bookingData.guests.adults +
      bookingData.guests.children +
      bookingData.guests.infants;
    return (
      totalGuests > 0 &&
      bookingData.guestDetails.every(
        (guest) =>
          guest.fullName.trim() && guest.age && parseInt(guest.age) > 0,
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login", {
        state: { from: `/hotels/${hotelId}/book/${roomId}` },
      });
      return;
    }

    try {
      setSubmitting(true);
      const bookingPayload = {
        bookingType: "Hotel",
        hotelId: hotelId,
        roomId: roomId,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        numberOfAdults: bookingData.guests.adults,
        numberOfChildren:
          bookingData.guests.children + bookingData.guests.infants,
        guests: bookingData.guestDetails.map((guest) => ({
          fullName: guest.fullName,
          age: parseInt(guest.age),
        })),
        specialRequests: bookingData.specialRequests,
        totalAmount: calculateTotal(),
      };

      const response = await bookingService.createBooking(bookingPayload);
      setCreatedBooking(response.data);
      setShowPaymentGateway(true);
    } catch (err) {
      setError(err.message || "Failed to create booking");
      console.error("Booking error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-20 flex flex-col justify-center items-center min-h-[50vh] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <p className="text-xs font-mono text-ink-muted">
          Reading room availability...
        </p>
      </div>
    );
  }

  if (error && !hotel) {
    return (
      <div className="container-custom py-16 max-w-lg">
        <div className="card-base p-6 text-center">
          <p className="text-sm font-medium text-ink-primary mb-2">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary text-xs inline-flex items-center gap-1.5 mt-2"
          >
            <ArrowLeft size={13} />
            <span>Return to hotel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs text-ink-muted mb-6 font-mono">
        <Link
          to={`/hotels/${hotelId}`}
          className="hover:text-ink-primary transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={12} />
          <span>{hotel?.name}</span>
        </Link>
        <span>/</span>
        <span className="text-ink-secondary">{room?.type}</span>
        <span>/</span>
        <span className="text-ink-primary">Reservation</span>
      </div>

      {/* Progress Steps Header */}
      <div className="mb-8 pb-4 border-b border-stone-200/80">
        <div className="flex items-center gap-6 text-xs font-mono">
          {[
            { step: 1, label: "Dates & Occupancy" },
            { step: 2, label: "Guest Roster" },
            { step: 3, label: "Review & Confirm" },
          ].map(({ step, label }) => (
            <div key={step} className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                  currentStep === step
                    ? "bg-stone-900 text-white font-medium"
                    : currentStep > step
                      ? "bg-stone-200 text-ink-primary"
                      : "bg-stone-100 text-ink-muted"
                }`}
              >
                {currentStep > step ? <Check size={11} /> : step}
              </span>
              <span
                className={
                  currentStep >= step
                    ? "text-ink-primary font-medium"
                    : "text-ink-muted"
                }
              >
                {label}
              </span>
              {step < 3 && <span className="text-stone-300 ml-2">/</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Form Column */}
        <div className="lg:col-span-8">
          <div className="card-base p-6 sm:p-8">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Dates & Occupancy */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <span className="tag-signature">STAGE 01</span>
                    <h2 className="font-serif text-2xl text-ink-primary font-normal mt-1">
                      Select stay dates
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Check in date
                      </label>
                      <input
                        type="date"
                        name="checkInDate"
                        value={bookingData.checkInDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split("T")[0]}
                        className="input-base"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Check out date
                      </label>
                      <input
                        type="date"
                        name="checkOutDate"
                        value={bookingData.checkOutDate}
                        onChange={handleInputChange}
                        min={
                          bookingData.checkInDate ||
                          new Date().toISOString().split("T")[0]
                        }
                        className="input-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
                      Guest headcount
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          key: "adults",
                          label: "Adults",
                          desc: "Ages 13+",
                          max: room?.maxOccupancy || 4,
                        },
                        {
                          key: "children",
                          label: "Children",
                          desc: "Ages 2-12",
                          max: 3,
                        },
                        {
                          key: "infants",
                          label: "Infants",
                          desc: "Under 2",
                          max: 2,
                        },
                      ].map(({ key, label, desc, max }) => (
                        <div
                          key={key}
                          className="p-3.5 rounded-control border border-stone-200/80 bg-stone-50/50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-ink-primary">
                                {label}
                              </p>
                              <p className="text-[10px] text-ink-muted font-mono">
                                {desc}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 tabular-nums">
                              <button
                                type="button"
                                onClick={() =>
                                  handleGuestChange(
                                    key,
                                    Math.max(0, bookingData.guests[key] - 1),
                                  )
                                }
                                className="w-6 h-6 rounded-control border border-stone-300 flex items-center justify-center hover:bg-stone-100 text-xs"
                                disabled={
                                  key === "adults"
                                    ? bookingData.guests[key] <= 1
                                    : bookingData.guests[key] <= 0
                                }
                              >
                                -
                              </button>
                              <span className="text-xs font-semibold w-4 text-center">
                                {bookingData.guests[key]}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleGuestChange(
                                    key,
                                    Math.min(max, bookingData.guests[key] + 1),
                                  )
                                }
                                className="w-6 h-6 rounded-control border border-stone-300 flex items-center justify-center hover:bg-stone-100 text-xs"
                                disabled={bookingData.guests[key] >= max}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!isStep1Valid()}
                      className="btn-primary !text-xs !py-2 !px-4 inline-flex items-center gap-1.5"
                    >
                      <span>Continue to guest details</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Guest Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="tag-signature">STAGE 02</span>
                      <h2 className="font-serif text-2xl text-ink-primary font-normal mt-1">
                        Guest roster
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-mono text-ink-muted hover:text-ink-primary"
                    >
                      ← Edit dates
                    </button>
                  </div>

                  <div className="space-y-4">
                    {bookingData.guestDetails.map((guest, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-control border border-stone-200 bg-stone-50/40"
                      >
                        <p className="text-xs font-semibold text-ink-primary mb-3">
                          Guest {index + 1}{" "}
                          {index === 0 && "(Primary Traveler)"}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                              Full name (as on ID)
                            </label>
                            <input
                              type="text"
                              value={guest.fullName}
                              onChange={(e) =>
                                handleGuestDetailChange(
                                  index,
                                  "fullName",
                                  e.target.value,
                                )
                              }
                              className="input-base"
                              placeholder="Legal name"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                              Age
                            </label>
                            <input
                              type="number"
                              value={guest.age}
                              onChange={(e) =>
                                handleGuestDetailChange(
                                  index,
                                  "age",
                                  e.target.value,
                                )
                              }
                              className="input-base tabular-nums"
                              placeholder="Age"
                              min="1"
                              max="120"
                              required
                            />
                          </div>
                        </div>

                        {/* Family member quick selection */}
                        {user && familyMembers.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-stone-200/60">
                            <span className="text-[10px] font-mono uppercase text-ink-muted block mb-1.5">
                              Autofill from saved guests:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {familyMembers.map((member) => (
                                <button
                                  key={member._id}
                                  type="button"
                                  onClick={() =>
                                    selectFamilyMember(member, index)
                                  }
                                  className="text-[11px] font-mono bg-white border border-stone-200 px-2 py-0.5 rounded-tag hover:border-stone-400 text-ink-secondary"
                                >
                                  {member.fullName} ({member.age}y)
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="btn-secondary !text-xs !py-2 !px-4"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      disabled={!isStep2Valid()}
                      className="btn-primary !text-xs !py-2 !px-4 inline-flex items-center gap-1.5"
                    >
                      <span>Review reservation</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="tag-signature">STAGE 03</span>
                      <h2 className="font-serif text-2xl text-ink-primary font-normal mt-1">
                        Review stay dossier
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs font-mono text-ink-muted hover:text-ink-primary"
                    >
                      ← Edit roster
                    </button>
                  </div>

                  <div className="p-4 rounded-control border border-stone-200 bg-stone-50/50 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-4 font-mono">
                      <div>
                        <span className="text-[10px] uppercase text-ink-muted block">
                          Duration
                        </span>
                        <span className="text-ink-primary font-medium tabular-nums">
                          {bookingData.checkInDate} to{" "}
                          {bookingData.checkOutDate} ({calculateNights()}{" "}
                          nights)
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-ink-muted block">
                          Party size
                        </span>
                        <span className="text-ink-primary font-medium tabular-nums">
                          {bookingData.guests.adults} Adults,{" "}
                          {bookingData.guests.children} Children
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200/60">
                      <span className="text-[10px] uppercase font-mono text-ink-muted block mb-1">
                        Registered travelers
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {bookingData.guestDetails.map((guest, idx) => (
                          <span key={idx} className="tag-signature">
                            {guest.fullName} ({guest.age}y)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                      Special requests or room preferences (optional)
                    </label>
                    <textarea
                      name="specialRequests"
                      value={bookingData.specialRequests}
                      onChange={handleInputChange}
                      rows={3}
                      className="input-base resize-none"
                      placeholder="e.g. Quiet upper floor, arrival after 20:00, feather-free bedding"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="btn-secondary !text-xs !py-2 !px-4"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary !text-xs !py-2.5 !px-6 inline-flex items-center gap-1.5 font-mono uppercase tracking-wider"
                    >
                      {submitting
                        ? "Confirming ledger..."
                        : "Proceed to checkout"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="card-base p-6 sticky top-20 shadow-elevated space-y-5">
            <div>
              <span className="tag-signature">
                № {hotel?._id ? hotel._id.slice(-4).toUpperCase() : "HOTEL"}
              </span>
              <h3 className="text-base font-semibold text-ink-primary mt-1">
                {hotel?.name}
              </h3>
              <p className="text-xs text-ink-muted font-mono">
                {hotel?.city} · {room?.type}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-ink-secondary">Nightly rate</span>
                <span className="text-ink-primary tabular-nums">
                  {formatCurrency(room?.pricePerNight)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Calculated nights</span>
                <span className="text-ink-primary tabular-nums">
                  {calculateNights()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Resort surcharges</span>
                <span className="text-ink-primary tabular-nums">
                  {formatCurrency(0)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-mono uppercase tracking-wider text-ink-secondary">
                  Total amount
                </span>
                <span className="text-2xl font-semibold text-ink-primary tabular-nums">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-2 text-[11px] text-ink-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={13}
                  className="text-ink-secondary flex-shrink-0"
                />
                <span>Zero reservation processing fee</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={13} className="text-ink-secondary flex-shrink-0" />
                <span>Flexible cancellation up to 48h prior</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentGateway && createdBooking && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-base max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-elevated">
            <PaymentGateway
              booking={createdBooking}
              onSuccess={() => {
                setShowPaymentGateway(false);
                navigate("/user", {
                  state: {
                    activeTab: "bookings",
                    message:
                      "Reservation confirmed. Check-in details dispatched.",
                    bookingId: createdBooking._id,
                  },
                });
              }}
              onCancel={() => {
                setShowPaymentGateway(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
