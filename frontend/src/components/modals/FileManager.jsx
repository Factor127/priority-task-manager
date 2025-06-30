import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

// CSV Processing Functions
const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const tasks = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        if (values.length >= headers.length) {
            const task = {};
            headers.forEach((header, index) => {
                task[header] = values[index]?.replace(/"/g, '') || '';
            });
            tasks.push(task);
        }
    }
    
    return tasks;
};

const convertCSVTask = (csvTask, priorityCategories) => {
    const priorityRatings = {};
    
    // Map priority ratings from CSV columns
    priorityCategories.forEach(category => {
        const englishMatch = csvTask[category.english] || csvTask[category.english.toLowerCase()];
        const hebrewMatch = csvTask[category.hebrew];
        const idMatch = csvTask[category.id];
        
        const rating = englishMatch || hebrewMatch || idMatch;
        if (rating && !isNaN(rating)) {
            priorityRatings[category.id] = Math.min(5, Math.max(0, parseInt(rating)));
        }
    });
    
    return {
        id: Date.now() + Math.random(),
        title: csvTask.title || csvTask.Title || csvTask.כותרת || 'Imported Task',
        project: csvTask.project || csvTask.Project || csvTask.פרויקט || '',
        goal: csvTask.goal || csvTask.Goal || csvTask.מטרה || '',
        update: csvTask.update || csvTask.Update || csvTask.עדכון || '',
        type: csvTask.type || csvTask.Type || csvTask.סוג || '',
        status: csvTask.status || csvTask.Status || csvTask.סטטוס || 'לא התחיל',
        dueDate: csvTask.dueDate || csvTask['due date'] || csvTask['Due Date'] || csvTask['תאריך יעד'] || '',
        isRepeating: csvTask.isRepeating === 'true' || csvTask.repeating === 'true',
        repeatInterval: csvTask.repeatInterval || csvTask.interval || 'daily',
        link: csvTask.link || csvTask.Link || csvTask.קישור || '',
        priorityRatings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null
    };
};

const generateTasksCSV = (tasks, priorityCategories) => {
    const headers = [
        'title', 'project', 'goal', 'update', 'type', 'status', 
        'dueDate', 'link', 'isRepeating', 'repeatInterval',
        ...priorityCategories.map(cat => cat.english),
        'priorityScore', 'createdAt', 'completedAt'
    ];
    
    const csvContent = [
        headers.join(','),
        ...tasks.map(task => {
            // Calculate priority score for export
            let priorityScore = 0;
            priorityCategories.forEach(category => {
                const rating = task.priorityRatings[category.id] || 0;
                const weight = category.weight;
                priorityScore += (rating * weight) / 100;
            });
            
            const row = [
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
                ...priorityCategories.map(cat => task.priorityRatings[cat.id] || 0),
                Math.round(priorityScore * 10) / 10,
                task.createdAt || '',
                task.completedAt || ''
            ];
            return row.join(',');
        })
    ].join('\n');
    
    return csvContent;
};

