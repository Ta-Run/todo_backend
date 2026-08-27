const express = require('express');
const rateLimit = require('express-rate-limit');
const { signup, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.get('/me', auth, getMe);

module.exports = router;
