// backend/routes/tasks.js
const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Task = require('../models/Task');
const router = express.Router();

// Validation middleware
const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
  
  body('project')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Project name cannot exceed 200 characters'),
    
  body('goal')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Goal cannot exceed 1000 characters'),
    
  body('update')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Update cannot exceed 2000 characters'),
    
  body('type')
    .optional()
    .isIn(['משימה', 'רעיון', 'מטרה', 'פגישה', 'למידה'])
    .withMessage('Invalid task type'),
    
  body('status')
    .optional()
    .isIn(['לא התחלתי', 'בתהליך', 'הושלם', 'בהמתנה', 'בוטל'])
    .withMessage('Invalid task status'),
    
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
    
  body('link')
    .optional()
    .trim()
    .isURL({ require_protocol: false })
    .withMessage('Invalid URL format'),
    
  body('priorityRatings')
    .optional()
    .isObject()
    .withMessage('Priority ratings must be an object'),
];

const validateId = [
  param('id').isMongoId().withMessage('Invalid task ID')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

// GET /api/tasks - Get all tasks with optional filtering and sorting
router.get('/', async (req, res) => {
  try {
    const {
      status,
      project,
      type,
      overdue,
      completed,
      page = 1,
      limit = 50,
      sort = 'priority' // priority, date, title, status
    } = req.query;

    // Build query
    let query = {};
    
    if (status) query.status = status;
    if (project) query.project = new RegExp(project, 'i');
    if (type) query.type = type;
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'הושלם' };
    }
    if (completed === 'true') query.status = 'הושלם';
    if (completed === 'false') query.status = { $ne: 'הושלם' };

    // Build sort
    let sortQuery = {};
    switch (sort) {
      case 'priority':
        sortQuery = { priorityScore: -1, createdAt: -1 };
        break;
      case 'date':
        sortQuery = { createdAt: -1 };
        break;
      case 'due':
        sortQuery = { dueDate: 1, priorityScore: -1 };
        break;
      case 'title':
        sortQuery = { title: 1 };
        break;
      case 'status':
        sortQuery = { status: 1, priorityScore: -1 };
        break;
      default:
        sortQuery = { priorityScore: -1, createdAt: -1 };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tasks = await Task.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/stats - Get task statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'הושלם'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'בתהליך'] }, 1, 0] }
          },
          notStarted: {
            $sum: { $cond: [{ $eq: ['$status', 'לא התחלתי'] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$status', 'הושלם'] },
                    { $ne: ['$dueDate', null] }
                  ]
                },
                1,
                0
              ]
            }
          },
          avgPriorityScore: { $avg: '$priorityScore' }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      overdue: 0,
      avgPriorityScore: 0
    };

    // Get project stats
    const projectStats = await Task.aggregate([
      { $match: { project: { $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$project',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'הושלם'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      overview: result,
      projects: projectStats
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ error: 'Failed to fetch task statistics' });
  }
});

// GET /api/tasks/:id - Get specific task
router.get('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create new task
router.post('/', validateTask, handleValidationErrors, async (req, res) => {
  try {
    const taskData = { ...req.body };
    
    // Convert priorityRatings object to Map if it exists
    if (taskData.priorityRatings && typeof taskData.priorityRatings === 'object') {
      taskData.priorityRatings = new Map(Object.entries(taskData.priorityRatings));
    }
    
    const task = new Task(taskData);
    await task.save();
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', [...validateId, ...validateTask], handleValidationErrors, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Convert priorityRatings object to Map if it exists
    if (updateData.priorityRatings && typeof updateData.priorityRatings === 'object') {
      updateData.priorityRatings = new Map(Object.entries(updateData.priorityRatings));
    }
    
    // Set completedAt when status changes to completed
    if (updateData.status === 'הושלם') {
      updateData.completedAt = new Date();
    } else if (updateData.status && updateData.status !== 'הושלם') {
      updateData.completedAt = null;
    }
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/status - Update task status only
router.patch('/:id/status', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['לא התחלתי', 'בתהליך', 'הושלם', 'בהמתנה', 'בוטל'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updateData = { status };
    if (status === 'הושלם') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// PATCH /api/tasks/:id/priority - Update task priority ratings
router.patch('/:id/priority', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { priorityRatings } = req.body;
    
    if (!priorityRatings || typeof priorityRatings !== 'object') {
      return res.status(400).json({ error: 'Priority ratings must be an object' });
    }
    
    // Validate rating values
    for (const [key, value] of Object.entries(priorityRatings)) {
      if (typeof value !== 'number' || value < 0 || value > 5) {
        return res.status(400).json({ 
          error: `Invalid rating for ${key}. Must be between 0 and 5` 
        });
      }
    }
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { priorityRatings: new Map(Object.entries(priorityRatings)) },
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task priority:', error);
    res.status(500).json({ error: 'Failed to update task priority' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully', task });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /api/tasks/bulk - Bulk operations
router.post('/bulk', async (req, res) => {
  try {
    const { operation, taskIds, data } = req.body;
    
    if (!operation || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ 
        error: 'Operation and taskIds array are required' 
      });
    }
    
    let result;
    
    switch (operation) {
      case 'delete':
        result = await Task.deleteMany({ _id: { $in: taskIds } });
        res.json({ 
          message: `${result.deletedCount} tasks deleted successfully`,
          deletedCount: result.deletedCount
        });
        break;
        
      case 'updateStatus':
        if (!data || !data.status) {
          return res.status(400).json({ error: 'Status is required for update operation' });
        }
        
        const updateData = { status: data.status };
        if (data.status === 'הושלם') {
          updateData.completedAt = new Date();
        } else {
          updateData.completedAt = null;
        }
        
        result = await Task.updateMany(
          { _id: { $in: taskIds } },
          updateData
        );
        res.json({ 
          message: `${result.modifiedCount} tasks updated successfully`,
          modifiedCount: result.modifiedCount
        });
        break;
        
      case 'updateProject':
        if (!data || !data.project) {
          return res.status(400).json({ error: 'Project is required for update operation' });
        }
        
        result = await Task.updateMany(
          { _id: { $in: taskIds } },
          { project: data.project }
        );
        res.json({ 
          message: `${result.modifiedCount} tasks updated successfully`,
          modifiedCount: result.modifiedCount
        });
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    res.status(500).json({ error: 'Failed to perform bulk operation' });
  }
});

// GET /api/tasks/search/:query - Search tasks
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const searchRegex = new RegExp(query.trim(), 'i');
    
    const tasks = await Task.find({
      $or: [
        { title: searchRegex },
        { project: searchRegex },
        { goal: searchRegex },
        { update: searchRegex }
      ]
    })
    .sort({ priorityScore: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .lean();
    
    res.json({
      query: query.trim(),
      results: tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('Error searching tasks:', error);
    res.status(500).json({ error: 'Failed to search tasks' });
  }
});

module.exports = router;