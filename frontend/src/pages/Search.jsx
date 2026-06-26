import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import MovieCard from '../components/MovieCard';
import { Search as SearchIcon, SlidersHorizontal, AlertCircle } from 'lucide-react';

const Search = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState(''); // '' (All), 'movie', 'series'
  const [genre, setGenre] = useState(''); // selected genre
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hardcoded list of categories for filter tabs
  const genresList = [
    'Action', 'Sci-Fi', 'Adventure', 'Fantasy', 'Thriller', 'Animation', 'Drama', 'Documentary', 'Mystery'
  ];

  const fetchResults = async () => {
    setLoading(true);
    try {
      // Build API query params
      const params = {};
      if (query) params.search = query;
      if (type) params.type = type;
      if (genre) params.genre = genre;

      const res = await api.get('/content', { params });
      setResults(res.data);
    } catch (error) {
      console.error('Error searching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchResults();
    }, 300); // Debounce typing search calls

    return () => clearTimeout(delayDebounceFn);
  }, [query, type, genre]);

  return (
    <div className="min-h-screen bg-cosmic-dark pb-20 px-4 sm:px-6 lg:px-8 pt-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold text-white tracking-wider flex items-center mb-6">
          <SearchIcon className="h-6 w-6 text-coral mr-2" /> Explore Content
        </h1>

        {/* Filters and Inputs Wrapper */}
        <div className="grid gap-4 md:grid-cols-4 items-end mb-8 bg-cosmic-card/40 border border-white/5 rounded-2xl p-6 glass-panel">
          
          {/* Search Box */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-silver uppercase tracking-wider mb-2">Search Query</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-silver" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies, web series, characters..."
                className="w-full rounded-lg py-2 pl-9 pr-4 text-xs glass-input"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-bold text-silver uppercase tracking-wider mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg py-2 px-3 text-xs glass-input outline-none cursor-pointer"
            >
              <option value="">All Formats</option>
              <option value="movie">Movies</option>
              <option value="series">Web Series</option>
            </select>
          </div>

          {/* Reset Filter Button */}
          <div>
            {(query || type || genre) && (
              <button
                onClick={() => {
                  setQuery('');
                  setType('');
                  setGenre('');
                }}
                className="w-full rounded-lg bg-cosmic-light hover:bg-cosmic-plum hover:text-coral transition-colors py-2 text-xs font-bold text-white border border-white/5"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Genre Tags Horizontal Filter */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-silver uppercase tracking-wider mb-3">Genres</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setGenre('')}
              className={`rounded-full px-4 py-1 text-xs font-semibold border transition-all ${
                genre === ''
                  ? 'bg-coral text-white border-coral glow-coral'
                  : 'bg-cosmic-card text-silver border-white/10 hover:border-white/20'
              }`}
            >
              All Genres
            </button>
            {genresList.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`rounded-full px-4 py-1 text-xs font-semibold border transition-all ${
                  genre === g
                    ? 'bg-coral text-white border-coral glow-coral'
                    : 'bg-cosmic-card text-silver border-white/10 hover:border-white/20'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Results section */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-coral"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-silver">
            <AlertCircle className="h-10 w-10 text-coral/60 mb-2 animate-bounce" />
            <p className="text-sm">No matches found for your search filters.</p>
            <span className="text-xs text-silver/60">Try searching for other keywords or select different genres.</span>
          </div>
        ) : (
          <div>
            <span className="block text-xs text-silver font-semibold mb-4 uppercase tracking-wider">
              Search Results ({results.length})
            </span>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {results.map((content) => (
                <MovieCard key={content._id} content={content} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
