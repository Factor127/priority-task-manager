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