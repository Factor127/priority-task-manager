//App.js file
import React, { useState, useEffect } from 'react';
import { X, Star, Save, Plus } from 'lucide-react';
import TaskField from './components/ui/TaskField';

// import styles from './TaskForm.module.css'; // Comment out if CSS module doesn't exist

useEffect(() => {
    // Global error handler
    const handleGlobalError = (event) => {
        console.error('Global error:', event.error);
        // Prevent default browser error handling
        event.preventDefault();
    };

    const handleUnhandledRejection = (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        // Prevent default browser error handling
        event.preventDefault();
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
        window.removeEventListener('error', handleGlobalError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
}, []);
useEffect(() => {
    // Monitor performance
    const startTime = performance.now();
    
    return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        if (renderTime > 1000) {
            console.warn(`Slow app render: ${renderTime}ms`);
        }
    };
}, []);
class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('App Error:', error, errorInfo);
        this.setState({ error, errorInfo });
        
        // Save error for debugging
        try {
            localStorage.setItem('lastAppError', JSON.stringify({
                error: error.message,
                stack: error.stack,
                errorInfo,
                timestamp: new Date().toISOString()
            }));
        } catch (e) {
            console.error('Failed to save error info');
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#fff5f5',
                    border: '1px solid #fed7d7',
                    borderRadius: '8px',
                    margin: '20px'
                }}>
                    <h2>Something went wrong</h2>
                    <p>The app encountered an error. Your data is safe.</p>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Reload App
                    </button>
                    <details style={{ marginTop: '20px', textAlign: 'left' }}>
                        <summary>Error Details</summary>
                        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    </details>
                </div>
            );
        }
        return this.props.children;
    }
}

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

  // Inline styles (use these if CSS module doesn't exist)
  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '0',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'hidden',
      boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      borderBottom: '1px solid #e5e7eb'
    },
    title: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      color: '#6b7280'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    },
    formContent: {
      padding: '20px',
      overflowY: 'auto',
      flex: 1
    },
    section: {
      marginBottom: '20px'
    },
    twoColumnRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px',
      marginBottom: '20px'
    },
    checkboxRow: {
      marginBottom: '15px'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    prioritySection: {
      marginBottom: '20px'
    },
    priorityHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px'
    },
    priorityTitle: {
      margin: 0,
      fontSize: '16px',
      fontWeight: '600'
    },
    priorityActions: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    },
    priorityScore: {
      fontSize: '14px',
      color: '#6b7280'
    },
    scoreValue: {
      fontWeight: '600',
      color: '#4f46e5'
    },
    ratePriorityBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 12px',
      background: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      cursor: 'pointer'
    },
    showPriorityBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 12px',
      background: '#f3f4f6',
      color: '#374151',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      cursor: 'pointer'
    },
    priorityRatings: {
      background: '#f9fafb',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    },
    priorityCategory: {
      marginBottom: '15px'
    },
    categoryInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    categoryName: {
      fontSize: '14px',
      fontWeight: '500'
    },
    categoryWeight: {
      fontSize: '12px',
      color: '#6b7280'
    },
    ratingSlider: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    slider: {
      flex: 1,
      height: '6px',
      borderRadius: '3px',
      outline: 'none',
      cursor: 'pointer'
    },
    ratingValue: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#374151',
      minWidth: '35px'
    },
    priorityTotal: {
      textAlign: 'center',
      padding: '10px',
      background: '#eff6ff',
      borderRadius: '6px',
      marginTop: '10px'
    },
    submitError: {
      color: '#dc2626',
      fontSize: '14px',
      padding: '10px',
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '6px',
      marginTop: '15px'
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      padding: '20px',
      borderTop: '1px solid #e5e7eb'
    },
    cancelButton: {
      padding: '8px 16px',
      background: '#f3f4f6',
      color: '#374151',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    submitButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      background: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    }
  };

  // Use either styles (CSS modules) or modalStyles (inline)
  const s = typeof styles !== 'undefined' ? styles : modalStyles;
  if (!isOpen) return null;

  return (
    <div style={s.overlay} onClick={handleClose}>
      <div 
        style={{...s.modal, ...(className ? {} : {})}}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={s.header}>
          <h2 style={s.title}>
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            style={s.closeButton}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.formContent}>
            {/* Title - Required */}
            <div style={s.section}>
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
            <div style={s.twoColumnRow}>
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
            <div style={s.section}>
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
            <div style={s.section}>
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
            <div style={s.twoColumnRow}>
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
            <div style={s.section}>
              <div style={s.checkboxRow}>
                <label style={s.checkboxLabel}>
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
            <div style={s.section}>
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
            <div style={s.prioritySection}>
              <div style={s.priorityHeader}>
                <h3 style={s.priorityTitle}>Priority Rating</h3>
                <div style={s.priorityActions}>
                  {priorityScore > 0 && (
                    <div style={s.priorityScore}>
                      Score: <span style={s.scoreValue}>{priorityScore}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRatePriority}
                    style={s.ratePriorityBtn}
                  >
                    <Star size={16} />
                    {showPrioritySection ? 'Advanced Rating' : 'Rate Priority'}
                  </button>
                  {!showPrioritySection && (
                    <button
                      type="button"
                      onClick={() => setShowPrioritySection(true)}
                      style={s.showPriorityBtn}
                    >
                      <Plus size={16} />
                      Show Ratings
                    </button>
                  )}
                </div>
              </div>

              {showPrioritySection && (
                <div style={s.priorityRatings}>
                  {priorityCategories.map(category => (
                    <div key={category.id} style={s.priorityCategory}>
                      <div style={s.categoryInfo}>
                        <span 
                          style={{...s.categoryName, color: category.color}}
                        >
                          {category.english} ({category.hebrew})
                        </span>
                        <span style={s.categoryWeight}>
                          Weight: {category.weight}%
                        </span>
                      </div>
                      <div style={s.ratingSlider}>
                        <input
                          id={`priority-${category.id}`}
                          type="range"
                          name={`priority-${category.id}`}
                          min="0"
                          max="5"
                          step="1"
                          value={formData.priorityRatings[category.id] || 0}
                          onChange={(e) => handlePriorityRatingChange(category.id, parseInt(e.target.value))}
                          style={{...s.slider, accentColor: category.color}}
                        />
                        <span style={s.ratingValue}>
                          {formData.priorityRatings[category.id] || 0}/5
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {priorityCategories.length > 0 && (
                    <div style={s.priorityTotal}>
                      <strong>Total Priority Score: {priorityScore}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div style={s.submitError}>
                {errors.submit}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={s.footer}>
            <button
              type="button"
              onClick={handleClose}
              style={s.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...s.submitButton, 
                opacity: (isSubmitting || !formData.title.trim()) ? 0.6 : 1,
                cursor: (isSubmitting || !formData.title.trim()) ? 'not-allowed' : 'pointer'
              }}
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

export default App;
