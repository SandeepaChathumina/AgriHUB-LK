import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import Distributor from '../models/Distributor.js';
import Transporter from '../models/Transporter.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

const removeLocalFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const register = async (req, res) => {
  try {
    const { role, email, password, fullName, phone, ...roleSpecificData } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (req.file) removeLocalFile(req.file.path);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      fullName,
      email,
      password: hashedPassword,
      phone,
      ...roleSpecificData
    };

    let newUser;

    switch (role) {
      case 'Farmer':
        newUser = new Farmer(userData);
        break;

      case 'Distributor': {
        if (req.file) {
          const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: 'agrihub/distributor-logos'
          });

          userData.logo = {
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id
          };

          removeLocalFile(req.file.path);
        }

        newUser = new Distributor(userData);
        break;
      }

      case 'Transporter': {
        if (req.file) {
          const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: 'agrihub/transporter-logos'
          });

          userData.logo = {
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id
          };

          removeLocalFile(req.file.path);
        }

        newUser = new Transporter(userData);
        break;
      }

      case 'Admin':
        newUser = new Admin(userData);
        break;

      default:
        if (req.file) removeLocalFile(req.file.path);
        return res.status(400).json({ message: 'Invalid role provided' });
    }

    await newUser.save();

    res.status(201).json({
      message: `${role} registered successfully! You can verify your account later.`,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified,
        logo: newUser.logo || null
      }
    });
  } catch (error) {
    if (req.file) removeLocalFile(req.file.path);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'super_secret_agri_key',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        logo: user.logo || null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'User id is required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if ((user.role === 'Distributor' || user.role === 'Transporter') && user.logo?.public_id) {
      await cloudinary.uploader.destroy(user.logo.public_id);
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- TEMPORARY EMAIL TEST ---
export const testEmail = async (req, res) => {
  try {
    await sendEmail({
      email: req.body.email,
      subject: 'AgriHUB-LK Test Email',
      message: 'Hello! If you are reading this, your Nodemailer is working perfectly!',
    });

    res.status(200).json({ message: 'Test email sent successfully!' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Email failed to send', error: error.message });
  }
};

// --- REQUEST OTP (ON DEMAND) ---
export const requestVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otpCode;
    user.otpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const emailMessage = `Hello ${user.fullName},\n\nYou requested an account verification code. Your OTP is: ${otpCode}\n\nThis code will expire in 10 minutes.`;

    await sendEmail({
      email: user.email,
      subject: 'AgriHUB-LK - Your Verification Code',
      message: emailMessage
    });

    res.status(200).json({ message: 'OTP sent successfully to your email!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- VERIFY OTP METHOD ---
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- FORGOT PASSWORD (SEND OTP) ---
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOtp = resetOtp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const emailMessage = `Hello ${user.fullName},\n\nYou requested a password reset. Your OTP is: ${resetOtp}\n\nThis code will expire in 15 minutes. If you did not request this, please ignore this email.`;

    await sendEmail({
      email: user.email,
      subject: 'AgriHUB-LK - Password Reset Code',
      message: emailMessage
    });

    res.status(200).json({ message: 'Password reset OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- RESET PASSWORD (UPDATE WITH NEW PASSWORD) ---
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};