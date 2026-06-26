import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MessageSquare, X, Send, Sparkles, Bot, User } from 'lucide-react';

const ChatbotWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'init',
      text: "Hi! I'm your Streaming Assistant. 🎬 Ask me to recommend movies/series by genre, get ratings, or ask about subscription plans!",
      isBot: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Hide chatbot if user is not logged in
  if (!user) return null;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: input,
      isBot: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot', { message: userMessage.text });
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: res.data.reply,
        isBot: true,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot API error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I'm having trouble connecting to the streaming service right now. Please try again later.",
          isBot: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* 1. Toggle Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-coral text-white shadow-lg shadow-coral/30 hover:bg-coral-hover transition-all duration-300 hover:scale-110 glow-coral"
          title="Open Assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* 2. Expandable Chat Box */}
      {isOpen && (
        <div className="w-[340px] h-[450px] rounded-2xl border border-white/10 shadow-2xl glass-panel flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-cosmic-darker/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-coral" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Stream Bot</h4>
                <span className="text-[9px] text-green-400 font-semibold flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                  Online Assistant
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="text-silver hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-cosmic-plum">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2 max-w-[85%] ${
                  msg.isBot ? 'mr-auto' : 'ml-auto flex-row-reverse space-x-reverse'
                }`}
              >
                {/* Avatar Icon */}
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  msg.isBot ? 'bg-coral/25 text-coral' : 'bg-cosmic-light text-white'
                }`}>
                  {msg.isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </div>

                {/* Bubble message */}
                <div
                  className={`rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                    msg.isBot
                      ? 'bg-cosmic-light text-white rounded-tl-none border border-white/5'
                      : 'bg-coral text-white rounded-tr-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Loading / Typing indicator */}
            {loading && (
              <div className="flex items-center space-x-2 mr-auto max-w-[85%]">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-coral/25 text-coral">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl px-3 py-2 bg-cosmic-light border border-white/5 rounded-tl-none flex space-x-1 items-center h-8">
                  <span className="h-1.5 w-1.5 bg-silver rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-silver rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-silver rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-cosmic-darker/40 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me something..."
              className="flex-grow rounded-full py-2 px-4 text-xs glass-input"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral text-white hover:bg-coral-hover disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
