import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';

// =================
// CONSTANTS
// =================

const AUTOSAVE_STATES = {
    IDLE: 'idle',
    SAVING: 'saving', 
    SAVED: 'saved',
    ERROR: 'error'
};

const DEFAULT_PRIORITY_CATEGORIES = [
    { id: 'income', english: 'Income/Revenue', hebrew: 'הכנסה לשוטף', weight: 40, color: '#10B981' },
    { id: 'home', english: 'Home Management', hebrew: 'ניהול בית', weight: 15, color: '#3B82F6' },
    { id: 'plan', english: '5-Year Plan', hebrew: 'תוכנית חומש', weight: 5, color: '#8B5CF6' },
    { id: 'social', english: 'Social', hebrew: 'סוציאל', weight: 20, color: '#F59E0B' },
    { id: 'relationship', english: 'Relationship', hebrew: 'זוגיות', weight: 5, color: '#EF4444' },
    { id: 'personal', english: 'Personal', hebrew: 'עצמי', weight: 20, color: '#06B6D4' },
    { id: 'children', english: 'Children', hebrew: 'ילדים', weight: 30, color: '#84CC16' }
];

const DEFAULT_PROJECTS = [
    'Personal Development',
    'Business Growth', 
    'Family',
    'Health',
    'Learning',
    'Finance'
];

// =================
// CONTEXT CREATION
// =================

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

// =================
// PROVIDER COMPONENT
// =================

