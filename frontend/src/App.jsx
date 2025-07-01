import './styles/globals.css';
import { ToastProvider } from './hooks/useToast';
import ToastContainer from './components/ui/ToastContainer';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AppProvider, useApp } from './context/AppContext';
import TaskForm from './components/modals/TaskForm';
import FileManager from './components/modals/FileManager';

// Define AUTOSAVE_STATES locally as a fallback
const LOCAL_AUTOSAVE_STATES = {
  IDLE: 'idle',
  SAVING: 'saving', 
  SAVED: 'saved',
  ERROR: 'error'
};

//import SettingsModal from './components/modals/SettingsModal';
const SettingsModal = ({ isOpen, onClose }) => {
  console.log('🧪 MEGA TEST MODAL: isOpen =', isOpen);
  
  // Use React Portal to escape any stacking context issues
  const [portalContainer, setPortalContainer] = React.useState(null);
  
  React.useEffect(() => {
    let container = document.getElementById('modal-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'modal-portal';
      container.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 999999 !important;
        pointer-events: none !important;
      `;
      document.body.appendChild(container);
    }
    setPortalContainer(container);
  }, []);
  
  if (!portalContainer) return null;
  
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'red',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      fontSize: '24px',
      color: 'white',
      fontWeight: 'bold',
      pointerEvents: 'all'
    }}>
      <div style={{
        background: 'blue',
        padding: '60px',
        borderRadius: '12px',
        textAlign: 'center',
        border: '5px solid yellow'
      }}>
        <h1 style={{color: 'white', fontSize: '36px'}}>🚨 PORTAL MODAL WORKING! 🚨</h1>
        <p style={{color: 'white', fontSize: '20px'}}>This uses React Portal</p>
        <button 
          onClick={onClose}
          style={{
            padding: '20px 40px',
            background: 'green',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          CLOSE PORTAL MODAL
        </button>
      </div>
    </div>,
    portalContainer
  );
};

// Enhanced Autosave Indicator Component - FIXED
const AutosaveIndicator = () => {
  const context = useApp();
  
  // Use local fallback if AUTOSAVE_STATES is not available from context
    const AUTOSAVE_STATES = {
    IDLE: 'idle',
    SAVING: 'saving', 
    SAVED: 'saved',
    ERROR: 'error'
  };
    const overallSaveState = context?.overallSaveState || AUTOSAVE_STATES.IDLE;


  const getIndicatorContent = () => {
    switch (overallSaveState) {
      case AUTOSAVE_STATES.SAVING:
        return {
          text: 'Saving...',
          color: '#4f46e5',
          background: '#eff6ff',
          borderColor: '#4f46e5',
          showDot: true,
          pulsing: true
        };
      case AUTOSAVE_STATES.SAVED:
        return {
          text: 'Saved',
          color: '#10b981',
          background: '#f0fdf4',
          borderColor: '#10b981',
          showDot: true,
          pulsing: false
        };
      case AUTOSAVE_STATES.ERROR:
        return {
          text: 'Save Error',
          color: '#ef4444',
          background: '#fef2f2',
          borderColor: '#ef4444',
          showDot: true,
          pulsing: false
        };
      default:
        return {
          text: 'Auto-save',
          color: '#6b7280',
          background: '#f9fafb',
          borderColor: '#e5e7eb',
          showDot: true,
          pulsing: false
        };
    }
  };

  const { text, color, background, borderColor, showDot, pulsing } = getIndicatorContent();

  return (
     <div style={{
      fontSize: '12px',
      color: color,
      background: background,
      padding: '4px 8px',
      borderRadius: '12px',
      border: `1px solid ${borderColor}`,
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      {showDot && (
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: color,
          animation: pulsing ? 'pulse 1.5s infinite' : 'none'
        }}></div>
      )}
      <span>{text}</span>
    </div>
  );
};

// Header Component
const Header = ({ onCreateTask, onShowFiles, onShowSettings, onForceSave }) => {
  const headerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px',
    color: 'white'
  };

  const logoStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const userStatsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '10px 15px',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)'
  };

  const buttonStyle = {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    fontSize: '14px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#4f46e5'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  };

  return (
    <header style={headerStyle}>
      <div style={logoStyle}>
        🎯 Priority Task Manager
      </div>
      
      <div style={userStatsStyle}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '15px',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          Multi-Project Mode
        </div>
        
        <AutosaveIndicator />
      </div>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button style={primaryButtonStyle} onClick={onCreateTask}>
          + New Task
        </button>
        <button style={secondaryButtonStyle} onClick={onShowFiles}>
          📁 Files
        </button>
        <button style={secondaryButtonStyle} onClick={onShowSettings}>
          ⚙️ Settings
        </button>
        <button style={secondaryButtonStyle} onClick={onForceSave}>
          💾 Save Now
        </button>
      </div>
    </header>
  );
};

// Search and Filters Component
const SearchAndFilters = ({ 
  searchQuery, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange,
  taskStats,
  onClearFilters 
}) => {
  const containerStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  };

  const searchStyle = {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    width: '100%',
    background: '#f9fafb',
    transition: 'all 0.2s ease'
  };

  const filtersStyle = {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap'
  };

  const selectStyle = {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: 'white',
    fontSize: '14px'
  };

  const statsStyle = {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  };

  const statChipStyle = {
    background: '#f3f4f6',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151'
  };

  const clearBtnStyle = {
    padding: '6px 12px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer'
  };

  const hasFilters = searchQuery || statusFilter !== 'all';

  return (
    <div style={containerStyle}>
      <input
        type="text"
        placeholder="🔍 Search tasks by title, project, goal, or notes..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          ...searchStyle,
          borderColor: searchQuery ? '#4f46e5' : '#e5e7eb'
        }}
      />

      <div style={filtersStyle}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Filter:</span>
          <select 
            value={statusFilter} 
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Tasks ({taskStats.total})</option>
            <option value="active">Active ({taskStats.active})</option>
            <option value="completed">Completed ({taskStats.completed})</option>
          </select>
          
          {hasFilters && (
            <button style={clearBtnStyle} onClick={onClearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        <div style={statsStyle}>
          <div style={statChipStyle}>📊 {taskStats.total} Total</div>
          <div style={statChipStyle}>⚡ {taskStats.active} Active</div>
          <div style={statChipStyle}>✅ {taskStats.completed} Done</div>
          {taskStats.overdue > 0 && (
            <div style={{...statChipStyle, background: '#fee2e2', color: '#dc2626'}}>
              🚨 {taskStats.overdue} Overdue
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Task Display
const EnhancedTaskCard = ({ task, onEdit, onComplete, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const cardStyle = {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '15px',
    margin: '10px 0',
    borderLeft: '4px solid #10b981',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  };

  const expandedCardStyle = {
    ...cardStyle,
    background: '#ffffff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    borderLeft: '4px solid #4f46e5'
  };

  const titleStyle = {
    margin: '0 0 8px 0', 
    color: '#1f2937',
    fontSize: '16px',
    fontWeight: '600'
  };

  const metaStyle = {
    margin: '0 0 8px 0', 
    fontSize: '13px', 
    color: '#6b7280',
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  };

  const contentStyle = {
    margin: '0 0 12px 0', 
    fontSize: '14px', 
    color: '#374151',
    lineHeight: '1.5'
  };

  const actionsStyle = {
    display: 'flex', 
    gap: '8px',
    marginTop: '10px'
  };

  const buttonBaseStyle = {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  };

  const isCompleted = task.status === 'הושלם';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

  const finalCardStyle = {
    ...(isExpanded ? expandedCardStyle : cardStyle),
    ...(isOverdue ? { borderLeft: '4px solid #ef4444', background: '#fef2f2' } : {}),
    ...(isCompleted ? { opacity: '0.7', background: '#f0fdf4' } : {})
  };

  return (
    <div style={finalCardStyle} onClick={() => setIsExpanded(!isExpanded)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{
            ...titleStyle,
            textDecoration: isCompleted ? 'line-through' : 'none'
          }}>
            {task.title}
          </h4>
          
          <div style={metaStyle}>
            {task.project && <span>📁 {task.project}</span>}
            <span>🏷️ {task.status}</span>
            {task.dueDate && (
              <span style={{ 
                color: isOverdue ? '#dc2626' : '#6b7280',
                fontWeight: isOverdue ? '600' : 'normal'
              }}>
                📅 {new Date(task.dueDate).toLocaleDateString()}
                {isOverdue && ' (Overdue!)'}
              </span>
            )}
            {task.type && <span>🏗️ {task.type}</span>}
          </div>

          {task.goal && (
            <p style={contentStyle}>{task.goal}</p>
          )}
          
          {isExpanded && task.update && (
            <div style={{
              background: '#eff6ff',
              padding: '10px',
              borderRadius: '6px',
              marginTop: '8px',
              fontSize: '13px',
              color: '#1e40af',
              borderLeft: '3px solid #3b82f6'
            }}>
              <strong>Update:</strong> {task.update}
            </div>
          )}

          {isExpanded && (
            <div style={actionsStyle} onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => onEdit(task)}
                style={{
                  ...buttonBaseStyle,
                  background: '#f59e0b',
                  color: 'white'
                }}
              >
                ✏️ Edit
              </button>
              <button 
                onClick={() => onComplete(task.id)}
                style={{
                  ...buttonBaseStyle,
                  background: isCompleted ? '#10b981' : '#4f46e5',
                  color: 'white'
                }}
              >
                {isCompleted ? '↩️ Undo' : '✅ Complete'}
              </button>
              <button 
                onClick={() => onDelete && onDelete(task.id)}
                style={{
                  ...buttonBaseStyle,
                  background: '#ef4444',
                  color: 'white'
                }}
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
        
        <div style={{ 
          fontSize: '12px', 
          color: '#9ca3af',
          marginLeft: '10px',
          cursor: 'pointer'
        }}>
          {isExpanded ? '▲' : '▼'}
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ taskCount, onCreateTask, searchQuery, hasFilters }) => {
  const emptyStateStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280'
  };

  const titleStyle = {
    fontSize: '20px',
    marginBottom: '10px',
    color: '#374151'
  };

  const getMessage = () => {
    if (taskCount === 0 && !searchQuery && !hasFilters) {
      return "Get started by creating your first task!";
    }
    if (searchQuery) {
      return `No tasks found matching "${searchQuery}"`;
    }
    if (hasFilters) {
      return "No tasks match your current filters";
    }
    return "No tasks found";
  };

  return (
    <div style={emptyStateStyle}>
      <h3 style={titleStyle}>
        {taskCount === 0 ? '🎯 Ready to get started?' : '🔍 No matches found'}
      </h3>
      <p style={{ fontSize: '16px', marginBottom: '20px' }}>
        {getMessage()}
      </p>
      <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
        💡 Tip: Click on any task to expand and see more details
      </p>
      {taskCount === 0 && (
        <button 
          onClick={onCreateTask}
          style={{
            padding: '12px 24px',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Create Your First Task
        </button>
      )}
    </div>
  );
};

// Main component that uses the context
const PriorityTaskManager = () => {
  const { 
    tasks, 
    setTasks, 
    forceSave,
    priorityCategories,
    setPriorityCategories,
    savedProjects,
    exportAllData,
    importAllData
  } = useApp();
  
  // UI State
  const [toast, setToast] = useState({ show: false, message: '' });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showFileManager, setShowFileManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // Calculate task statistics
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'הושלם').length;
    const active = total - completed;
    const overdue = tasks.filter(task => 
      task.dueDate && 
      task.status !== 'הושלם' && 
      new Date(task.dueDate) < new Date()
    ).length;
    return { total, completed, active, overdue };
  };

  // Filter tasks based on search and status
  const getFilteredTasks = () => {
    let filtered = [...tasks];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(query) ||
        task.project?.toLowerCase().includes(query) ||
        task.goal?.toLowerCase().includes(query) ||
        task.update?.toLowerCase().includes(query) ||
        task.type?.toLowerCase().includes(query) ||
        task.status?.toLowerCase().includes(query)
      );
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(task => task.status !== 'הושלם');
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(task => task.status === 'הושלם');
    }

    return filtered;
  };

  // Task handlers
  const handleCreateTask = () => {
    console.log('handleCreateTask called');
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showToast('Task deleted successfully');
    }
  };

  const handleSaveTask = (taskData) => {
    try {
      console.log('Saving task data:', taskData);
      
      // Process the task data to ensure proper formats
      const processedData = {
        ...taskData,
        // Handle due date - keep as string if provided
        dueDate: taskData.dueDate || null,
        // Ensure priority ratings exist
        priorityRatings: taskData.priorityRatings || {},
      };
      
      if (editingTask) {
        // Editing existing task - ensure we keep the original ID
        const updatedTask = {
          ...processedData,
          id: editingTask.id, // Preserve original ID
          updatedAt: new Date().toISOString()
        };
        setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
        showToast(`Task "${taskData.title}" updated successfully!`);
      } else {
        // Creating new task - generate new ID
        const newTask = {
          ...processedData,
          id: Date.now(), // Generate unique ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log('Creating new task:', newTask);
        setTasks(prev => [...prev, newTask]);
        showToast(`Task "${taskData.title}" created successfully!`);
      }
      setShowTaskForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
      showToast('Error saving task. Please try again.');
    }
  };

  const handleCompleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const wasCompleted = task.status === 'הושלם';
    const updatedTask = {
      ...task,
      status: wasCompleted ? 'בעבודה' : 'הושלם',
      completedAt: wasCompleted ? null : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    if (!wasCompleted) {
      showToast(`Task completed!`);
    } else {
      showToast('Task marked as incomplete');
    }
  };

  // Settings handlers
  const handleUpdateCategories = (newCategories) => {
    console.log('🔧 handleUpdateCategories called with:', newCategories);
    setPriorityCategories(newCategories);
    showToast('Priority categories updated successfully!');
  };

  const handleExportData = () => {
    console.log('🔧 handleExportData called');
    try {
      const message = exportAllData();
      showToast(message);
    } catch (error) {
      console.error('Export error:', error);
      showToast('Export failed: ' + error.message);
    }
  };

  const handleImportData = (file) => {
    console.log('🔧 handleImportData called with file:', file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        const message = importAllData(importData);
        showToast(message);
      } catch (error) {
        console.error('Import error:', error);
        showToast('Import failed: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    console.log('🔧 handleResetData called');
    setTasks([]);
    setSearchQuery('');
    setStatusFilter('all');
    showToast('All data has been reset!');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Settings handler
  const handleShowSettings = () => {
    console.log('✅ handleShowSettings called, current showSettings:', showSettings);
    setShowSettings(true);
    console.log('✅ Settings modal should open now');
  };

  const taskStats = getTaskStats();
  const filteredTasks = getFilteredTasks();
  const hasFilters = searchQuery || statusFilter !== 'all';

  return (
    <div className="app">
      <Header
        onCreateTask={handleCreateTask}
        onShowFiles={() => setShowFileManager(true)}
        onShowSettings={handleShowSettings}
        onForceSave={() => {
          if (forceSave) {
            forceSave();
            showToast('Force save triggered!');
          }
        }}
      />

      <SearchAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        taskStats={taskStats}
        onClearFilters={handleClearFilters}
      />

      <main className="main-content">
        {filteredTasks.length === 0 ? (
          <EmptyState 
            taskCount={tasks.length} 
            onCreateTask={handleCreateTask}
            searchQuery={searchQuery}
            hasFilters={hasFilters}
          />
        ) : (
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '20px', 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
          }}>
            <h3 style={{ marginBottom: '15px', color: '#1f2937' }}>
              📋 {hasFilters ? 'Filtered Tasks' : 'Your Tasks'} ({filteredTasks.length})
              {hasFilters && <span style={{ fontSize: '14px', color: '#6b7280' }}> of {tasks.length} total</span>}
            </h3>
            {filteredTasks.map(task => (
              <EnhancedTaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showTaskForm && (
        <TaskForm
          isOpen={showTaskForm}
          task={editingTask}
          onSave={handleSaveTask}
          onCancel={() => setShowTaskForm(false)}
          onClose={() => setShowTaskForm(false)}
          savedProjects={savedProjects}
          priorityCategories={priorityCategories}
        />
      )}

      {showFileManager && (
        <FileManager
          isOpen={showFileManager}
          onClose={() => setShowFileManager(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => {
            console.log('Settings modal closing');
            setShowSettings(false);
          }}
        />
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3)',
          zIndex: 1001
        }}>
          {toast.message}
        </div>
      )}

      {/* Debug Info Panel */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '20px', 
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        marginTop: '20px'
      }}>
        <h3>🎯 App Status</h3>
        <p>✅ Settings Modal State: {showSettings ? 'OPEN' : 'CLOSED'}</p>
        <p>✅ Priority Categories: {priorityCategories?.length || 0} loaded</p>
        <p>✅ Export/Import Functions: {exportAllData && importAllData ? 'Available' : 'Missing'}</p>
        <p style={{ color: '#10b981', fontWeight: 'bold' }}>
          🎯 Multi-Project Mode • {taskStats.total} tasks
        </p>
        <button 
          onClick={handleShowSettings}
          style={{
            padding: '8px 16px',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          🧪 Test Settings Button
        </button>
      </div>
    </div>
  );
};

// Main App with both providers
function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <PriorityTaskManager />
        <ToastContainer />
      </AppProvider>
    </ToastProvider>
  );
}

export default App;