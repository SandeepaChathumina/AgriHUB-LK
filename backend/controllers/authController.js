import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import Distributor from '../models/Distributor.js';
import Transporter from '../models/Transporter.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';

export const register = async (req, res) => {
  try {
    const { role, email, password, fullName, phone, ...roleSpecificData } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
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
      case 'Distributor':
        newUser = new Distributor(userData);
        break;
      case 'Transporter':
        newUser = new Transporter(userData);
        break;
      case 'Admin':                          
        newUser = new Admin(userData);       
        break;
      default:
        return res.status(400).json({ message: 'Invalid role provided' });
    }

    // Just save the user normally! No OTP generated here anymore.
    await newUser.save();

    res.status(201).json({ 
      message: `${role} registered successfully! You can verify your account later.`, 
      user: { id: newUser._id, email: newUser.email, role: newUser.role, isVerified: newUser.isVerified } 
    });

  } catch (error) {
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
      user: { id: user._id, fullName: user.fullName, role: user.role }
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
      users: users
    });

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

    // 1. Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Check if they are already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified' });
    }

    // 3. Generate new OTP and expiration (10 minutes)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otpCode;
    user.otpExpires = Date.now() + 10 * 60 * 1000; 

    await user.save();

    // 4. Send the Email
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

    // 1. Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Check if they are already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // 3. Check if the OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    // 4. Check if the OTP has expired
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // 5. Success! Mark as verified and clear the OTP fields for security
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};