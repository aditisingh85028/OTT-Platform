import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, User, LogOut, Film, Tv, List, Award, Settings, Menu, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import io from 'socket.io-client';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);

  // Fetch initial notifications
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/notifications');
          setNotifications(res.data);
          setUnreadCount(res.data.filter((n) => !n.isRead).length);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };
      fetchNotifications();

      // Initialize Socket connection
      socketRef.current = io('http://localhost:5000');
      
      // Register user with socket (for targeted pushes)
      socketRef.current.on('connect', () => {
        // We can emit a join event or similar if needed.
        // Actually, we can join a room named after user's ID so the admin can send direct alerts!
        socketRef.current.emit('join_watch_party', { roomId: user._id, userName: user.name });
      });

      // Listen for incoming notifications
      socketRef.current.on('notification', (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user]);

  const handleMarkAsRead = async (notifId) => {
    try {
      await api.post(`/notifications/read/${notifId}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close menus on path changes
  useEffect(() => {
    setShowNotifPanel(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-cosmic-dark/95 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Links */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <span className="bg-gradient-to-r from-coral to-electric-violet bg-clip-text text-xl font-extrabold tracking-wider text-transparent uppercase">
                OTT STREAM
              </span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center space-x-6">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center text-sm font-semibold tracking-wide transition-colors ${
                      isActive ? 'text-coral' : 'text-silver hover:text-white'
                    }`
                  }
                  end
                >
                  <Film className="mr-1.5 h-4 w-4" />
                  Content Library
                </NavLink>
                <NavLink
                  to="/watchlist"
                  className={({ isActive }) =>
                    `flex items-center text-sm font-semibold tracking-wide transition-colors ${
                      isActive ? 'text-coral' : 'text-silver hover:text-white'
                    }`
                  }
                >
                  <List className="mr-1.5 h-4 w-4" />
                  My Watchlist
                </NavLink>
                <NavLink
                  to="/plans"
                  className={({ isActive }) =>
                    `flex items-center text-sm font-semibold tracking-wide transition-colors ${
                      isActive ? 'text-coral' : 'text-silver hover:text-white'
                    }`
                  }
                >
                  <Award className="mr-1.5 h-4 w-4" />
                  Plans
                </NavLink>
              </div>
            )}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Search link */}
                <Link
                  to="/search"
                  className="rounded-full p-2 text-silver transition-colors hover:bg-cosmic-light hover:text-white"
                  title="Search Content"
                >
                  <Search className="h-5 w-5" />
                </Link>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifPanel(!showNotifPanel)}
                    className="relative rounded-full p-2 text-silver transition-colors hover:bg-cosmic-light hover:text-white"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[9px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Panel */}
                  {showNotifPanel && (
                    <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-cosmic-card p-4 shadow-2xl z-50 glass-panel">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h4 className="text-sm font-bold text-white">Notifications</h4>
                        <span className="text-xs text-silver">{unreadCount} Unread</span>
                      </div>
                      <div className="mt-2 max-h-60 overflow-y-auto space-y-3">
                        {notifications.length === 0 ? (
                          <p className="py-4 text-center text-xs text-silver">No new notifications</p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              className={`rounded-lg p-2.5 transition-colors ${
                                notif.isRead ? 'bg-transparent' : 'bg-cosmic-light/40 border-l-2 border-coral'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <h5 className="text-xs font-bold text-white">{notif.title}</h5>
                                {!notif.isRead && (
                                  <button
                                    onClick={() => handleMarkAsRead(notif._id)}
                                    className="text-[10px] text-coral hover:underline flex items-center"
                                  >
                                    <Check className="h-3 w-3 mr-0.5" />
                                    Read
                                  </button>
                                )}
                              </div>
                              <p className="mt-1 text-[11px] text-silver leading-relaxed">{notif.message}</p>
                              <span className="mt-1 block text-[9px] text-silver/60">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar / Settings */}
                <div className="relative group">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 rounded-full border border-white/10 bg-cosmic-light/50 px-3 py-1.5 hover:bg-cosmic-light transition-all"
                  >
                    <User className="h-4 w-4 text-coral" />
                    <span className="hidden sm:inline text-xs font-medium text-white max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </Link>

                  {/* Dropdown menu on hover */}
                  <div className="absolute right-0 hidden group-hover:block w-48 rounded-xl border border-white/10 bg-cosmic-card py-2 shadow-2xl glass-panel">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-xs text-silver hover:bg-cosmic-light hover:text-white"
                    >
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-xs text-silver hover:bg-cosmic-light hover:text-white"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-xs text-red-400 hover:bg-red-950/20 hover:text-red-300"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-silver hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-coral px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-coral-hover"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden rounded-full p-2 text-silver transition-colors hover:bg-cosmic-light hover:text-white"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && user && (
        <div className="md:hidden bg-cosmic-card border-b border-white/5 px-4 pt-2 pb-4 space-y-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-cosmic-light text-coral' : 'text-silver hover:bg-cosmic-light/45 hover:text-white'
              }`
            }
            end
          >
            <Film className="mr-3 h-5 w-5" />
            Content Library
          </NavLink>
          <NavLink
            to="/watchlist"
            className={({ isActive }) =>
              `flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-cosmic-light text-coral' : 'text-silver hover:bg-cosmic-light/45 hover:text-white'
              }`
            }
          >
            <List className="mr-3 h-5 w-5" />
            My Watchlist
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              `flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-cosmic-light text-coral' : 'text-silver hover:bg-cosmic-light/45 hover:text-white'
              }`
            }
          >
            <Award className="mr-3 h-5 w-5" />
            Plans
          </NavLink>
          {user.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-cosmic-light text-coral' : 'text-silver hover:bg-cosmic-light/45 hover:text-white'
                }`
              }
            >
              <Settings className="mr-3 h-5 w-5" />
              Admin Dashboard
            </NavLink>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/20"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
