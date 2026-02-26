import Notification from '../models/Notification.js';
import User from '../models/User.js';

// ADMIN FUNCTIONS

// 1. Get filtered users 
export const getUsersForNotification = async (req, res) => {
  try {
    const { role, status } = req.query; 
    let query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (status && status !== 'All') {
      query.isVerified = status === 'Verified' ? true : false;
    }

    const users = await User.find(query).select('fullName email role isVerified phone');
    
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 2. Send the notification (Handles Single AND Bulk)
export const sendNotification = async (req, res) => {
  try {
    const { targetType, userId, role, verificationStatus, title, message } = req.body;
    const senderId = req.user._id; 

    if (targetType === 'Single') {
      if (!userId) return res.status(400).json({ message: 'User ID is required for Single targetType.' });

      const newNotification = new Notification({
        recipient: userId,
        sender: senderId,
        title,
        message
      });
      await newNotification.save();
      
      return res.status(201).json({ message: 'Notification sent successfully to the user!' });

    } else if (targetType === 'Bulk') {
      let query = {};

      if (role && role !== 'All') query.role = role;
      if (verificationStatus && verificationStatus !== 'All') {
        query.isVerified = verificationStatus === 'Verified' ? true : false;
      }

      const targetUsers = await User.find(query).select('_id');

      if (targetUsers.length === 0) {
        return res.status(404).json({ message: 'No users found matching these criteria.' });
      }

      const notifications = targetUsers.map(user => ({
        recipient: user._id,
        sender: senderId,
        title,
        message
      }));

      await Notification.insertMany(notifications);

      return res.status(201).json({ 
        message: `Bulk notification sent successfully to ${targetUsers.length} users!` 
      });

    } else {
      return res.status(400).json({ message: 'Invalid targetType. Must be Single or Bulk.' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// USER FUNCTIONS

// 3. Get my own notifications
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }) 
      .populate('sender', 'fullName role'); 

    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    const notification = await Notification.findOne({ _id: notificationId, recipient: req.user._id });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or unauthorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 3. Admin: Get ALL notifications (with filters for Role and Read Status)
export const getAllNotificationsAdmin = async (req, res) => {
  try {
    const { role, isRead } = req.query;
    let query = {};

    // Filter by Read Status (true or false)
    if (isRead && isRead !== 'All') {
      query.isRead = isRead === 'true';
    }

    // Filter by User Role (Farmer, Distributor, etc.)
    if (role && role !== 'All') {
      // First, find all users with that specific role
      const targetUsers = await User.find({ role }).select('_id');
      const userIds = targetUsers.map(user => user._id);
      
      // Then, only look for notifications sent to those specific users
      query.recipient = { $in: userIds };
    }

    // Fetch notifications and attach the recipient's name and role so the Admin can see who it's for
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('recipient', 'fullName role email')
      .populate('sender', 'fullName');

    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 4. Admin: Update a notification (ONLY if unread)
export const updateNotificationAdmin = async (req, res) => {
  try {
    const { title, message } = req.body;
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // SECURITY CHECK: Block update if already read!
    if (notification.isRead) {
      return res.status(400).json({ 
        message: 'Cannot update this notification because the user has already read it.' 
      });
    }

    // Update the fields
    notification.title = title || notification.title;
    notification.message = message || notification.message;
    await notification.save();

    res.status(200).json({ message: 'Notification updated successfully', notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 5. Admin: Delete a notification
export const deleteNotificationAdmin = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.deleteOne();

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};