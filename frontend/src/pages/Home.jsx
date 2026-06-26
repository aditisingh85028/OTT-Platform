import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import MovieCard from '../components/MovieCard';
import { Play, Info, Plus, Check, Star, ShieldAlert, Sparkles } from 'lucide-react';

const Home = () => {
  const { user, isInWatchlist, toggleWatchlist } = useAuth();
  const [contents, setContents] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          // Fetch contents
          const res = await api.get('/content');
          setContents(res.data);
          
          // Find featured
          const featRes = await api.get('/content/featured');
          if (featRes.data.length > 0) {
            setFeatured(featRes.data[0]);
          } else if (res.data.length > 0) {
            setFeatured(res.data[0]);
          }
        } else {
          // Fetch plans for landing page
          const plansRes = await api.get('/plans');
          setPlans(plansRes.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-cosmic-dark">
        <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-coral"></div>
      </div>
    );
  }

  // --- RENDERING LANDING PAGE (GUEST) ---
  if (!user) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] bg-cosmic-dark bg-radial-glow pb-20">
        {/* Hero Banner */}
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 lg:px-8 text-center">
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 -translate-y-12 h-64 w-64 bg-electric-violet/10 rounded-full blur-3xl -z-10"></div>
          
          <span className="inline-flex items-center rounded-full bg-coral/15 px-3 py-1 text-xs font-bold text-coral border border-coral/20 uppercase tracking-widest mb-4">
            <Sparkles className="mr-1.5 h-3 w-3 fill-current" /> Introducing Watch Parties
          </span>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Stream Together.<br />
            <span className="bg-gradient-to-r from-coral to-electric-violet bg-clip-text text-transparent">
              Anywhere. Anytime.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-silver leading-relaxed">
            Experience the ultimate OTT platform. Engage in real-time synced Watch Parties with friends, rate your favorites, and enjoy high-speed content streams.
          </p>

          <div className="mt-8 flex justify-center space-x-4">
            <Link
              to="/register"
              className="rounded-full bg-coral px-8 py-3 text-sm font-bold text-white shadow-lg shadow-coral/30 hover:bg-coral-hover transition-all"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Subscription Plans Grid */}
        <div className="mx-auto max-w-7xl px-4 mt-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Pricing Plans</h2>
            <p className="mt-2 text-xs text-silver uppercase tracking-wider">Choose a plan that fits your streaming style</p>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="flex flex-col rounded-2xl glass-panel p-6 relative overflow-hidden transition-all duration-300 hover:scale-105"
              >
                {plan.name.toLowerCase().includes('platinum') && (
                  <div className="absolute -right-12 -top-1 px-12 py-2 bg-coral text-white text-[9px] font-extrabold rotate-45 uppercase tracking-wider">
                    Best Value
                  </div>
                )}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-white">₹{plan.price}</span>
                  <span className="ml-1 text-xs text-silver">
                    /{plan.durationMonths > 1 ? `${plan.durationMonths} months` : 'month'}
                  </span>
                </div>

                <ul className="mt-6 space-y-3 flex-1 border-t border-white/5 pt-6 text-xs text-silver">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-coral"></span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className="mt-8 block w-full rounded-xl bg-coral py-2.5 text-center text-xs font-bold text-white transition-all hover:bg-coral-hover"
                >
                  Join Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING BROWSE PAGE (LOGGED IN USER) ---
  const watchlistItems = contents.filter((c) => isInWatchlist(c._id));
  const movies = contents.filter((c) => c.type === 'movie');
  const series = contents.filter((c) => c.type === 'series');
  const continueWatching = user.continueWatching || [];

  return (
    <div className="min-h-screen bg-cosmic-dark pb-16">
      {/* Featured Hero Banner */}
      {featured && (
        <div className="relative h-[56.25vw] max-h-[80vh] min-h-[400px] w-full overflow-hidden">
          <img
            src={featured.thumbnailUrl}
            alt={featured.title}
            className="h-full w-full object-cover"
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-cosmic-dark via-cosmic-dark/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-cosmic-dark via-transparent to-transparent"></div>

          {/* Featured Info */}
          <div className="absolute bottom-[10%] left-4 max-w-lg sm:left-12">
            <span className="inline-flex items-center rounded-full bg-coral/20 px-2.5 py-0.5 text-xs font-bold text-coral border border-coral/30 uppercase tracking-wider mb-3">
              Featured Content
            </span>
            <h1 className="text-2xl font-extrabold text-white sm:text-5xl drop-shadow-md">
              {featured.title}
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-silver line-clamp-3 leading-relaxed drop-shadow-sm">
              {featured.description}
            </p>

            <div className="mt-3 flex items-center space-x-2 text-xs text-silver">
              <span className="font-semibold text-coral">{featured.releaseYear}</span>
              <span>•</span>
              <span className="capitalize">{featured.type}</span>
              <span>•</span>
              <div className="flex items-center text-yellow-400">
                <Star className="mr-0.5 h-3 w-3 fill-current" />
                <span>{featured.rating > 0 ? featured.rating.toFixed(1) : 'New'}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-6 flex items-center space-x-3">
              <Link
                to={`/watch/${featured._id}`}
                className="flex items-center rounded-full bg-coral px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-coral-hover"
              >
                <Play className="mr-2 h-4 w-4 fill-current" /> Play Now
              </Link>
              
              <Link
                to={`/content/${featured._id}`}
                className="flex items-center rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all"
              >
                <Info className="mr-2 h-4 w-4" /> More Info
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Browse Lists */}
      <div className="px-4 sm:px-6 lg:px-8 mt-8 space-y-10 relative z-20">
        
        {/* Continue Watching Section */}
        {continueWatching.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide mb-4 flex items-center">
              <span className="h-4 w-1 bg-coral rounded-full mr-2"></span>
              Continue Watching
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {continueWatching.map((item) => {
                if (!item.content) return null;
                const percentage = item.duration > 0 ? Math.round((item.progress / item.duration) * 100) : 0;
                
                return (
                  <div key={item._id} className="group relative rounded-lg overflow-hidden bg-cosmic-card border border-white/5">
                    <Link to={`/watch/${item.content._id}`}>
                      <div className="relative aspect-[16/9] w-full">
                        <img
                          src={item.content.thumbnailUrl}
                          alt={item.content.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coral text-white">
                            <Play className="h-5 w-5 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="p-2.5">
                      <h4 className="text-xs font-bold text-white truncate">{item.content.title}</h4>
                      {/* Progress bar */}
                      <div className="mt-2 h-1 w-full bg-cosmic-light rounded-full overflow-hidden">
                        <div
                          className="h-full bg-coral"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="mt-1 block text-[9px] text-silver">
                        {percentage}% completed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trending Section */}
        {contents.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide mb-4 flex items-center">
              <span className="h-4 w-1 bg-coral rounded-full mr-2"></span>
              Trending Now
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {contents.slice(0, 10).map((content) => (
                <MovieCard key={content._id} content={content} />
              ))}
            </div>
          </div>
        )}

        {/* Watchlist Section */}
        {watchlistItems.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide mb-4 flex items-center">
              <span className="h-4 w-1 bg-coral rounded-full mr-2"></span>
              My Watchlist
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {watchlistItems.map((content) => (
                <MovieCard key={content._id} content={content} />
              ))}
            </div>
          </div>
        )}

        {/* Movies Section */}
        {movies.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide mb-4 flex items-center">
              <span className="h-4 w-1 bg-coral rounded-full mr-2"></span>
              Blockbuster Movies
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {movies.map((content) => (
                <MovieCard key={content._id} content={content} />
              ))}
            </div>
          </div>
        )}

        {/* Series Section */}
        {series.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide mb-4 flex items-center">
              <span className="h-4 w-1 bg-coral rounded-full mr-2"></span>
              Trending Web Series
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {series.map((content) => (
                <MovieCard key={content._id} content={content} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
