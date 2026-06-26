import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Play, Plus, Check, Star, Send, Trash2, Calendar, Clock, Film } from 'lucide-react';

const ContentDetail = () => {
  const { id } = useParams();
  const { user, isInWatchlist, toggleWatchlist } = useAuth();
  const [content, setContent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const navigate = useNavigate();

  const inWatchlist = isInWatchlist(id);

  const fetchData = async () => {
    try {
      // Fetch Content Details
      const contentRes = await api.get(`/content/${id}`);
      setContent(contentRes.data);

      // Fetch Reviews
      const reviewRes = await api.get(`/reviews/${id}`);
      setReviews(reviewRes.data);
    } catch (error) {
      console.error('Error fetching content details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleWatchlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    await toggleWatchlist(content._id);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(`/reviews/${content._id}`, { rating, comment });
      setComment('');
      // Reload reviews and content metrics (average rating)
      await fetchData();
    } catch (error) {
      console.error('Error posting review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await api.delete(`/reviews/${reviewId}`);
        await fetchData();
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-cosmic-dark">
        <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-coral"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-cosmic-dark text-white">
        <p className="text-lg text-silver">Content not found.</p>
        <Link to="/" className="mt-4 text-coral font-bold hover:underline">Go Back Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-dark pb-20">
      {/* Background Banner */}
      <div className="relative h-[45vw] max-h-[60vh] min-h-[300px] w-full overflow-hidden">
        <img src={content.thumbnailUrl} alt={content.title} className="h-full w-full object-cover blur-sm opacity-30 scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-cosmic-dark to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-cosmic-dark via-cosmic-dark/50 to-transparent"></div>
        
        {/* Poster & Main details */}
        <div className="absolute inset-x-0 bottom-4 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-end space-y-6 md:space-y-0 md:space-x-8">
          <div className="aspect-[16/9] w-full max-w-sm rounded-lg overflow-hidden border border-white/10 shadow-2xl shrink-0">
            <img src={content.thumbnailUrl} alt={content.title} className="h-full w-full object-cover" />
          </div>
          
          <div className="flex-1 pb-2">
            <h1 className="text-3xl font-extrabold text-white sm:text-5xl">{content.title}</h1>
            
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-silver">
              <span className="font-semibold text-coral flex items-center">
                <Calendar className="h-4 w-4 mr-1" /> {content.releaseYear}
              </span>
              <span>•</span>
              <span className="capitalize">{content.type}</span>
              <span>•</span>
              {content.type === 'movie' && (
                <>
                  <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {content.duration} mins</span>
                  <span>•</span>
                </>
              )}
              <div className="flex items-center text-yellow-400">
                <Star className="mr-0.5 h-4 w-4 fill-current" />
                <span>{content.rating > 0 ? `${content.rating.toFixed(1)} / 5.0 (${content.numReviews} reviews)` : 'Not Rated'}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {content.genres.map((genre, idx) => (
                <span key={idx} className="rounded-full bg-cosmic-plum px-3 py-1 text-xs text-white border border-white/5">
                  {genre}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center space-x-3">
              {content.type === 'movie' ? (
                <Link
                  to={`/watch/${content._id}`}
                  className="flex items-center rounded-full bg-coral px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-coral-hover"
                >
                  <Play className="mr-2 h-4 w-4 fill-current" /> Watch Now
                </Link>
              ) : (
                <Link
                  to={`/watch/${content._id}?season=1&episode=1`}
                  className="flex items-center rounded-full bg-coral px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-coral-hover"
                >
                  <Play className="mr-2 h-4 w-4 fill-current" /> Play Episode 1
                </Link>
              )}

              <button
                onClick={handleWatchlistToggle}
                className={`flex items-center rounded-full border px-6 py-3 text-sm font-bold transition-all duration-200 ${
                  inWatchlist
                    ? 'border-green-400 text-green-400 bg-green-950/20'
                    : 'border-white/20 text-white hover:border-white hover:bg-white/10'
                }`}
              >
                {inWatchlist ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Added to Watchlist
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Add to Watchlist
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Info Blocks */}
      <div className="mx-auto max-w-7xl px-4 mt-8 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-3">
        {/* Description & Episodes */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Synopsis</h3>
            <p className="text-silver text-sm leading-relaxed">{content.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-2">Cast</h3>
            <p className="text-silver text-sm">{content.cast.join(', ') || 'No cast details available'}</p>
          </div>

          {/* Web Series Episodes List */}
          {content.type === 'series' && content.seasons.length > 0 && (
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                <h3 className="text-lg font-bold text-white">Episodes</h3>
                
                {/* Season Selector */}
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="rounded-lg bg-cosmic-card px-3 py-1 text-xs text-white border border-white/10 outline-none"
                >
                  {content.seasons.map((s) => (
                    <option key={s._id} value={s.seasonNumber}>
                      Season {s.seasonNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Episode list rendering */}
              <div className="space-y-4">
                {content.seasons
                  .find((s) => s.seasonNumber === selectedSeason)
                  ?.episodes.map((ep) => (
                    <Link
                      key={ep._id}
                      to={`/watch/${content._id}?season=${selectedSeason}&episode=${ep.episodeNumber}`}
                      className="flex items-center space-x-4 rounded-xl border border-white/5 bg-cosmic-card/40 p-4 transition-all hover:bg-cosmic-light hover:border-white/10 group"
                    >
                      <div className="relative aspect-[16/9] w-24 shrink-0 rounded-lg overflow-hidden bg-cosmic-dark border border-white/10">
                        <img src={content.thumbnailUrl} alt={ep.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-4 w-4 text-white fill-current" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white group-hover:text-coral transition-colors truncate">
                            {ep.episodeNumber}. {ep.title}
                          </h4>
                          <span className="text-[10px] text-silver font-semibold">{ep.duration} mins</span>
                        </div>
                        <p className="mt-1 text-[11px] text-silver line-clamp-2 leading-relaxed">
                          {ep.description || 'No description available for this episode.'}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="glass-panel rounded-2xl p-6 h-fit space-y-6">
          <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2">Reviews & Ratings</h3>

          {/* Add Review Form */}
          {user ? (
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-silver uppercase tracking-wider mb-1">Your Rating</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setRating(stars)}
                      className="text-yellow-400 focus:outline-none"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          stars <= rating ? 'fill-current' : 'text-silver/40'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-silver uppercase tracking-wider mb-1">Comment</label>
                <textarea
                  required
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts on this content..."
                  className="w-full rounded-lg py-2 px-3 text-xs glass-input"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="flex w-full items-center justify-center rounded-lg bg-coral py-2 text-xs font-bold text-white transition-all hover:bg-coral-hover"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" /> Submit Review
              </button>
            </form>
          ) : (
            <p className="text-xs text-silver">
              Please{' '}
              <Link to="/login" className="text-coral hover:underline font-bold">
                Login
              </Link>{' '}
              to write a review.
            </p>
          )}

          {/* Reviews List */}
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {reviews.length === 0 ? (
              <p className="text-xs text-silver py-4 text-center">No reviews yet. Be the first to share your opinion!</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev._id} className="border-b border-white/5 pb-3 last:border-b-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{rev.userName}</span>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-yellow-400">
                        <Star className="h-3 w-3 fill-current mr-0.5" />
                        <span className="text-[10px] font-bold">{rev.rating}</span>
                      </div>
                      
                      {(user && (user._id === rev.user._id || user._id === rev.user || user.role === 'admin')) && (
                        <button
                          onClick={() => handleDeleteReview(rev._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-silver leading-relaxed">{rev.comment}</p>
                  <span className="block text-[9px] text-silver/55">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetail;
