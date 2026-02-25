import Notification from '../models/Notification.js';
import User from '../models/User.js';

// ADMIN FUNCTIONS

// 1. Get filtered users (so Admin can see who to send to)
export const getUsersForNotification = async (req, res) => {
  try {
    // We expect query parameters like: ?role=Farmer&status=Unverified
    const { role, status } = req.query; 
    let query = {};

    // Filter by Role (if it's not 'All')
    if (role && role !== 'All') {
      query.role = role;
    }

    // Filter by Verification Status (if it's not 'All')
    if (status && status !== 'All') {
      query.isVerified = status === 'Verified' ? true : false;
    }

    // Find the users and only return the necessary details
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
    const senderId = req.user._id; // Taken from your `protect` middleware!

    // --- SCENARIO A: SEND TO A SINGLE SPECIFIC USER ---
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

    // --- SCENARIO B: SEND IN BULK (BASED ON FILTERS) ---
    } else if (targetType === 'Bulk') {
      let query = {};

      if (role && role !== 'All') query.role = role;
      if (verificationStatus && verificationStatus !== 'All') {
        query.isVerified = verificationStatus === 'Verified' ? true : false;
      }

      // Find everyone matching the Admin's filters (we only need their _id)
      const targetUsers = await User.find(query).select('_id');

      if (targetUsers.length === 0) {
        return res.status(404).json({ message: 'No users found matching these criteria.' });
      }

      // Map through the users and build an array of unique notification objects
      const notifications = targetUsers.map(user => ({
        recipient: user._id,
        sender: senderId,
        title,
        message
      }));

      // Insert all copies into the database at the exact same time!
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
    // Find notifications where the recipient matches the currently logged-in user
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }) // Sort by newest first
      .populate('sender', 'fullName role'); // Attach the Admin's name so the user sees who sent it

    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 4. Mark a specific notification as Read
export const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    // Make sure we only update it if it belongs to the logged-in user
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