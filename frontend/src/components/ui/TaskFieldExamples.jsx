// TaskFieldExamples.jsx - Comprehensive usage examples
import React, { useState } from 'react';
import TaskField from './TaskField';

const TaskFieldExamples = () => {
  // Example form state
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
    priority: 3
  });

  const [errors, setErrors] = useState({});

  // Sample project suggestions for autocomplete
  const projectSuggestions = [
    'Personal Development',
    'Business Growth', 
    'Family',
    'Health',
    'Learning',
    'Finance',
    'Website Redesign',
    'Mobile App',
    'Marketing Campaign'
  ];

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

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }
    
    if (formData.link && !isValidUrl(formData.link)) {
      newErrors.link = 'Please enter a valid URL';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', formData);
      alert('Task created successfully!');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <h2>TaskField Component Examples</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Required Text Input */}
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

        {/* Project Autocomplete */}
        <TaskField
          type="autocomplete"
          name="project"
          label="Project"
          placeholder="Start typing project name..."
          value={formData.project}
          onChange={handleFieldChange}
          suggestions={projectSuggestions}
          helpText="Choose an existing project or create a new one"
        />

        {/* Auto-resize Textarea */}
        <TaskField
          type="textarea"
          name="goal"
          label="Goal/Description"
          placeholder="Describe the goal or objective..."
          value={formData.goal}
          onChange={handleFieldChange}
          rows={3}
          maxRows={8}
          helpText="Detailed description of what you want to achieve"
        />

        {/* Update Notes Textarea */}
        <TaskField
          type="textarea"
          name="update"
          label="Updates/Notes"
          placeholder="Add progress updates or notes..."
          value={formData.update}
          onChange={handleFieldChange}
          rows={2}
          maxRows={6}
        />

        {/* Hebrew Task Type Select */}
        <TaskField
          type="taskType"
          name="type"
          label="Task Type"
          value={formData.type}
          onChange={handleFieldChange}
          helpText="Select the category that best describes this task"
        />

        {/* Hebrew Status Select */}
        <TaskField
          type="taskStatus"
          name="status"
          label="Status"
          value={formData.status}
          onChange={handleFieldChange}
          required
        />

        {/* Date Input */}
        <TaskField
          type="date"
          name="dueDate"
          label="Due Date"
          value={formData.dueDate}
          onChange={handleFieldChange}
          showIcon
          helpText="When should this task be completed?"
        />

        {/* Checkbox for Repeating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="checkbox"
            id="isRepeating"
            checked={formData.isRepeating}
            onChange={(e) => handleFieldChange(e.target.checked, 'isRepeating')}
          />
          <label htmlFor="isRepeating">Repeating Task</label>
        </div>

        {/* Conditional Repeat Interval */}
        {formData.isRepeating && (
          <TaskField
            type="repeatInterval"
            name="repeatInterval"
            label="Repeat Interval"
            value={formData.repeatInterval}
            onChange={handleFieldChange}
            required={formData.isRepeating}
          />
        )}

        {/* URL Input */}
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

        {/* Number Input for Priority */}
        <TaskField
          type="number"
          name="priority"
          label="Base Priority"
          value={formData.priority}
          onChange={handleFieldChange}
          min={0}
          max={5}
          step={1}
          helpText="Initial priority level (0-5)"
        />

        {/* Submit Button */}
        <button 
          type="submit"
          style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            marginTop: '1rem',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
        >
          Create Task
        </button>
      </form>

      {/* Form Data Preview */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f8fafc', 
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <h3>Form Data Preview:</h3>
        <pre style={{ 
          fontSize: '0.75rem', 
          overflow: 'auto',
          maxHeight: '200px',
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.25rem',
          border: '1px solid #e2e8f0'
        }}>
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>

      {/* Field Type Examples */}
      <div style={{ marginTop: '2rem' }}>
        <h3>Additional Field Type Examples</h3>
        
        {/* Disabled Field */}
        <TaskField
          type="text"
          name="disabled"
          label="Disabled Field"
          value="This field is disabled"
          disabled
          helpText="Example of a disabled field"
        />

        {/* Field with Error */}
        <TaskField
          type="email"
          name="email"
          label="Email"
          value="invalid-email"
          error="Please enter a valid email address"
          helpText="Example field showing error state"
        />

        {/* Custom Select with Options */}
        <TaskField
          type="select"
          name="priority_level"
          label="Priority Level"
          placeholder="Select priority..."
          options={[
            { value: 'low', label: 'Low Priority', color: '#6b7280' },
            { value: 'medium', label: 'Medium Priority', color: '#f59e0b' },
            { value: 'high', label: 'High Priority', color: '#ef4444' },
            { value: 'urgent', label: 'Urgent', color: '#dc2626' }
          ]}
          helpText="Custom select with colored options"
        />

        {/* Password Field */}
        <TaskField
          type="password"
          name="password"
          label="Password"
          placeholder="Enter password..."
          helpText="Example password field"
        />

        {/* Search Field */}
        <TaskField
          type="search"
          name="search"
          label="Search Tasks"
          placeholder="Search for tasks..."
          helpText="Example search input"
        />
      </div>

      {/* Usage Instructions */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        backgroundColor: '#eff6ff', 
        borderRadius: '0.5rem',
        border: '1px solid #bfdbfe'
      }}>
        <h3 style={{ color: '#1e40af', marginTop: 0 }}>TaskField Usage Guide</h3>
        
        <h4>Supported Field Types:</h4>
        <ul style={{ marginBottom: '1rem' }}>
          <li><strong>text</strong> - Basic text input</li>
          <li><strong>textarea</strong> - Auto-resizing text area</li>
          <li><strong>select</strong> - Dropdown with custom options</li>
          <li><strong>taskType</strong> - Hebrew task types dropdown</li>
          <li><strong>taskStatus</strong> - Hebrew status dropdown with colors</li>
          <li><strong>repeatInterval</strong> - Repeat frequency dropdown</li>
          <li><strong>date</strong> - Date picker with optional icon</li>
          <li><strong>url</strong> - URL input with validation and icon</li>
          <li><strong>number</strong> - Number input with min/max</li>
          <li><strong>autocomplete</strong> - Text input with suggestions</li>
          <li><strong>email, password, search</strong> - Standard HTML5 types</li>
        </ul>

        <h4>Key Features:</h4>
        <ul style={{ marginBottom: '1rem' }}>
          <li>Auto-resizing textareas with configurable min/max rows</li>
          <li>Project autocomplete with keyboard navigation</li>
          <li>Hebrew text support and RTL layout</li>
          <li>Built-in validation and error states</li>
          <li>Accessible with ARIA labels and keyboard support</li>
          <li>Mobile-responsive with touch-friendly inputs</li>
          <li>Dark mode and high contrast support</li>
          <li>Consistent styling across all field types</li>
        </ul>

        <h4>Required Props:</h4>
        <ul style={{ marginBottom: '1rem' }}>
          <li><code>name</code> - Field identifier</li>
          <li><code>onChange</code> - Change handler function</li>
        </ul>

        <h4>Common Props:</h4>
        <ul>
          <li><code>type</code> - Field type (default: "text")</li>
          <li><code>label</code> - Field label</li>
          <li><code>value</code> - Current value</li>
          <li><code>placeholder</code> - Placeholder text</li>
          <li><code>required</code> - Required field indicator</li>
          <li><code>error</code> - Error message to display</li>
          <li><code>helpText</code> - Help text below field</li>
          <li><code>disabled</code> - Disable the field</li>
          <li><code>suggestions</code> - Array for autocomplete</li>
          <li><code>options</code> - Array for select dropdowns</li>
        </ul>
      </div>
    </div>
  );
};

export default TaskFieldExamples;