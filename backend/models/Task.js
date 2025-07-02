// backend/models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [500, 'Title cannot exceed 500 characters']
  },
  
  project: {
    type: String,
    trim: true,
    maxlength: [200, 'Project name cannot exceed 200 characters']
  },
  
  goal: {
    type: String,
    trim: true,
    maxlength: [1000, 'Goal cannot exceed 1000 characters']
  },
  
  update: {
    type: String,
    trim: true,
    maxlength: [2000, 'Update cannot exceed 2000 characters']
  },
  
  type: {
    type: String,
    enum: ['משימה', 'רעיון', 'מטרה', 'פגישה', 'למידה'],
    default: 'משימה'
  },
  
  status: {
    type: String,
    enum: ['לא התחלתי', 'בתהליך', 'הושלם', 'בהמתנה', 'בוטל'],
    default: 'לא התחלתי'
  },
  
  dueDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date >= new Date('2020-01-01');
      },
      message: 'Due date must be after January 1, 2020'
    }
  },
  
  isRepeating: {
    type: Boolean,
    default: false
  },
  
  repeatInterval: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', null],
    default: null
  },
  
  link: {
    type: String,
    trim: true,
    validate: {
      validator: function(url) {
        if (!url) return true;
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        return urlPattern.test(url);
      },
      message: 'Please enter a valid URL'
    }
  },
  
  priorityRatings: {
    type: Map,
    of: {
      type: Number,
      min: [0, 'Priority rating must be between 0 and 5'],
      max: [5, 'Priority rating must be between 0 and 5']
    },
    default: new Map()
  },
  
  priorityScore: {
    type: Number,
    default: 0,
    min: 0
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  // For future user authentication
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      // Convert Map to Object for JSON serialization
      if (ret.priorityRatings) {
        ret.priorityRatings = Object.fromEntries(ret.priorityRatings);
      }
      return ret;
    }
  }
});

// Indexes for better query performance
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, project: 1 });
taskSchema.index({ userId: 1, priorityScore: -1 });
taskSchema.index({ createdAt: -1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'הושלם') return false;
  return new Date() > this.dueDate;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate priority score
taskSchema.pre('save', function(next) {
  this.calculatePriorityScore();
  next();
});

// Method to calculate priority score
taskSchema.methods.calculatePriorityScore = async function() {
  try {
    const Category = mongoose.model('Category');
    const categories = await Category.find({ isDefault: true });
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const category of categories) {
      const rating = this.priorityRatings.get(category.id) || 0;
      const weight = category.weight || 0;
      totalScore += rating * weight;
      totalWeight += weight;
    }
    
    // Add urgency bonus based on due date
    let urgencyBonus = 0;
    if (this.dueDate) {
      const daysUntilDue = this.daysUntilDue;
      if (daysUntilDue <= 1) urgencyBonus = 20;
      else if (daysUntilDue <= 3) urgencyBonus = 15;
      else if (daysUntilDue <= 7) urgencyBonus = 10;
      else if (daysUntilDue <= 14) urgencyBonus = 5;
    }
    
    this.priorityScore = totalWeight > 0 ? totalScore + urgencyBonus : 0;
  } catch (error) {
    console.error('Error calculating priority score:', error);
    this.priorityScore = 0;
  }
};

// Static method to get tasks by priority
taskSchema.statics.getByPriority = function(userId = null) {
  const query = userId ? { userId } : {};
  return this.find(query).sort({ priorityScore: -1, createdAt: -1 });
};

// Static method to get overdue tasks
taskSchema.statics.getOverdue = function(userId = null) {
  const query = {
    dueDate: { $lt: new Date() },
    status: { $ne: 'הושלם' }
  };
  if (userId) query.userId = userId;
  
  return this.find(query).sort({ dueDate: 1 });
};

// Static method to get tasks by status
taskSchema.statics.getByStatus = function(status, userId = null) {
  const query = { status };
  if (userId) query.userId = userId;
  
  return this.find(query).sort({ priorityScore: -1, createdAt: -1 });
};

// Static method to get tasks by project
taskSchema.statics.getByProject = function(project, userId = null) {
  const query = { project: new RegExp(project, 'i') };
  if (userId) query.userId = userId;
  
  return this.find(query).sort({ priorityScore: -1, createdAt: -1 });
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;