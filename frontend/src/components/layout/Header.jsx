import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/layout/Header';
import SearchAndFilters from './components/layout/SearchAndFilters';
import EmptyState from './components/ui/EmptyState';
import { useTaskManager } from './hooks/useTaskManager';
import { calculatePriorityScore } from './utils/taskHelpers';
import './styles/globals.css';

// Main component that uses the context
const PriorityTaskManager = () => {
  const { tasks, userProgress, priorityCategories } = useApp();
  const taskManager = useTaskManager();
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '' });

  // Show toast message
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // Create a sample task for testing
  const handleCreateTask = () => {
    const sampleTask = {
      title: `Sample Task ${tasks.length + 1}`,
      project: 'Test Project',
      goal: 'This is a test task to verify everything works',
      type: 'מנהלה',
      status: 'לא התחיל',
      priorityRatings: {
        income: 3,
        home: 2,
        personal: 4
      }
    };
    
    const message = taskManager.handleCreateTask(sampleTask);
    showToast(message);
  };

  const handleShowFiles = () => showToast('Files feature coming in Phase 2!');
  const handleShowSettings = () => showToast('Settings feature coming in Phase 2!');
  const handleForceSave = () => showToast('Force save feature coming in Phase 2!');

  // Mock unique projects (empty for now)
  const uniqueProjects = [];

  // Calculate priority weights
  const priorityWeights = {};
  priorityCategories.forEach(cat => {
    priorityWeights[cat.id] = cat.weight;
  });

  return (
    <div className="app">
      <Header
        onCreateTask={handleCreateTask}
        onShowFiles={handleShowFiles}
        onShowSettings={handleShowSettings}
        onForceSave={handleForceSave}
      />
      
      <SearchAndFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        uniqueProjects={uniqueProjects}
      />

      <main className="main-content">
        {tasks.length === 0 ? (
          <EmptyState
            taskCount={tasks.length}
            onCreateTask={handleCreateTask}
          />
        ) : (
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
          }}>
            <h3>📋 Your Tasks ({tasks.length})</h3>
            {tasks.map(task => {
              const priorityScore = calculatePriorityScore(task, priorityCategories, priorityWeights);
              return (
                <div key={task.id} style={{
                  background: '#f9fafb',
                  borderRadius: '8px',
                  padding: '15px',
                  margin: '10px 0',
                  borderLeft: `4px solid ${priorityScore >= 3 ? '#ef4444' : priorityScore >= 1.5 ? '#10b981' : '#6b7280'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>{task.title}</h4>
                      <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
                        Project: {task.project} | Type: {task.type} | Status: {task.status}
                      </p>
                      <p style={{ margin: '0', fontSize: '14px', color: '#374151' }}>{task.goal}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        background: 'linear-gradient(45deg, #4f46e5, #10b981)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        marginBottom: '5px'
                      }}>
                        Priority: {priorityScore}
                      </div>
                      <button 
                        onClick={() => {
                          const message = taskManager.handleToggleComplete(task.id);
                          if (message) showToast(message);
                        }}
                        style={{
                          padding: '4px 8px',
                          border: 'none',
                          borderRadius: '4px',
                          background: task.status === 'הושלם' ? '#10b981' : '#4f46e5',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {task.status === 'הושלם' ? '✓ Completed' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Toast notification */}
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
        <h3>🎯 Phase 1 Complete!</h3>
        <p>✅ Task creation working</p>
        <p>✅ Priority calculation working</p>
        <p>✅ Task completion with points working</p>
        <p>✅ All core functionality ready</p>
        <p style={{ marginTop: '10px', color: '#10b981', fontWeight: 'bold' }}>
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