const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logAudit, logError } = require('../utils/logger');

// @desc    Get All Users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    await logError(error, { context: 'getUsers' });
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

// @desc    Get Single User
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    await logError(error, { context: 'getUserById' });
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
};

// @desc    Create User (Admin Only)
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({ success: false, error: errorMessages });
    }

    const { fullName, username, email, password, role } = req.body;
    
    // Check if username already exists
    const userExists = await User.findOne({ username: username.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'Email already exists' });
      }
    }

    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email: email ? email.toLowerCase() : undefined,
      passwordHash: password,
      role: role || 'Clerk'
    });

    await logAudit('USER_CREATED', {
      userId: req.user.id,
      newUserId: user._id,
      username: user.username,
      role: user.role
    });

    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      data: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    await logError(error, { context: 'createUser' });
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        error: `${field} already exists` 
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to create user: ' + error.message });
  }
};

// @desc    Update User
exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({ success: false, error: errorMessages });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Update fields
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.email) user.email = req.body.email.toLowerCase();
    if (req.body.role) user.role = req.body.role;
    if (req.body.status) user.status = req.body.status;

    // Update password if provided
    if (req.body.password) {
      user.passwordHash = req.body.password; // Pre-save hook will hash it
    }

    await user.save();

    await logAudit('USER_UPDATED', {
      userId: req.user.id,
      updatedUserId: user._id,
      username: user.username
    });

    res.status(200).json({ 
      success: true, 
      message: 'User updated successfully',
      data: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    await logError(error, { context: 'updateUser' });
    res.status(500).json({ success: false, error: 'Failed to update user: ' + error.message });
  }
};

// @desc    Delete User
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    // Prevent deleting default admin
    if (user.username === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot delete default admin user' });
    }

    await user.deleteOne();

    await logAudit('USER_DELETED', {
      userId: req.user.id,
      deletedUserId: user._id,
      username: user.username
    });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    await logError(error, { context: 'deleteUser' });
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};