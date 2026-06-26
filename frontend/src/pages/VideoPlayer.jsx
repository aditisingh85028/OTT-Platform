import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ArrowLeft, Users, Play, Pause, RotateCcw, Volume2, Maximize } from 'lucide-react';

const VideoPlayer = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateProgress } = useAuth();
  
  const [content, setContent] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const videoRef = useRef(null);
  const progressInterval = useRef(null);

  const seasonParam = searchParams.get('season');
  const episodeParam = searchParams.get('episode');

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        const res = await api.get(`/content/${id}`);
        setContent(res.data);

        if (res.data.type === 'movie') {
          setVideoTitle(res.data.title);
          setVideoUrl(res.data.videoUrl);
        } else {
          // It is a series, find the correct season and episode
          const sNum = Number(seasonParam) || 1;
          const eNum = Number(episodeParam) || 1;
          
          const season = res.data.seasons.find((s) => s.seasonNumber === sNum);
          const episode = season?.episodes.find((e) => e.episodeNumber === eNum);

          if (episode) {
            setVideoTitle(`${res.data.title} - S${sNum}E${eNum}: ${episode.title}`);
            setVideoUrl(episode.videoUrl);
          } else {
            alert('Episode not found');
            navigate(`/content/${id}`);
          }
        }
      } catch (error) {
        console.error('Error fetching video details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [id, seasonParam, episodeParam]);

  // Set up progress tracking and restore previous state
  useEffect(() => {
    if (user && content && videoRef.current) {
      const video = videoRef.current;

      // Find if we have saved progress for this content
      const savedProgress = user.continueWatching?.find(
        (item) => (item.content._id || item.content) === content._id
      );

      const onLoadedMetadata = () => {
        if (savedProgress && savedProgress.progress > 5 && savedProgress.progress < video.duration - 10) {
          video.currentTime = savedProgress.progress;
        }
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata);

      // Save progress periodically (every 5 seconds)
      progressInterval.current = setInterval(() => {
        if (!video.paused && video.duration > 0) {
          updateProgress(content._id, video.currentTime, video.duration);
        }
      }, 5000);

      // Cleanup
      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        clearInterval(progressInterval.current);
        // Save final progress on close
        if (video.duration > 0) {
          updateProgress(content._id, video.currentTime, video.duration);
        }
      };
    }
  }, [user, content, videoUrl]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-coral"></div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white p-4">
        <p className="text-silver">No playable video url configured.</p>
        <Link to={`/content/${id}`} className="mt-4 text-coral font-bold hover:underline">Go Back</Link>
      </div>
    );
  }

  const isYoutube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  // Launch Watch party URL builder
  const getWatchPartyUrl = () => {
    let url = `/watch-party/${id}`;
    if (seasonParam && episodeParam) {
      url += `?season=${seasonParam}&episode=${episodeParam}`;
    }
    return url;
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden select-none">
      {/* Top Floating Controls */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/content/${id}`)}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-all"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{videoTitle}</h2>
            <span className="text-[10px] text-silver uppercase tracking-widest">Currently Playing</span>
          </div>
        </div>

        {/* Watch Party Action */}
        <button
          onClick={() => navigate(getWatchPartyUrl())}
          className="flex items-center rounded-full bg-electric-violet px-4 py-2 text-xs font-bold text-white hover:bg-electric-violet/90 transition-all glow-cyan"
        >
          <Users className="mr-2 h-4 w-4" /> Start Watch Party
        </button>
      </div>

      {/* Video Display Container */}
      <div className="h-full w-full flex items-center justify-center">
        {isYoutube ? (
          // YouTube embed player
          <iframe
            src={videoUrl.replace('watch?v=', 'embed/')}
            title={videoTitle}
            className="h-full w-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          // Default HTML5 video player with custom controls standard to premium players
          <video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full"
            controls
            autoPlay
          ></video>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
