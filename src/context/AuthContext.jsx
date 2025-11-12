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
    if (user.role === 'superadmin') return true;
    if (user.role === 'owner' && user.id === eventOwnerId) return true;
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
