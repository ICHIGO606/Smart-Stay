import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
  const location = useLocation();

  const links = [
    { to: '/admin', label: 'Dashboard', icon: '🏠' },
    { to: '/admin/hotels', label: 'Hotel Management', icon: '🏨' },
    { to: '/admin/bookings', label: 'Booking Management', icon: '📅' },
    { to: '/admin/packages', label: 'Package Management', icon: '🎁' },
    { to: '/admin/users', label: 'User Management', icon: '👥' },
    { to: '/admin/verifications', label: 'Verification Requests', icon: '🪪' },
    { to: '/admin/profile', label: 'Profile Settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-primary text-white min-h-screen p-6 sticky top-0">
      <h2 className="text-xl font-bold text-accent mb-8">Admin Dashboard</h2>
      <nav>
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`flex items-center gap-3 py-2 px-4 rounded-lg transition-colors ${
                  location.pathname === link.to
                    ? 'bg-accent text-white shadow'
                    : 'hover:bg-opacity-20 hover:text-accent'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
