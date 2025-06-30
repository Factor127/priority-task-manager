// TaskField.jsx - Fixed with proper ID/label associations
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Calendar, Link, AlertCircle } from 'lucide-react';
import styles from './TaskField.module.css';

const TASK_TYPES = [
  { value: 'מנהלה', label: 'מנהלה (Administration)' },
  { value: 'שותפות', label: 'שותפות (Partnerships)' },
  { value: 'שיווק', label: 'שיווק (Marketing)' },
  { value: 'תשתית', label: 'תשתית (Infrastructure)' },
  { value: 'פיתוח עיסקי', label: 'פיתוח עיסקי (Business Development)' },
  { value: 'מחקר', label: 'מחקר (Research)' },
  { value: 'פיתוח', label: 'פיתוח (Development)' },
  { value: 'לקוח', label: 'לקוח (Client)' }
];

const TASK_STATUSES = [
  { value: 'לא התחיל', label: 'לא התחיל (Not Started)', color: '#6b7280' },
  { value: 'הערכה', label: 'הערכה (Assessment)', color: '#3b82f6' },
  { value: 'תיכנון', label: 'תיכנון (Planning)', color: '#8b5cf6' },
  { value: 'דחיפה', label: 'דחיפה (Push)', color: '#f59e0b' },
  { value: 'בעבודה', label: 'בעבודה (In Progress)', color: '#10b981' },
  { value: 'בהמתנה', label: 'בהמתנה (On Hold)', color: '#6b7280' },
  { value: 'האצלתי', label: 'האצלתי (Delegated)', color: '#84cc16' },
  { value: 'הושלם', label: 'הושלם (Completed)', color: '#059669' },
  { value: 'בוטל', label: 'בוטל (Cancelled)', color: '#dc2626' },
  { value: 'מושהה', label: 'מושהה (Paused)', color: '#f59e0b' }
];

const REPEAT_INTERVALS = [
  { value: '', label: 'No Repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

const TaskField = forwardRef(({
  type = 'text',
  name,
  value = '',
  onChange,
  onBlur,
  label,
  placeholder,
  required = false,
  error,
  disabled = false,
  className = '',
  autoComplete = 'off',
  rows = 3,
  maxRows = 8,
  options = [],
  suggestions = [],
  showIcon = false,
  helpText = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Generate unique ID for this field instance
  const fieldId = `field-${name}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle input changes
  const handleChange = (e) => {
    const newValue = e.target.value;
    console.log('TaskField handleChange called:', newValue, name);
    onChange?.(newValue, name);

    if (type === 'autocomplete' && suggestions.length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(newValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(newValue.length > 0 && filtered.length > 0);
    }

    if (type === 'textarea') {
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      }, 0);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    console.log('Selecting suggestion:', suggestion);
    onChange?.(suggestion, name);
    setShowSuggestions(false);
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (type === 'autocomplete' && suggestions.length > 0) {
      const currentValue = value || '';
      const filtered = currentValue 
        ? suggestions.filter(s => s.toLowerCase().includes(currentValue.toLowerCase()))
        : suggestions;
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleKeyDown = (e) => {
    if (type === 'autocomplete' && showSuggestions && e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getDateValue = () => {
    if (!value) return '';
    if (typeof value === 'string') {
      return value.includes('T') ? value.split('T')[0] : value;
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return '';
  };

  const handleDateChange = (e) => {
    onChange?.(e.target.value, name);
  };

  const getFieldClasses = () => {
    const classes = [styles.field];
    if (error) classes.push(styles.fieldError);
    if (disabled) classes.push(styles.fieldDisabled);
    if (isFocused) classes.push(styles.fieldFocused);
    if (type === 'textarea') classes.push(styles.textarea);
    return classes.join(' ');
  };

  // Common props with proper ID
  const commonProps = {
    ref: type === 'textarea' ? textareaRef : ref,
    id: fieldId, // ✅ Add unique ID
    name,
    value: type === 'date' ? getDateValue() : value,
    onChange: type === 'date' ? handleDateChange : handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    placeholder,
    disabled,
    required,
    autoComplete,
    className: getFieldClasses(),
    'aria-invalid': error ? 'true' : 'false',
    'aria-describedby': error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined,
    ...props
  };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return <textarea {...commonProps} rows={rows} />;

      case 'taskType':
        return (
          <select {...commonProps}>
            <option value="">Select Task Type</option>
            {TASK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        );

      case 'taskStatus':
        return (
          <select {...commonProps}>
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value} style={{ color: s.color }}>
                {s.label}
              </option>
            ))}
          </select>
        );

      case 'repeatInterval':
        return (
          <select {...commonProps}>
            {REPEAT_INTERVALS.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        );

      case 'date':
        return (
          <div className={styles.dateInputWrapper}>
            <input {...commonProps} type="date" />
            {showIcon && <Calendar className={styles.dateIcon} size={16} />}
          </div>
        );

      case 'url':
        return (
          <div className={styles.urlInputWrapper}>
            <input {...commonProps} type="url" />
            {showIcon && <Link className={styles.urlIcon} size={16} />}
          </div>
        );

      case 'autocomplete':
        return (
          <div className={styles.autocompleteWrapper}>
            <input {...commonProps} type="text" autoComplete="off" />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className={styles.suggestions} ref={suggestionsRef}>
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion}-${index}`}
                    type="button"
                    className={styles.suggestion}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSuggestionClick(suggestion);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return <input {...commonProps} type={type} />;
    }
  };

  return (
    <div className={`${styles.fieldGroup} ${className}`}>
      {label && (
        <label 
          htmlFor={fieldId} // ✅ Use fieldId instead of name
          className={`${styles.label} ${required ? styles.labelRequired : ''}`}
        >
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        {renderInput()}
      </div>

      {error && (
        <div 
          id={`${fieldId}-error`} // ✅ Use fieldId for error ID
          className={styles.error} 
          role="alert"
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {helpText && !error && (
        <div 
          id={`${fieldId}-help`} // ✅ Use fieldId for help ID
          className={styles.helpText}
        >
          {helpText}
        </div>
      )}
    </div>
  );
});

TaskField.displayName = 'TaskField';
export default TaskField;