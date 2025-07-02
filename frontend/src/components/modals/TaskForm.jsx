import React, { useState, useEffect } from 'react';

const TaskForm = ({
  isOpen = false,
  onSave,
  onClose,
  onCancel,
  task = null, // null for new task, task object for editing
  savedProjects = [],
  priorityCategories = []
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
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        isRepeating: task.isRepeating || false,
        repeatInterval: task.repeatInterval || '',
        link: task.link || '',
        priorityRatings: task.priorityRatings || {}
      });
      setShowPrioritySection(Object.keys(task.priorityRatings || {}).length > 0);
    } else {
      // New task - reset form
      const initialRatings = {};
      priorityCategories.forEach(cat => {
        initialRatings[cat.id] = 0;
      });
      
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
        priorityRatings: initialRatings
      });
      setShowPrioritySection(false);
    }
    setErrors({});
  }, [task, isOpen, priorityCategories]);

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
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
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

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (formData.dueDate) {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    if (formData.link && formData.link.trim()) {
      try {
        new URL(formData.link);
      } catch {
        newErrors.link = 'Please enter a valid URL';
      }
    }

    if (formData.isRepeating && !formData.repeatInterval) {
      newErrors.repeatInterval = 'Repeat interval is required for repeating tasks';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        priorityScore: calculatePriorityScore()
      };

      await onSave(submitData);
      
      // Reset form for new tasks
      if (!task) {
        const initialRatings = {};
        priorityCategories.forEach(cat => {
          initialRatings[cat.id] = 0;
        });
        
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
          priorityRatings: initialRatings
        });
        setShowPrioritySection(false);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({ submit: 'Failed to save task. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setErrors({});
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const priorityScore = calculatePriorityScore();

  if (!isOpen) return null;

  const modalStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  };

  const contentStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3)'
  };

  const headerStyle = {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px'
  };

  const formStyle = {
    padding: '24px'
  };

  const fieldStyle = {
    marginBottom: '20px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#ffffff'
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: '80px',
    resize: 'vertical'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const errorStyle = {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px'
  };

  const prioritySectionStyle = {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px'
  };

  const priorityHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px'
  };

  const priorityTitleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  };

  const priorityActionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  };

  const scoreStyle = {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500'
  };

  const scoreValueStyle = {
    fontWeight: '700',
    color: '#4f46e5',
    fontSize: '16px'
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    borderColor: '#4f46e5'
  };

  const categoryStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginBottom: '12px'
  };

  const categoryInfoStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px'
  };

  const categoryNameStyle = {
    fontSize: '14px',
    fontWeight: '500'
  };

  const categoryWeightStyle = {
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '4px'
  };

  const sliderRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const sliderStyle = {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    outline: 'none',
    cursor: 'pointer'
  };

  const ratingValueStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    minWidth: '40px',
    textAlign: 'center'
  };

  const footerStyle = {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    color: '#6b7280'
  };

  const submitButtonStyle = {
    ...primaryButtonStyle,
    opacity: isSubmitting ? 0.6 : 1,
    cursor: isSubmitting ? 'not-allowed' : 'pointer'
  };

  return (
    <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && handleCancel()}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button style={closeButtonStyle} onClick={handleCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {/* Task Title */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="title">
              Task Title *
            </label>
            <input
              id="title"
              type="text"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.title ? '#dc2626' : '#d1d5db'
              }}
            />
            {errors.title && <div style={errorStyle}>{errors.title}</div>}
          </div>

          {/* Project */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="project">
              Project
            </label>
            <input
              id="project"
              type="text"
              placeholder="Project name..."
              value={formData.project}
              onChange={(e) => handleFieldChange('project', e.target.value)}
              style={inputStyle}
              list="projects-list"
            />
            <datalist id="projects-list">
              {savedProjects.map((project, index) => (
                <option key={index} value={project} />
              ))}
            </datalist>
          </div>

          {/* Goal/Description */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="goal">
              Goal/Description
            </label>
            <textarea
              id="goal"
              placeholder="Describe the goal..."
              value={formData.goal}
              onChange={(e) => handleFieldChange('goal', e.target.value)}
              style={textareaStyle}
            />
          </div>

          {/* Updates/Notes */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="update">
              Updates/Notes
            </label>
            <textarea
              id="update"
              placeholder="Add notes..."
              value={formData.update}
              onChange={(e) => handleFieldChange('update', e.target.value)}
              style={textareaStyle}
            />
          </div>

          {/* Status */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="status">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              style={selectStyle}
            >
              <option value="לא התחיל">לא התחיל</option>
              <option value="בעבודה">בעבודה</option>
              <option value="הושלם">הושלם</option>
              <option value="בהמתנה">בהמתנה</option>
              <option value="בוטל">בוטל</option>
            </select>
          </div>

          {/* Due Date */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="dueDate">
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleFieldChange('dueDate', e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.dueDate ? '#dc2626' : '#d1d5db'
              }}
            />
            {errors.dueDate && <div style={errorStyle}>{errors.dueDate}</div>}
          </div>

          {/* Link */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="link">
              Related Link
            </label>
            <input
              id="link"
              type="url"
              placeholder="https://example.com"
              value={formData.link}
              onChange={(e) => handleFieldChange('link', e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.link ? '#dc2626' : '#d1d5db'
              }}
            />
            {errors.link && <div style={errorStyle}>{errors.link}</div>}
          </div>

          {/* Priority Section */}
          <div style={prioritySectionStyle}>
            <div style={priorityHeaderStyle}>
              <h3 style={priorityTitleStyle}>Priority Rating</h3>
              <div style={priorityActionsStyle}>
                {priorityScore > 0 && (
                  <div style={scoreStyle}>
                    Score: <span style={scoreValueStyle}>{priorityScore}</span>
                  </div>
                )}
                {!showPrioritySection && (
                  <button
                    type="button"
                    onClick={() => setShowPrioritySection(true)}
                    style={buttonStyle}
                  >
                    + Show Ratings
                  </button>
                )}
                {showPrioritySection && (
                  <button
                    type="button"
                    onClick={() => setShowPrioritySection(false)}
                    style={buttonStyle}
                  >
                    - Hide Ratings
                  </button>
                )}
              </div>
            </div>

            {showPrioritySection && (
              <div>
                {priorityCategories.map(category => (
                  <div key={category.id} style={categoryStyle}>
                    <div style={categoryInfoStyle}>
                      <span 
                        style={{
                          ...categoryNameStyle,
                          color: category.color
                        }}
                      >
                        {category.english} ({category.hebrew})
                      </span>
                      <span style={categoryWeightStyle}>
                        Weight: {category.weight}%
                      </span>
                    </div>
                    <div style={sliderRowStyle}>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        value={formData.priorityRatings[category.id] || 0}
                        onChange={(e) => handlePriorityRatingChange(category.id, parseInt(e.target.value))}
                        style={{
                          ...sliderStyle,
                          accentColor: category.color
                        }}
                      />
                      <span style={ratingValueStyle}>
                        {formData.priorityRatings[category.id] || 0}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errors.submit && (
            <div style={{ ...errorStyle, marginBottom: '16px', fontSize: '14px' }}>
              {errors.submit}
            </div>
          )}
        </form>

        <div style={footerStyle}>
          <button
            type="button"
            onClick={handleCancel}
            style={cancelButtonStyle}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={submitButtonStyle}
          >
            {isSubmitting ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;