export const AppProvider = ({ children }) => {
    // Multi-project state
    const [projects, setProjects] = useState({});
    const [currentProjectId, setCurrentProjectId] = useState('default');
    const [overallSaveState, setOverallSaveState] = useState(AUTOSAVE_STATES.IDLE);
    
    // Refs for auto-save
    const saveTimeoutRef = useRef(null);
    const lastSaveRef = useRef(Date.now());

    // =================
    // UTILITY FUNCTIONS
    // =================

    const saveToLocalStorage = useCallback((key, value) => {
        try {
            if (value === undefined || value === null) {
                console.log(`localStorage key "${key}" is empty, using default`);
                return false;
            }
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Failed to save ${key} to localStorage:`, error);
            return false;
        }
    }, []);

    const loadFromLocalStorage = useCallback((key, defaultValue) => {
        try {
            const item = localStorage.getItem(key);
            if (item === null || item === undefined) {
                console.log(`localStorage key "${key}" is empty, using default`);
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error(`Failed to load ${key} from localStorage:`, error);
            return defaultValue;
        }
    }, []);

    // =================
    // INITIALIZE DATA
    // =================

    useEffect(() => {
        const loadedProjects = loadFromLocalStorage('multiProjects', {});
        const loadedCurrentProjectId = loadFromLocalStorage('currentProject', 'default');
        
        // Initialize default project if none exists
        if (Object.keys(loadedProjects).length === 0) {
            const defaultProject = {
                id: 'default',
                name: 'Default Project',
                tasks: [],
                priorityCategories: DEFAULT_PRIORITY_CATEGORIES,
                savedProjects: DEFAULT_PROJECTS,
                createdAt: new Date().toISOString()
            };
            setProjects({ default: defaultProject });
            setCurrentProjectId('default');
        } else {
            setProjects(loadedProjects);
            setCurrentProjectId(loadedCurrentProjectId);
        }
    }, [loadFromLocalStorage]);

    // =================
    // AUTO-SAVE LOGIC
    // =================

    const scheduleAutoSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        setOverallSaveState(AUTOSAVE_STATES.SAVING);
        
        saveTimeoutRef.current = setTimeout(() => {
            try {
                const success1 = saveToLocalStorage('multiProjects', projects);
                const success2 = saveToLocalStorage('currentProject', currentProjectId);
                
                if (success1 && success2) {
                    setOverallSaveState(AUTOSAVE_STATES.SAVED);
                    lastSaveRef.current = Date.now();
                    
                    setTimeout(() => {
                        setOverallSaveState(AUTOSAVE_STATES.IDLE);
                    }, 2000);
                } else {
                    setOverallSaveState(AUTOSAVE_STATES.ERROR);
                }
            } catch (error) {
                console.error('Auto-save failed:', error);
                setOverallSaveState(AUTOSAVE_STATES.ERROR);
            }
        }, 800);
    }, [projects, currentProjectId, saveToLocalStorage]);

    // Trigger auto-save when projects change
    useEffect(() => {
        if (Object.keys(projects).length > 0) {
            scheduleAutoSave();
        }
    }, [projects, scheduleAutoSave]);

    // =================
    // DERIVED STATE
    // =================

    const currentProject = projects[currentProjectId] || null;
    const tasks = currentProject?.tasks || [];
    const priorityCategories = currentProject?.priorityCategories || DEFAULT_PRIORITY_CATEGORIES;
    const savedProjects = currentProject?.savedProjects || DEFAULT_PROJECTS;

    // =================
    // PROJECT MANAGEMENT
    // =================

    const updateProject = useCallback((projectId, updates) => {
        setProjects(prev => ({
            ...prev,
            [projectId]: {
                ...prev[projectId],
                ...updates,
                updatedAt: new Date().toISOString()
            }
        }));
    }, []);

    const createProject = useCallback((name) => {
        const newProjectId = `project_${Date.now()}`;
        const newProject = {
            id: newProjectId,
            name,
            tasks: [],
            priorityCategories: DEFAULT_PRIORITY_CATEGORIES,
            savedProjects: DEFAULT_PROJECTS,
            createdAt: new Date().toISOString()
        };
        
        setProjects(prev => ({
            ...prev,
            [newProjectId]: newProject
        }));
        
        return newProjectId;
    }, []);

    const deleteProject = useCallback((projectId) => {
        if (projectId === 'default') return false;
        
        setProjects(prev => {
            const newProjects = { ...prev };
            delete newProjects[projectId];
            return newProjects;
        });
        
        if (currentProjectId === projectId) {
            setCurrentProjectId('default');
        }
        
        return true;
    }, [currentProjectId]);

    const switchProject = useCallback((projectId) => {
        if (projects[projectId]) {
            setCurrentProjectId(projectId);
            return true;
        }
        return false;
    }, [projects]);

    // =================
    // CURRENT PROJECT OPERATIONS
    // =================

    const setTasks = useCallback((newTasks) => {
        if (typeof newTasks === 'function') {
            updateProject(currentProjectId, {
                tasks: newTasks(tasks)
            });
        } else {
            updateProject(currentProjectId, {
                tasks: newTasks
            });
        }
    }, [currentProjectId, tasks, updateProject]);

    const setPriorityCategories = useCallback((newCategories) => {
        if (typeof newCategories === 'function') {
            updateProject(currentProjectId, {
                priorityCategories: newCategories(priorityCategories)
            });
        } else {
            updateProject(currentProjectId, {
                priorityCategories: newCategories
            });
        }
    }, [currentProjectId, priorityCategories, updateProject]);

    const setSavedProjects = useCallback((newProjects) => {
        if (typeof newProjects === 'function') {
            updateProject(currentProjectId, {
                savedProjects: newProjects(savedProjects)
            });
        } else {
            updateProject(currentProjectId, {
                savedProjects: newProjects
            });
        }
    }, [currentProjectId, savedProjects, updateProject]);

    // =================
    // DATA EXPORT/IMPORT
    // =================

    const exportAllData = useCallback(() => {
        try {
            const exportData = {
                projects,
                currentProjectId,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `task-manager-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return 'Data exported successfully!';
        } catch (error) {
            console.error('Export failed:', error);
            throw new Error('Export failed: ' + error.message);
        }
    }, [projects, currentProjectId]);

    const importAllData = useCallback((importData) => {
        try {
            if (importData.projects) {
                setProjects(importData.projects);
                if (importData.currentProjectId && importData.projects[importData.currentProjectId]) {
                    setCurrentProjectId(importData.currentProjectId);
                }
                return 'Data imported successfully!';
            } else if (importData.tasks) {
                // Legacy format - add to current project
                updateProject(currentProjectId, {
                    tasks: importData.tasks,
                    priorityCategories: importData.priorityCategories || priorityCategories,
                    savedProjects: importData.savedProjects || savedProjects
                });
                return 'Legacy data imported successfully!';
            }
            return 'Invalid import format';
        } catch (error) {
            console.error('Import failed:', error);
            return 'Import failed: ' + error.message;
        }
    }, [currentProjectId, priorityCategories, savedProjects, updateProject]);

    // =================
    // FORCE SAVE
    // =================

    const forceSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        setOverallSaveState(AUTOSAVE_STATES.SAVING);
        
        try {
            const success1 = saveToLocalStorage('multiProjects', projects);
            const success2 = saveToLocalStorage('currentProject', currentProjectId);
            
            if (success1 && success2) {
                setOverallSaveState(AUTOSAVE_STATES.SAVED);
                lastSaveRef.current = Date.now();
                
                setTimeout(() => {
                    setOverallSaveState(AUTOSAVE_STATES.IDLE);
                }, 2000);
            } else {
                setOverallSaveState(AUTOSAVE_STATES.ERROR);
            }
        } catch (error) {
            console.error('Force save failed:', error);
            setOverallSaveState(AUTOSAVE_STATES.ERROR);
        }
    }, [projects, currentProjectId, saveToLocalStorage]);

    // =================
    // CLEANUP
    // =================

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // =================
    // CONTEXT VALUE
    // =================

    const contextValue = useMemo(() => ({
        // Multi-project state
        projects,
        currentProjectId,
        currentProject,
        
        // Current project data (for backward compatibility)
        tasks,
        priorityCategories,
        savedProjects,
        
        // Project management
        createProject,
        deleteProject,
        updateProject,
        switchProject,
        
        // Current project operations  
        setTasks,
        setPriorityCategories,
        setSavedProjects,
        
        // Auto-save
        overallSaveState,
        forceSave,
        AUTOSAVE_STATES,
        
        // Export/Import
        exportAllData,
        importAllData
    }), [
        projects,
        currentProjectId,
        currentProject,
        tasks,
        priorityCategories,
        savedProjects,
        createProject,
        deleteProject,
        updateProject,
        switchProject,
        setTasks,
        setPriorityCategories,
        setSavedProjects,
        overallSaveState,
        forceSave,
        exportAllData,
        importAllData
    ]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};