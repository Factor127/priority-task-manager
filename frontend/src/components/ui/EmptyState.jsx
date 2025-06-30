// src/components/ui/EmptyState.jsx
import React from 'react';
import { Plus, Search, AlertCircle, FileText, Target, CheckCircle2 } from 'lucide-react';
import styles from '../../styles/components/EmptyState.module.css';

const EmptyState = ({ 
  type = 'no-tasks',
  searchQuery = '',
  activeFilters = {},
  onCreateTask,
  onClearFilters,
  onClearSearch,
  className = ''
}) => {
  const getEmptyStateConfig = () => {
    switch (type) {
      case 'no-tasks':
        return {
          icon: <Target className={styles.icon} />,
          title: 'No tasks yet',
          description: 'Start managing your priorities by creating your first task.',
          actions: [
            {
              label: 'Create First Task',
              onClick: onCreateTask,
              variant: 'primary',
              icon: <Plus size={16} />
            }
          ],
          tips: [
            'Set priority ratings for each task to see what matters most',
            'Use projects to organize related tasks together',
            'Hebrew text is fully supported for task details'
          ]
        };

      case 'no-search-results':
        return {
          icon: <Search className={styles.icon} />,
          title: 'No tasks found',
          description: `No tasks match "${searchQuery}". Try adjusting your search or filters.`,
          actions: [
            ...(searchQuery ? [{
              label: 'Clear Search',
              onClick: onClearSearch,
              variant: 'secondary'
            }] : []),
            ...(Object.keys(activeFilters).length > 0 ? [{
              label: 'Clear Filters',
              onClick: onClearFilters,
              variant: 'secondary'
            }] : []),
            {
              label: 'Create New Task',
              onClick: onCreateTask,
              variant: 'primary',
              icon: <Plus size={16} />
            }
          ],
          tips: [
            'Search looks through task titles, goals, and projects',
            'Try searching for project names or status terms',
            'Use Hebrew keywords if your tasks contain Hebrew text'
          ]
        };

      case 'no-filtered-results':
        return {
          icon: <FileText className={styles.icon} />,
          title: 'No tasks in this view',
          description: 'No tasks match your current filters. Try adjusting your filter settings.',
          actions: [
            {
              label: 'Clear Filters',
              onClick: onClearFilters,
              variant: 'secondary'
            },
            {
              label: 'Create New Task',
              onClick: onCreateTask,
              variant: 'primary',
              icon: <Plus size={16} />
            }
          ],
          tips: [
            'Try viewing "All Tasks" to see your complete list',
            'Check if tasks exist in other status categories',
            'Use project filters to narrow down by specific projects'
          ]
        };

      case 'loading':
        return {
          icon: <div className={styles.spinner} />,
          title: 'Loading tasks...',
          description: 'Please wait while we fetch your tasks.',
          actions: [],
          tips: []
        };

      case 'error':
        return {
          icon: <AlertCircle className={styles.icon} />,
          title: 'Unable to load tasks',
          description: 'There was a problem loading your tasks. Please try again.',
          actions: [
            {
              label: 'Retry',
              onClick: () => window.location.reload(),
              variant: 'primary'
            }
          ],
          tips: [
            'Check your internet connection',
            'Try refreshing the page',
            'Your data is safely stored and will return when the issue is resolved'
          ]
        };

      case 'all-completed':
        return {
          icon: <CheckCircle2 className={styles.icon} />,
          title: 'All tasks completed!',
          description: 'Great job! You\'ve completed all your tasks. Ready for more?',
          actions: [
            {
              label: 'Create New Task',
              onClick: onCreateTask,
              variant: 'primary',
              icon: <Plus size={16} />
            }
          ],
          tips: [
            'Review completed tasks to see your achievements',
            'Check your points and level progress',
            'Consider planning tasks for tomorrow or next week'
          ]
        };

      default:
        return {
          icon: <FileText className={styles.icon} />,
          title: 'No content',
          description: 'Nothing to display here.',
          actions: [],
          tips: []
        };
    }
  };

  const config = getEmptyStateConfig();

  return (
    <div className={`${styles.emptyState} ${className}`}>
      <div className={styles.content}>
        {/* Icon */}
        <div className={styles.iconContainer}>
          {config.icon}
        </div>

        {/* Title and Description */}
        <h3 className={styles.title}>{config.title}</h3>
        <p className={styles.description}>{config.description}</p>

        {/* Action Buttons */}
        {config.actions.length > 0 && (
          <div className={styles.actions}>
            {config.actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`${styles.actionButton} ${styles[action.variant] || styles.primary}`}
                disabled={!action.onClick}
              >
                {action.icon && <span className={styles.actionIcon}>{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Tips Section */}
        {config.tips.length > 0 && (
          <div className={styles.tips}>
            <h4 className={styles.tipsTitle}>💡 Tips:</h4>
            <ul className={styles.tipsList}>
              {config.tips.map((tip, index) => (
                <li key={index} className={styles.tip}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;