import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import './styles/globals.css';

// Header Component
const Header = ({ onCreateTask, onShowFiles, onShowSettings, onForceSave }) => {
    const { userProgress } = useApp();

    const headerStyle = {
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
    };

    const logoStyle = {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#4f46e5'
    };

    const userStatsStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
    };

    const levelBadgeStyle = {
        background: 'linear-gradient(45deg, #4f46e5, #10b981)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontWeight: 'bold'
    };

    const pointsStyle = {
        color: '#10b981',
        fontWeight: '600'
    };

    const buttonStyle = {
        padding: '10px 16px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s ease'
    };

    const primaryButtonStyle = {
        ...buttonStyle,
        background: '#4f46e5',
        color: 'white'
    };

    const secondaryButtonStyle = {
        ...buttonStyle,
        background: '#f3f4f6',
        color: '#374151'
    };

    return (
        <header style={headerStyle}>
            <div style={logoStyle}>🎯 Priority Task Manager</div>
            
            <div style={userStatsStyle}>
                <div style={levelBadgeStyle}>Level {userProgress.level}</div>
                <div style={pointsStyle}>{userProgress.points} points</div>
                <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    background: '#f9fafb',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                }}>
                    Auto-save Ready
                </div>
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

// Empty State Component
const EmptyState = ({ taskCount, onCreateTask }) => {
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

    const textStyle = {
        fontSize: '16px',
        marginBottom: '20px'
    };

    const tipStyle = {
        fontSize: '14px',
        color: '#9ca3af',
        marginTop: '10px'
    };

    const subtipStyle = {
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '5px'
    };

    const createBtnStyle = {
        padding: '10px 16px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        background: '#4f46e5',
        color: 'white',
        transition: 'all 0.2s ease',
        marginTop: '10px'
    };

    return (
        <div style={emptyStateStyle}>
            <h3 style={titleStyle}>No tasks found</h3>
            <p style={textStyle}>
                {taskCount === 0 
                    ? "Get started by creating your first task!"
                    : "Try adjusting your search or filters."
                }
            </p>
            <p style={tipStyle}>
                💡 Tip: Click on any task to expand and edit it inline
            </p>
            <p style={subtipStyle}>
                🔄 Auto-save is enabled - your changes are saved automatically
            </p>
            {taskCount === 0 && (
                <button style={createBtnStyle} onClick={onCreateTask}>
                    Create Your First Task
                </button>
            )}
        </div>
    );
};

// Main component that uses the context
const PriorityTaskManager = () => {
  const { tasks, userProgress, setTasks, setUserProgress, priorityCategories } = useApp();
  
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleCreateTask = () => {
    const newTask = {
      id: Date.now(),
      title: `Sample Task ${tasks.length + 1}`,
      project: 'Test Project',
      goal: 'This is a test task to verify everything works',
      type: 'מנהלה',
      status: 'לא התחיל',
      priorityRatings: { income: 3, home: 2, personal: 4 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null
    };
    
    setTasks(prev => [...prev, newTask]);
    showToast(`Task "${newTask.title}" created successfully!`);
  };

  const handleCompleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = {
      ...task,
      status: task.status === 'הושלם' ? 'בעבודה' : 'הושלם',
      completedAt: task.status === 'הושלם' ? null : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

    if (updatedTask.status === 'הושלם') {
      const points = 25; // Simple points for now
      setUserProgress(prev => ({
        ...prev,
        points: prev.points + points,
        level: Math.floor((prev.points + points) / 1000) + 1
      }));
      showToast(`Task completed! +${points} points`);
    }
  };

  return (
    <div className="app">
      <Header
        onCreateTask={handleCreateTask}
        onShowFiles={() => showToast('Files coming in Phase 2!')}
        onShowSettings={() => showToast('Settings coming in Phase 2!')}
        onForceSave={() => showToast('Save coming in Phase 2!')}
      />

      <main className="main-content">
        {tasks.length === 0 ? (
          <EmptyState taskCount={tasks.length} onCreateTask={handleCreateTask} />
        ) : (
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
          }}>
            <h3>📋 Your Tasks ({tasks.length})</h3>
            {tasks.map(task => (
              <div key={task.id} style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '15px',
                margin: '10px 0',
                borderLeft: '4px solid #10b981'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>{task.title}</h4>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
                      Project: {task.project} | Status: {task.status}
                    </p>
                    <p style={{ margin: '0', fontSize: '14px', color: '#374151' }}>{task.goal}</p>
                  </div>
                  <button 
                    onClick={() => handleCompleteTask(task.id)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      background: task.status === 'הושלם' ? '#10b981' : '#4f46e5',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {task.status === 'הושלם' ? '✓ Completed' : 'Complete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

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

      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '20px', 
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        marginTop: '20px'
      }}>
        <h3>🎯 Phase 1 Working!</h3>
        <p>✅ Basic task creation working</p>
        <p>✅ Task completion with points working</p>
        <p>✅ All core components rendering</p>
        <p style={{ color: '#10b981', fontWeight: 'bold' }}>
          👤 Level {userProgress.level} • {userProgress.points} points • {tasks.length} tasks
        </p>
      </div>
    </div>
  );
};

// Main App with Provider
function App() {
  return (
    <AppProvider>
      <PriorityTaskManager />
    </AppProvider>
  );
}

export default App;