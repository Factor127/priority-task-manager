// TaskCardTest.jsx - Test TaskCard component
import React, { useState } from 'react';
import TaskCard from './TaskCard';

const TaskCardTest = () => {
  // Sample priority categories (from your spec)
  const priorityCategories = [
    { id: 'income', english: 'Income/Revenue', hebrew: 'הכנסה לשוטף', weight: 40, color: '#10B981' },
    { id: 'home', english: 'Home Management', hebrew: 'ניהול בית', weight: 15, color: '#3B82F6' },
    { id: 'plan', english: '5-Year Plan', hebrew: 'תוכנית חומש', weight: 5, color: '#8B5CF6' },
    { id: 'social', english: 'Social', hebrew: 'סוציאל', weight: 20, color: '#F59E0B' },
    { id: 'relationship', english: 'Relationship', hebrew: 'זוגיות', weight: 5, color: '#EF4444' },
    { id: 'personal', english: 'Personal', hebrew: 'עצמי', weight: 20, color: '#06B6D4' },
    { id: 'children', english: 'Children', hebrew: 'ילדים', weight: 30, color: '#84CC16' }
  ];

  // Sample saved projects
  const savedProjects = [
    'Personal Development',
    'Business Growth',
    'Family',
    'Health',
    'Learning',
    'Finance',
    'Website Redesign',
    'Mobile App Development'
  ];

  // Sample tasks with different states
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Complete React TaskCard Component',
      project: 'Website Redesign',
      goal: 'Build a comprehensive task card component with inline editing, priority indicators, and all the features from the original HTML version.',
      update: 'Made good progress on the basic structure. Need to add the priority calculation and rating system.',
      type: 'פיתוח',
      status: 'בעבודה',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      isRepeating: false,
      repeatInterval: '',
      link: 'https://github.com/your-repo',
      priorityRatings: {
        income: 4,
        personal: 5,
        plan: 3
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1000).toISOString(), // Recently updated
      completedAt: null
    },
    {
      id: 2,
      title: 'Review and update priority categories',
      project: 'Personal Development',
      goal: 'Review the current priority category weights and adjust based on current life priorities.',
      update: '',
      type: 'מנהלה',
      status: 'לא התחיל',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Overdue
      isRepeating: true,
      repeatInterval: 'monthly',
      link: '',
      priorityRatings: {
        personal: 4,
        plan: 5
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: null
    },
    {
      id: 3,
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
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
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
      completedAt: null
    }
  ]);

  // Handle task updates
  const handleTaskUpdate = (taskId, updates) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
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
      // Calculate points (priority score * 10)
      const priorityScore = calculatePriorityScore(task.priorityRatings || {}, priorityCategories);
      const points = Math.round(priorityScore * 10);
      console.log(`Task completed! Earned ${points} points`);
      
      // You could show a toast notification here
      alert(`Task completed! You earned ${points} points!`);
    }
  };

  // Handle priority rating (placeholder)
  const handleRatePriority = (task) => {
    console.log('Rate priority for task:', task.title);
    alert('Priority rating modal would open here');
  };

  // Calculate priority score (same logic as in TaskCard)
  const calculatePriorityScore = (priorityRatings = {}, categories = []) => {
    let score = 0;
    categories.forEach(category => {
      const rating = priorityRatings[category.id] || 0;
      const weight = category.weight || 0;
      score += (rating * weight) / 100;
    });
    return Math.round(score * 10) / 10;
  };

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

      {/* Task Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
            onToggleComplete={handleTaskToggleComplete}
            onRatePriority={handleRatePriority}
            savedProjects={savedProjects}
            priorityCategories={priorityCategories}
          />
        ))}
      </div>

      {/* Debug Info */}
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
        </div>
        
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', color: '#4f46e5' }}>View Raw Task Data</summary>
          <pre style={{ 
            fontSize: '0.625rem', 
            overflow: 'auto',
            maxHeight: '200px',
            backgroundColor: '#f8fafc',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            marginTop: '0.5rem'
          }}>
            {JSON.stringify(tasks, null, 2)}
          </pre>
        </details>
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        backgroundColor: '#eff6ff', 
        borderRadius: '0.5rem',
        border: '1px solid #bfdbfe'
      }}>
        <h3 style={{ color: '#1e40af', marginTop: 0 }}>Testing Instructions</h3>
        <ul style={{ color: '#1e40af', fontSize: '0.875rem' }}>
          <li>Click on any task to expand and see inline editing</li>
          <li>Try editing the title, project, goal, or notes - changes auto-save after 800ms</li>
          <li>Change the status using the dropdown</li>
          <li>Toggle task completion with the checkmark button</li>
          <li>Notice the priority indicators (colored dots) based on calculated scores</li>
          <li>Observe different visual states: overdue (red border), completed (grayed out), recently updated (yellow highlight)</li>
          <li>Test the project autocomplete in expanded view</li>
          <li>Try the "Rate Priority" and "Delete" buttons</li>
        </ul>
      </div>
    </div>
  );
};

export default TaskCardTest;