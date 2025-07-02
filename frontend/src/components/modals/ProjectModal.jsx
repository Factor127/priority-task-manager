// src/components/modals/ProjectModal.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import styles from './ProjectModal.module.css';

const ProjectModal = ({ isOpen, onClose, projectToEdit = null }) => {
    const { createProject, updateProject } = useProjects();
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priority: 50,
        color: '#4f46e5'
    });
    
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Color options for projects
    const colorOptions = [
        { value: '#4f46e5', label: 'כחול', name: 'blue' },
        { value: '#10b981', label: 'ירוק', name: 'green' },
        { value: '#f59e0b', label: 'כתום', name: 'orange' },
        { value: '#ef4444', label: 'אדום', name: 'red' },
        { value: '#8b5cf6', label: 'סגול', name: 'purple' },
        { value: '#06b6d4', label: 'טורקיז', name: 'cyan' },
        { value: '#84cc16', label: 'ליים', name: 'lime' },
        { value: '#f97316', label: 'כתום כהה', name: 'dark-orange' },
        { value: '#6b7280', label: 'אפור', name: 'gray' },
        { value: '#ec4899', label: 'ורוד', name: 'pink' }
    ];

    // Reset form when modal opens/closes or project changes
    useEffect(() => {
        if (isOpen) {
            if (projectToEdit) {
                setFormData({
                    name: projectToEdit.name,
                    description: projectToEdit.description || '',
                    priority: projectToEdit.priority,
                    color: projectToEdit.color
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    priority: 50,
                    color: '#4f46e5'
                });
            }
            setErrors({});
        }
    }, [isOpen, projectToEdit]);

    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'שם הפרויקט נדרש';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'שם הפרויקט חייב להכיל לפחות 2 תווים';
        } else if (formData.name.trim().length > 50) {
            newErrors.name = 'שם הפרויקט לא יכול להכיל יותר מ-50 תווים';
        }

        if (formData.description && formData.description.length > 200) {
            newErrors.description = 'התיאור לא יכול להכיל יותר מ-200 תווים';
        }

        if (formData.priority < 1 || formData.priority > 100) {
            newErrors.priority = 'עדיפות חייבת להיות בין 1 ל-100';
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
            const projectData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                priority: parseInt(formData.priority),
                color: formData.color
            };

            if (projectToEdit) {
                updateProject(projectToEdit.id, projectData);
            } else {
                createProject(projectData);
            }

            onClose();
        } catch (error) {
            console.error('Error saving project:', error);
            setErrors({ submit: 'שגיאה בשמירת הפרויקט' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close
    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && !isSubmitting) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                        {projectToEdit ? 'עריכת פרויקט' : 'פרויקט חדש'}
                    </h3>
                    <button
                        className={styles.closeBtn}
                        onClick={handleClose}
                        disabled={isSubmitting}
                        aria-label="סגור"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Project Name */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                            שם הפרויקט *
                        </label>
                        <input
                            type="text"
                            className={`${styles.formInput} ${errors.name ? styles.error : ''}`}
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="הכנס שם פרויקט..."
                            maxLength={50}
                            disabled={isSubmitting}
                            required
                        />
                        {errors.name && (
                            <span className={styles.errorMessage}>{errors.name}</span>
                        )}
                    </div>

                    {/* Project Description */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                            תיאור הפרויקט
                        </label>
                        <textarea
                            className={`${styles.formTextarea} ${errors.description ? styles.error : ''}`}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="תיאור קצר של הפרויקט (אופציונלי)..."
                            rows={3}
                            maxLength={200}
                            disabled={isSubmitting}
                        />
                        <div className={styles.charCount}>
                            {formData.description.length}/200
                        </div>
                        {errors.description && (
                            <span className={styles.errorMessage}>{errors.description}</span>
                        )}
                    </div>

                    {/* Project Priority */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                            עדיפות פרויקט (1-100)
                        </label>
                        <div className={styles.priorityContainer}>
                            <input
                                type="range"
                                className={styles.prioritySlider}
                                min="1"
                                max="100"
                                value={formData.priority}
                                onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                                disabled={isSubmitting}
                            />
                            <input
                                type="number"
                                className={`${styles.priorityInput} ${errors.priority ? styles.error : ''}`}
                                value={formData.priority}
                                onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 1)}
                                min="1"
                                max="100"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className={styles.priorityDescription}>
                            עדיפות גבוהה יותר תציב את הפרויקט ראשון ברשימה
                        </div>
                        {errors.priority && (
                            <span className={styles.errorMessage}>{errors.priority}</span>
                        )}
                    </div>

                    {/* Project Color */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                            צבע זיהוי
                        </label>
                        <div className={styles.colorGrid}>
                            {colorOptions.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    className={`${styles.colorOption} ${
                                        formData.color === color.value ? styles.selected : ''
                                    }`}
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => handleInputChange('color', color.value)}
                                    title={color.label}
                                    disabled={isSubmitting}
                                    aria-label={`בחר צבע ${color.label}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Submit Error */}
                    {errors.submit && (
                        <div className={styles.submitError}>
                            {errors.submit}
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'שומר...' : projectToEdit ? 'עדכן פרויקט' : 'צור פרויקט'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectModal;