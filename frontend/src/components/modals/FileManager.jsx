import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const FileManager = ({ isOpen, onClose }) => {
  const { 
    tasks, 
    priorityCategories, 
    exportAllData, 
    importAllData,
    projects,
    currentProjectId,
    setProjects
  } = useApp();
  
  const [importType, setImportType] = useState('json');
  const [exportType, setExportType] = useState('csv');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Duplicate handling state
  const [duplicateDialog, setDuplicateDialog] = useState({
    show: false,
    duplicates: [],
    newTasks: [],
    onResolve: null
  });

  const showToast = (message, type = 'success') => {
    console.log(`🔔 Toast: ${message} (${type})`);
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  // Enhanced CSV parsing
  const parseCSV = (csvText) => {
    console.log('📝 Starting CSV parse, text length:', csvText.length);
    
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      console.log('❌ CSV has less than 2 lines');
      return [];
    }
    
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && (i === 0 || line[i-1] === ',' || inQuotes)) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
    console.log('📋 CSV Headers found:', headers);
    
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      if (row.title) {
        rows.push(row);
      }
    }
    
    console.log('📊 CSV parsed rows:', rows.length);
    return rows;
  };

  // Convert CSV task with exact column mapping
  const convertCSVTask = (csvTask, categories) => {
    console.log('🔄 Converting CSV task:', csvTask.title);
    
    const priorityRatings = {};
    
    // Handle your specific CSV format
    categories.forEach(category => {
      let rating = 0;
      
      // Map exact column names from your CSV
      if (csvTask['Income/Revenue'] !== undefined && category.id === 'income') {
        rating = Number(csvTask['Income/Revenue']) || 0;
      } else if (csvTask['Home Management'] !== undefined && category.id === 'home') {
        rating = Number(csvTask['Home Management']) || 0;
      } else if (csvTask['5-Year Plan'] !== undefined && category.id === 'plan') {
        rating = Number(csvTask['5-Year Plan']) || 0;
      } else if (csvTask['Social'] !== undefined && category.id === 'social') {
        rating = Number(csvTask['Social']) || 0;
      } else if (csvTask['Relationship'] !== undefined && category.id === 'relationship') {
        rating = Number(csvTask['Relationship']) || 0;
      } else if (csvTask['Personal'] !== undefined && category.id === 'personal') {
        rating = Number(csvTask['Personal']) || 0;
      } else if (csvTask['Children'] !== undefined && category.id === 'children') {
        rating = Number(csvTask['Children']) || 0;
      } else if (csvTask[category.english] !== undefined) {
        rating = Number(csvTask[category.english]) || 0;
      } else if (csvTask[category.id] !== undefined) {
        rating = Number(csvTask[category.id]) || 0;
      }
      
      priorityRatings[category.id] = Math.max(0, Math.min(5, rating));
    });

    const isRepeating = csvTask.isRepeating === 'true' || csvTask.isRepeating === true;

    const convertedTask = {
      id: csvTask.id || Date.now() + Math.random(),
      title: csvTask.title || 'Imported Task',
      project: csvTask.project || '',
      goal: csvTask.goal || '',
      update: csvTask.update || '',
      type: csvTask.type || '',
      status: csvTask.status || 'לא התחיל',
      dueDate: csvTask.dueDate || '',
      isRepeating,
      repeatInterval: csvTask.repeatInterval || (isRepeating ? 'monthly' : ''),
      link: csvTask.link || '',
      priorityRatings,
      createdAt: csvTask.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: csvTask.completedAt || null
    };

    console.log('✅ Converted task with priority ratings:', convertedTask.priorityRatings);
    return convertedTask;
  };

  // ENHANCED DUPLICATE DETECTION: Check for duplicates by title AND ID
  const findDuplicates = (newTasks, existingTasks) => {
    console.log('🔍 Checking for duplicates by title and ID...');
    
    // Create maps for both title and ID comparison
    const existingTitles = new Map();
    const existingIds = new Set();
    
    existingTasks.forEach(task => {
      if (task.title) {
        existingTitles.set(task.title.toLowerCase().trim(), task);
      }
      if (task.id) {
        existingIds.add(task.id);
      }
    });

    const duplicates = [];
    const uniqueTasks = [];

    newTasks.forEach(newTask => {
      const titleKey = newTask.title.toLowerCase().trim();
      const isDuplicateTitle = existingTitles.has(titleKey);
      const isDuplicateId = existingIds.has(newTask.id);
      
      if (isDuplicateTitle || isDuplicateId) {
        const existingTask = isDuplicateTitle 
          ? existingTitles.get(titleKey)
          : existingTasks.find(t => t.id === newTask.id);
          
        duplicates.push({
          newTask,
          existingTask,
          title: newTask.title,
          duplicateType: isDuplicateTitle && isDuplicateId ? 'both' : 
                       isDuplicateTitle ? 'title' : 'id'
        });
      } else {
        uniqueTasks.push(newTask);
      }
    });

    console.log('🔍 Enhanced duplicate check results:', {
      total: newTasks.length,
      duplicates: duplicates.length,
      unique: uniqueTasks.length,
      duplicateBreakdown: {
        titleOnly: duplicates.filter(d => d.duplicateType === 'title').length,
        idOnly: duplicates.filter(d => d.duplicateType === 'id').length,
        both: duplicates.filter(d => d.duplicateType === 'both').length
      }
    });

    return { duplicates, uniqueTasks };
  };

  // DUPLICATE RESOLUTION: Handle user's choice for duplicates with unique ID generation
  const handleDuplicateResolution = (action) => {
    const { duplicates, onResolve } = duplicateDialog;
    
    console.log('🔧 Resolving duplicates with action:', action);
    
    let tasksToAdd = [];
    
    if (action === 'skip') {
      // Skip all duplicates - add nothing from duplicates
      console.log('⏭️ Skipping all duplicate tasks');
      tasksToAdd = [];
    } else if (action === 'duplicate') {
      // Add all duplicates with guaranteed unique IDs
      console.log('📋 Adding all duplicate tasks with new unique IDs');
      tasksToAdd = duplicates.map(dup => ({
        ...dup.newTask,
        id: Date.now() + Math.random() + Math.random(), // Extra randomness for uniqueness
        title: `${dup.newTask.title} (Import ${new Date().toLocaleDateString()})`, // Add suffix to distinguish
        updatedAt: new Date().toISOString()
      }));
    } else if (action === 'replace') {
      // Replace existing tasks with new data, but ensure unique IDs
      console.log('🔄 Replacing existing tasks with imported data');
      tasksToAdd = duplicates.map(dup => {
        // If it's an ID duplicate, generate a new unique ID
        const useExistingId = dup.duplicateType === 'title' && dup.duplicateType !== 'id';
        return {
          ...dup.newTask,
          id: useExistingId ? dup.existingTask.id : Date.now() + Math.random() + Math.random(),
          createdAt: useExistingId ? dup.existingTask.createdAt : dup.newTask.createdAt,
          updatedAt: new Date().toISOString()
        };
      });
    }

    console.log('📊 Duplicate resolution result:', {
      action,
      tasksToAdd: tasksToAdd.length,
      allUniqueIds: tasksToAdd.every((task, index, arr) => 
        arr.findIndex(t => t.id === task.id) === index
      )
    });

    // Close dialog and process
    setDuplicateDialog({ show: false, duplicates: [], newTasks: [], onResolve: null });
    
    // Call the resolution callback
    if (onResolve) {
      onResolve(tasksToAdd);
    }
  };

  // MAIN IMPORT FUNCTION with duplicate detection
  const performImport = (tasksToImport) => {
    console.log('🔧 Performing import with', tasksToImport.length, 'tasks');
    
    if (projects && currentProjectId && projects[currentProjectId] && setProjects) {
      const currentProject = projects[currentProjectId];
      const existingTasks = currentProject.tasks || [];
      
      // Check for duplicates by title
      const { duplicates, uniqueTasks } = findDuplicates(tasksToImport, existingTasks);
      
      if (duplicates.length > 0) {
        console.log('⚠️ Found', duplicates.length, 'duplicate tasks');
        
        // Show duplicate dialog
        setDuplicateDialog({
          show: true,
          duplicates,
          newTasks: uniqueTasks,
          onResolve: (duplicateResolution) => {
            // Combine unique tasks with resolved duplicates
            const allTasksToAdd = [...uniqueTasks, ...duplicateResolution];
            
            console.log('📊 Final import summary:', {
              unique: uniqueTasks.length,
              duplicateResolution: duplicateResolution.length,
              total: allTasksToAdd.length
            });
            
            if (allTasksToAdd.length > 0) {
              // Update project with all tasks
              const updatedTasks = [...existingTasks, ...allTasksToAdd];
              
              const updatedProject = {
                ...currentProject,
                tasks: updatedTasks,
                updatedAt: new Date().toISOString()
              };
              
              setProjects(prev => ({
                ...prev,
                [currentProjectId]: updatedProject
              }));
              
              showToast(`Successfully imported ${allTasksToAdd.length} tasks! (${uniqueTasks.length} unique, ${duplicateResolution.length} duplicates processed)`);
            } else {
              showToast('No new tasks imported (all were skipped duplicates)', 'info');
            }
          }
        });
        
        return; // Exit here - will continue after user resolves duplicates
      }
      
      // No duplicates - proceed with direct import
      console.log('✅ No duplicates found, proceeding with direct import');
      
      const updatedProject = {
        ...currentProject,
        tasks: [...existingTasks, ...uniqueTasks],
        updatedAt: new Date().toISOString()
      };
      
      setProjects(prev => ({
        ...prev,
        [currentProjectId]: updatedProject
      }));
      
      showToast(`Successfully imported ${uniqueTasks.length} new tasks!`);
      
    } else {
      throw new Error('Cannot access project data for import. Please check if the project is properly loaded.');
    }
  };

  // MAIN IMPORT HANDLER
  const handleTaskImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('🚀 Starting import with duplicate detection:', { 
      fileName: file.name, 
      fileType: file.type, 
      importType,
      currentProjectId,
      currentTaskCount: tasks.length
    });
    
    showToast('Starting import...', 'info');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let tasksToImport = [];
        
        if (importType === 'json') {
          console.log('📄 Processing JSON file...');
          const data = JSON.parse(e.target.result);
          
          if (Array.isArray(data)) {
            console.log('✅ JSON is direct array format');
            tasksToImport = data;
          } else if (data.tasks && Array.isArray(data.tasks)) {
            console.log('✅ JSON has tasks property');
            tasksToImport = data.tasks;
          } else {
            throw new Error('Invalid JSON format. Expected array of tasks or object with tasks property.');
          }
          
        } else if (importType === 'csv') {
          console.log('📊 Processing CSV file...');
          const csvTasks = parseCSV(e.target.result);
          
          if (csvTasks.length === 0) {
            throw new Error('No valid tasks found in CSV file');
          }
          
          console.log('🔄 Converting CSV tasks...');
          tasksToImport = csvTasks.map(csvTask => convertCSVTask(csvTask, priorityCategories));
        }
        
        if (tasksToImport.length === 0) {
          throw new Error('No tasks found in the file');
        }

        console.log('📥 Processing', tasksToImport.length, 'tasks for import...');
        
        // Ensure proper task format with guaranteed unique IDs
        const processedTasks = tasksToImport.map(task => ({
          ...task,
          id: task.id ? task.id + '_' + Math.random().toString(36).substr(2, 9) : Date.now() + Math.random(),
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          priorityRatings: task.priorityRatings || {}
        }));

        // Perform import with duplicate detection
        performImport(processedTasks);

      } catch (error) {
        console.error('❌ Import error:', error);
        showToast(`Import failed: ${error.message}`, 'error');
      }
    };
    
    reader.onerror = () => {
      console.error('❌ File reading error');
      showToast('Failed to read file', 'error');
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  // Generate CSV for export
  const generateTasksCSV = (tasks, categories) => {
    const headers = [
      'title', 'project', 'goal', 'update', 'type', 'status', 'dueDate', 'link',
      'isRepeating', 'repeatInterval',
      ...categories.map(cat => cat.english),
      'priorityScore', 'createdAt', 'updatedAt', 'completedAt'
    ];

    const rows = tasks.map(task => {
      const priorityScore = categories.reduce((score, cat) => {
        const rating = task.priorityRatings?.[cat.id] || 0;
        const weight = cat.weight || 0;
        return score + (rating * weight) / 100;
      }, 0);

      return [
        `"${(task.title || '').replace(/"/g, '""')}"`,
        `"${(task.project || '').replace(/"/g, '""')}"`,
        `"${(task.goal || '').replace(/"/g, '""')}"`,
        `"${(task.update || '').replace(/"/g, '""')}"`,
        `"${task.type || ''}"`,
        `"${task.status || ''}"`,
        task.dueDate || '',
        task.link || '',
        task.isRepeating || false,
        task.repeatInterval || '',
        ...categories.map(cat => task.priorityRatings?.[cat.id] || 0),
        Math.round(priorityScore * 10) / 10,
        task.createdAt || '',
        task.updatedAt || '',
        task.completedAt || ''
      ];
    });

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  // Export handler
  const handleTaskExport = () => {
    console.log('📤 Starting export...');
    
    const filteredTasks = tasks.filter(task => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'active') return task.status !== 'הושלם';
      if (filterStatus === 'completed') return task.status === 'הושלם';
      return task.status === filterStatus;
    });

    if (filteredTasks.length === 0) {
      showToast('No tasks to export with the current filter.', 'error');
      return;
    }

    let content, filename, mimeType;
    
    if (exportType === 'csv') {
      content = generateTasksCSV(filteredTasks, priorityCategories);
      filename = `tasks-${filterStatus}-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(filteredTasks, null, 2);
      filename = `tasks-${filterStatus}-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${filteredTasks.length} tasks successfully!`);
  };

  // Template download
  const downloadTemplate = () => {
    const templateHeaders = [
      'title', 'project', 'goal', 'update', 'type', 'status', 'dueDate', 'link',
      'isRepeating', 'repeatInterval',
      'Income/Revenue', 'Home Management', '5-Year Plan', 'Social', 'Relationship', 'Personal', 'Children',
      'createdAt', 'updatedAt', 'completedAt'
    ];
    
    const sampleRow = [
      'Sample Task', 'Sample Project', 'Sample Goal', 'Sample Update',
      'מנהלה', 'לא התחיל', '2025-12-31', 'https://example.com',
      'false', 'monthly',
      '3', '4', '2', '3', '2', '4', '5',
      new Date().toISOString(), new Date().toISOString(), ''
    ];
    
    const csvContent = [
      templateHeaders.join(','),
      sampleRow.map(cell => `"${cell}"`).join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'task-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Template downloaded - matches your CSV format!');
  };

  // Complete backup handlers
  const handleCompleteBackup = () => {
    try {
      const message = exportAllData();
      showToast(message);
    } catch (error) {
      showToast(`Export failed: ${error.message}`, 'error');
    }
  };

  const handleCompleteImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const message = importAllData(data);
        showToast(message);
      } catch (error) {
        showToast(`Import failed: ${error.message}`, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            📁 File Manager - With Duplicate Detection
          </h2>
          <button style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6b7280'
          }} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Debug Info */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>🔧 Enhanced Import:</strong> Project: {currentProjectId} | 
          Tasks: {tasks.length} | 
          Duplicate Detection: ✅ Active |
          Ready: {!!(projects && currentProjectId && setProjects) ? '✅' : '❌'}
        </div>

        {/* Task Import Section */}
        <div style={{
          border: '2px solid #10b981',
          borderRadius: '8px',
          padding: '16px',
          background: '#f0fdf4',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>📥 Import Tasks - With Duplicate Detection</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              Import Format:
            </label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                width: '100%',
                marginBottom: '12px'
              }}
            >
              <option value="json">JSON (Your tasks-all file)</option>
              <option value="csv">CSV (Your CSV export)</option>
            </select>
            
            <label style={{
              display: 'block',
              padding: '12px 16px',
              background: '#10b981',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              📤 Choose File to Import
              <input
                type="file"
                accept={importType === 'csv' ? '.csv' : '.json'}
                onChange={handleTaskImport}
                style={{ display: 'none' }}
              />
            </label>
            
            {importType === 'csv' && (
              <button 
                onClick={downloadTemplate}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                📋 Download CSV Template
              </button>
            )}
          </div>
          
          <div style={{
            fontSize: '14px',
            color: '#065f46',
            background: '#d1fae5',
            padding: '12px',
            borderRadius: '6px'
          }}>
            <strong>✅ Enhanced Features:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li><strong>Duplicate Detection:</strong> Checks task titles for duplicates</li>
              <li><strong>User Choice:</strong> Skip, duplicate, or replace existing tasks</li>
              <li><strong>Safe Import:</strong> No accidental overwrites</li>
              <li><strong>Smart Naming:</strong> Duplicates get date suffix</li>
              <li><strong>Full Control:</strong> You decide what happens</li>
            </ul>
          </div>
        </div>

        {/* Task Export Section */}
        <div style={{
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          background: '#f9fafb',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>📤 Export Tasks</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              Export Format:
            </label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                width: '100%',
                marginBottom: '12px'
              }}
            >
              <option value="csv">CSV (Excel compatible)</option>
              <option value="json">JSON</option>
            </select>
            
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              Filter Tasks:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                width: '100%',
                marginBottom: '12px'
              }}
            >
              <option value="all">All Tasks ({tasks.length})</option>
              <option value="active">Active Tasks</option>
              <option value="completed">Completed Tasks</option>
            </select>
            
            <button
              onClick={handleTaskExport}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              📥 Export Tasks
            </button>
          </div>
        </div>

        {/* Complete Backup Section */}
        <div style={{
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          background: '#f9fafb'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>💾 Complete Backup</h3>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCompleteBackup}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '12px 16px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📤 Export All Data
            </button>
            
            <label style={{
              flex: 1,
              minWidth: '200px',
              padding: '12px 16px',
              background: '#f59e0b',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              📥 Import All Data
              <input
                type="file"
                accept=".json"
                onChange={handleCompleteImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* Toast Notification */}
        {toast.show && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#10b981',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3)',
            zIndex: 1001,
            maxWidth: '400px'
          }}>
            {toast.message}
          </div>
        )}
      </div>

      {/* Duplicate Resolution Dialog */}
      {duplicateDialog.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Dialog Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #f59e0b'
            }}>
              <span style={{ fontSize: '24px', marginRight: '12px' }}>⚠️</span>
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
                Duplicate Tasks Found
              </h3>
            </div>

            {/* Duplicate Info */}
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#92400e' }}>
                Found {duplicateDialog.duplicates.length} duplicate task(s):
              </p>
              <div style={{
                maxHeight: '150px',
                overflow: 'auto',
                background: 'white',
                borderRadius: '6px',
                padding: '8px'
              }}>
                {duplicateDialog.duplicates.map((dup, index) => (
                  <div key={index} style={{
                    padding: '6px 0',
                    borderBottom: index < duplicateDialog.duplicates.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div style={{ fontWeight: '500', color: '#1f2937' }}>
                      "{dup.title}"
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      Existing: {dup.existingTask.status} | Import: {dup.newTask.status}
                      {dup.duplicateType && (
                        <span style={{ 
                          marginLeft: '8px', 
                          padding: '2px 6px', 
                          background: dup.duplicateType === 'both' ? '#ef4444' : 
                                     dup.duplicateType === 'title' ? '#f59e0b' : '#3b82f6',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          {dup.duplicateType === 'both' ? 'ID + Title' : 
                           dup.duplicateType === 'title' ? 'Title' : 'ID'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <button
                onClick={() => handleDuplicateResolution('skip')}
                style={{
                  padding: '14px 20px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>⏭️</span>
                <div>
                  <div style={{ fontWeight: '600' }}>Skip Duplicates</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    Don't import duplicate tasks, keep existing ones
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleDuplicateResolution('duplicate')}
                style={{
                  padding: '14px 20px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>📋</span>
                <div>
                  <div style={{ fontWeight: '600' }}>Import as Duplicates</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    Import with unique IDs and date suffix (e.g., "Task Name (Import 7/2/2025)")
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleDuplicateResolution('replace')}
                style={{
                  padding: '14px 20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>🔄</span>
                <div>
                  <div style={{ fontWeight: '600' }}>Replace Existing</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    Replace existing tasks with imported data (ensures unique IDs)
                  </div>
                </div>
              </button>
            </div>

            {/* Additional Info */}
            <div style={{
              marginTop: '20px',
              padding: '12px',
              background: '#f3f4f6',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              <strong>Note:</strong> {duplicateDialog.newTasks.length} unique tasks will be imported regardless of your choice.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;