import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import userService from '../../services/userService';
import VerificationComponent from '../../components/VerificationComponent';
import ProfileSettings from '../../components/ProfileSettings';
import UserBookings from '../../components/UserBookings';
import FamilyMembers from '../../components/FamilyMembers';

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
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-primary mb-2">Profile Status</h3>
                <p className="text-2xl font-bold text-accent">
                  {userData?.verification.status === "Verified"  ? 'Verified' : 'Not Verified'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {userData?.verification.status === "Verified" 
                    ? 'Your account is fully verified' 
                    : 'Complete verification to access all features'
                  }
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-primary mb-2">Email</h3>
                <p className="text-lg text-gray-800">{userData?.email}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {userData?.emailVerified ? 'Verified' : 'Not Verified'}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-primary mb-2">Member Since</h3>
                <p className="text-lg text-gray-800">
                  {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-primary mb-4">Recent Activity</h2>
              <p className="text-gray-600">
                {userData?.bookings && userData.bookings.length > 0
                  ? `You have ${userData.bookings.length} booking(s)`
                  : 'No recent bookings'
                }
              </p>
            </div>

            {!userData?.verification.status === "Verified"  && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
                <p className="text-sm">
                  Please complete your ID verification to access all booking features.
                </p>
              </div>
            )}
          </>
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
        return (
          <FamilyMembers 
            user={userData}
          />
        );
      
      case 'bookings':
        return <UserBookings />;
      
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-primary mb-6">Welcome back, {user?.fullName}!</h1>
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default UserDashboard;