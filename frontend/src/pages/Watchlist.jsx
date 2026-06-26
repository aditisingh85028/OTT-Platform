import React from 'react';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import { List, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Watchlist = () => {
  const { user } = useAuth();

  if (!user) return null;

  const watchlistItems = user.watchlist || [];

  return (
    <div className="min-h-screen bg-cosmic-dark pb-20 px-4 sm:px-6 lg:px-8 pt-8">
      <div className="mx-auto max-w-7xl">
        
        <h1 className="text-2xl font-bold text-white tracking-wider flex items-center mb-6">
          <List className="h-6 w-6 text-coral mr-2" /> My Watchlist
        </h1>

        {watchlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-silver bg-cosmic-card/20 border border-white/5 rounded-2xl p-6 glass-panel max-w-lg mx-auto">
            <AlertCircle className="h-10 w-10 text-coral/60 mb-2 animate-bounce" />
            <h3 className="text-sm font-bold text-white mb-1">Your watchlist is empty</h3>
            <p className="text-xs text-silver mb-6">Explore our movies and web series catalog and save items to watch them later.</p>
            <Link
              to="/"
              className="rounded-full bg-coral px-6 py-2 text-xs font-bold text-white hover:bg-coral-hover transition-colors shadow-md shadow-coral/15"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {watchlistItems.map((content) => (
              <MovieCard key={content._id} content={content} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
