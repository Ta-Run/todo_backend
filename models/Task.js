const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [2000, 'Note cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'done'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Supports user's tasks + status filter + newest first sorting
taskSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
