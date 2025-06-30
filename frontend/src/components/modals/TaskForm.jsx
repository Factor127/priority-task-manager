// TaskForm.jsx - Fixed syntax errors
import React, { useState, useEffect } from 'react';
import { X, Star, Save, Plus } from 'lucide-react';
import TaskField from '../ui/TaskField';
import styles from './TaskForm.module.css';

const TaskForm = ({
  isOpen = false,
  onClose,
  onSubmit,
  onRatePriority,
  task = null, // null for new task, task object for editing
  savedProjects = [],
  priorityCategories = [],
  className = ''
}) => {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    project: '',
    goal: '',
    update: '',
    type: '',
    status: 'לא התחיל',
    dueDate: '',
    isRepeating: false,
    repeatInterval: '',
    link: '',
    priorityRatings: {}
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrioritySection, setShowPrioritySection] = useState(false);

  // Initialize form data when task prop changes
  useEffect(() => {
    if (task) {
      // Editing existing task
      setFormData({
        title: task.title || '',
        project: task.project || '',
        goal: task.goal || '',
        update: task.update || '',
        type: task.type || '',
        status: task.status || 'לא התחיל',
        dueDate: task.dueDate || '',
        isRepeating: task.isRepeating || false,
        repeatInterval: task.repeatInterval || '',
        link: task.link || '',
        priorityRatings: task.priorityRatings || {}
      });
      setShowPrioritySection(Object.keys(task.priorityRatings || {}).length > 0);
    } else {
      // New task - reset form
      setFormData({
        title: '',
        project: '',
        goal: '',
        update: '',
        type: '',
        status: 'לא התחיל',
        dueDate: '',
        isRepeating: false,
        repeatInterval: '',
        link: '',
        priorityRatings: {}
      });
      setShowPrioritySection(false);
    }
    setErrors({});
  }, [task, isOpen]);

  // Calculate priority score
  const calculatePriorityScore = () => {
    let score = 0;
    priorityCategories.forEach(category => {
      const rating = formData.priorityRatings[category.id] || 0;
      const weight = category.weight || 0;
      score += (rating * weight) / 100;
    });

    // Add urgency bonus for due date
    if (formData.dueDate) {
      const today = new Date();
      const dueDate = new Date(formData.dueDate);
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

  // Handle field changes
  const handleFieldChange = (value, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  // Handle priority rating changes
  const handlePriorityRatingChange = (categoryId, rating) => {
    setFormData(prev => ({
      ...prev,
      priorityRatings: {
        ...prev.priorityRatings,
        [categoryId]: rating
      }
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    // URL validation
    if (formData.link && !isValidUrl(formData.link)) {
      newErrors.link = 'Please enter a valid URL';
    }

    // Repeat interval validation
    if (formData.isRepeating && !formData.repeatInterval) {
      newErrors.repeatInterval = 'Repeat interval is required for repeating tasks';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Simple URL validation
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        ...formData,
        // Convert date string to proper format
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        // Ensure proper data types
        isRepeating: Boolean(formData.isRepeating),
        // Add timestamps
        updatedAt: new Date().toISOString(),
        ...(task ? {} : { createdAt: new Date().toISOString() }) // Only add createdAt for new tasks
      };

      await onSubmit(taskData);
      handleClose();
    } catch (error) {
      console.error('Error submitting task:', error);
      setErrors({ submit: 'Failed to save task. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle priority rating button
  const handleRatePriority = () => {
    if (onRatePriority) {
      onRatePriority(formData);
    } else {
      setShowPrioritySection(true);
    }
  };

  // Get priority score for display
  const priorityScore = calculatePriorityScore();

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div 
        className={`${styles.modal} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className={styles.closeButton}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formContent}>
            {/* Title - Required */}
            <div className={styles.section}>
              <TaskField
                type="text"
                name="title"
                label="Task Title"
                placeholder="Enter task title..."
                value={formData.title}
                onChange={handleFieldChange}
                required
                error={errors.title}
                helpText="A clear, concise description of what needs to be done"
              />
            </div>

            {/* Project and Type Row */}
            <div className={styles.twoColumnRow}>
              <TaskField
                type="autocomplete"
                name="project"
                label="Project"
                placeholder="Start typing project name..."
                value={formData.project}
                onChange={handleFieldChange}
                suggestions={savedProjects}
                helpText="Choose an existing project or create a new one"
              />

              <TaskField
                type="taskType"
                name="type"
                label="Task Type"
                value={formData.type}
                onChange={handleFieldChange}
                helpText="Select the category that best describes this task"
              />
            </div>

            {/* Goal */}
            <div className={styles.section}>
              <TaskField
                type="textarea"
                name="goal"
                label="Goal/Description"
                placeholder="Describe the goal or objective..."
                value={formData.goal}
                onChange={handleFieldChange}
                rows={3}
                maxRows={6}
                helpText="Detailed description of what you want to achieve"
              />
            </div>

            {/* Update Notes */}
            <div className={styles.section}>
              <TaskField
                type="textarea"
                name="update"
                label="Updates/Notes"
                placeholder="Add progress updates or notes..."
                value={formData.update}
                onChange={handleFieldChange}
                rows={2}
                maxRows={4}
                helpText="Current progress, notes, or additional information"
              />
            </div>

            {/* Status and Due Date Row */}
            <div className={styles.twoColumnRow}>
              <TaskField
                type="taskStatus"
                name="status"
                label="Status"
                value={formData.status}
                onChange={handleFieldChange}
                required
                helpText="Current status of the task"
              />

              <TaskField
                type="date"
                name="dueDate"
                label="Due Date"
                value={formData.dueDate ? formData.dueDate.split('T')[0] : ''}
                onChange={handleFieldChange}
                showIcon
                helpText="When should this task be completed?"
              />
            </div>

            {/* Repeating Task Section */}
            <div className={styles.section}>
              <div className={styles.checkboxRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    id="isRepeating-checkbox"
                    type="checkbox"
                    name="isRepeating"
                    checked={formData.isRepeating}
                    onChange={(e) => handleFieldChange(e.target.checked, 'isRepeating')}
                  />
                  <span>Repeating Task</span>
                </label>
              </div>

              {formData.isRepeating && (
                <TaskField
                  type="repeatInterval"
                  name="repeatInterval"
                  label="Repeat Interval"
                  value={formData.repeatInterval}
                  onChange={handleFieldChange}
                  required={formData.isRepeating}
                  error={errors.repeatInterval}
                  helpText="How often should this task repeat?"
                />
              )}
            </div>

            {/* Link */}
            <div className={styles.section}>
              <TaskField
                type="url"
                name="link"
                label="Related Link"
                placeholder="https://example.com"
                value={formData.link}
                onChange={handleFieldChange}
                showIcon
                error={errors.link}
                helpText="Optional link to relevant resources or documents"
              />
            </div>

            {/* Priority Section */}
            <div className={styles.prioritySection}>
              <div className={styles.priorityHeader}>
                <h3 className={styles.priorityTitle}>Priority Rating</h3>
                <div className={styles.priorityActions}>
                  {priorityScore > 0 && (
                    <div className={styles.priorityScore}>
                      Score: <span className={styles.scoreValue}>{priorityScore}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRatePriority}
                    className={styles.ratePriorityBtn}
                  >
                    <Star size={16} />
                    {showPrioritySection ? 'Advanced Rating' : 'Rate Priority'}
                  </button>
                  {!showPrioritySection && (
                    <button
                      type="button"
                      onClick={() => setShowPrioritySection(true)}
                      className={styles.showPriorityBtn}
                    >
                      <Plus size={16} />
                      Show Ratings
                    </button>
                  )}
                </div>
              </div>

              {showPrioritySection && (
                <div className={styles.priorityRatings}>
                  {priorityCategories.map(category => (
                    <div key={category.id} className={styles.priorityCategory}>
                      <div className={styles.categoryInfo}>
                        <span 
                          className={styles.categoryName}
                          style={{ color: category.color }}
                        >
                          {category.english} ({category.hebrew})
                        </span>
                        <span className={styles.categoryWeight}>
                          Weight: {category.weight}%
                        </span>
                      </div>
                      <div className={styles.ratingSlider}>
                        <input
                          id={`priority-${category.id}`}
                          type="range"
                          name={`priority-${category.id}`}
                          min="0"
                          max="5"
                          step="1"
                          value={formData.priorityRatings[category.id] || 0}
                          onChange={(e) => handlePriorityRatingChange(category.id, parseInt(e.target.value))}
                          className={styles.slider}
                          style={{ accentColor: category.color }}
                        />
                        <span className={styles.ratingValue}>
                          {formData.priorityRatings[category.id] || 0}/5
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {priorityCategories.length > 0 && (
                    <div className={styles.priorityTotal}>
                      <strong>Total Priority Score: {priorityScore}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className={styles.submitError}>
                {errors.submit}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Save size={16} />
                  {task ? 'Update Task' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;