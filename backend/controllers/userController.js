import User from '../models/User.js';

// USER FUNCTIONS (Own Profile)

// 1. Get Logged-in User's Profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 2. Update Logged-in User's Profile (No Password)
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.password) {
      return res.status(400).json({ 
        message: 'You cannot update your password here. Please use the reset password flow.' 
      });
    }

    user.fullName = req.body.fullName || user.fullName;
    user.phone = req.body.phone || user.phone;
    
    if (req.body.location) user.location = req.body.location;

    const updatedUser = await user.save();

    updatedUser.password = undefined;

    res.status(200).json({ 
      message: 'Profile updated successfully', 
      user: updatedUser 
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 3. Delete Logged-in User's Account (Self-Delete)
export const deleteUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.status(200).json({ message: 'Your account has been deleted successfully.' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// ADMIN FUNCTIONS

// 4. Admin Deleting ANY User by ID
export const deleteUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account from here.' });
    }

    await user.deleteOne();
    res.status(200).json({ message: `User ${user.fullName} has been removed by Admin.` });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};