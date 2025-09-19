import { Link, useLocation } from 'react-router-dom';

const UserSidebar = ({ onTabChange, activeTab }) => {
  const location = useLocation();
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'bookings', label: 'My Bookings' },
    { id: 'verification', label: 'ID Verification' },
    { id: 'settings', label: 'Profile Settings' },
  ];

  return (
    <aside className="w-64 bg-primary text-white h-full min-h-screen p-6">
      <h2 className="text-xl font-bold text-accent mb-8">User Dashboard</h2>
      <nav>
        <ul className="space-y-4">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => onTabChange(tab.id)}
                className={`w-full text-left py-2 px-4 rounded transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent text-white'
                    : 'hover:bg-primary-light hover:text-accent'
                }`}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default UserSidebar;