const Task = require('../models/Task');
const { isValidObjectId } = require('../middleware/errorHandler');

const ALLOWED_STATUSES = ['pending', 'done'];

const createTask = async (req, res, next) => {
  try {
    const { title, note, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot exceed 200 characters',
      });
    }

    if (note && note.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Note cannot exceed 2000 characters',
      });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be pending or done',
      });
    }

    const task = await Task.create({
      userId: req.userId,
      title: title.trim(),
      note: note ? note.trim() : '',
      status: status || 'pending',
    });

    res.status(201).json({
      success: true,
      task,
    });
  } catch (err) {
    next(err);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const filter = { userId: req.userId };

    if (req.query.status) {
      if (!ALLOWED_STATUSES.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be pending or done',
        });
      }
      filter.status = req.query.status;
    }

    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;

    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page must be at least 1',
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100',
      });
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Task.countDocuments(filter),
    ]);

    res.json({
      success: true,
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getTask = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const updateData = {};
    const { title, note, status } = req.body;

    if (req.body.userId !== undefined || req.body._id !== undefined || req.body.createdAt !== undefined) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update protected fields',
      });
    }

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title is required',
        });
      }
      if (title.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot exceed 200 characters',
        });
      }
      updateData.title = title.trim();
    }

    if (note !== undefined) {
      if (note.length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Note cannot exceed 2000 characters',
        });
      }
      updateData.note = note.trim();
    }

    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be pending or done',
        });
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
};
