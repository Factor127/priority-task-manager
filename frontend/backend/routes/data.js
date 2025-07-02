// backend/routes/data.js
const express = require('express');
const Task = require('../models/Task');
const Category = require('../models/Category');
const router = express.Router();

// GET /api/data/export - Export all data
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', userId } = req.query;
    
    // Build query based on userId
    const taskQuery = userId ? { userId } : {};
    const categoryQuery = userId ? { $or: [{ isDefault: true }, { userId }] } : {};
    
    const [tasks, categories] = await Promise.all([
      Task.find(taskQuery).lean(),
      Category.find(categoryQuery).lean()
    ]);
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      userId: userId || null,
      data: {
        tasks,
        categories
      },
      meta: {
        taskCount: tasks.length,
        categoryCount: categories.length,
        defaultCategoriesIncluded: categories.some(cat => cat.isDefault)
      }
    };
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(tasks);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="tasks_export.csv"');
      return res.send(csv);
    }
    
    // Default JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="priority_tasks_export.json"');
    res.json(exportData);
    
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// POST /api/data/import - Import data
router.post('/import', async (req, res) => {
  try {
    const { data, options = {} } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Import data is required' });
    }
    
    const {
      overwriteExisting = false,
      importTasks = true,
      importCategories = true,
      userId = null
    } = options;
    
    const results = {
      tasks: { imported: 0, skipped: 0, errors: [] },
      categories: { imported: 0, skipped: 0, errors: [] }
    };
    
    // Import categories first (tasks depend on them)
    if (importCategories && data.categories) {
      for (const categoryData of data.categories) {
        try {
          // Skip default categories unless explicitly overwriting
          if (categoryData.isDefault && !overwriteExisting) {
            results.categories.skipped++;
            continue;
          }
          
          // Add userId if provided
          if (userId && !categoryData.isDefault) {
            categoryData.userId = userId;
          }
          
          const existingCategory = await Category.findOne({ id: categoryData.id });
          
          if (existingCategory) {
            if (overwriteExisting) {
              await Category.findOneAndUpdate({ id: categoryData.id }, categoryData);
              results.categories.imported++;
            } else {
              results.categories.skipped++;
            }
          } else {
            const category = new Category(categoryData);
            await category.save();
            results.categories.imported++;
          }
        } catch (error) {
          results.categories.errors.push({
            category: categoryData.id || 'unknown',
            error: error.message
          });
        }
      }
    }
    
    // Import tasks
    if (importTasks && data.tasks) {
      for (const taskData of data.tasks) {
        try {
          // Add userId if provided
          if (userId) {
            taskData.userId = userId;
          }
          
          // Convert priorityRatings to Map if it's an object
          if (taskData.priorityRatings && typeof taskData.priorityRatings === 'object') {
            taskData.priorityRatings = new Map(Object.entries(taskData.priorityRatings));
          }
          
          // Check if task already exists (by title and project)
          const existingTask = await Task.findOne({
            title: taskData.title,
            project: taskData.project || null,
            userId: userId
          });
          
          if (existingTask) {
            if (overwriteExisting) {
              await Task.findByIdAndUpdate(existingTask._id, taskData);
              results.tasks.imported++;
            } else {
              results.tasks.skipped++;
            }
          } else {
            // Remove _id to allow MongoDB to generate new one
            delete taskData._id;
            
            const task = new Task(taskData);
            await task.save();
            results.tasks.imported++;
          }
        } catch (error) {
          results.tasks.errors.push({
            task: taskData.title || 'unknown',
            error: error.message
          });
        }
      }
    }
    
    res.json({
      message: 'Import completed',
      results,
      summary: {
        totalImported: results.tasks.imported + results.categories.imported,
        totalSkipped: results.tasks.skipped + results.categories.skipped,
        totalErrors: results.tasks.errors.length + results.categories.errors.length
      }
    });
    
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// GET /api/data/backup - Create complete backup
router.get('/backup', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Get all data
    const taskQuery = userId ? { userId } : {};
    const categoryQuery = userId ? { $or: [{ isDefault: true }, { userId }] } : {};
    
    const [tasks, categories] = await Promise.all([
      Task.find(taskQuery).lean(),
      Category.find(categoryQuery).lean()
    ]);
    
    // Get statistics
    const stats = await Task.aggregate([
      ...(userId ? [{ $match: { userId: userId } }] : []),
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'הושלם'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'בתהליך'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const backup = {
      version: '1.0',
      backupDate: new Date().toISOString(),
      userId: userId || null,
      statistics: stats[0] || { total: 0, completed: 0, inProgress: 0 },
      data: {
        tasks,
        categories
      },
      meta: {
        taskCount: tasks.length,
        categoryCount: categories.length,
        completionRate: stats[0] ? (stats[0].completed / stats[0].total * 100).toFixed(1) : 0
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="priority_tasks_backup_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(backup);
    
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// POST /api/data/restore - Restore from backup
router.post('/restore', async (req, res) => {
  try {
    const { backup, options = {} } = req.body;
    
    if (!backup || !backup.data) {
      return res.status(400).json({ error: 'Valid backup data is required' });
    }
    
    const {
      clearExisting = false,
      userId = null
    } = options;
    
    // Clear existing data if requested
    if (clearExisting) {
      const deleteQuery = userId ? { userId } : {};
      await Promise.all([
        Task.deleteMany(deleteQuery),
        Category.deleteMany({ ...deleteQuery, isDefault: false })
      ]);
    }
    
    // Restore categories
    let categoriesRestored = 0;
    if (backup.data.categories) {
      for (const categoryData of backup.data.categories) {
        try {
          if (userId && !categoryData.isDefault) {
            categoryData.userId = userId;
          }
          
          const existingCategory = await Category.findOne({ id: categoryData.id });
          if (!existingCategory) {
            const category = new Category(categoryData);
            await category.save();
            categoriesRestored++;
          }
        } catch (error) {
          console.error('Error restoring category:', error);
        }
      }
    }
    
    // Restore tasks
    let tasksRestored = 0;
    if (backup.data.tasks) {
      for (const taskData of backup.data.tasks) {
        try {
          if (userId) {
            taskData.userId = userId;
          }
          
          // Convert priorityRatings to Map if it's an object
          if (taskData.priorityRatings && typeof taskData.priorityRatings === 'object') {
            taskData.priorityRatings = new Map(Object.entries(taskData.priorityRatings));
          }
          
          // Remove _id to allow MongoDB to generate new one
          delete taskData._id;
          
          const task = new Task(taskData);
          await task.save();
          tasksRestored++;
        } catch (error) {
          console.error('Error restoring task:', error);
        }
      }
    }
    
    res.json({
      message: 'Restore completed successfully',
      restored: {
        tasks: tasksRestored,
        categories: categoriesRestored
      },
      originalBackup: {
        date: backup.backupDate,
        version: backup.version,
        taskCount: backup.meta?.taskCount || 0,
        categoryCount: backup.meta?.categoryCount || 0
      }
    });
    
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// POST /api/data/migrate-localstorage - Migrate from localStorage format
router.post('/migrate-localstorage', async (req, res) => {
  try {
    const { localStorageData, userId = null } = req.body;
    
    if (!localStorageData) {
      return res.status(400).json({ error: 'localStorage data is required' });
    }
    
    const results = {
      tasks: { imported: 0, errors: [] },
      categories: { imported: 0, errors: [] },
      userProgress: null
    };
    
    // Parse localStorage data
    let parsedData = {};
    try {
      // Handle different localStorage data formats
      if (typeof localStorageData === 'string') {
        parsedData = JSON.parse(localStorageData);
      } else {
        parsedData = localStorageData;
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid localStorage data format' });
    }
    
    // Migrate priority categories
    if (parsedData.priorityCategories) {
      try {
        const categories = Array.isArray(parsedData.priorityCategories) 
          ? parsedData.priorityCategories 
          : JSON.parse(parsedData.priorityCategories);
        
        for (const categoryData of categories) {
          try {
            // Transform localStorage format to database format
            const dbCategory = {
              id: categoryData.id,
              english: categoryData.english,
              hebrew: categoryData.hebrew,
              weight: categoryData.weight || 0,
              color: categoryData.color || '#000000',
              isDefault: categoryData.isDefault || false,
              userId: userId
            };
            
            // Check if category already exists
            const existingCategory = await Category.findOne({ id: dbCategory.id });
            if (!existingCategory) {
              const category = new Category(dbCategory);
              await category.save();
              results.categories.imported++;
            }
          } catch (error) {
            results.categories.errors.push({
              category: categoryData.id || 'unknown',
              error: error.message
            });
          }
        }
      } catch (error) {
        results.categories.errors.push({
          category: 'general',
          error: 'Failed to parse categories: ' + error.message
        });
      }
    }
    
    // Migrate tasks
    if (parsedData.tasks) {
      try {
        const tasks = Array.isArray(parsedData.tasks) 
          ? parsedData.tasks 
          : JSON.parse(parsedData.tasks);
        
        for (const taskData of tasks) {
          try {
            // Transform localStorage format to database format
            const dbTask = {
              title: taskData.title,
              project: taskData.project || '',
              goal: taskData.goal || '',
              update: taskData.update || '',
              type: taskData.type || 'משימה',
              status: taskData.status || 'לא התחלתי',
              dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
              isRepeating: taskData.isRepeating || false,
              repeatInterval: taskData.repeatInterval || null,
              link: taskData.link || '',
              priorityRatings: new Map(Object.entries(taskData.priorityRatings || {})),
              priorityScore: taskData.priorityScore || 0,
              completedAt: taskData.completedAt ? new Date(taskData.completedAt) : null,
              userId: userId
            };
            
            const task = new Task(dbTask);
            await task.save();
            results.tasks.imported++;
          } catch (error) {
            results.tasks.errors.push({
              task: taskData.title || 'unknown',
              error: error.message
            });
          }
        }
      } catch (error) {
        results.tasks.errors.push({
          task: 'general',
          error: 'Failed to parse tasks: ' + error.message
        });
      }
    }
    
    // Migrate user progress (if present)
    if (parsedData.userProgress) {
      try {
        results.userProgress = {
          points: parsedData.userProgress.points || 0,
          level: parsedData.userProgress.level || 1,
          achievements: parsedData.userProgress.achievements || []
        };
      } catch (error) {
        console.error('Error migrating user progress:', error);
      }
    }
    
    res.json({
      message: 'localStorage migration completed',
      results,
      summary: {
        totalImported: results.tasks.imported + results.categories.imported,
        totalErrors: results.tasks.errors.length + results.categories.errors.length,
        userProgressMigrated: !!results.userProgress
      }
    });
    
  } catch (error) {
    console.error('Error migrating localStorage data:', error);
    res.status(500).json({ error: 'Failed to migrate localStorage data' });
  }
});

// GET /api/data/validate - Validate data integrity
router.get('/validate', async (req, res) => {
  try {
    const { userId } = req.query;
    const taskQuery = userId ? { userId } : {};
    const categoryQuery = userId ? { $or: [{ isDefault: true }, { userId }] } : {};
    
    const [tasks, categories] = await Promise.all([
      Task.find(taskQuery),
      Category.find(categoryQuery)
    ]);
    
    const validation = {
      tasks: {
        total: tasks.length,
        issues: []
      },
      categories: {
        total: categories.length,
        totalWeight: categories.reduce((sum, cat) => sum + cat.weight, 0),
        issues: []
      },
      overall: {
        isValid: true,
        issues: []
      }
    };
    
    // Validate tasks
    for (const task of tasks) {
      // Check for missing priority ratings
      const categoryIds = categories.map(cat => cat.id);
      const taskRatingKeys = Array.from(task.priorityRatings.keys());
      
      const missingRatings = categoryIds.filter(id => !taskRatingKeys.includes(id));
      if (missingRatings.length > 0) {
        validation.tasks.issues.push({
          taskId: task._id,
          title: task.title,
          issue: 'Missing priority ratings',
          details: missingRatings
        });
      }
      
      // Check for invalid rating values
      for (const [categoryId, rating] of task.priorityRatings) {
        if (rating < 0 || rating > 5) {
          validation.tasks.issues.push({
            taskId: task._id,
            title: task.title,
            issue: 'Invalid rating value',
            details: `${categoryId}: ${rating}`
          });
        }
      }
    }
    
    // Validate categories
    if (validation.categories.totalWeight > 100) {
      validation.categories.issues.push({
        issue: 'Total weight exceeds 100%',
        details: `Current total: ${validation.categories.totalWeight}%`
      });
    }
    
    // Check for duplicate category IDs
    const categoryIds = categories.map(cat => cat.id);
    const duplicates = categoryIds.filter((id, index) => categoryIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      validation.categories.issues.push({
        issue: 'Duplicate category IDs',
        details: duplicates
      });
    }
    
    // Overall validation
    validation.overall.isValid = 
      validation.tasks.issues.length === 0 && 
      validation.categories.issues.length === 0;
    
    if (!validation.overall.isValid) {
      validation.overall.issues.push('Data integrity issues found. See detailed issues above.');
    }
    
    res.json(validation);
    
  } catch (error) {
    console.error('Error validating data:', error);
    res.status(500).json({ error: 'Failed to validate data' });
  }
});

// Helper function to convert tasks to CSV
function convertToCSV(tasks) {
  if (tasks.length === 0) return '';
  
  const headers = [
    'Title', 'Project', 'Goal', 'Update', 'Type', 'Status', 
    'Due Date', 'Priority Score', 'Created At', 'Completed At', 'Link'
  ];
  
  const csvRows = [headers.join(',')];
  
  for (const task of tasks) {
    const row = [
      `"${(task.title || '').replace(/"/g, '""')}"`,
      `"${(task.project || '').replace(/"/g, '""')}"`,
      `"${(task.goal || '').replace(/"/g, '""')}"`,
      `"${(task.update || '').replace(/"/g, '""')}"`,
      `"${task.type || ''}"`,
      `"${task.status || ''}"`,
      task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      task.priorityScore || 0,
      task.createdAt ? new Date(task.createdAt).toISOString() : '',
      task.completedAt ? new Date(task.completedAt).toISOString() : '',
      `"${(task.link || '').replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = router;