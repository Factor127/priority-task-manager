// utils/debugTasks.js - Utility to debug task duplicate issues

// Debug function to analyze task arrays for duplicates
export const analyzeTaskDuplicates = (tasks, context = 'Unknown') => {
  console.group(`🔍 Task Analysis - ${context}`);
  
  if (!Array.isArray(tasks)) {
    console.error('❌ Tasks is not an array:', typeof tasks, tasks);
    console.groupEnd();
    return { hasIssues: true, issues: ['Not an array'] };
  }
  
  const issues = [];
  const idCounts = {};
  const duplicateIds = [];
  
  // Count ID occurrences
  tasks.forEach((task, index) => {
    if (!task) {
      issues.push(`Task at index ${index} is null/undefined`);
      return;
    }
    
    if (!task.id) {
      issues.push(`Task at index ${index} missing ID: ${task.title || 'No title'}`);
      return;
    }
    
    if (typeof task.id !== 'string') {
      issues.push(`Task at index ${index} has non-string ID: ${typeof task.id} - ${task.id}`);
    }
    
    idCounts[task.id] = (idCounts[task.id] || 0) + 1;
    
    if (idCounts[task.id] === 2) {
      duplicateIds.push(task.id);
    }
  });
  
  // Report findings
  console.log(`📊 Total tasks: ${tasks.length}`);
  console.log(`🆔 Unique IDs: ${Object.keys(idCounts).length}`);
  
  if (duplicateIds.length > 0) {
    console.warn(`🚨 Found ${duplicateIds.length} duplicate IDs:`);
    duplicateIds.forEach(id => {
      console.warn(`  - ID "${id}" appears ${idCounts[id]} times`);
      const duplicateTasks = tasks.filter(t => t.id === id);
      duplicateTasks.forEach((task, i) => {
        console.warn(`    [${i}] Title: "${task.title}" | Created: ${task.createdAt}`);
      });
    });
  } else {
    console.log('✅ No duplicate IDs found');
  }
  
  if (issues.length > 0) {
    console.warn(`⚠️ Found ${issues.length} issues:`);
    issues.forEach(issue => console.warn(`  - ${issue}`));
  } else {
    console.log('✅ No structural issues found');
  }
  
  console.groupEnd();
  
  return {
    hasIssues: duplicateIds.length > 0 || issues.length > 0,
    duplicateIds,
    issues,
    totalTasks: tasks.length,
    uniqueIds: Object.keys(idCounts).length
  };
};

// Function to add to window for console debugging
export const addDebugToWindow = () => {
  if (typeof window !== 'undefined') {
    window.debugTasks = analyzeTaskDuplicates;
    window.analyzeTaskDuplicates = analyzeTaskDuplicates;
    console.log('🔧 Debug functions added to window: debugTasks(), analyzeTaskDuplicates()');
  }
};

// Function to immediately check tasks in localStorage
export const debugLocalStorageTasks = () => {
  try {
    const data = localStorage.getItem('priority-task-manager-projects');
    if (!data) {
      console.log('No localStorage data found');
      return;
    }
    
    const parsed = JSON.parse(data);
    console.group('🗄️ LocalStorage Analysis');
    
    Object.keys(parsed).forEach(projectId => {
      const project = parsed[projectId];
      if (project.tasks) {
        analyzeTaskDuplicates(project.tasks, `Project: ${projectId}`);
      }
    });
    
    console.groupEnd();
  } catch (error) {
    console.error('Error analyzing localStorage:', error);
  }
};

// Advanced duplicate finder with source tracking
export const findDuplicateSource = (tasks) => {
  const idMap = new Map();
  const duplicates = [];
  
  tasks.forEach((task, index) => {
    if (!task || !task.id) return;
    
    if (idMap.has(task.id)) {
      const original = idMap.get(task.id);
      duplicates.push({
        id: task.id,
        original: { index: original.index, task: original.task },
        duplicate: { index, task },
        possibleCause: analyzeDuplicateCause(original.task, task)
      });
    } else {
      idMap.set(task.id, { index, task });
    }
  });
  
  return duplicates;
};

// Analyze potential cause of duplication
const analyzeDuplicateCause = (task1, task2) => {
  const causes = [];
  
  // Same object reference
  if (task1 === task2) {
    causes.push('Same object reference - possible array mutation issue');
  }
  
  // Same content, different timestamps
  if (task1.title === task2.title && 
      task1.createdAt !== task2.createdAt) {
    causes.push('Same title, different creation times - possible duplicate creation');
  }
  
  // Same creation time
  if (task1.createdAt === task2.createdAt) {
    causes.push('Same creation time - possible rapid duplicate creation');
  }
  
  // Very close update times
  if (task1.updatedAt && task2.updatedAt) {
    const diff = Math.abs(new Date(task1.updatedAt) - new Date(task2.updatedAt));
    if (diff < 1000) { // Less than 1 second apart
      causes.push('Updates within 1 second - possible rapid state updates');
    }
  }
  
  return causes.length > 0 ? causes : ['Unknown cause'];
};

// React component hook for debugging
export const useTaskDebugger = (tasks, componentName = 'Component') => {
  if (process.env.NODE_ENV === 'development') {
    const analysis = analyzeTaskDuplicates(tasks, componentName);
    
    if (analysis.hasIssues) {
      console.warn(`🐛 ${componentName} has task issues:`, analysis);
    }
    
    return analysis;
  }
  
  return null;
};