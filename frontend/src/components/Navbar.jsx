import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  Compass,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { to: "/", label: "Overview" },
    { to: "/hotels", label: "Hotels" },
    { to: "/packages", label: "Curated packages" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200/70">
      <div className="container-custom">
        <div className="flex items-center justify-between h-15">
          {/* Brand mark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-7 h-7 rounded-[6px] bg-primary text-white flex items-center justify-center text-xs font-semibold tracking-wider">
              SS
            </span>
            <div className="flex flex-col">
              <span className="font-sans font-semibold tracking-tight text-ink-primary text-[15px] leading-tight">
                SmartStay
              </span>
              <span className="font-mono text-[9px] text-ink-muted uppercase tracking-widest leading-none">
                Boutique Stays
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-sm rounded-control transition-colors ${
                  isActive(link.to)
                    ? "text-ink-primary font-medium bg-stone-100/80"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-stone-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-control text-sm text-ink-primary hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200"
                >
                  <span className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-xs text-ink-secondary font-medium">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </span>
                  <span className="font-medium text-xs text-ink-primary">
                    {user?.name}
                  </span>
                  <ChevronDown size={14} className="text-ink-muted" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-card border border-stone-200 shadow-elevated py-1 z-50">
                    <div className="px-3.5 py-2 border-b border-stone-100">
                      <p className="text-xs font-medium text-ink-primary truncate">
                        {user?.name}
                      </p>
                      <p className="text-[11px] text-ink-muted truncate">
                        {user?.email}
                      </p>
                    </div>

                    <Link
                      to={user?.role === "admin" ? "/admin" : "/user"}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-ink-secondary hover:text-ink-primary hover:bg-stone-50 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <LayoutDashboard size={14} className="text-ink-muted" />
                      <span>
                        {user?.role === "admin"
                          ? "Admin dashboard"
                          : "Account dashboard"}
                      </span>
                    </Link>

                    <button
                      onClick={() => {
                        handleLogout();
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-700 hover:bg-red-50 transition-colors text-left border-t border-stone-100"
                    >
                      <LogOut size={14} />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs !py-1.5 !px-3.5"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-control text-ink-secondary hover:text-ink-primary hover:bg-stone-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-3 py-2 rounded-control text-sm ${
                isActive(link.to)
                  ? "bg-stone-100 text-ink-primary font-medium"
                  : "text-ink-secondary hover:bg-stone-50"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-2 border-t border-stone-100 mt-2 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  to={user?.role === "admin" ? "/admin" : "/user"}
                  className="block px-3 py-2 rounded-control text-sm text-ink-primary font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {user?.role === "admin"
                    ? "Admin dashboard"
                    : "Account dashboard"}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-control text-sm text-red-700"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  className="btn-secondary w-full text-center text-xs"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary w-full text-center text-xs"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
