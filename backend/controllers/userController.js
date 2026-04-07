import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// USER FUNCTIONS (Own Profile)

const removeLocalFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

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
      if (req.file) removeLocalFile(req.file.path);
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.password) {
      if (req.file) removeLocalFile(req.file.path);
      return res.status(400).json({ 
        message: 'You cannot update your password here. Please use the reset password flow.' 
      });
    }

    // --- NEW: CLOUDINARY LOGO UPDATE LOGIC ---
    if (req.file) {
      // 1. If user already has a logo, delete the old one from Cloudinary first
      if (user.logo && user.logo.public_id) {
        await cloudinary.uploader.destroy(user.logo.public_id);
      }

      // 2. Upload the new logo
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'agrihub/distributor-logos'
      });

      // 3. Save new logo data to user
      user.logo = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      };

      // 4. Delete the temp file saved by Multer
      removeLocalFile(req.file.path);
    }
    // ------------------------------------------

    // Update basic text fields
    user.fullName = req.body.fullName || user.fullName;
    user.phone = req.body.phone || user.phone;
    if (req.body.location) user.location = req.body.location;

    // Role-specific updates
    switch (user.role) {
      case 'Farmer':
        if (req.body.farmSize !== undefined) user.farmSize = req.body.farmSize;
        if (req.body.nicNumber !== undefined) user.nicNumber = req.body.nicNumber;
        if (req.body.mainCrops !== undefined) user.mainCrops = req.body.mainCrops;
        break;
      case 'Distributor':
        if (req.body.businessName !== undefined) user.businessName = req.body.businessName;
        if (req.body.businessRegNumber !== undefined) user.businessRegNumber = req.body.businessRegNumber;
        if (req.body.warehouseCapacity !== undefined) user.warehouseCapacity = req.body.warehouseCapacity;
        break;
      case 'Transporter':
        if (req.body.companyName !== undefined) user.companyName = req.body.companyName;
        if (req.body.businessRegNumber !== undefined) user.businessRegNumber = req.body.businessRegNumber;
        if (req.body.fleetSize !== undefined) user.fleetSize = req.body.fleetSize;
        break;
    }

    const updatedUser = await user.save();
    updatedUser.password = undefined;

    res.status(200).json({ 
      message: 'Profile updated successfully', 
      user: updatedUser 
    });

  } catch (error) {
    if (req.file) removeLocalFile(req.file.path);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const removeLogo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.logo || !user.logo.public_id) {
      return res.status(400).json({ message: 'No logo found to delete' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(user.logo.public_id);

    // Clear the logo object in the database
    user.logo = { url: '', public_id: '' };
    
    const updatedUser = await user.save();
    updatedUser.password = undefined;

    res.status(200).json({ 
      message: 'Logo removed successfully', 
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

export const getUserLogo = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('logo role businessName');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user actually has a logo
    if (!user.logo || !user.logo.url) {
      return res.status(404).json({ 
        message: 'No logo found for this user',
        logoUrl: null 
      });
    }

    res.status(200).json({
      success: true,
      businessName: user.businessName,
      logoUrl: user.logo.url
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateLogoOnly = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      if (req.file) removeLocalFile(req.file.path);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    // 1. If user already has a logo, delete the old one from Cloudinary first
    if (user.logo && user.logo.public_id) {
      await cloudinary.uploader.destroy(user.logo.public_id);
    }

    // 2. Upload the new logo to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: 'agrihub/distributor-logos'
    });

    // 3. Save new logo data to user
    user.logo = {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id
    };

    // FORCE MONGOOSE TO SAVE THE NESTED OBJECT
    user.markModified('logo'); 
    await user.save();

    // 4. Delete the temporary file saved by Multer
    removeLocalFile(req.file.path);

    // Send back the new URL for the frontend
    res.status(200).json({ 
      message: 'Logo updated successfully', 
      logoUrl: user.logo.url 
    });

  } catch (error) {
    if (req.file) removeLocalFile(req.file.path);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};