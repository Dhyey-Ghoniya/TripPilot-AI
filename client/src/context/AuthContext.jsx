import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import userPreferenceService from '../services/userPreferenceService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session on application mount
  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response && response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
      localStorage.removeItem('trippilot_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      if (response && response.success && response.data) {
        const { user: userData, token } = response.data;
        if (token) {
          localStorage.setItem('trippilot_token', token);
        }
        setUser(userData);
        return { success: true, user: userData, message: response.message };
      }
      throw new Error(response?.message || 'Login failed');
    } catch (error) {
      const message = error.customMessage || error.message || 'Invalid email or password';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      if (response && response.success && response.data) {
        const { user: newUser, token } = response.data;
        if (token) {
          localStorage.setItem('trippilot_token', token);
        }
        setUser(newUser);
        return { success: true, user: newUser, message: response.message };
      }
      throw new Error(response?.message || 'Registration failed');
    } catch (error) {
      const message = error.customMessage || error.message || 'Registration failed';
      const errors = error.errors || [];
      return { success: false, message, errors };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('[Logout Notice]: API error during logout:', error.message);
    } finally {
      setUser(null);
      localStorage.removeItem('trippilot_token');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      if (response && response.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true, user: response.data.user, message: response.message };
      }
      throw new Error(response?.message || 'Failed to update profile');
    } catch (error) {
      const message = error.customMessage || error.message || 'Failed to update profile';
      return { success: false, message };
    }
  };

  const updateTravelPreferences = async (preferencesData) => {
    try {
      const response = await userPreferenceService.updateTravelPreferences(preferencesData);
      if (response && response.success && response.data?.preferences) {
        setUser((prev) =>
          prev
            ? { ...prev, travelPreferences: response.data.preferences }
            : prev
        );
        return { success: true, preferences: response.data.preferences, message: response.message };
      }
      throw new Error(response?.message || 'Failed to update travel preferences');
    } catch (error) {
      const message = error.customMessage || error.message || 'Failed to update travel preferences';
      return { success: false, message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await authService.changePassword(passwordData);
      if (response && response.success) {
        return { success: true, message: response.message };
      }
      throw new Error(response?.message || 'Failed to change password');
    } catch (error) {
      const message = error.customMessage || error.message || 'Failed to change password';
      return { success: false, message };
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'ADMIN',
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    updateTravelPreferences,
    changePassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

