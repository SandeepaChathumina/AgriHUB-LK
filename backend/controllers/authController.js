import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import Distributor from '../models/Distributor.js';
import Transporter from '../models/Transporter.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


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

    await newUser.save();

    res.status(201).json({ 
      message: `${role} registered successfully!`, 
      user: { id: newUser._id, email: newUser.email, role: newUser.role } 
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