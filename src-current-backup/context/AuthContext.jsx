import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('eventsx_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('eventsx_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('eventsx_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eventsx_user');
  };

  const isSuperAdmin = () => {
    return user?.role === 'superadmin';
  };

  const isOwner = () => {
    return user?.role === 'owner';
  };

  const canEditEvent = (eventOwnerId) => {
    if (!user) return false;
    // Only super admin can edit events
    if (user.role === 'superadmin') return true;
    return false;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isSuperAdmin,
    isOwner,
    canEditEvent,
    isAuthenticated: !!user
  };

  // Don't render children until auth state is loaded
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
