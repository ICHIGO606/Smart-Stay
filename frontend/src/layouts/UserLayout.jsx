import { Outlet, Navigate, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";

const UserLayout = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const location = useLocation();

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-3 bg-[#FBF9F5]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <p className="text-xs font-mono text-ink-muted">
          Loading guest session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FBF9F5]">
      <Navbar />
      <div className="flex flex-grow">
        <UserSidebar onTabChange={handleTabChange} activeTab={activeTab} />
        <main className="flex-grow p-6 lg:p-8 max-w-[1400px] overflow-x-hidden">
          <Outlet context={{ activeTab, setActiveTab }} />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
