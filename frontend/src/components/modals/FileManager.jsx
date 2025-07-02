import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useProjects } from '../../context/ProjectContext'; // NEW: Import project context

const FileManager = ({ isOpen, onClose }) => {
  const { 
    tasks, 
    priorityCategories, 
    exportAllData, 
    importAllData,
    setTasks,
    savedProjects,
    setSavedProjects
  } = useApp();
  
  // NEW: Project context integration
  const {
    projects,
    currentProjectId,
    getCurrentProject,
    setCurrentProject,
    addTask: addProjectTask,
    getProjectsSortedByPriority
  } = useProjects();
  
  const [importType, setImportType] = useState('json');
  const [exportType, setExportType] = useState('csv');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // NEW: Import flow states
  const [importStep, setImportStep] = useState('select'); // 'select', 'project-choice', 'importing', 'success'
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId);
  const [importPreview, setImportPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Duplicate handling state
  const [duplicateDialog, setDuplicateDialog] = useState({
    show: false,
    duplicates: [],
    newTasks: [],
    onResolve: null
  });

  // Reset import state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setImportStep('select');
      setSelectedFile(null);
      setSelectedProjectId(currentProjectId);
      setImportPreview(null);
      setImportResult(null);
      setIsProcessing(false);
    }
  }, [isOpen, currentProjectId]);

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

  // Convert CSV task with project-specific categories
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
      id: csvTask.id || generateUniqueId(),
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

  // NEW: Analyze import data to show preview
  const analyzeImportData = (data) => {
    let taskCount = 0;
    let projectCount = 0;
    let dataType = 'unknown';

    if (data.projects) {
      // New project-based format
      dataType = 'project-based';
      projectCount = Object.keys(data.projects).length;
      taskCount = Object.values(data.projects).reduce((total, project) => {
        return total + (project.tasks ? project.tasks.length : 0);
      }, 0);
    } else if (data.tasks || Array.isArray(data)) {
      // Legacy task list format
      dataType = 'task-list';
      const tasks = data.tasks || data;
      taskCount = Array.isArray(tasks) ? tasks.length : 0;
    } else if (data.project && data.project.tasks) {
      // Single project export
      dataType = 'single-project';
      taskCount = data.project.tasks.length;
      projectCount = 1;
    }

    return {
      dataType,
      taskCount,
      projectCount,
      hasCategories: !!(data.priorityCategories || data.categories),
      hasUserData: !!(data.user),
      fileName: selectedFile?.name || 'Unknown',
      fileSize: selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : 'Unknown'
    };
  };

  // NEW: Handle file selection with preview
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (importType === 'json' && (file.type !== 'application/json' && !file.name.endsWith('.json'))) {
      showToast('Please select a JSON file', 'error');
      return;
    }

    if (importType === 'csv' && !file.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    // Read and preview file content
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data;
        
        if (importType === 'json') {
          data = JSON.parse(e.target.result);
        } else if (importType === 'csv') {
          const csvTasks = parseCSV(e.target.result);
          data = { tasks: csvTasks };
        }
        
        // Analyze the import data structure
        const preview = analyzeImportData(data);
        setImportPreview({ ...preview, rawData: data });
        setImportStep('project-choice');
        setIsProcessing(false);
      } catch (error) {
        console.error('File parsing error:', error);
        showToast(`Invalid ${importType.toUpperCase()} file. Please check the file format.`, 'error');
        setSelectedFile(null);
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  // NEW: Execute import to selected project
  const handleImportToProject = async () => {
    if (!selectedFile || !selectedProjectId || !importPreview) return;

    setIsProcessing(true);
    setImportStep('importing');

    try {
      const targetProject = projects[selectedProjectId];
      if (!targetProject) {
        throw new Error('Target project not found');
      }

      const { rawData } = importPreview;
      let tasksToImport = [];

      // Extract tasks based on data format
      if (rawData.projects) {
        // Import from project-based export - combine all tasks
        Object.values(rawData.projects).forEach(project => {
          if (project.tasks && project.tasks.length > 0) {
            tasksToImport.push(...project.tasks);
          }
        });
      } else if (rawData.tasks || Array.isArray(rawData)) {
        // Import from legacy task list or direct array
        tasksToImport = rawData.tasks || rawData;
      } else if (rawData.project && rawData.project.tasks) {
        // Import from single project export
        tasksToImport = rawData.project.tasks;
      }

      // Convert CSV tasks if needed
      if (importType === 'csv') {
        tasksToImport = tasksToImport.map(csvTask => 
          convertCSVTask(csvTask, targetProject.priorityCategories)
        );
      }

      console.log(`📥 Processing ${tasksToImport.length} tasks for import to project: ${targetProject.name}`);

      // Process tasks with duplicate detection
      await importTasksToProject(tasksToImport, selectedProjectId);

    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        error: error.message
      });
      setImportStep('success');
    } finally {
      setIsProcessing(false);
    }
  };

  // NEW: Import tasks to specific project with duplicate detection
  const importTasksToProject = async (tasksToImport, projectId) => {
    const targetProject = projects[projectId];
    const existingProjectTasks = targetProject.tasks || [];
    
    // Check for duplicates within the project
    const { duplicates, uniqueTasks } = findDuplicates(tasksToImport, existingProjectTasks);
    
    if (duplicates.length > 0) {
      console.log('⚠️ Found', duplicates.length, 'duplicate tasks in project');
      
      // Show duplicate dialog for project-specific duplicates
      setDuplicateDialog({
        show: true,
        duplicates,
        newTasks: uniqueTasks,
        targetProjectId: projectId,
        onResolve: async (duplicateResolution) => {
          // Combine unique tasks with resolved duplicates
          const allTasksToAdd = [...uniqueTasks, ...duplicateResolution];
          await addTasksToProject(allTasksToAdd, projectId);
        }
      });
      
      return;
    }
    
    // No duplicates - proceed with direct import
    await addTasksToProject(uniqueTasks, projectId);
  };

  // NEW: Add tasks to project using project context
  const addTasksToProject = async (tasksToAdd, projectId) => {
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const taskData of tasksToAdd) {
      try {
        // Generate new ID to avoid conflicts and ensure uniqueness
        const newTask = {
          ...taskData,
          id: generateUniqueId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null // Clear completion status for imports
        };

        // Use project context to add task
        await addProjectTask(newTask);
        importedCount++;
      } catch (error) {
        console.warn('Failed to import task:', taskData.title, error);
        skippedCount++;
      }
    }

    // Update saved projects list
    const newProjects = tasksToAdd
      .map(task => task.project)
      .filter(project => project && !savedProjects.includes(project));
    
    if (newProjects.length > 0) {
      setSavedProjects(prev => [...prev, ...newProjects]);
    }

    setImportResult({
      success: true,
      taskCount: importedCount,
      skippedCount,
      projectName: projects[projectId]?.name || 'Unknown Project'
    });
    setImportStep('success');
  };

  // ENHANCED DUPLICATE DETECTION: Check for duplicates by title AND ID
  const findDuplicates = (newTasks, existingTasks) => {
    console.log('🔍 Checking for duplicates by title and ID...');
    
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

    console.log('🔍 Duplicate check results:', {
      total: newTasks.length,
      duplicates: duplicates.length,
      unique: uniqueTasks.length
    });

    return { duplicates, uniqueTasks };
  };

  // DUPLICATE RESOLUTION: Handle user's choice for duplicates
  const handleDuplicateResolution = (action) => {
    const { duplicates, onResolve } = duplicateDialog;
    
    console.log('🔧 Resolving duplicates with action:', action);
    
    let tasksToAdd = [];
    
    if (action === 'skip') {
      tasksToAdd = [];
    } else if (action === 'duplicate') {
      tasksToAdd = duplicates.map(dup => ({
        ...dup.newTask,
        id: generateUniqueId(),
        title: `${dup.newTask.title} (Import ${new Date().toLocaleDateString()})`,
        updatedAt: new Date().toISOString()
      }));
    } else if (action === 'replace') {
      tasksToAdd = duplicates.map(dup => ({
        ...dup.newTask,
        id: generateUniqueId(), // Always generate new ID for safety
        updatedAt: new Date().toISOString()
      }));
    }

    // Close dialog and process
    setDuplicateDialog({ show: false, duplicates: [], newTasks: [], onResolve: null });
    
    // Call the resolution callback
    if (onResolve) {
      onResolve(tasksToAdd);
    }
  };

  // Helper function to generate truly unique IDs
  const generateUniqueId = () => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Reset import process
  const resetImport = () => {
    setImportStep('select');
    setSelectedFile(null);
    setImportPreview(null);
    setImportResult(null);
    setIsProcessing(false);
    // Reset file input
    const fileInput = document.getElementById('import-file');
    if (fileInput) fileInput.value = '';
  };

  // EXISTING EXPORT FUNCTIONS (Enhanced with project support)

  // NEW: Export current project only
  const handleExportCurrentProject = () => {
    try {
      const currentProject = getCurrentProject();
      if (!currentProject) {
        showToast('No current project selected', 'error');
        return;
      }

      const exportData = {
        project: currentProject,
        exportDate: new Date().toISOString(),
        exportType: 'single-project',
        version: '2.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showToast(`Project "${currentProject.name}" exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      showToast('Export failed: ' + error.message, 'error');
    }
  };

  // NEW: Export all projects
  const handleExportAllProjects = () => {
    try {
      const exportData = {
        projects,
        exportDate: new Date().toISOString(),
        exportType: 'all-projects',
        version: '2.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `priority-tasks-all-projects-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showToast('All projects exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Export failed: ' + error.message, 'error');
    }
  };

  // Generate CSV for export (updated for current project)
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

  // Export handler (updated for current project)
  const handleTaskExport = () => {
    console.log('📤 Starting export...');
    
    const currentProject = getCurrentProject();
    if (!currentProject) {
      showToast('No current project selected', 'error');
      return;
    }

    const projectTasks = currentProject.tasks || [];
    const filteredTasks = projectTasks.filter(task => {
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
      content = generateTasksCSV(filteredTasks, currentProject.priorityCategories);
      filename = `${currentProject.name}-tasks-${filterStatus}-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(filteredTasks, null, 2);
      filename = `${currentProject.name}-tasks-${filterStatus}-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${filteredTasks.length} tasks from ${currentProject.name}!`);
  };

  // Template download (updated for current project categories)
  const downloadTemplate = () => {
    const currentProject = getCurrentProject();
    const categories = currentProject?.priorityCategories || priorityCategories;
    
    const templateHeaders = [
      'title', 'project', 'goal', 'update', 'type', 'status', 'dueDate', 'link',
      'isRepeating', 'repeatInterval',
      ...categories.map(cat => cat.english),
      'createdAt', 'updatedAt', 'completedAt'
    ];
    
    const sampleRow = [
      'Sample Task', 'Sample Project', 'Sample Goal', 'Sample Update',
      'מנהלה', 'לא התחיל', '2025-12-31', 'https://example.com',
      'false', 'monthly',
      ...categories.map(() => '3'),
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
    a.download = `task-import-template-${currentProject?.name || 'default'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`Template downloaded for ${currentProject?.name || 'current project'}!`);
  };

  // Complete backup handlers (keep existing)
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
            📁 File Manager - Project-Based Import
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

        {/* Current Project Info */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>🎯 Current Project:</strong> {getCurrentProject()?.name || 'None'} | 
          Tasks: {getCurrentProject()?.tasks?.length || 0} | 
          Total Projects: {Object.keys(projects).length}
        </div>

        {/* NEW: Enhanced Task Import Section with Project Selection */}
        <div style={{
          border: '2px solid #10b981',
          borderRadius: '8px',
          padding: '16px',
          background: '#f0fdf4',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>📥 Import Tasks to Project</h3>
          
          {importStep === 'select' && (
            <div>
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
                  <option value="json">JSON (Tasks or Projects)</option>
                  <option value="csv">CSV (Task List)</option>
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
                  {isProcessing ? 'Processing...' : '📤 Choose File to Import'}
                  <input
                    id="import-file"
                    type="file"
                    accept={importType === 'csv' ? '.csv' : '.json'}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={isProcessing}
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
                    📋 Download CSV Template for Current Project
                  </button>
                )}
              </div>
            </div>
          )}

          {importStep === 'project-choice' && importPreview && (
            <div>
              {/* File Preview */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <h5 style={{ margin: '0 0 12px 0', fontWeight: '600' }}>📄 File Preview:</h5>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px' }}>
                  <div><strong>{importPreview.taskCount}</strong> tasks</div>
                  {importPreview.projectCount > 0 && (
                    <div><strong>{importPreview.projectCount}</strong> projects</div>
                  )}
                  <div><strong>{importPreview.fileSize}</strong></div>
                  <div>Type: <strong>{importPreview.dataType}</strong></div>
                </div>
              </div>

              {/* Project Selection */}
              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  🎯 Select Target Project:
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    fontSize: '14px'
                  }}
                >
                  {getProjectsSortedByPriority().map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({(project.tasks || []).length} existing tasks)
                    </option>
                  ))}
                </select>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#92400e' }}>
                  All {importPreview.taskCount} tasks will be imported to this project
                </p>
              </div>

              {/* Import Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={resetImport}
                  style={{
                    padding: '10px 16px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImportToProject}
                  disabled={!selectedProjectId}
                  style={{
                    padding: '10px 16px',
                    background: selectedProjectId ? '#10b981' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: selectedProjectId ? 'pointer' : 'not-allowed'
                  }}
                >
                  Import to {projects[selectedProjectId]?.name}
                </button>
              </div>
            </div>
          )}

          {importStep === 'importing' && (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <p>Importing tasks to {projects[selectedProjectId]?.name}...</p>
            </div>
          )}

          {importStep === 'success' && importResult && (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              {importResult.success ? (
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                  <h5 style={{ color: '#059669', marginBottom: '16px' }}>Import Successful!</h5>
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>{importResult.taskCount}</strong> tasks imported to project <strong>{importResult.projectName}</strong>
                    </p>
                    {importResult.skippedCount > 0 && (
                      <p style={{ margin: '0', color: '#d97706' }}>
                        {importResult.skippedCount} tasks skipped due to errors
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => {
                        setCurrentProject(selectedProjectId);
                        onClose();
                      }}
                      style={{
                        padding: '10px 16px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Go to {importResult.projectName}
                    </button>
                    <button 
                      onClick={resetImport}
                      style={{
                        padding: '10px 16px',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Import More Files
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '16px', color: '#ef4444' }}>❌</div>
                  <h5 style={{ color: '#dc2626', marginBottom: '16px' }}>Import Failed</h5>
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <p style={{ margin: '0', color: '#dc2626' }}>{importResult.error}</p>
                  </div>
                  <button 
                    onClick={resetImport}
                    style={{
                      padding: '10px 16px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div style={{
            fontSize: '14px',
            color: '#065f46',
            background: '#d1fae5',
            padding: '12px',
            borderRadius: '6px',
            marginTop: '16px'
          }}>
            <strong>✅ Project-Based Import Features:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li><strong>Choose Target:</strong> Select which project to import tasks into</li>
              <li><strong>File Preview:</strong> See what you're importing before proceeding</li>
              <li><strong>Duplicate Detection:</strong> Checks for duplicates within the target project</li>
              <li><strong>Safe Import:</strong> Generates unique IDs to prevent conflicts</li>
              <li><strong>Smart Categories:</strong> Uses target project's priority categories</li>
            </ul>
          </div>
        </div>

        {/* Enhanced Export Section */}
        <div style={{
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          background: '#f9fafb',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>📤 Export Options</h3>
          
          {/* Current Project Export */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
              Current Project: {getCurrentProject()?.name || 'None'}
            </h4>
            
            <div style={{ marginBottom: '12px' }}>
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
                <option value="all">All Tasks ({getCurrentProject()?.tasks?.length || 0})</option>
                <option value="active">Active Tasks</option>
                <option value="completed">Completed Tasks</option>
              </select>
              
              <button
                onClick={handleTaskExport}
                disabled={!getCurrentProject()}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: getCurrentProject() ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: getCurrentProject() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}
              >
                📥 Export Current Project
              </button>

              <button
                onClick={handleExportCurrentProject}
                disabled={!getCurrentProject()}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: getCurrentProject() ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: getCurrentProject() ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                📦 Export Project Structure (JSON)
              </button>
            </div>
          </div>

          {/* All Projects Export */}
          <div style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '16px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
              All Projects Export
            </h4>
            <button
              onClick={handleExportAllProjects}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              📁 Export All Projects & Data
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
          <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>💾 Legacy Backup</h3>
          
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
              📤 Export Legacy Format
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
              📥 Import Legacy Data
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

        {/* Add CSS for spinner animation */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
                Duplicate Tasks Found in {projects[duplicateDialog.targetProjectId]?.name}
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
                Found {duplicateDialog.duplicates.length} duplicate task(s) in this project:
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
                    Don't import duplicate tasks, keep existing ones in {projects[duplicateDialog.targetProjectId]?.name}
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
                    Import with unique IDs and date suffix (e.g., "Task Name (Import {new Date().toLocaleDateString()})")
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
                    Replace existing tasks in {projects[duplicateDialog.targetProjectId]?.name} with imported data
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
              <strong>Note:</strong> {duplicateDialog.newTasks?.length || 0} unique tasks will be imported to {projects[duplicateDialog.targetProjectId]?.name} regardless of your choice.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;