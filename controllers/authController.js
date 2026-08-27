const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required',
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use',
      });
    }

    await User.create({ email, password });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getMe };
