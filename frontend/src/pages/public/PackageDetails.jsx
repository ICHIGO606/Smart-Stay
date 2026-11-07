import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { getPackageById, bookPackage } from '../../services/packageService';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, MapPin, Calendar, Users, ShieldCheck, Check, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [participants, setParticipants] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPackageDetails();
  }, [id]);

  const fetchPackageDetails = async () => {
    try {
      setLoading(true);
      const response = await getPackageById(id);
      setPackageData(response);
      setError(null);
    } catch (err) {
      setError('Failed to load package details. Please try again later.');
      console.error('Error fetching package details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to confirm this itinerary');
      navigate('/login', { state: { from: `/packages/${id}` } });
      return;
    }
    
    if (!bookingDate) {
      toast.error('Please select an itinerary departure date');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const bookingData = {
        startDate: bookingDate,
        participants: participants,
        userId: user._id
      };
      
      await bookPackage(id, bookingData);
      toast.success('Itinerary reserved successfully');
      navigate('/user');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete package booking');
      console.error('Error booking package:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-20 flex flex-col justify-center items-center min-h-[50vh] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <p className="text-xs font-mono text-ink-muted">Reading itinerary dossier...</p>
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="container-custom py-16 max-w-lg">
        <div className="card-base p-6 text-center">
          <p className="text-sm font-medium text-ink-primary mb-2">{error || 'Package not found'}</p>
          <Link to="/packages" className="btn-secondary text-xs inline-flex items-center gap-1.5">
            <ArrowLeft size={13} />
            <span>Return to packages</span>
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const totalPrice = Math.round(packageData.price * participants);

  return (
    <div className="container-custom py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-ink-muted mb-6 font-mono">
        <Link to="/packages" className="hover:text-ink-primary transition-colors flex items-center gap-1">
          <ArrowLeft size={12} />
          <span>Curated journeys</span>
        </Link>
        <span>/</span>
        <span className="text-ink-primary truncate max-w-[240px]">{packageData.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Visual */}
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-card overflow-hidden bg-stone-100 border border-stone-200 shadow-subtle">
            {packageData.images?.length ? (
              <img 
                src={packageData.images[0]} 
                alt={packageData.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-mono text-ink-muted">
                Archival documentation
              </div>
            )}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-ink-primary px-2.5 py-1 rounded-tag text-xs font-mono">
              {packageData.duration?.days || 0} Days · {packageData.duration?.nights || 0} Nights
            </div>
          </div>

          {/* Title & Overview */}
          <div className="space-y-3 pb-6 border-b border-stone-200/80">
            <div className="flex items-center gap-2">
              <span className="tag-signature">JOURNEY № {packageData._id ? packageData._id.slice(-4).toUpperCase() : '01'}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal">
              {packageData.name}
            </h1>

            {packageData.destinations?.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-ink-muted font-mono pt-1">
                <MapPin size={13} className="text-ink-secondary" />
                <span>Territory: {packageData.destinations.join(' → ')}</span>
              </div>
            )}

            <p className="text-sm text-ink-secondary leading-relaxed pt-2">
              {packageData.description}
            </p>
          </div>

          {/* Daily Itinerary */}
          {packageData.itinerary && packageData.itinerary.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-2xl text-ink-primary font-normal">
                Structured route schedule
              </h2>
              <div className="space-y-3">
                {packageData.itinerary.map((day, index) => (
                  <div key={index} className="card-base p-4 border-l-4 border-l-stone-900">
                    <div className="flex items-center gap-2 text-xs font-mono text-ink-muted mb-1">
                      <span>DAY {day.day}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-ink-primary mb-1">
                      {day.title}
                    </h3>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {day.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Gallery */}
          {packageData.images && packageData.images.length > 1 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                Territory photography
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {packageData.images.slice(1).map((image, index) => (
                  <div key={index} className="aspect-[4/3] rounded-control overflow-hidden bg-stone-100 border border-stone-200">
                    <img 
                      src={image} 
                      alt={`${packageData.name} view ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Booking Console */}
        <div className="lg:col-span-4">
          <div className="card-base p-6 sticky top-20 shadow-elevated space-y-6">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Itinerary enrollment
              </p>
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-3xl font-semibold text-ink-primary">
                  ${Math.round(packageData.price).toLocaleString()}
                </span>
                <span className="text-xs text-ink-muted font-mono">/ guest</span>
              </div>
            </div>

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label htmlFor="bookingDate" className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                  Departure date
                </label>
                <input
                  type="date"
                  id="bookingDate"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={minDate}
                  className="input-base"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="participants" className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                  Number of travelers
                </label>
                <input
                  type="number"
                  id="participants"
                  value={participants}
                  onChange={(e) => setParticipants(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="10"
                  className="input-base tabular-nums"
                  required
                />
              </div>

              <div className="pt-3 border-t border-stone-100">
                <div className="flex justify-between items-center text-xs mb-3 font-mono">
                  <span className="text-ink-secondary">Total investment</span>
                  <span className="text-base font-semibold text-ink-primary tabular-nums">
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full !py-2.5 text-xs font-mono uppercase tracking-wider"
                >
                  {submitting ? 'Confirming with ledger...' : 'Reserve journey'}
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-stone-100 space-y-2 text-xs text-ink-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-ink-secondary flex-shrink-0" />
                <span>Comprehensive host insurance & travel protection</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-ink-secondary flex-shrink-0" />
                <span>Boutique lodging accommodations included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetails;
