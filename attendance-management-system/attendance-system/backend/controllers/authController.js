const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });
};

// @desc    Register a new employee (or HR, with a valid signup code)
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join('; '));
  }

  const { name, email, password, department, designation, role, hrSignupCode } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // HR role requires a secret signup code so random users cannot self-elevate
  let finalRole = 'employee';
  if (role === 'hr') {
    if (!hrSignupCode || hrSignupCode !== process.env.HR_SIGNUP_CODE) {
      res.status(403);
      throw new Error('Invalid HR signup code');
    }
    finalRole = 'hr';
  }

  // Generate a simple sequential-ish employee ID
  const count = await User.countDocuments();
  const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;

  const user = await User.create({
    employeeId,
    name,
    email,
    password,
    department,
    designation,
    role: finalRole
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      leaveBalance: user.leaveBalance,
      token: generateToken(user._id)
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join('; '));
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      leaveBalance: user.leaveBalance,
      token: generateToken(user._id)
    }
  });
});

// @desc    Get current logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = { register, login, getMe };
