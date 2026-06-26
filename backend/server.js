const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.send('OTT API is running...');
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const continueWatchingRoutes = require('./routes/continueWatchingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const planRoutes = require('./routes/planRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/continue-watching', continueWatchingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Create HTTP server for Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Make io globally accessible for controllers to send live events
global.io = io;

// Socket.io Real-Time Module (Watch Party & Notifications)
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a specific watch party room
  socket.on('join_watch_party', ({ roomId, userName }) => {
    socket.join(roomId);
    console.log(`${userName} joined room: ${roomId}`);
    
    // Broadcast user joined notification
    socket.to(roomId).emit('message_received', {
      sender: 'System',
      text: `${userName} has joined the Watch Party!`,
      createdAt: new Date(),
    });
  });

  // Handle Watch Party Chat messaging
  socket.on('send_message', ({ roomId, sender, text }) => {
    io.to(roomId).emit('message_received', {
      sender,
      text,
      createdAt: new Date(),
    });
  });

  // Handle video synchronization events
  socket.on('video_play', ({ roomId, time, sender }) => {
    socket.to(roomId).emit('sync_play', { time, sender });
  });

  socket.on('video_pause', ({ roomId, sender }) => {
    socket.to(roomId).emit('sync_pause', { sender });
  });

  socket.on('video_seek', ({ roomId, time, sender }) => {
    socket.to(roomId).emit('sync_seek', { time, sender });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
