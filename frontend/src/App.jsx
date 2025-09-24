import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import HotelSearch from './pages/public/HotelSearch';
import HotelDetails from './pages/public/HotelDetails';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import BookingPage from './pages/user/BookingPage';
const UserBookings = () => <div className="p-8"><h1 className="text-2xl font-bold">My Bookings</h1></div>;

// Admin Pages
import HotelManagement from './pages/admin/HotelManagement';
import BookingManagement from './pages/admin/BookingManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfile from './pages/admin/AdminProfile';
const AdminPackages = () => <div className="p-8"><h1 className="text-2xl font-bold">Package Management</h1></div>;
const AdminUsers = () => <div className="p-8"><h1 className="text-2xl font-bold">User Management</h1></div>;
const AdminVerifications = () => <div className="p-8"><h1 className="text-2xl font-bold">Verification Requests</h1></div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="hotels" element={<HotelSearch />} />
            <Route path="hotels/:id" element={<HotelDetails />} />
            <Route path="hotels/:hotelId/book/:roomId" element={<BookingPage />} />
          </Route>

          {/* User Routes */}
          <Route path="/user" element={<UserLayout />}>
            <Route index element={<UserDashboard />} />
            <Route path="bookings" element={<UserBookings />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="hotels" element={<HotelManagement />} />
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
