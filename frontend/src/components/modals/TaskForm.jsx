import React, { useState, useEffect } from 'react';

const TaskForm = ({
  isOpen = false,
  onClose,
  onSubmit,
  onSave, // Alternative prop name
  onCancel, // Alternative prop name
  task = null,
  savedProjects = [],
  priorityCategories = [],
  className = ''
}) => {
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

  useEffect(() => {
    if (task) {
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
    } else {
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
    }
    setErrors({});
  }, [task, isOpen]);

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const isValidUrl = (string) => {
    if (!string) return true; // Empty is valid
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Task title must be at least 2 characters';
    }

    if (formData.link && !isValidUrl(formData.link)) {
      newErrors.link = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        ...formData,
        dueDate: formData.dueDate || null,
        isRepeating: Boolean(formData.isRepeating),
        updatedAt: new Date().toISOString(),
        ...(task ? {} : { createdAt: new Date().toISOString() })
      };

      // Handle different prop names
      if (onSave) {
        await onSave(taskData);
      } else if (onSubmit) {
        await onSubmit(taskData);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error submitting task:', error);
      setErrors({ submit: `Failed to save task: ${error.message || 'Please try again.'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      if (onCancel) {
        onCancel();
      } else if (onClose) {
        onClose();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const styles = {
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
      fontWeight: '600'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px'
    },
    formContent: {
      padding: '20px',
      maxHeight: '60vh',
      overflowY: 'auto'
    },
    fieldGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: '500',
      fontSize: '14px'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      resize: 'vertical',
      minHeight: '60px',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box',
      backgroundColor: 'white'
    },
    error: {
      color: '#dc2626',
      fontSize: '12px',
      marginTop: '4px'
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      padding: '20px',
      borderTop: '1px solid #e5e7eb'
    },
    button: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    primaryButton: {
      backgroundColor: '#4f46e5',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    }
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            style={styles.closeButton}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formContent}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Task Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                style={styles.input}
                placeholder="Enter task title..."
              />
              {errors.title && <div style={styles.error}>{errors.title}</div>}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Project</label>
              <input
                type="text"
                value={formData.project}
                onChange={(e) => handleInputChange('project', e.target.value)}
                style={styles.input}
                placeholder="Project name..."
                list="projects-list"
              />
              <datalist id="projects-list">
                {savedProjects.map((project, index) => (
                  <option key={index} value={project} />
                ))}
              </datalist>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Goal/Description</label>
              <textarea
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                style={styles.textarea}
                placeholder="Describe the goal..."
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Updates/Notes</label>
              <textarea
                value={formData.update}
                onChange={(e) => handleInputChange('update', e.target.value)}
                style={styles.textarea}
                placeholder="Add notes..."
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                style={styles.select}
              >
                <option value="לא התחיל">לא התחיל</option>
                <option value="בעבודה">בעבודה</option>
                <option value="הושלם">הושלם</option>
                <option value="מושהה">מושהה</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Due Date</label>
              <input
                type="date"
                value={formData.dueDate ? formData.dueDate.split('T')[0] : ''}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Link</label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => handleInputChange('link', e.target.value)}
                style={styles.input}
                placeholder="https://example.com"
              />
              {errors.link && <div style={styles.error}>{errors.link}</div>}
            </div>

            {errors.submit && (
              <div style={{...styles.error, backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px'}}>
                {errors.submit}
              </div>
            )}
          </div>

          <div style={styles.footer}>
            <button
              type="button"
              onClick={handleClose}
              style={{...styles.button, ...styles.secondaryButton}}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{...styles.button, ...styles.primaryButton}}
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting ? 'Saving...' : (
                <>
                  💾 {task ? 'Update Task' : 'Create Task'}
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