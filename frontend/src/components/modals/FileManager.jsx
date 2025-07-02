import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const FileManager = ({ isOpen, onClose }) => {
  const { 
    tasks, 
    priorityCategories, 
    exportAllData, 
    importAllData 
  } = useApp();
  
  const [importType, setImportType] = useState('json');
  const [exportType, setExportType] = useState('csv');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // CSV parsing helper
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
    
    return rows;
  };

  // Convert CSV task to app format
  const convertCSVTask = (csvTask, categories) => {
    const priorityRatings = {};
    categories.forEach(category => {
      const rating = parseInt(csvTask[category.english] || csvTask[category.hebrew] || 0);
      priorityRatings[category.id] = Math.max(0, Math.min(5, rating));
    });

    return {
      title: csvTask.title || 'Untitled Task',
      project: csvTask.project || '',
      goal: csvTask.goal || '',
      update: csvTask.update || '',
      type: csvTask.type || '',
      status: csvTask.status || 'לא התחיל',
      dueDate: csvTask.dueDate || null,
      link: csvTask.link || '',
      isRepeating: csvTask.isRepeating === 'true' || false,
      repeatInterval: csvTask.repeatInterval || '',
      priorityRatings
    };
  };

  // Generate CSV content
  const generateTasksCSV = (tasks, categories) => {
    const headers = [
      'title', 'project', 'goal', 'update', 'type', 'status', 'dueDate', 'link',
      'isRepeating', 'repeatInterval',
      ...categories.map(cat => cat.english),
      'createdAt', 'completedAt'
    ];

    const rows = tasks.map(task => {
      const priorityScore = categories.reduce((score, cat) => {
        const rating = task.priorityRatings?.[cat.id] || 0;
        const weight = cat.weight || 0;
        return score + (rating * weight) / 100;
      }, 0);

      return [
        `"${task.title || ''}"`,
        `"${task.project || ''}"`,
        `"${task.goal || ''}"`,
        `"${task.update || ''}"`,
        `"${task.type || ''}"`,
        `"${task.status || ''}"`,
        task.dueDate || '',
        task.link || '',
        task.isRepeating || false,
        task.repeatInterval || '',
        ...categories.map(cat => task.priorityRatings?.[cat.id] || 0),
        task.createdAt || '',
        task.completedAt || ''
      ];
    });

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  // Task Import Handler - FIXED VERSION
  const handleTaskImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let importData;
        
        if (importType === 'json') {
          const data = JSON.parse(e.target.result);
          if (Array.isArray(data)) {
            // Direct tasks array
            importData = { tasks: data };
          } else if (data.tasks) {
            // Full export format
            importData = data;
          } else {
            throw new Error('Invalid JSON format. Expected tasks array or object with tasks property.');
          }
        } else if (importType === 'csv') {
          const csvTasks = parseCSV(e.target.result);
          const convertedTasks = csvTasks.map(csvTask => convertCSVTask(csvTask, priorityCategories));
          importData = { tasks: convertedTasks };
        }
        
        if (importData && importData.tasks && importData.tasks.length > 0) {
          // Use the context's importAllData function instead of setTasks directly
          const message = importAllData(importData);
          showToast(message);
        } else {
          showToast('No valid tasks found in the file.', 'error');
        }
      } catch (error) {
        console.error('Import error:', error);
        showToast(`Error importing file: ${error.message}`, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Task Export Handler
  const handleTaskExport = () => {
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

  // CSV Template Download
  const downloadTemplate = () => {
    const templateHeaders = [
      'title', 'project', 'goal', 'update', 'type', 'status', 'dueDate', 'link',
      'isRepeating', 'repeatInterval',
      ...priorityCategories.map(cat => cat.english)
    ];
    
    const sampleRow = [
      'Sample Task', 'Sample Project', 'Sample Goal', 'Sample Update',
      'מנהלה', 'לא התחיל', '2025-12-31', 'https://example.com',
      'false', '',
      ...priorityCategories.map(() => '3')
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
    
    showToast('Template downloaded! Fill it out and import your tasks.');
  };

  // Complete Data Backup
  const handleCompleteBackup = () => {
    try {
      const message = exportAllData();
      showToast(message);
    } catch (error) {
      showToast(`Export failed: ${error.message}`, 'error');
    }
  };

  // Complete Data Import
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
            📁 File Manager
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

        {/* Task Import Section */}
        <div style={{
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          background: '#f9fafb',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>📥 Import Tasks</h3>
          
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
              <option value="json">JSON (Complete backup)</option>
              <option value="csv">CSV (Tasks only)</option>
            </select>
            
            <label style={{
              display: 'block',
              padding: '12px 16px',
              background: '#4f46e5',
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
            color: '#6b7280',
            background: '#eff6ff',
            padding: '12px',
            borderRadius: '6px'
          }}>
            <strong>Import Tips:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>JSON files preserve all data including categories</li>
              <li>CSV files import tasks only</li>
              <li>Download the CSV template for proper format</li>
              <li>Use ratings 0-5 for priority values</li>
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
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3)',
            zIndex: 1001
          }}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManager;