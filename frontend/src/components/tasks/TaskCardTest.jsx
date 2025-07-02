// TaskCardTest.jsx - FIXED version with unique React keys

import React, { useState } from 'react';
import TaskCard from './TaskCard';

const TaskCardTest = () => {
  // ... (all your existing code for priorityCategories, savedProjects, etc.)
  
  // Sample tasks with different states - FIXED with unique IDs
  const [tasks, setTasks] = useState([
    {
      id: `task_1_${Date.now()}`, // ✅ Unique ID with timestamp
      title: 'Complete React TaskCard Component',
      project: 'Website Redesign',
      goal: 'Build a comprehensive task card component with inline editing, priority indicators, and all the features from the original HTML version.',
      update: 'Made good progress on the basic structure. Need to add the priority calculation and rating system.',
      type: 'פיתוח',
      status: 'בעבודה',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      isRepeating: false,
      repeatInterval: '',
      link: 'https://github.com/your-repo',
      priorityRatings: {
        income: 4,
        personal: 5,
        plan: 3
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1000).toISOString(),
      completedAt: null,
      reactKey: `task_1_${Date.now()}_unique` // ✅ Explicit React key
    },
    {
      id: `task_2_${Date.now() + 1}`, // ✅ Unique ID
      title: 'Review and update priority categories',
      project: 'Personal Development',
      goal: 'Review the current priority category weights and adjust based on current life priorities.',
      update: '',
      type: 'מנהלה',
      status: 'לא התחיל',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isRepeating: true,
      repeatInterval: 'monthly',
      link: '',
      priorityRatings: {
        personal: 4,
        plan: 5
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: null,
      reactKey: `task_2_${Date.now() + 1}_unique` // ✅ Explicit React key
    },
    {
      id: `task_3_${Date.now() + 2}`, // ✅ Unique ID
      title: 'Set up exercise routine',
      project: 'Health',
      goal: 'Establish a consistent workout schedule with both cardio and strength training.',
      update: 'Started going to gym twice a week. Need to add one more day.',
      type: 'עצמי',
      status: 'הושלם',
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isRepeating: false,
      repeatInterval: '',
      link: 'https://myfitnesspal.com',
      priorityRatings: {
        personal: 5,
        home: 2
      },
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      reactKey: `task_3_${Date.now() + 2}_unique` // ✅ Explicit React key
    },
    {
      id: `task_4_${Date.now() + 3}`, // ✅ Unique ID
      title: 'Plan family vacation',
      project: 'Family',
      goal: 'Research and book summer vacation destination. Need to coordinate with everyone\'s schedules.',
      update: 'Looking at beach destinations. Checking availability for July.',
      type: 'תיכנון',
      status: 'תיכנון',
      dueDate: null,
      isRepeating: false,
      repeatInterval: '',
      link: '',
      priorityRatings: {
        children: 5,
        social: 4,
        relationship: 3
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: null,
      reactKey: `task_4_${Date.now() + 3}_unique` // ✅ Explicit React key
    }
  ]);

  // Generate unique key helper function
  const generateUniqueTaskKey = (task, index) => {
    // Priority order: reactKey > composite key > fallback
    if (task.reactKey) return task.reactKey;
    if (task.id && task.createdAt) return `${task.id}_${task.createdAt}_${index}`;
    return `fallback_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle task updates - FIXED to ensure unique keys
  const handleTaskUpdate = (taskId, updates) => {
    setTasks(prevTasks => 
      prevTasks.map((task, index) => {
        if (task.id === taskId) {
          const updatedTask = { 
            ...task, 
            ...updates, 
            updatedAt: new Date().toISOString()
          };
          
          // Ensure the updated task has a unique React key
          if (!updatedTask.reactKey) {
            updatedTask.reactKey = generateUniqueTaskKey(updatedTask, index);
          }
          
          return updatedTask;
        }
        return task;
      })
    );
    console.log('Task updated:', taskId, updates);
  };

  // Handle task deletion
  const handleTaskDelete = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    console.log('Task deleted:', taskId);
  };

  // Handle task completion toggle
  const handleTaskToggleComplete = (task, isCompleted) => {
    const updates = {
      completedAt: isCompleted ? new Date().toISOString() : null,
      status: isCompleted ? 'הושלם' : 'לא התחיל'
    };
    
    handleTaskUpdate(task.id, updates);
    
    if (isCompleted) {
      const priorityScore = calculatePriorityScore(task.priorityRatings || {}, priorityCategories);
      const points = Math.round(priorityScore * 10);
      console.log(`Task completed! Earned ${points} points`);
      alert(`Task completed! You earned ${points} points!`);
    }
  };

  // ... (rest of your existing handler functions)

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '2rem auto', 
      padding: '2rem',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#111827', marginBottom: '0.5rem' }}>🎯 TaskCard Component Test</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Testing TaskCard with different states: active, overdue, completed, recently updated
        </p>
      </div>

      {/* Task Cards - FIXED with unique keys */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tasks.map((task, index) => {
          const uniqueKey = generateUniqueTaskKey(task, index);
          
          return (
            <TaskCard
              key={uniqueKey} // ✅ FIXED: Using guaranteed unique keys
              task={task}
              onUpdate={handleTaskUpdate}
              onDelete={handleTaskDelete}
              onToggleComplete={handleTaskToggleComplete}
              onRatePriority={handleRatePriority}
              savedProjects={savedProjects}
              priorityCategories={priorityCategories}
            />
          );
        })}
      </div>

      {/* Debug Info - Enhanced to show key information */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#ffffff', 
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ marginTop: 0, color: '#111827' }}>Debug Information</h3>
        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          <p><strong>Total Tasks:</strong> {tasks.length}</p>
          <p><strong>Active Tasks:</strong> {tasks.filter(t => !t.completedAt).length}</p>
          <p><strong>Completed Tasks:</strong> {tasks.filter(t => t.completedAt).length}</p>
          <p><strong>Overdue Tasks:</strong> {tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completedAt).length}</p>
          
          {/* ✅ NEW: Show React keys for debugging */}
          <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f0f9ff', borderRadius: '0.25rem' }}>
            <strong>React Keys (for debugging duplicate key warnings):</strong>
            <ul style={{ margin: '0.25rem 0', paddingLeft: '1rem', fontSize: '0.625rem' }}>
              {tasks.map((task, index) => (
                <li key={`debug_${index}`}>
                  Task {index + 1}: {generateUniqueTaskKey(task, index)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* ... rest of your debug section */}
      </div>

      {/* ... rest of your existing instructions section */}
    </div>
  );
};

export default TaskCardTest;