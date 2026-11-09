import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./context/AuthContext";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import TenantWebsiteLayout from "./layouts/TenantWebsiteLayout";
import { TenantProvider } from "./context/TenantContext";

// Public Pages
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import HotelSearch from "./pages/public/HotelSearch";
import HotelDetails from "./pages/public/HotelDetails";
import PackageSearch from "./pages/public/PackageSearch";
import PackageDetails from "./pages/public/PackageDetails";
import OnboardingWizard from "./pages/public/OnboardingWizard";
import OrganizationDirectory from "./pages/public/OrganizationDirectory";

// Tenant Hosted Pages
import TenantHome from "./pages/tenant/TenantHome";
import TenantHotelDetails from "./pages/tenant/TenantHotelDetails";

// User Pages
import UserDashboard from "./pages/user/UserDashboard";
import BookingPage from "./pages/user/BookingPage";
const UserBookings = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">My Bookings</h1>
  </div>
);

// Admin Pages
import HotelManagement from "./pages/admin/HotelManagement";
import HotelDetailPage from "./pages/admin/HotelDetailPage";
import BookingManagement from "./pages/admin/BookingManagement";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminVerifications from "./pages/admin/AdminVerifications";
import PackageListPage from "./pages/admin/PackageListPage";
import PackageFormPage from "./pages/admin/PackageFormPage";
import OrganizationSettings from "./pages/admin/OrganizationSettings";
// const AdminUsers = () => <div className="p-8"><h1 className="text-2xl font-bold">User Management</h1></div>;

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
            <Route
              path="hotels/:hotelId/book/:roomId"
              element={<BookingPage />}
            />
            <Route path="packages" element={<PackageSearch />} />
            <Route path="packages/:id" element={<PackageDetails />} />
            <Route path="orgs" element={<OrganizationDirectory />} />
            <Route path="onboard" element={<OnboardingWizard />} />
          </Route>

          {/* Tenant Hosted Websites */}
          <Route
            path="/portal/:slug"
            element={
              <TenantProvider>
                <TenantWebsiteLayout />
              </TenantProvider>
            }
          >
            <Route index element={<TenantHome />} />
            <Route path="hotels/:id" element={<TenantHotelDetails />} />
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
            <Route path="hotels/:hotelId" element={<HotelDetailPage />} />
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="packages" element={<PackageListPage />} />
            <Route path="packages/new" element={<PackageFormPage />} />
            <Route path="packages/edit/:id" element={<PackageFormPage />} />
            {/* <Route path="users" element={<AdminUsers />} /> */}
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="organization" element={<OrganizationSettings />} />
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
