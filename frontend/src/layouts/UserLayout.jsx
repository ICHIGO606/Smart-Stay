import { Outlet, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import UserSidebar from '../components/UserSidebar';

const UserLayout = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-grow">
        <UserSidebar onTabChange={handleTabChange} activeTab={activeTab} />
        <main className="flex-grow p-6">
          <Outlet context={{ activeTab, setActiveTab }} />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;