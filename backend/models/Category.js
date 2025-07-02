// backend/models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'Category ID is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category ID cannot exceed 50 characters']
  },
  
  english: {
    type: String,
    required: [true, 'English name is required'],
    trim: true,
    maxlength: [100, 'English name cannot exceed 100 characters']
  },
  
  hebrew: {
    type: String,
    trim: true,
    maxlength: [100, 'Hebrew name cannot exceed 100 characters']
  },
  
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [0, 'Weight must be between 0 and 100'],
    max: [100, 'Weight must be between 0 and 100'],
    default: 0
  },
  
  color: {
    type: String,
    required: [true, 'Color is required'],
    validate: {
      validator: function(color) {
        // Validate hex color format
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
      },
      message: 'Color must be a valid hex color (e.g., #FF0000)'
    }
  },
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // For future user authentication
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ userId: 1, id: 1 });
categorySchema.index({ isDefault: 1 });

// Static method to get default categories
categorySchema.statics.getDefaults = function() {
  return this.find({ isDefault: true }).sort({ id: 1 });
};

// Static method to get user categories
categorySchema.statics.getUserCategories = function(userId) {
  return this.find({ 
    $or: [
      { isDefault: true },
      { userId: userId }
    ]
  }).sort({ isDefault: -1, id: 1 });
};

// Static method to initialize default categories
categorySchema.statics.initializeDefaults = async function() {
  const defaultCategories = [
    {
      id: 'impact',
      english: 'Impact',
      hebrew: 'השפעה',
      weight: 25,
      color: '#FF6B6B',
      isDefault: true
    },
    {
      id: 'urgency',
      english: 'Urgency',
      hebrew: 'דחיפות',
      weight: 20,
      color: '#4ECDC4',
      isDefault: true
    },
    {
      id: 'effort',
      english: 'Effort Required',
      hebrew: 'מאמץ נדרש',
      weight: 15,
      color: '#45B7D1',
      isDefault: true
    },
    {
      id: 'alignment',
      english: 'Goal Alignment',
      hebrew: 'התאמה למטרות',
      weight: 15,
      color: '#96CEB4',
      isDefault: true
    },
    {
      id: 'learning',
      english: 'Learning Value',
      hebrew: 'ערך לימודי',
      weight: 10,
      color: '#FFEAA7',
      isDefault: true
    },
    {
      id: 'enjoyment',
      english: 'Enjoyment',
      hebrew: 'הנאה',
      weight: 10,
      color: '#DDA0DD',
      isDefault: true
    },
    {
      id: 'risk',
      english: 'Risk Level',
      hebrew: 'רמת סיכון',
      weight: 5,
      color: '#FFB6C1',
      isDefault: true
    }
  ];

  try {
    // Check if default categories already exist
    const existingDefaults = await this.find({ isDefault: true });
    
    if (existingDefaults.length === 0) {
      await this.insertMany(defaultCategories);
      console.log('Default categories initialized successfully');
    } else {
      console.log('Default categories already exist');
    }
  } catch (error) {
    console.error('Error initializing default categories:', error);
  }
};

// Method to validate total weight doesn't exceed 100%
categorySchema.statics.validateTotalWeight = async function(userId = null) {
  const query = userId ? { $or: [{ isDefault: true }, { userId }] } : { isDefault: true };
  const categories = await this.find(query);
  
  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
  
  if (totalWeight > 100) {
    throw new Error(`Total weight cannot exceed 100%. Current total: ${totalWeight}%`);
  }
  
  return { totalWeight, categories };
};

// Pre-save middleware to validate weight
categorySchema.pre('save', async function(next) {
  try {
    // Skip validation for default categories during initialization
    if (this.isDefault && this.isNew) {
      return next();
    }
    
    await this.constructor.validateTotalWeight(this.userId);
    next();
  } catch (error) {
    next(error);
  }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;