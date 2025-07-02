// TaskList.jsx
import React, { useMemo } from 'react';
import TaskCard from './TaskCard';
import EmptyState from '../ui/EmptyState';
import styles from './TaskList.module.css';

const generateStableKey = (task, index) => {
  // Ensure we have a valid task ID
  if (!task.id || typeof task.id !== 'string') {
    console.warn('Task missing valid ID, using index fallback:', task);
    return `fallback-${index}-${task.title?.slice(0, 10) || 'untitled'}`;
  }
  
  // Use just the task ID - it should be unique
  return task.id;
};

const TaskList = ({
  tasks = [],
  loading = false,
  error = null,
  searchQuery = '',
  statusFilter = 'all', // 'all', 'active', 'completed'
  projectFilter = '',
  onTaskUpdate,
  onTaskDelete,
  onTaskToggleComplete,
  onRatePriority,
  onCreateTask,
  onClearSearch,
  onClearFilters,
  onRetry,
  savedProjects = [],
  priorityCategories = [],
  className = ''
}) => {
  
  // Calculate priority score for sorting
  const calculatePriorityScore = (task, categories) => {
    let score = 0;
    const priorityRatings = task.priorityRatings || {};
    
    categories.forEach(category => {
      const rating = priorityRatings[category.id] || 0;
      const weight = category.weight || 0;
      score += (rating * weight) / 100;
    });

    // Add urgency bonus
    if (task.dueDate && !task.completedAt) {
      const today = new Date();
      const dueDate = new Date(task.dueDate);
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        score += 50; // Overdue or due today
      } else if (diffDays <= 3) {
        score += 30; // Due in 1-3 days
      } else if (diffDays <= 7) {
        score += 15; // Due in 4-7 days
      }
    }

    return Math.round(score * 10) / 10;
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    let filtered = [...tasks];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(query) ||
        task.project?.toLowerCase().includes(query) ||
        task.goal?.toLowerCase().includes(query) ||
        task.update?.toLowerCase().includes(query) ||
        task.type?.toLowerCase().includes(query) ||
        task.status?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(task => !task.completedAt);
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(task => task.completedAt);
    }

    // Apply project filter
    if (projectFilter && projectFilter !== 'all') {
      filtered = filtered.filter(task => task.project === projectFilter);
    }

    // Sort by priority score (highest first), then by creation date
    filtered.sort((a, b) => {
      const scoreA = calculatePriorityScore(a, priorityCategories);
      const scoreB = calculatePriorityScore(b, priorityCategories);
      
      if (scoreB !== scoreA) {
        return scoreB - scoreA; // Higher priority first
      }
      
      // If same priority, sort by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return filtered;
  }, [tasks, searchQuery, statusFilter, projectFilter, priorityCategories]);

  // Determine empty state type
  const getEmptyStateType = () => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (!tasks || tasks.length === 0) return 'no-tasks';
    
    // Check if all tasks are completed
    const allCompleted = tasks.length > 0 && tasks.every(task => task.completedAt);
    if (allCompleted && statusFilter !== 'completed') return 'all-completed';
    
    // Check if we have search results
    if (searchQuery.trim() && filteredAndSortedTasks.length === 0) {
      return 'no-search-results';
    }
    
    // Check if we have filter results
    if ((statusFilter !== 'all' || projectFilter) && filteredAndSortedTasks.length === 0) {
      return 'no-filtered-results';
    }
    
    return null;
  };

  // Get stats for display
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completedAt).length;
    const active = total - completed;
    const overdue = tasks.filter(task => 
      task.dueDate && 
      !task.completedAt && 
      new Date(task.dueDate) < new Date()
    ).length;

    return { total, completed, active, overdue };
  };

  const emptyStateType = getEmptyStateType();
  const stats = getTaskStats();

  // Handle empty state actions
  const handleEmptyStateAction = (action) => {
    switch (action) {
      case 'create-task':
        onCreateTask?.();
        break;
      case 'clear-search':
        onClearSearch?.();
        break;
      case 'clear-filters':
        onClearFilters?.();
        break;
      case 'retry':
        onRetry?.();
        break;
      default:
        break;
    }
  };

  return (
  <div className={`${styles.taskList} ${className}`}>
    {/* Task Stats Header */}
    {!loading && !error && tasks.length > 0 && (
      <div className={styles.statsHeader}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{stats.total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{stats.active}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{stats.completed}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statNumber} ${stats.overdue > 0 ? styles.overdue : ''}`}>
              {stats.overdue}
            </span>
            <span className={styles.statLabel}>Overdue</span>
          </div>
        </div>

        {/* Filter Summary */}
        {(searchQuery || statusFilter !== 'all' || projectFilter) && (
          <div className={styles.filterSummary}>
            <span className={styles.showingText}>
              Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
            </span>
            {searchQuery && (
              <span className={styles.filterTag}>
                Search: "{searchQuery}"
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className={styles.filterTag}>
                Status: {statusFilter}
              </span>
            )}
            {projectFilter && projectFilter !== 'all' && (
              <span className={styles.filterTag}>
                Project: {projectFilter}
              </span>
            )}
            <button 
              className={styles.clearFiltersBtn}
              onClick={() => handleEmptyStateAction('clear-filters')}
              title="Clear all filters"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    )}

    {/* Task Cards or Empty State */}
    <div className={styles.taskContainer}>
      {emptyStateType ? (
        <EmptyState
          type={emptyStateType}
          onAction={handleEmptyStateAction}
          searchQuery={searchQuery}
          hasFilters={statusFilter !== 'all' || projectFilter}
          error={error}
        />
      ) : (
        <div className={styles.taskCards}>
          {filteredAndSortedTasks.map((task, index) => (
            <TaskCard
              key={generateStableKey(task, index)} // ✅ FIXED: Simple, stable key
              task={task}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
              onToggleComplete={onTaskToggleComplete}
              onRatePriority={onRatePriority}
              savedProjects={savedProjects}
              priorityCategories={priorityCategories}
              className={index === 0 ? styles.firstCard : ''}
            />
          ))}
        </div>
      )}
    </div>

    {/* Performance hint for large lists */}
    {filteredAndSortedTasks.length > 50 && (
      <div className={styles.performanceHint}>
        <span className={styles.hintText}>
          💡 Tip: Use search or filters to find tasks faster when you have many items
        </span>
      </div>
    )}

    {/* Debug info in development */}
    {process.env.NODE_ENV === 'development' && (
      <div className={styles.debugInfo} style={{ 
        marginTop: '1rem', 
        padding: '0.5rem', 
        background: '#f3f4f6', 
        fontSize: '0.75rem',
        borderRadius: '0.25rem'
      }}>
        <details>
          <summary style={{ cursor: 'pointer' }}>🔍 Debug Info</summary>
          <div style={{ marginTop: '0.5rem' }}>
            <p>📊 Total tasks: {tasks.length}</p>
            <p>🎯 Filtered tasks: {filteredAndSortedTasks.length}</p>
            <p>🆔 Unique task IDs: {new Set(filteredAndSortedTasks.map(t => t.id)).size}</p>
            {new Set(filteredAndSortedTasks.map(t => t.id)).size !== filteredAndSortedTasks.length && (
              <p style={{ color: 'red' }}>⚠️ DUPLICATE IDs DETECTED!</p>
            )}
          </div>
        </details>
      </div>
    )}
  </div>
);

// Alternative: If you prefer a more robust approach with validation
const generateValidatedKey = (task, index, allTasks) => {
  // Check for valid ID
  if (!task.id || typeof task.id !== 'string') {
    console.warn(`Task at index ${index} has invalid ID:`, task.id);
    return `invalid-id-${index}-${task.title?.replace(/\s+/g, '-').slice(0, 20) || 'untitled'}`;
  }
  
  // Check for duplicate IDs in the current list
  const sameIdTasks = allTasks.filter(t => t.id === task.id);
  if (sameIdTasks.length > 1) {
    console.warn(`Duplicate ID found: ${task.id}`);
    // Find which occurrence this is
    const occurrence = sameIdTasks.indexOf(task);
    return `${task.id}-dup-${occurrence}`;
  }
  
  return task.id;
};

// Usage with validation:
// key={generateValidatedKey(task, index, filteredAndSortedTasks)}