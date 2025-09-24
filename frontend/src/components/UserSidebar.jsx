import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, IdCard, Settings } from 'lucide-react';

const UserSidebar = ({ onTabChange, activeTab }) => {
  const location = useLocation();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'family', label: 'Family Members', icon: <Users size={18} /> },
    { id: 'bookings', label: 'My Bookings', icon: <Calendar size={18} /> },
    { id: 'verification', label: 'ID Verification', icon: <IdCard size={18} /> },
    { id: 'settings', label: 'Profile Settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-primary text-white min-h-screen p-6 sticky top-0">
      <h2 className="text-xl font-bold text-accent mb-8">User Dashboard</h2>
      <nav>
        <ul className="space-y-2">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3 text-left py-2 px-4 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent text-white shadow'
                    : 'hover:bg-primary-light hover:text-accent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default UserSidebar;
