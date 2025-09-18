import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
  const location = useLocation();
  
  const links = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/hotels', label: 'Hotel Management' },
    { to: '/admin/bookings', label: 'Booking Management' },
    { to: '/admin/packages', label: 'Package Management' },
    { to: '/admin/users', label: 'User Management' },
    { to: '/admin/verifications', label: 'Verification Requests' },
  ];

  return (
    <aside className="w-64 bg-primary text-white h-full min-h-screen p-6">
      <h2 className="text-xl font-bold text-accent mb-8">Admin Dashboard</h2>
      <nav>
        <ul className="space-y-4">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`block py-2 px-4 rounded transition-colors ${
                  location.pathname === link.to
                    ? 'bg-accent text-white'
                    : 'hover:bg-opacity-20 hover:text-accent'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;