const mongoose = require('mongoose');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Email already in use';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Unauthorized';
  }

  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

module.exports = { errorHandler, notFound, isValidObjectId };
