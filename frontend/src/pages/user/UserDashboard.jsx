import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOutletContext, Link } from 'react-router';
import userService from '../../services/userService';
import VerificationComponent from '../../components/VerificationComponent';
import ProfileSettings from '../../components/ProfileSettings';
import UserBookings from '../../components/UserBookings';
import FamilyMembers from '../../components/FamilyMembers';
import { ShieldCheck, Mail, Calendar, ArrowRight, BedDouble } from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { activeTab, setActiveTab } = useOutletContext();

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      setUserData(response.data);
    } catch (err) {
      setError('Failed to fetch user profile');
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationUpdate = () => {
    fetchUserProfile();
  };

  const handleProfileUpdate = () => {
    fetchUserProfile();
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <p className="text-xs font-mono text-ink-muted">Reading guest profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="card-base p-6 border-red-200 bg-red-50/50">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const isVerified = userData?.verification?.status === "Verified";

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Identity prompt banner if unverified */}
            {!isVerified && (
              <div className="card-base p-4 border-stone-300 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-control bg-stone-200 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={16} className="text-stone-700" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-primary">Identity verification required</p>
                    <p className="text-[11px] text-ink-secondary">Complete government ID validation to confirm pending and future hotel reservations.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('verification')}
                  className="btn-primary !text-xs !py-1.5 !px-3 self-start sm:self-auto flex-shrink-0 inline-flex items-center gap-1"
                >
                  <span>Submit ID</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            )}

            {/* Profile Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card-base p-5">
                <div className="flex items-center justify-between text-xs text-ink-muted mb-2 font-mono">
                  <span>Verification status</span>
                  <ShieldCheck size={14} className={isVerified ? "text-emerald-700" : "text-amber-700"} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${isVerified ? "bg-emerald-600" : "bg-amber-600"}`}></span>
                  <span className="text-lg font-semibold text-ink-primary">
                    {isVerified ? 'Verified account' : 'Pending verification'}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-2">
                  {isVerified ? 'All booking features and fast check-in unlocked' : 'Submit ID to unlock seamless check-in'}
                </p>
              </div>

              <div className="card-base p-5">
                <div className="flex items-center justify-between text-xs text-ink-muted mb-2 font-mono">
                  <span>Email address</span>
                  <Mail size={14} className="text-ink-secondary" />
                </div>
                <p className="text-base font-semibold text-ink-primary truncate mb-1">
                  {userData?.email || 'Not provided'}
                </p>
                <p className="text-xs text-ink-muted mt-2 font-mono">
                  {userData?.emailVerified ? 'Primary communications verified' : 'Standard guest notifications'}
                </p>
              </div>

              <div className="card-base p-5">
                <div className="flex items-center justify-between text-xs text-ink-muted mb-2 font-mono">
                  <span>Member registration</span>
                  <Calendar size={14} className="text-ink-secondary" />
                </div>
                <p className="text-base font-semibold text-ink-primary tabular-nums mb-1">
                  {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                </p>
                <p className="text-xs text-ink-muted mt-2 font-mono">
                  SmartStay guest registry
                </p>
              </div>
            </div>

            {/* Active Bookings Summary Card */}
            <div className="card-base p-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <BedDouble size={16} className="text-ink-secondary" />
                  <h2 className="text-sm font-semibold text-ink-primary">Reservation activity</h2>
                </div>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs font-mono text-ink-secondary hover:text-ink-primary inline-flex items-center gap-1"
                >
                  <span>View reservations</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-ink-primary font-medium">
                    {userData?.bookings && userData.bookings.length > 0
                      ? `${userData.bookings.length} recorded reservation(s)`
                      : 'No upcoming reservations currently scheduled'
                    }
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Explore curated hotels or multi-day itineraries to plan your next retreat.
                  </p>
                </div>

                <Link to="/hotels" className="btn-secondary !text-xs !py-1.5 !px-3 self-start sm:self-auto">
                  Browse catalog
                </Link>
              </div>
            </div>
          </div>
        );
      
      case 'verification':
        return (
          <VerificationComponent 
            user={userData} 
            onVerificationUpdate={handleVerificationUpdate}
          />
        );
      
      case 'settings':
        return (
          <ProfileSettings 
            user={userData} 
            onProfileUpdate={handleProfileUpdate}
          />
        );
      
      case 'family':
        return <FamilyMembers />;
      
      case 'bookings':
        return <UserBookings />;
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title (no greeting slop) */}
      <div className="pb-5 border-b border-stone-200/80">
        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
          Guest portal
        </p>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="font-serif text-3xl text-ink-primary font-normal">
            Account overview
          </h1>
          <span className="text-xs font-mono text-ink-muted">
            Guest: {user?.fullName || user?.name || 'Verified Member'}
          </span>
        </div>
      </div>
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default UserDashboard;
