import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ArrowLeft, Send, Users, Play, Pause, AlertCircle } from 'lucide-react';

const WatchParty = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [content, setContent] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);

  // Chat states
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');

  const videoRef = useRef(null);
  const chatEndRef = useRef(null);

  const seasonParam = searchParams.get('season');
  const episodeParam = searchParams.get('episode');

  const roomId = `${id}${seasonParam ? `-S${seasonParam}E${episodeParam}` : ''}`;

  // Predefined lists of mock replies triggered when the user chats
  const peerReplies = [
    { sender: 'Marcus', text: 'Haha, totally agree with you on that!' },
    { sender: 'Elena', text: 'Whoa, look at the background detail in this shot!' },
    { sender: 'David', text: 'This part always gives me goosebumps, honestly.' },
    { sender: 'Marcus', text: 'Wait, did you see that coming? Mind blown.' },
    { sender: 'Elena', text: 'The sound design in this scene is absolutely elite!' },
    { sender: 'David', text: 'I need to check the cast list again, this acting is fantastic.' }
  ];

  const replyIndexRef = useRef(0);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        const res = await api.get(`/content/${id}`);
        setContent(res.data);

        if (res.data.type === 'movie') {
          setVideoTitle(res.data.title);
          setVideoUrl(res.data.videoUrl);
        } else {
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
        console.error('Error fetching content details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [id, seasonParam, episodeParam]);

  // Seed initial mock chat history and trigger delayed comments
  useEffect(() => {
    if (user && videoUrl) {
      setMessages([
        { sender: 'System', text: 'You have joined the Watch Party!', createdAt: new Date() },
        { sender: 'Marcus', text: 'Hey there! Glad you could make it.', createdAt: new Date(Date.now() - 3000) },
        { sender: 'Elena', text: 'Yes! I was just about to click play. Perfect timing!', createdAt: new Date(Date.now() - 1000) }
      ]);

      // Set up periodic automated chat comments from friends commenting on the movie
      const timer1 = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: 'David', text: 'Wow, the cinematic tone here is gorgeous.', createdAt: new Date() }
        ]);
      }, 5000);

      const timer2 = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: 'Marcus', text: 'For real, the director did an amazing job.', createdAt: new Date() }
        ]);
      }, 15000);

      const timer3 = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: 'Elena', text: 'The soundtrack is building up... get ready!', createdAt: new Date() }
        ]);
      }, 25000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [user, videoUrl]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    // 1. Append User's Message
    const userMsg = {
      sender: user.name,
      text: typedMessage,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTypedMessage('');

    // 2. Trigger automated buddy reply after a short delay
    setTimeout(() => {
      const currentReply = peerReplies[replyIndexRef.current % peerReplies.length];
      replyIndexRef.current += 1;

      setMessages((prev) => [
        ...prev,
        {
          sender: currentReply.sender,
          text: currentReply.text,
          createdAt: new Date(),
        }
      ]);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-coral"></div>
      </div>
    );
  }

  const isYoutube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  return (
    <div className="flex h-screen w-screen flex-col lg:flex-row bg-cosmic-dark select-none overflow-hidden">
      
      {/* 1. Left Video Section */}
      <div className="relative flex-1 bg-black flex flex-col justify-between">
        {/* Floating Top Header */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/content/${id}`)}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white truncate">{videoTitle}</h2>
              <span className="text-[9px] text-coral font-semibold uppercase tracking-widest flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                Mock Watch Party Demo (Synced with 3 users)
              </span>
            </div>
          </div>
        </div>

        {/* Video Frame */}
        <div className="flex-1 flex items-center justify-center">
          {isYoutube ? (
            <iframe
              src={videoUrl.replace('watch?v=', 'embed/')}
              title={videoTitle}
              className="aspect-video w-full max-w-4xl border border-white/10 rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              className="h-full w-full max-h-[85vh]"
              controls
              autoPlay
            ></video>
          )}
        </div>
      </div>

      {/* 2. Right Chat Panel */}
      <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/5 bg-cosmic-card flex flex-col h-[40vh] lg:h-full justify-between">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-cosmic-darker/60">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-coral" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Party Chat</h3>
          </div>
          <span className="text-[10px] text-green-400 font-bold bg-green-950/35 px-2 py-0.5 rounded-full flex items-center border border-green-500/10">
            4 Online
          </span>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-cosmic-plum">
          {messages.map((msg, idx) => {
            const isSystem = msg.sender === 'System';
            const isMe = msg.sender === user.name;
            
            if (isSystem) {
              return (
                <div key={idx} className="text-center">
                  <span className="inline-block rounded bg-cosmic-light/40 px-2 py-0.5 text-[9px] font-semibold text-silver border border-white/5 italic">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <span className="text-[9px] text-silver font-semibold mb-0.5">{msg.sender}</span>
                <div
                  className={`rounded-2xl px-3 py-1.5 text-xs text-white leading-relaxed break-words ${
                    isMe
                      ? 'bg-coral rounded-tr-none'
                      : 'bg-cosmic-light rounded-tl-none border border-white/5'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-cosmic-darker/40 flex items-center space-x-2">
          <input
            type="text"
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            placeholder="Send message to party..."
            className="flex-1 rounded-full py-1.5 px-3.5 text-xs glass-input"
          />
          <button
            type="submit"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral text-white hover:bg-coral-hover transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default WatchParty;