const FileManager = ({ onClose }) => {
    const { tasks, priorityCategories, exportAllData, importAllData, setTasks, savedProjects, setSavedProjects } = useApp();
    const [importType, setImportType] = useState('json');
    const [exportType, setExportType] = useState('csv');
    const [filterStatus, setFilterStatus] = useState('all');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // Task Import Handler
    const handleTaskImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let importedTasks = [];
                
                if (importType === 'json') {
                    const data = JSON.parse(e.target.result);
                    importedTasks = Array.isArray(data) ? data : (data.tasks || []);
                } else if (importType === 'csv') {
                    const csvTasks = parseCSV(e.target.result);
                    importedTasks = csvTasks.map(csvTask => convertCSVTask(csvTask, priorityCategories));
                }
                
                if (importedTasks.length > 0) {
                    // Add unique IDs and timestamps
                    const tasksWithUniqueIds = importedTasks.map(task => ({
                        ...task,
                        id: task.id || Date.now() + Math.random(),
                        createdAt: task.createdAt || new Date().toISOString(),
                        updatedAt: task.updatedAt || new Date().toISOString()
                    }));
                    
                    setTasks(prev => [...prev, ...tasksWithUniqueIds]);
                    
                    // Add new projects to saved projects
                    const newProjects = tasksWithUniqueIds
                        .map(task => task.project)
                        .filter(project => project && !savedProjects.includes(project));
                    
                    if (newProjects.length > 0) {
                        setSavedProjects(prev => [...prev, ...newProjects]);
                    }
                    
                    showToast(`Successfully imported ${tasksWithUniqueIds.length} tasks!`);
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
            ...priorityCategories.map(cat => cat.english)
        ];
        
        const sampleRow = [
            'Sample Task', 'Sample Project', 'Sample Goal', 'Sample Update',
            'מנהלה', 'לא התחיל', '2025-12-31', 'https://example.com',
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

    return (
        <div 
            style={{
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
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '700px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
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
                    <button 
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#6b7280'
                        }}
                        onClick={onClose}
                    >
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
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                        </select>
                        
                        <label style={{
                            display: 'block',
                            padding: '10px 16px',
                            background: '#4f46e5',
                            color: 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            marginBottom: '8px'
                        }}>
                            📤 Select {importType.toUpperCase()} File
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
                        <strong>CSV Import Tips:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            <li>Download the template to see expected format</li>
                            <li>Priority columns should match your category names</li>
                            <li>Use ratings 0-5 for priority values</li>
                            <li>Hebrew text is supported</li>
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
                            <option value="active">Active Tasks ({tasks.filter(t => t.status !== 'הושלם').length})</option>
                            <option value="completed">Completed Tasks ({tasks.filter(t => t.status === 'הושלם').length})</option>
                            {[...new Set(tasks.map(t => t.status))].map(status => (
                                <option key={status} value={status} className="hebrew">
                                    {status} ({tasks.filter(t => t.status === status).length})
                                </option>
                            ))}
                        </select>
                        
                        <button 
                            onClick={handleTaskExport}
                            style={{
                                width: '100%',
                                padding: '10px 16px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            💾 Export {exportType.toUpperCase()}
                        </button>
                    </div>
                </div>

                {/* Complete Backup Section */}
                <div style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    background: '#f9fafb',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>🔐 Complete Data Backup</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button 
                            onClick={handleCompleteBackup}
                            style={{
                                padding: '10px 16px',
                                background: '#8b5cf6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            📤 Export Complete Backup (All Data)
                        </button>
                        
                        <label style={{
                            padding: '10px 16px',
                            background: '#f59e0b',
                            color: 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'center'
                        }}>
                            📥 Import Complete Backup
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleCompleteImport}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                    
                    <div style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginTop: '12px',
                        padding: '12px',
                        background: '#fef3c7',
                        borderRadius: '6px'
                    }}>
                        <strong>Complete Backup includes:</strong> All tasks, priority categories, 
                        saved projects, user progress, and settings.
                    </div>
                </div>

                {/* Current Data Summary */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '15px',
                    marginBottom: '20px'
                }}>
                    <div style={{ textAlign: 'center', padding: '10px', background: '#eff6ff', borderRadius: '6px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4f46e5' }}>{tasks.length}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Tasks</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', background: '#f0fdf4', borderRadius: '6px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{priorityCategories.length}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Categories</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', background: '#fef3c7', borderRadius: '6px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{tasks.filter(t => t.status !== 'הושלם').length}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Active</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', background: '#f0fdf4', borderRadius: '6px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>{tasks.filter(t => t.status === 'הושלם').length}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Completed</div>
                    </div>
                </div>

                {/* Close Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        onClick={onClose}
                        style={{
                            padding: '10px 16px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
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
                        zIndex: 1002
                    }}>
                        {toast.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileManager;