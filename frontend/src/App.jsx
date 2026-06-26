import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ContentDetail from './pages/ContentDetail';
import VideoPlayer from './pages/VideoPlayer';
import WatchParty from './pages/WatchParty';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import Search from './pages/Search';
import AdminDashboard from './pages/AdminDashboard';
import ChatbotWidget from './components/ChatbotWidget';

// Layout wrapper for standard pages (Navbar + Footer)
const PageLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-cosmic-dark">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <ChatbotWidget />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Guest Landing + Authentication */}
          <Route path="/" element={<PageLayout><Home /></PageLayout>} />
          <Route path="/login" element={<PageLayout><Login /></PageLayout>} />
          <Route path="/register" element={<PageLayout><Register /></PageLayout>} />
          <Route path="/plans" element={<PageLayout><Subscription /></PageLayout>} />

          {/* User Protected Routes */}
          <Route
            path="/content/:id"
            element={
              <ProtectedRoute>
                <PageLayout>
                  <ContentDetail />
                </PageLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <PageLayout>
                  <Watchlist />
                </PageLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PageLayout>
                  <Profile />
                </PageLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <PageLayout>
                  <Search />
                </PageLayout>
              </ProtectedRoute>
            }
          />

          {/* Full Screen Cinema Players (No Navbar/Footer) */}
          <Route
            path="/watch/:id"
            element={
              <ProtectedRoute>
                <VideoPlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watch-party/:id"
            element={
              <ProtectedRoute>
                <WatchParty />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <PageLayout>
                    <AdminDashboard />
                  </PageLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<PageLayout><Home /></PageLayout>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
