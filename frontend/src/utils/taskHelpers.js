// utils/taskHelpers.js - Enhanced with better ID generation

// Generate unique task ID using crypto API or fallback
export const generateUniqueId = () => {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: timestamp + high-entropy random string
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
  
  return `${timestamp}_${randomPart}`;
};

// Enhanced task creation with guaranteed unique ID
export const createTaskWithUniqueId = (taskData, existingTasks = []) => {
  let newId;
  let attempts = 0;
  const maxAttempts = 10;
  
  // Ensure the ID is truly unique by checking against existing tasks
  do {
    newId = generateUniqueId();
    attempts++;
    
    if (attempts > maxAttempts) {
      // Fallback to UUID-like format if we somehow can't generate unique ID
      newId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
      break;
    }
  } while (existingTasks.some(task => task.id === newId));
  
  return {
    id: newId,
    title: taskData.title || '',
    project: taskData.project || '',
    goal: taskData.goal || '',
    update: taskData.update || '',
    type: taskData.type || 'מנהלה',
    status: taskData.status || 'לא התחיל',
    dueDate: taskData.dueDate || null,
    isRepeating: taskData.isRepeating || false,
    repeatInterval: taskData.repeatInterval || '',
    link: taskData.link || '',
    priorityRatings: taskData.priorityRatings || {},
    createdAt: taskData.createdAt || new Date().toISOString(),
    updatedAt: taskData.updatedAt || new Date().toISOString(),
    completedAt: taskData.completedAt || null
  };
};

// Remove duplicate tasks from array (by ID)
export const removeDuplicateTasks = (tasks) => {
  const seen = new Set();
  return tasks.filter(task => {
    if (seen.has(task.id)) {
      console.warn(`Duplicate task ID found and removed: ${task.id}`);
      return false;
    }
    seen.add(task.id);
    return true;
  });
};

// Validate and clean task array
export const validateAndCleanTasks = (tasks) => {
  if (!Array.isArray(tasks)) {
    console.error('Tasks must be an array');
    return [];
  }
  
  // Remove duplicates
  const uniqueTasks = removeDuplicateTasks(tasks);
  
  // Ensure all tasks have valid IDs
  const validatedTasks = uniqueTasks.map(task => {
    if (!task.id || typeof task.id !== 'string') {
      console.warn('Task missing valid ID, generating new one:', task);
      return {
        ...task,
        id: generateUniqueId(),
        updatedAt: new Date().toISOString()
      };
    }
    return task;
  });
  
  return validatedTasks;
};

// Task constants (same as your original)
export const TASK_TYPES = [
    'מנהלה', 'שותפות', 'שיווק', 'תשתית', 
    'פיתוח עיסקי', 'מחקר', 'פיתוח', 'לקוח'
];

export const TASK_STATUSES = [
    'לא התחיל', 'הערכה', 'תיכנון', 'דחיפה', 'בעבודה',
    'בהמתנה', 'האצלתי', 'הושלם', 'בוטל', 'מושהה'
];

// Priority calculation (exact same algorithm as your original)
export const calculatePriorityScore = (task, priorityCategories, priorityWeights) => {
    let score = 0;
    
    priorityCategories.forEach(category => {
        const rating = task.priorityRatings[category.id] || 0;
        const weight = priorityWeights[category.id] || category.weight;
        score += (rating * weight) / 100;
    });

    // Add urgency bonus
    if (task.dueDate) {
        const now = new Date();
        const due = new Date(task.dueDate);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) score += 50;
        else if (diffDays <= 3) score += 30;
        else if (diffDays <= 7) score += 15;
    }

    return Math.round(score * 10) / 10;
};

export const isTaskOverdue = (task) => {
    if (!task.dueDate) return false;
    const now = new Date();
    const due = new Date(task.dueDate);
    return due < now && task.status !== 'הושלם';
};

export const getStatusColor = (status) => {
    const colors = {
        'לא התחיל': '#6b7280',
        'הערכה': '#3b82f6',
        'תיכנון': '#8b5cf6',
        'דחיפה': '#f59e0b',
        'בעבודה': '#10b981',
        'בהמתנה': '#6b7280',
        'האצלתי': '#84cc16',
        'הושלם': '#059669',
        'בוטל': '#dc2626',
        'מושהה': '#f59e0b'
    };
    return colors[status] || '#6b7280';
};

export const getPriorityIndicator = (score) => {
    if (score >= 3) return 'high';
    if (score >= 1.5) return 'medium';
    return 'low';
};