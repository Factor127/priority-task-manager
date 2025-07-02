// SettingsModal.jsx - Complete Implementation
import React, { useState, useEffect } from 'react';
import { X, Download, Upload, RotateCcw, Settings } from 'lucide-react';
import styles from './SettingsModal.module.css';
import generateUniqueId from '../../utils/idGenerator';

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  priorityCategories = [], 
  onUpdateCategories,
  onExportData,
  onImportData,
  onResetData,
  taskStats = { total: 0, completed: 0, active: 0, overdue: 0 }
}) => {
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ 
    english: '', 
    hebrew: '', 
    weight: 10, 
    color: '#4f46e5' 
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showDataCleanup, setShowDataCleanup] = useState(false);
  // Default color palette
  const colorPalette = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', 
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', 
    '#ec4899', '#f43f5e', '#6b7280', '#374151', '#111827'
  ];

  // Initialize categories from props
  useEffect(() => {
    if (priorityCategories && priorityCategories.length > 0) {
      setCategories([...priorityCategories]);
    } else {
      const defaultCategories = [
        { id: 'income', english: 'Income/Revenue', hebrew: 'הכנסה לשוטף', weight: 40, color: '#10B981' },
        { id: 'home', english: 'Home Management', hebrew: 'ניהול בית', weight: 15, color: '#3B82F6' },
        { id: 'plan', english: '5-Year Plan', hebrew: 'תוכנית חומש', weight: 5, color: '#8B5CF6' },
        { id: 'social', english: 'Social', hebrew: 'סוציאל', weight: 20, color: '#F59E0B' },
        { id: 'relationship', english: 'Relationship', hebrew: 'זוגיות', weight: 5, color: '#EF4444' },
        { id: 'personal', english: 'Personal', hebrew: 'עצמי', weight: 20, color: '#06B6D4' },
        { id: 'children', english: 'Children', hebrew: 'ילדים', weight: 30, color: '#84CC16' }
      ];
      setCategories(defaultCategories);
    }
  }, [priorityCategories]);

  // Category management functions
  const handleCategoryChange = (id, field, value) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
    setHasChanges(true);
  };

  const handleAddCategory = () => {
    if (newCategory.english.trim()) {
      const category = {
        id: generateUniqueId().toString(),
        english: newCategory.english.trim(),
        hebrew: newCategory.hebrew.trim() || newCategory.english.trim(),
        weight: Math.max(0, Math.min(100, newCategory.weight)),
        color: newCategory.color
      };
      setCategories(prev => [...prev, category]);
      setNewCategory({ english: '', hebrew: '', weight: 10, color: '#4f46e5' });
      setHasChanges(true);
    }
  };

  const handleDeleteCategory = (id) => {
    if (categories.length > 1) {
      setCategories(prev => prev.filter(cat => cat.id !== id));
      setHasChanges(true);
    }
  };

  const handleResetCategories = () => {
    if (window.confirm('Reset all categories to defaults? This will remove any custom categories.')) {
      const defaultCategories = [
        { id: 'income', english: 'Income/Revenue', hebrew: 'הכנסה לשוטף', weight: 40, color: '#10B981' },
        { id: 'home', english: 'Home Management', hebrew: 'ניהול בית', weight: 15, color: '#3B82F6' },
        { id: 'plan', english: '5-Year Plan', hebrew: 'תוכנית חומש', weight: 5, color: '#8B5CF6' },
        { id: 'social', english: 'Social', hebrew: 'סוציאל', weight: 20, color: '#F59E0B' },
        { id: 'relationship', english: 'Relationship', hebrew: 'זוגיות', weight: 5, color: '#EF4444' },
        { id: 'personal', english: 'Personal', hebrew: 'עצמי', weight: 20, color: '#06B6D4' },
        { id: 'children', english: 'Children', hebrew: 'ילדים', weight: 30, color: '#84CC16' }
      ];
      setCategories(defaultCategories);
      setHasChanges(true);
    }
  };

  const handleSaveChanges = () => {
    if (onUpdateCategories) {
      onUpdateCategories(categories);
    }
    setHasChanges(false);
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Close without saving?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // File handling
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file && onImportData) {
      onImportData(file);
    }
    event.target.value = '';
  };

  const handleExportData = () => {
    if (onExportData) {
      onExportData();
    }
  };

  const handleResetData = () => {
    const message = `This will permanently delete ALL your data including:
    
• ${taskStats.total} tasks
• All priority categories
• All saved projects
• All progress data

This action cannot be undone. Are you sure?`;

    if (window.confirm(message)) {
      if (onResetData) {
        onResetData();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            ⚙️ Settings
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <button 
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              background: activeTab === 'categories' ? '#ffffff' : 'transparent',
              color: activeTab === 'categories' ? '#4f46e5' : '#6b7280',
              fontSize: '14px',
              fontWeight: activeTab === 'categories' ? '600' : '500',
              cursor: 'pointer',
              borderBottom: activeTab === 'categories' ? '2px solid #4f46e5' : 'none',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setActiveTab('categories')}
          >
            🏷️ Priority Categories
          </button>
          <button 
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              background: activeTab === 'data' ? '#ffffff' : 'transparent',
              color: activeTab === 'data' ? '#4f46e5' : '#6b7280',
              fontSize: '14px',
              fontWeight: activeTab === 'data' ? '600' : '500',
              cursor: 'pointer',
              borderBottom: activeTab === 'data' ? '2px solid #4f46e5' : 'none',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setActiveTab('data')}
          >
            💾 Data Management
          </button>
          <button 
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              background: activeTab === 'stats' ? '#ffffff' : 'transparent',
              color: activeTab === 'stats' ? '#4f46e5' : '#6b7280',
              fontSize: '14px',
              fontWeight: activeTab === 'stats' ? '600' : '500',
              cursor: 'pointer',
              borderBottom: activeTab === 'stats' ? '2px solid #4f46e5' : 'none',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setActiveTab('stats')}
          >
            📊 Statistics
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflow: 'auto'
        }}>
          
          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>Priority Categories</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  Customize the categories used for priority scoring. Total weight: {categories.reduce((sum, cat) => sum + cat.weight, 0)}%
                </p>
              </div>

              {/* Existing Categories */}
              <div style={{ marginBottom: '24px' }}>
                {categories.map((category) => (
                  <div key={category.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    backgroundColor: '#f9fafb'
                  }}>
                    {/* Color */}
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: category.color,
                          cursor: 'pointer',
                          border: '2px solid white',
                          boxShadow: '0 0 0 1px #e5e7eb'
                        }}
                        onClick={() => setShowColorPicker(showColorPicker === category.id ? null : category.id)}
                      />
                      {showColorPicker === category.id && (
                        <div style={{
                          position: 'absolute',
                          top: '30px',
                          left: 0,
                          zIndex: 10,
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: '4px',
                            width: '120px'
                          }}>
                            {colorPalette.map(color => (
                              <div
                                key={color}
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  backgroundColor: color,
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  border: category.color === color ? '2px solid #4f46e5' : '1px solid #e5e7eb'
                                }}
                                onClick={() => {
                                  handleCategoryChange(category.id, 'color', color);
                                  setShowColorPicker(null);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* English Name */}
                    <input
                      type="text"
                      value={category.english}
                      onChange={(e) => handleCategoryChange(category.id, 'english', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      placeholder="English name"
                    />

                    {/* Hebrew Name */}
                    <input
                      type="text"
                      value={category.hebrew}
                      onChange={(e) => handleCategoryChange(category.id, 'hebrew', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        direction: 'rtl'
                      }}
                      placeholder="Hebrew name"
                    />

                    {/* Weight */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        value={category.weight}
                        onChange={(e) => handleCategoryChange(category.id, 'weight', parseInt(e.target.value) || 0)}
                        style={{
                          width: '60px',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                          textAlign: 'center'
                        }}
                        min="0"
                        max="100"
                      />
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>%</span>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={categories.length <= 1}
                      style={{
                        padding: '8px',
                        border: 'none',
                        backgroundColor: categories.length <= 1 ? '#f3f4f6' : '#fee2e2',
                        color: categories.length <= 1 ? '#9ca3af' : '#dc2626',
                        borderRadius: '4px',
                        cursor: categories.length <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                      title={categories.length <= 1 ? 'Cannot delete the last category' : 'Delete category'}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Category */}
              <div style={{
                padding: '16px',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Add New Category</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      English Name
                    </label>
                    <input
                      type="text"
                      value={newCategory.english}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, english: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      placeholder="e.g., Business"
                    />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Hebrew Name
                    </label>
                    <input
                      type="text"
                      value={newCategory.hebrew}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, hebrew: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        direction: 'rtl'
                      }}
                      placeholder="עסקים"
                    />
                  </div>
                  
                  <div style={{ minWidth: '80px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Weight %
                    </label>
                    <input
                      type="number"
                      value={newCategory.weight}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        textAlign: 'center'
                      }}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCategory.english.trim()}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: !newCategory.english.trim() ? '#f3f4f6' : '#4f46e5',
                      color: !newCategory.english.trim() ? '#9ca3af' : 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: !newCategory.english.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ➕ Add
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleResetCategories}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🔄 Reset to Defaults
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={!hasChanges}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: !hasChanges ? '#f3f4f6' : '#10b981',
                    color: !hasChanges ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: !hasChanges ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  💾 Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>Data Management</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  Export, import, or reset your task data.
                </p>
              </div>

              {/* Export Section */}
              <div style={{
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '20px',
                backgroundColor: '#f9fafb'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>📤 Export Data</h4>
                <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
                  Download a complete backup of all your tasks, categories, and settings.
                </p>
                <button
                  onClick={handleExportData}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  📥 Download Backup
                </button>
              </div>

              {/* Import Section */}
              <div style={{
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '20px',
                backgroundColor: '#f9fafb'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>📥 Import Data</h4>
                <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
                  Restore data from a previously exported backup file.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  style={{
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    width: '100%',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Reset Section */}
              <div style={{
                padding: '20px',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                backgroundColor: '#fef2f2'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#dc2626' }}>⚠️ Reset All Data</h4>
                <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
                  Permanently delete all tasks, categories, and settings. This action cannot be undone.
                </p>
                <button
                  onClick={handleResetData}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  🗑️ Reset All Data
                </button>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>Task Statistics</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  Overview of your task management data.
                </p>
              </div>

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }}>
                    {taskStats.total}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Tasks</div>
                </div>

                <div style={{
                  padding: '20px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#15803d' }}>
                    {taskStats.completed}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Completed</div>
                </div>

                <div style={{
                  padding: '20px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d97706' }}>
                    {taskStats.active}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Active</div>
                </div>

                <div style={{
                  padding: '20px',
                  backgroundColor: taskStats.overdue > 0 ? '#fef2f2' : '#f3f4f6',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: taskStats.overdue > 0 ? '#dc2626' : '#6b7280' 
                  }}>
                    {taskStats.overdue}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Overdue</div>
                </div>
              </div>

              {/* Category Stats */}
              <div style={{
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>Priority Categories</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categories.map(category => (
                    <div key={category.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: category.color
                        }} />
                        <span style={{ fontSize: '14px', color: '#374151' }}>
                          {category.english} ({category.hebrew})
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                        {category.weight}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Priority Task Manager v2.0
          </div>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;