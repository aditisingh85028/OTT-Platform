import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if token exists and load user
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error('Error loading user profile:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Register user
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  // Login user
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      
      // Fetch full profile (populated watchlist, continueWatching)
      const profileRes = await api.get('/auth/me');
      setUser(profileRes.data);
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Refresh user data (useful after watchlist additions/purchases)
  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (error) {
      console.error('Failed to refresh user data', error);
    }
  };

  // Check if content is in watchlist
  const isInWatchlist = (contentId) => {
    if (!user || !user.watchlist) return false;
    return user.watchlist.some((item) => (item._id || item) === contentId);
  };

  // Toggle watchlist
  const toggleWatchlist = async (contentId) => {
    if (!user) return false;
    const inWatchlist = isInWatchlist(contentId);
    
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${contentId}`);
      } else {
        await api.post(`/watchlist/${contentId}`);
      }
      await refreshUser();
      return true;
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      return false;
    }
  };

  // Update continue watching progress
  const updateProgress = async (contentId, progress, duration) => {
    if (!user) return;
    try {
      await api.post('/continue-watching', { contentId, progress, duration });
      // update user's continueWatching locally to avoid layout flickers
      setUser((prev) => {
        if (!prev) return null;
        
        // Remove existing progress entry
        const filtered = prev.continueWatching.filter(
          (item) => (item.content._id || item.content) !== contentId
        );
        
        // If not completed (less than 95%), add to front of list
        const isCompleted = duration > 0 && (progress / duration) > 0.95;
        if (!isCompleted && progress > 5) {
          // Find the content detail from current user's continue watching to keep references,
          // or we can refresh user periodically
          const newEntry = {
            content: contentId, // or full object, we'll refreshUser to get clean state
            progress,
            duration,
            updatedAt: new Date().toISOString(),
          };
          
          // Re-insert at beginning
          filtered.unshift(newEntry);
        }
        
        return {
          ...prev,
          continueWatching: filtered.slice(0, 15),
        };
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        refreshUser,
        isInWatchlist,
        toggleWatchlist,
        updateProgress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
