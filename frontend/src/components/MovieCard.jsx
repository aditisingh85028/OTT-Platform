import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MovieCard = ({ content }) => {
  const { user, isInWatchlist, toggleWatchlist } = useAuth();
  const navigate = useNavigate();
  const inWatchlist = isInWatchlist(content._id);

  const handlePlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/watch/${content._id}`);
  };

  const handleWatchlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    await toggleWatchlist(content._id);
  };

  return (
    <Link to={`/content/${content._id}`} className="group relative block aspect-[16/9] w-full overflow-hidden rounded-lg bg-cosmic-card transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-2xl hover:shadow-electric-violet/20 border border-white/5">
      {/* Thumbnail */}
      <img
        src={content.thumbnailUrl}
        alt={content.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />

      {/* Dim Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-cosmic-darker via-cosmic-dark/40 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-90"></div>

      {/* Hover Info & Controls */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="transform translate-y-4 transition-transform duration-300 group-hover:translate-y-0">
          <h3 className="text-base font-bold text-white line-clamp-1">{content.title}</h3>
          
          <div className="mt-1 flex items-center space-x-2 text-xs text-silver">
            <span className="font-semibold text-coral">{content.releaseYear}</span>
            <span>•</span>
            <span className="capitalize">{content.type}</span>
            <span>•</span>
            <div className="flex items-center text-yellow-400">
              <Star className="mr-0.5 h-3 w-3 fill-current" />
              <span>{content.rating > 0 ? content.rating.toFixed(1) : 'New'}</span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {content.genres.slice(0, 2).map((genre, idx) => (
              <span key={idx} className="rounded-full bg-cosmic-plum/60 px-2 py-0.5 text-[10px] text-white">
                {genre}
              </span>
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-3 flex items-center space-x-2">
            <button
              onClick={handlePlayClick}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-coral text-white transition-colors duration-200 hover:bg-coral-hover"
            >
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </button>
            
            <button
              onClick={handleWatchlistToggle}
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${
                inWatchlist
                  ? 'border-green-400 text-green-400 bg-green-950/20'
                  : 'border-white/40 text-white hover:border-white hover:bg-white/10'
              }`}
              title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              {inWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
