// src/hooks/useEmptyState.js
import { useMemo } from 'react';

/**
 * Hook to determine empty state type and configuration
 * @param {Object} params - Parameters for empty state determination
 * @param {Array} params.tasks - Array of tasks
 * @param {string} params.searchQuery - Current search query
 * @param {Object} params.activeFilters - Current active filters
 * @param {boolean} params.isLoading - Loading state
 * @param {boolean} params.hasError - Error state
 * @returns {Object} Empty state configuration
 */
export const useEmptyState = ({
  tasks = [],
  searchQuery = '',
  activeFilters = {},
  isLoading = false,
  hasError = false
}) => {
  return useMemo(() => {
    // Loading state takes precedence
    if (isLoading) {
      return {
        type: 'loading',
        shouldShow: true
      };
    }

    // Error state takes precedence over empty states
    if (hasError) {
      return {
        type: 'error',
        shouldShow: true
      };
    }

    // No tasks exist at all
    if (tasks.length === 0) {
      return {
        type: 'no-tasks',
        shouldShow: true
      };
    }

    // Has search query but no results
    if (searchQuery.trim() && tasks.length === 0) {
      return {
        type: 'no-search-results',
        shouldShow: true
      };
    }

    // Has active filters but no results
    const hasActiveFilters = Object.keys(activeFilters).some(key => {
      const value = activeFilters[key];
      return value && value !== 'all' && value !== '';
    });

    if (hasActiveFilters && tasks.length === 0) {
      return {
        type: 'no-filtered-results',
        shouldShow: true
      };
    }

    // Check if all tasks are completed (special celebration state)
    const completedTasks = tasks.filter(task => task.status === 'הושלם' || task.completed);
    if (tasks.length > 0 && completedTasks.length === tasks.length) {
      return {
        type: 'all-completed',
        shouldShow: true
      };
    }

    // Has tasks, don't show empty state
    return {
      type: null,
      shouldShow: false
    };
  }, [tasks, searchQuery, activeFilters, isLoading, hasError]);
};

export default useEmptyState;