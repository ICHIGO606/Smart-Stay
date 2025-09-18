import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container-custom mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-primary">SmartStay</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link to="/" className="px-3 py-2 text-primary hover:text-accent">Home</Link>
            <Link to="/hotels" className="px-3 py-2 text-primary hover:text-accent">Hotels</Link>
            
            {isAuthenticated ? (
              <div className="relative ml-3">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center text-primary hover:text-accent"
                >
                  <span className="mr-2">{user.name}</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    {user.role === 'admin' ? (
                      <Link 
                        to="/admin" 
                        className="block px-4 py-2 text-primary hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link 
                        to="/user" 
                        className="block px-4 py-2 text-primary hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        My Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setProfileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-primary hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-primary hover:text-accent">Login</Link>
                <Link to="/register" className="px-4 py-2 bg-accent text-white rounded-md hover:bg-opacity-90">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-primary hover:text-accent"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="block px-3 py-2 text-primary hover:text-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/hotels" 
              className="block px-3 py-2 text-primary hover:text-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hotels
            </Link>
            
            {isAuthenticated ? (
              <>
                {user.role === 'admin' ? (
                  <Link 
                    to="/admin" 
                    className="block px-3 py-2 text-primary hover:text-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link 
                    to="/user" 
                    className="block px-3 py-2 text-primary hover:text-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-primary hover:text-accent"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 text-primary hover:text-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block px-3 py-2 text-primary hover:text-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;