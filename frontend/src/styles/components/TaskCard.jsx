// TaskCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Link, 
  Star, 
  Check, 
  Trash2, 
  RotateCcw,
  ExternalLink 
} from 'lucide-react';
import TaskField from '../../components/ui/TaskField';
import styles from './TaskCard.module.css';

// Priority indicator thresholds
const PRIORITY_THRESHOLDS = {
  HIGH: 3.5,
  MEDIUM: 2.0
};

const TaskCard = ({
  task,
  onUpdate,
  onDelete,
  onToggleComplete,
  onRatePriority,
  savedProjects = [],
  priorityCategories = [],
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState(task);
  const [saveTimeout, setSaveTimeout] = useState(null);
  
  const cardRef = useRef(null);

  // Calculate priority score
  const calculatePriorityScore = (priorityRatings = {}, categories = []) => {
    let score = 0;
    categories.forEach(category => {
      const rating = priorityRatings[category.id] || 0;
      const weight = category.weight || 0;
      score += (rating * weight) / 100;
    });

    // Add urgency bonus
    if (task.dueDate) {
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

  const priorityScore = calculatePriorityScore(task.priorityRatings || {}, priorityCategories);

  // Get priority indicator color
  const getPriorityIndicator = () => {
    if (priorityScore >= PRIORITY_THRESHOLDS.HIGH) {
      return { color: '#ef4444', label: 'High' }; // Red
    } else if (priorityScore >= PRIORITY_THRESHOLDS.MEDIUM) {
      return { color: '#10b981', label: 'Medium' }; // Green
    } else {
      return { color: '#6b7280', label: 'Low' }; // Gray
    }
  };

  // Format due date for display
  const formatDueDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
    if (diffDays <= 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Check if task is overdue
  const isOverdue = () => {
    if (!task.dueDate || task.completedAt) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
  };

  // Handle field changes with auto-save
  const handleFieldChange = (value, fieldName) => {
    const updatedData = { ...localData, [fieldName]: value };
    setLocalData(updatedData);

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for auto-save (800ms delay)
    const timeout = setTimeout(() => {
      onUpdate(task.id, { [fieldName]: value });
    }, 800);

    setSaveTimeout(timeout);
  };

  // Handle immediate updates (status, completion)
  const handleImmediateUpdate = (updates) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    setLocalData(prev => ({ ...prev, ...updates }));
    onUpdate(task.id, updates);
  };

  // Toggle completion
  const handleToggleComplete = () => {
    const updates = {
      completedAt: task.completedAt ? null : new Date().toISOString(),
      status: task.completedAt ? 'לא התחיל' : 'הושלם'
    };
    handleImmediateUpdate(updates);
    onToggleComplete?.(task, !task.completedAt);
  };

  // Handle expand/collapse
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setIsEditing(true);
    }
  };

  // Handle delete with confirmation
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  // Handle rate priority
  const handleRatePriority = () => {
    onRatePriority?.(task);
  };

  // Handle link click
  const handleLinkClick = (e) => {
    e.stopPropagation();
    if (task.link) {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  // Get task status color
  const getStatusColor = (status) => {
    const statusColors = {
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
    return statusColors[status] || '#6b7280';
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const priorityIndicator = getPriorityIndicator();
  const dueFormatted = formatDueDate(task.dueDate);
  const statusColor = getStatusColor(localData.status || task.status);

  return (
    <div 
      ref={cardRef}
      className={`
        ${styles.taskCard} 
        ${task.completedAt ? styles.completed : ''} 
        ${isOverdue() ? styles.overdue : ''} 
        ${task.updatedAt && new Date(task.updatedAt) > new Date(Date.now() - 5000) ? styles.recentlyUpdated : ''}
        ${className}
      `}
    >
      {/* Priority Indicator */}
      <div 
        className={styles.priorityIndicator}
        style={{ backgroundColor: priorityIndicator.color }}
        title={`${priorityIndicator.label} Priority (${priorityScore})`}
      />

      {/* Compact View */}
      <div className={styles.compactView}>
        {/* Left Section - Title and Info */}
        <div className={styles.leftSection} onClick={toggleExpanded}>
          <div className={styles.titleRow}>
            <h3 className={`${styles.title} ${task.completedAt ? styles.strikethrough : ''}`}>
              {task.title}
            </h3>
            {task.link && (
              <button
                className={styles.linkButton}
                onClick={handleLinkClick}
                title="Open link"
                aria-label="Open related link"
              >
                <ExternalLink size={14} />
              </button>
            )}
          </div>

          {/* Meta Info Row */}
          <div className={styles.metaRow}>
            {task.project && (
              <span className={styles.project}>{task.project}</span>
            )}
            {dueFormatted && (
              <span className={`${styles.dueDate} ${isOverdue() ? styles.overdueBadge : ''}`}>
                <Calendar size={12} />
                {dueFormatted}
              </span>
            )}
            {task.isRepeating && (
              <span className={styles.repeating} title="Repeating task">
                <RotateCcw size={12} />
              </span>
            )}
          </div>
        </div>

        {/* Right Section - Status and Actions */}
        <div className={styles.rightSection}>
          {/* Status Dropdown */}
          <div className={styles.statusContainer}>
            <TaskField
              type="taskStatus"
              name="status"
              value={localData.status || task.status}
              onChange={handleFieldChange}
              className={styles.statusField}
            />
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              className={`${styles.actionButton} ${task.completedAt ? styles.completed : ''}`}
              onClick={handleToggleComplete}
              title={task.completedAt ? 'Mark incomplete' : 'Mark complete'}
              aria-label={task.completedAt ? 'Mark task incomplete' : 'Mark task complete'}
            >
              <Check size={16} />
            </button>

            <button
              className={styles.actionButton}
              onClick={toggleExpanded}
              title={isExpanded ? 'Collapse' : 'Expand'}
              aria-label={isExpanded ? 'Collapse task details' : 'Expand task details'}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className={styles.expandedView}>
          <div className={styles.formGrid}>
            {/* Title */}
            <div className={styles.formRow}>
              <TaskField
                type="text"
                name="title"
                label="Title"
                value={localData.title || task.title}
                onChange={handleFieldChange}
                required
                placeholder="Task title..."
              />
            </div>

            {/* Project and Type Row */}
            <div className={styles.formRowTwoCol}>
              <TaskField
                type="autocomplete"
                name="project"
                label="Project"
                value={localData.project || task.project || ''}
                onChange={handleFieldChange}
                suggestions={savedProjects}
                placeholder="Project name..."
              />

              <TaskField
                type="taskType"
                name="type"
                label="Type"
                value={localData.type || task.type || ''}
                onChange={handleFieldChange}
              />
            </div>

            {/* Goal */}
            <div className={styles.formRow}>
              <TaskField
                type="textarea"
                name="goal"
                label="Goal/Description"
                value={localData.goal || task.goal || ''}
                onChange={handleFieldChange}
                placeholder="Describe the goal or objective..."
                rows={3}
                maxRows={6}
              />
            </div>

            {/* Updates */}
            <div className={styles.formRow}>
              <TaskField
                type="textarea"
                name="update"
                label="Updates/Notes"
                value={localData.update || task.update || ''}
                onChange={handleFieldChange}
                placeholder="Add progress updates or notes..."
                rows={2}
                maxRows={4}
              />
            </div>

            {/* Due Date and Repeat Row */}
            <div className={styles.formRowTwoCol}>
              <TaskField
                type="date"
                name="dueDate"
                label="Due Date"
                value={localData.dueDate || task.dueDate || ''}
                onChange={handleFieldChange}
                showIcon
              />

              <div className={styles.repeatContainer}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={localData.isRepeating || task.isRepeating || false}
                    onChange={(e) => handleFieldChange(e.target.checked, 'isRepeating')}
                  />
                  Repeating Task
                </label>

                {(localData.isRepeating || task.isRepeating) && (
                  <TaskField
                    type="repeatInterval"
                    name="repeatInterval"
                    value={localData.repeatInterval || task.repeatInterval || ''}
                    onChange={handleFieldChange}
                  />
                )}
              </div>
            </div>

            {/* Link */}
            <div className={styles.formRow}>
              <TaskField
                type="url"
                name="link"
                label="Related Link"
                value={localData.link || task.link || ''}
                onChange={handleFieldChange}
                placeholder="https://example.com"
                showIcon
              />
            </div>

            {/* Priority Score Display */}
            <div className={styles.priorityScoreRow}>
              <div className={styles.priorityScore}>
                <span className={styles.scoreLabel}>Priority Score:</span>
                <span 
                  className={styles.scoreValue}
                  style={{ backgroundColor: priorityIndicator.color }}
                >
                  {priorityScore}
                </span>
              </div>

              <button
                className={styles.ratePriorityButton}
                onClick={handleRatePriority}
                title="Rate priority categories"
              >
                <Star size={16} />
                Rate Priority
              </button>
            </div>

            {/* Action Buttons Row */}
            <div className={styles.expandedActions}>
              <button
                className={`${styles.actionBtn} ${styles.completeBtn} ${task.completedAt ? styles.completed : ''}`}
                onClick={handleToggleComplete}
              >
                <Check size={16} />
                {task.completedAt ? 'Mark Incomplete' : 'Complete Task'}
              </button>

              <button
                className={`${styles.actionBtn} ${styles.priorityBtn}`}
                onClick={handleRatePriority}
              >
                <Star size={16} />
                Rate Priority
              </button>

              {task.link && (
                <button
                  className={`${styles.actionBtn} ${styles.linkBtn}`}
                  onClick={handleLinkClick}
                >
                  <ExternalLink size={16} />
                  Open Link
                </button>
              )}

              <button
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;