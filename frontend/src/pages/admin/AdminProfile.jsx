import { useState, useEffect } from 'react';
import userService from '../../services/userService';
import ProfileSettings from '../../components/ProfileSettings';

const AdminProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      if (response.data) {
        setUser(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    // Refresh user data after profile update
    fetchUserProfile();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Admin Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your personal information and account security
        </p>
      </div>

      {user && (
        <ProfileSettings 
          user={user} 
          onProfileUpdate={handleProfileUpdate} 
        />
      )}
    </div>
  );
};

export default AdminProfile;