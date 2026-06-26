const Notification = require('../models/Notification');

// @desc    Get user notifications (broadcast + user-specific)
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { user: null },
        { user: req.user._id }
      ]
    }).sort({ createdAt: -1 });

    // Format output to specify if read by this user
    const formatted = notifications.map(notif => {
      const isRead = notif.isReadBy.includes(req.user._id);
      return {
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        createdAt: notif.createdAt,
        isRead,
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a notification (Admin broadcast or target)
// @route   POST /api/notifications
// @access  Private/Admin
const createNotificationByAdmin = async (req, res) => {
  const { title, message, user, type } = req.body;

  try {
    const notification = new Notification({
      title,
      message,
      user: user || null,
      type: type || 'info',
    });

    const createdNotif = await notification.save();
    
    // If we have socket.io, we could emit it to the connected users.
    // We'll hook this up in the server.js where we export the io object.
    if (global.io) {
      if (user) {
        // Targeted notification
        global.io.to(user).emit('notification', {
          _id: createdNotif._id,
          title,
          message,
          type: type || 'info',
          createdAt: createdNotif.createdAt,
          isRead: false,
        });
      } else {
        // Broadcast notification
        global.io.emit('notification', {
          _id: createdNotif._id,
          title,
          message,
          type: type || 'info',
          createdAt: createdNotif.createdAt,
          isRead: false,
        });
      }
    }

    res.status(201).json(createdNotif);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a notification as read
// @route   POST /api/notifications/read/:id
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!notification.isReadBy.includes(req.user._id)) {
      notification.isReadBy.push(req.user._id);
      await notification.save();
    }

    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  createNotificationByAdmin,
  markAsRead,
};
