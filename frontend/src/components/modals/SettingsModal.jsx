// SettingsModal.jsx - No External Icons Version
import React, { useState, useEffect } from 'react';

// Simple icon components to replace Lucide React
const X = () => <span>✕</span>;
const Plus = () => <span>+</span>;
const Trash2 = () => <span>🗑️</span>;
const RotateCcw = () => <span>🔄</span>;
const Download = () => <span>📤</span>;
const Upload = () => <span>📥</span>;
const Save = () => <span>💾</span>;
const AlertCircle = () => <span>⚠️</span>;

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  priorityCategories = [], 
  onUpdateCategories,
  onExportData,
  onImportData,
  onResetData,
  taskStats = { total: 0, completed: 0, active: 0 }
}) => {
  console.log('🔍 SettingsModal render:', { isOpen, priorityCategories, taskStats });

  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ english: '', hebrew: '', weight: 10, color: '#4f46e5' });
  const [hasChanges, setHasChanges] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(null);

  // Default color palette
  const colorPalette = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', 
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', 
    '#ec4899', '#f43f5e', '#6b7280', '#374151', '#111827'
  ];

  // Initialize categories from props
  useEffect(() => {
    console.log('🔍 Categories effect:', priorityCategories);
    if (priorityCategories && priorityCategories.length > 0) {
      setCategories([...priorityCategories]);
    } else {
      // Set default categories if none provided
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
        id: Date.now().toString(),
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
    console.log('💾 Saving categories:', categories);
    if (onUpdateCategories) {
      onUpdateCategories(categories);
    }
    setHasChanges(false);
  };

  const handleClose = () => {
    console.log('🚪 Closing modal, hasChanges:', hasChanges);
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Close without saving?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Calculate total weight
  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);

  if (!isOpen) {
    console.log('❌ Modal not open, not rendering');
    return null;
  }

  console.log('✅ Rendering SettingsModal');

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
      }} 
      onClick={handleClose}
    >
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>⚙️ Settings</h2>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Customize your Priority Task Manager</p>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px'
              }}
            >
              <X />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          background: '#f8fafc'
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
          {activeTab === 'categories' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>Priority Categories</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  Customize the categories used for priority scoring. Total weight: <strong>{totalWeight}%</strong>
                  {totalWeight !== 100 && (
                    <span style={{ color: '#ef4444', marginLeft: '8px' }}>
                      (Recommended: 100%)
                    </span>
                  )}
                </p>
              </div>

              {/* Existing Categories */}
              <div style={{ marginBottom: '24px' }}>
                {categories.map((category) => (
                  <div key={category.id} style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr 100px 60px 40px' : '1fr',
                      gap: '12px', 
                      alignItems: 'center' 
                    }}>
                      <input
                        type="text"
                        value={category.english}
                        onChange={(e) => handleCategoryChange(category.id, 'english', e.target.value)}
                        placeholder="English name"
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <input
                        type="text"
                        value={category.hebrew}
                        onChange={(e) => handleCategoryChange(category.id, 'hebrew', e.target.value)}
                        placeholder="Hebrew name"
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          direction: 'rtl'
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={category.weight}
                          onChange={(e) => handleCategoryChange(category.id, 'weight', parseInt(e.target.value) || 0)}
                          min="0"
                          max="100"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            width: '70px'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>%</span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setShowColorPicker(showColorPicker === category.id ? null : category.id)}
                          style={{
                            width: '40px',
                            height: '32px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '6px',
                            backgroundColor: category.color,
                            cursor: 'pointer'
                          }}
                        />
                        {showColorPicker === category.id && (
                          <div style={{
                            position: 'absolute',
                            top: '36px',
                            right: 0,
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                            zIndex: 10
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                              {colorPalette.map(color => (
                                <button
                                  key={color}
                                  onClick={() => {
                                    handleCategoryChange(category.id, 'color', color);
                                    setShowColorPicker(null);
                                  }}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: color,
                                    border: category.color === color ? '2px solid #1f2937' : '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={categories.length <= 1}
                        style={{
                          background: categories.length <= 1 ? '#f3f4f6' : '#fee2e2',
                          color: categories.length <= 1 ? '#9ca3af' : '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px',
                          cursor: categories.length <= 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Category */}
              <div style={{
                background: '#eff6ff',
                border: '2px dashed #3b82f6',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#1e40af' }}>Add New Category</h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr 100px 60px 80px' : '1fr',
                  gap: '12px', 
                  alignItems: 'end' 
                }}>
                  <input
                    type="text"
                    value={newCategory.english}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, english: e.target.value }))}
                    placeholder="English name"
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #3b82f6',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="text"
                    value={newCategory.hebrew}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, hebrew: e.target.value }))}
                    placeholder="Hebrew name"
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #3b82f6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      direction: 'rtl'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      value={newCategory.weight}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                      min="0"
                      max="100"
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #3b82f6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '70px'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#1e40af' }}>%</span>
                  </div>
                  <button
                    onClick={() => setShowColorPicker(showColorPicker === 'new' ? null : 'new')}
                    style={{
                      width: '40px',
                      height: '32px',
                      border: '2px solid #3b82f6',
                      borderRadius: '6px',
                      backgroundColor: newCategory.color,
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCategory.english.trim()}
                    style={{
                      background: newCategory.english.trim() ? '#3b82f6' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      cursor: newCategory.english.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    <Plus />
                    Add
                  </button>
                </div>
                {showColorPicker === 'new' && (
                  <div style={{
                    marginTop: '12px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px' }}>
                      {colorPalette.map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            setNewCategory(prev => ({ ...prev, color }));
                            setShowColorPicker(null);
                          }}
                          style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: color,
                            border: newCategory.color === color ? '2px solid #1f2937' : '1px solid #e5e7eb',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Button */}
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button
                  onClick={handleResetCategories}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px'
                  }}
                >
                  <RotateCcw />
                  Reset to Defaults
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Data Management</h3>
              
              {/* Export Section */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#166534' }}>📤 Export Data</h4>
                <p style={{ margin: '0 0 16px 0', color: '#15803d', fontSize: '14px' }}>
                  Download your tasks and settings as a backup file
                </p>
                <button
                  onClick={() => {
                    console.log('📤 Export clicked');
                    onExportData && onExportData();
                  }}
                  style={{
                    background: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <Download />
                  Export All Data
                </button>
              </div>

              {/* Import Section */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>📥 Import Data</h4>
                <p style={{ margin: '0 0 16px 0', color: '#2563eb', fontSize: '14px' }}>
                  Restore from a previously exported backup file
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    console.log('📥 Import file selected');
                    const file = e.target.files[0];
                    if (file) {
                      onImportData && onImportData(file);
                      e.target.value = '';
                    }
                  }}
                  style={{ display: 'none' }}
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <Upload />
                  Choose Backup File
                </label>
              </div>

              {/* Reset Section */}
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>⚠️ Reset All Data</h4>
                <p style={{ margin: '0 0 16px 0', color: '#ef4444', fontSize: '14px' }}>
                  Permanently delete all tasks and reset to default settings
                </p>
                <button
                  onClick={() => {
                    console.log('🗑️ Reset clicked');
                    if (window.confirm('Are you sure? This will delete ALL your tasks and cannot be undone!')) {
                      if (window.confirm('Really delete everything? This action is permanent!')) {
                        onResetData && onResetData();
                      }
                    }
                  }}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <AlertCircle />
                  Reset Everything
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h3 style={{ margin: '0 0 24px 0', color: '#1f2937' }}>📊 Your Statistics</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {/* User Progress */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>🏆 Progress</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Level {1}
                  </div>
                  <div style={{ opacity: 0.9 }}>
                    {0} points
                  </div>
                </div>

                {/* Task Stats */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>📋 Tasks</h4>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4f46e5', marginBottom: '4px' }}>
                    {taskStats.total}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Total Tasks
                  </div>
                </div>

                {/* Completion Rate */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#166534' }}>✅ Completed</h4>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a', marginBottom: '4px' }}>
                    {taskStats.completed}
                  </div>
                  <div style={{ fontSize: '14px', color: '#15803d' }}>
                    {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}% Complete
                  </div>
                </div>

                {/* Active Tasks */}
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#92400e' }}>⚡ Active</h4>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d97706', marginBottom: '4px' }}>
                    {taskStats.active}
                  </div>
                  <div style={{ fontSize: '14px', color: '#92400e' }}>
                    In Progress
                  </div>
                </div>
              </div>

              {/* Categories Overview */}
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>🏷️ Priority Categories</h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {categories.map(category => (
                    <div key={category.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          backgroundColor: category.color
                        }} />
                        <span style={{ fontWeight: '500', color: '#1f2937' }}>
                          {category.english}
                        </span>
                        <span style={{ fontSize: '14px', color: '#6b7280', direction: 'rtl' }}>
                          {category.hebrew}
                        </span>
                      </div>
                      <span style={{ fontWeight: '600', color: '#4f46e5' }}>
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
          padding: '20px 24px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            {hasChanges && (
              <span style={{ color: '#f59e0b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle />
                You have unsaved changes
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleClose}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            {hasChanges && (
              <button
                onClick={handleSaveChanges}
                style={{
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Save />
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;