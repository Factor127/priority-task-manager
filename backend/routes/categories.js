// backend/routes/categories.js
const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Category = require('../models/Category');
const router = express.Router();

// Validation middleware
const validateCategory = [
  body('id')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category ID must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Category ID can only contain letters, numbers, hyphens, and underscores'),
  
  body('english')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('English name must be between 1 and 100 characters'),
    
  body('hebrew')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Hebrew name cannot exceed 100 characters'),
    
  body('weight')
    .isNumeric()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Weight must be between 0 and 100'),
    
  body('color')
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color (e.g., #FF0000)'),
    
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean value')
];

const validateId = [
  param('id').isMongoId().withMessage('Invalid category ID')
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

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const { defaults = 'true', userId } = req.query;
    
    let categories;
    if (defaults === 'true') {
      categories = await Category.getDefaults();
    } else if (userId) {
      categories = await Category.getUserCategories(userId);
    } else {
      categories = await Category.find().sort({ isDefault: -1, id: 1 });
    }
    
    // Calculate total weight
    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
    
    res.json({
      categories,
      totalWeight,
      isValidWeight: totalWeight <= 100
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/validate-weight - Validate total weight
router.get('/validate-weight', async (req, res) => {
  try {
    const { userId } = req.query;
    const result = await Category.validateTotalWeight(userId);
    
    res.json({
      isValid: result.totalWeight <= 100,
      totalWeight: result.totalWeight,
      categories: result.categories.map(cat => ({
        id: cat.id,
        english: cat.english,
        weight: cat.weight
      }))
    });
  } catch (error) {
    console.error('Error validating weight:', error);
    res.status(500).json({ error: 'Failed to validate weight' });
  }
});

// GET /api/categories/:id - Get specific category
router.get('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST /api/categories - Create new category
router.post('/', validateCategory, handleValidationErrors, async (req, res) => {
  try {
    const categoryData = { ...req.body };
    
    // Check if category ID already exists
    const existingCategory = await Category.findOne({ id: categoryData.id });
    if (existingCategory) {
      return res.status(400).json({ 
        error: 'Category ID already exists. Please choose a different ID.' 
      });
    }
    
    // Validate total weight won't exceed 100%
    const currentCategories = await Category.find({
      $or: [
        { isDefault: true },
        { userId: categoryData.userId }
      ]
    });
    
    const currentTotalWeight = currentCategories.reduce((sum, cat) => sum + cat.weight, 0);
    const newTotalWeight = currentTotalWeight + categoryData.weight;
    
    if (newTotalWeight > 100) {
      return res.status(400).json({
        error: `Total weight cannot exceed 100%. Current: ${currentTotalWeight}%, Adding: ${categoryData.weight}%, New total would be: ${newTotalWeight}%`
      });
    }
    
    const category = new Category(categoryData);
    await category.save();
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Category ID already exists'
      });
    }
    
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', [...validateId, ...validateCategory], handleValidationErrors, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Don't allow updating isDefault for existing default categories
    const existingCategory = await Category.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    if (existingCategory.isDefault && updateData.isDefault === false) {
      return res.status(400).json({
        error: 'Cannot modify default category status'
      });
    }
    
    // Check if new category ID conflicts with existing ones (if ID is being changed)
    if (updateData.id && updateData.id !== existingCategory.id) {
      const conflictCategory = await Category.findOne({ 
        id: updateData.id,
        _id: { $ne: req.params.id }
      });
      
      if (conflictCategory) {
        return res.status(400).json({
          error: 'Category ID already exists. Please choose a different ID.'
        });
      }
    }
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.message.includes('Total weight cannot exceed 100%')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// PATCH /api/categories/:id/weight - Update category weight only
router.patch('/:id/weight', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { weight } = req.body;
    
    if (typeof weight !== 'number' || weight < 0 || weight > 100) {
      return res.status(400).json({ 
        error: 'Weight must be a number between 0 and 100' 
      });
    }
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { weight },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error updating category weight:', error);
    
    if (error.message.includes('Total weight cannot exceed 100%')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update category weight' });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Don't allow deleting default categories
    if (category.isDefault) {
      return res.status(400).json({
        error: 'Cannot delete default categories'
      });
    }
    
    // Check if category is being used by any tasks
    const Task = require('../models/Task');
    const tasksUsingCategory = await Task.countDocuments({
      [`priorityRatings.${category.id}`]: { $exists: true }
    });
    
    if (tasksUsingCategory > 0) {
      return res.status(400).json({
        error: `Cannot delete category. It is being used by ${tasksUsingCategory} task(s).`,
        tasksCount: tasksUsingCategory
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Category deleted successfully',
      category: {
        id: category.id,
        english: category.english
      }
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// POST /api/categories/reset-defaults - Reset to default categories
router.post('/reset-defaults', async (req, res) => {
  try {
    // Delete all existing default categories
    await Category.deleteMany({ isDefault: true });
    
    // Initialize default categories
    await Category.initializeDefaults();
    
    const defaultCategories = await Category.getDefaults();
    
    res.json({
      message: 'Default categories reset successfully',
      categories: defaultCategories
    });
  } catch (error) {
    console.error('Error resetting default categories:', error);
    res.status(500).json({ error: 'Failed to reset default categories' });
  }
});

// POST /api/categories/bulk-update-weights - Update multiple category weights
router.post('/bulk-update-weights', async (req, res) => {
  try {
    const { weights } = req.body;
    
    if (!weights || typeof weights !== 'object') {
      return res.status(400).json({
        error: 'Weights object is required'
      });
    }
    
    // Validate total weight
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    if (totalWeight > 100) {
      return res.status(400).json({
        error: `Total weight cannot exceed 100%. Provided total: ${totalWeight}%`
      });
    }
    
    // Update categories
    const updatePromises = Object.entries(weights).map(([categoryId, weight]) => {
      return Category.findOneAndUpdate(
        { id: categoryId },
        { weight },
        { new: true, runValidators: true }
      );
    });
    
    const updatedCategories = await Promise.all(updatePromises);
    
    // Filter out null results (categories not found)
    const validUpdates = updatedCategories.filter(cat => cat !== null);
    
    res.json({
      message: `${validUpdates.length} categories updated successfully`,
      categories: validUpdates,
      totalWeight
    });
  } catch (error) {
    console.error('Error bulk updating category weights:', error);
    res.status(500).json({ error: 'Failed to update category weights' });
  }
});

module.exports = router;