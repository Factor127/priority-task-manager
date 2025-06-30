// src/components/tasks/TaskListContainer.jsx
// Example showing EmptyState integration in a task list

import React, { useState, useMemo } from 'react';
import EmptyState from '../ui/EmptyState';
import useEmptyState from '../../hooks/useEmptyState';
import TaskCard from './TaskCard';
import styles from '../../styles/components/TaskList.module.css';

const TaskListContainer = ({ 
  tasks, 
  isLoading, 
  error,
  searchQuery,
  statusFilter,
  projectFilter,
  onCreateTask,
  onUpdateTask,
  onDeleteTask 
}) => {
  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          task.title?.toLowerCase().includes(searchLower) ||
          task.goal?.toLowerCase().includes(searchLower) ||
          task.project?.toLowerCase().includes(searchLower) ||
          task.update?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'active' && (task.status === 'הושלם' || task.completed)) {
          return false;
        }
        if (statusFilter === 'completed' && task.status !== 'הושלם' && !task.completed) {
          return false;
        }
        if (statusFilter !== 'active' && statusFilter !== 'completed' && task.status !== statusFilter) {
          return false;
        }
      }

      // Project filter
      if (projectFilter && projectFilter !== 'all') {
        if (task.project !== projectFilter) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, projectFilter]);

  // Determine empty state
  const emptyState = useEmptyState({
    tasks: filteredTasks,
    searchQuery,
    activeFilters: {
      status: statusFilter,
      project: projectFilter
    },
    isLoading,
    hasError: !!error
  });

  // Event handlers for empty state actions
  const handleClearSearch = () => {
    // This would typically call a parent function to clear search
    console.log('Clear search');
  };

  const handleClearFilters = () => {
    // This would typically call a parent function to clear filters
    console.log('Clear filters');
  };

  // Show empty state if appropriate
  if (emptyState.shouldShow) {
    return (
      <div className={styles.taskListContainer}>
        <EmptyState
          type={emptyState.type}
          searchQuery={searchQuery}
          activeFilters={{
            status: statusFilter,
            project: projectFilter
          }}
          onCreateTask={onCreateTask}
          onClearFilters={handleClearFilters}
          onClearSearch={handleClearSearch}
          className={styles.emptyStateWrapper}
        />
      </div>
    );
  }

  // Render task list
  return (
    <div className={styles.taskListContainer}>
      <div className={styles.taskList}>
        {filteredTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskListContainer;

// Example usage in main App component:
const ExampleAppUsage = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [showTaskForm, setShowTaskForm] = useState(false);

  const handleCreateTask = () => {
    setShowTaskForm(true);
  };

  const handleUpdateTask = (taskId, updates) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  return (
    <div className="app">
      {/* Search and Filters Component */}
      <div className="search-filters">
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks..."
        />
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Tasks</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Task List with EmptyState */}
      <TaskListContainer
        tasks={tasks}
        isLoading={isLoading}
        error={error}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        projectFilter={projectFilter}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onSave={(newTask) => {
            setTasks(prev => [...prev, newTask]);
            setShowTaskForm(false);
          }}
          onCancel={() => setShowTaskForm(false)}
        />
      )}
    </div>
  );
};

// Different EmptyState scenarios for testing:

// 1. No tasks at all
const NoTasksExample = () => (
  <EmptyState
    type="no-tasks"
    onCreateTask={() => console.log('Create first task')}
  />
);

// 2. No search results
const NoSearchResultsExample = () => (
  <EmptyState
    type="no-search-results"
    searchQuery="nonexistent task"
    onCreateTask={() => console.log('Create task')}
    onClearSearch={() => console.log('Clear search')}
  />
);

// 3. No filtered results
const NoFilteredResultsExample = () => (
  <EmptyState
    type="no-filtered-results"
    activeFilters={{ status: 'completed', project: 'Work' }}
    onCreateTask={() => console.log('Create task')}
    onClearFilters={() => console.log('Clear filters')}
  />
);

// 4. Loading state
const LoadingExample = () => (
  <EmptyState type="loading" />
);

// 5. Error state
const ErrorExample = () => (
  <EmptyState type="error" />
);

// 6. All completed celebration
const AllCompletedExample = () => (
  <EmptyState
    type="all-completed"
    onCreateTask={() => console.log('Create new task')}
  />
);