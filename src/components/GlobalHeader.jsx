import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, Calendar, Plus, LogIn, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GlobalHeader = ({ variant = 'light' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isSuperAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = variant === 'dark';

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Events', path: '/events', icon: Calendar },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 border-b ${
      isDark 
        ? 'bg-gray-950/80 backdrop-blur-xl border-gray-800/50' 
        : 'bg-white/80 backdrop-blur-md border-gray-200/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <div>
              <div className="flex items-center">
                <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Link</span>
                <span className="text-xl font-bold text-red-500">Me</span>
                <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>U</span>
              </div>
              <p className={`text-[9px] -mt-0.5 tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Link Me. You Matter Most.
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? isDark 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-50 text-red-600'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isSuperAdmin && isSuperAdmin() && (
              <button
                onClick={() => navigate('/admin')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark 
                    ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            )}
            
            <button
              onClick={() => navigate('/register-listing')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-red-500/20"
            >
              <Plus className="w-4 h-4" />
              Post Listing
            </button>

            {user ? (
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-all ${
                  isDark 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-all ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-t ${
          isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${
                    active
                      ? isDark 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-50 text-red-600'
                      : isDark
                        ? 'text-gray-400 hover:bg-gray-800'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  navigate('/register-listing');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium"
              >
                <Plus className="w-5 h-5" />
                Post Listing
              </button>
            </div>

            {user ? (
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
                  isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
                  isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LogIn className="w-5 h-5" />
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default GlobalHeader;
