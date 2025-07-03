import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import apiService from '../services/api';

// =================
// CONSTANTS
// =================

const AUTOSAVE_STATES = {
    IDLE: 'idle',
    SAVING: 'saving', 
    SAVED: 'saved',
    ERROR: 'error'
};

// Updated to match backend default categories
const DEFAULT_PRIORITY_CATEGORIES = [
    { id: 'impact', english: 'Impact', hebrew: 'השפעה', weight: 25, color: '#FF6B6B' },
    { id: 'urgency', english: 'Urgency', hebrew: 'דחיפות', weight: 20, color: '#4ECDC4' },
    { id: 'effort', english: 'Effort Required', hebrew: 'מאמץ נדרש', weight: 15, color: '#45B7D1' },
    { id: 'alignment', english: 'Goal Alignment', hebrew: 'התאמה למטרות', weight: 15, color: '#96CEB4' },
    { id: 'learning', english: 'Learning Value', hebrew: 'ערך לימודי', weight: 10, color: '#FFEAA7' },
    { id: 'enjoyment', english: 'Enjoyment', hebrew: 'הנאה', weight: 10, color: '#DDA0DD' },
    { id: 'risk', english: 'Risk Level', hebrew: 'רמת סיכון', weight: 5, color: '#FFB6C1' }
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
    // Multi-project state (existing)
    const [projects, setProjects] = useState({});
    const [currentProjectId, setCurrentProjectId] = useState('default');
    const [overallSaveState, setOverallSaveState] = useState(AUTOSAVE_STATES.IDLE);
    
    // NEW: API integration state
    const [apiStatus, setApiStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [isOnline, setIsOnline] = useState(true);
    const [syncMode, setSyncMode] = useState('localStorage'); // 'localStorage', 'api', 'hybrid'
    const [lastApiSync, setLastApiSync] = useState(null);
    const [apiError, setApiError] = useState(null);
    
    // Refs for auto-save (existing)
    const saveTimeoutRef = useRef(null);
    const lastSaveRef = useRef(Date.now());

    // =================
    // UTILITY FUNCTIONS (existing + enhanced)
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

    // NEW: API utility functions
    const handleApiError = useCallback((error) => {
        console.error('API Error:', error);
        setApiError(error.message);
        setApiStatus('error');
        
        // If it's a network error, switch to offline mode
        if (error.message.includes('fetch') || error.message.includes('network')) {
            setIsOnline(false);
            setSyncMode('localStorage');
        }
    }, []);

    const clearApiError = useCallback(() => {
        setApiError(null);
        setApiStatus('idle');
    }, []);

    // =================
    // API OPERATIONS
    // =================

    const testApiConnection = useCallback(async () => {
        try {
            setApiStatus('loading');
            await apiService.healthCheck();
            setIsOnline(true);
            setApiStatus('success');
            setSyncMode('api');
            return true;
        } catch (error) {
            handleApiError(error);
            return false;
        }
    }, [handleApiError]);

    const syncWithApi = useCallback(async () => {
        if (!isOnline) return false;
        
        try {
            setApiStatus('loading');
            
            // Load categories and tasks from API
            const [categoriesResponse, tasksResponse] = await Promise.all([
                apiService.getCategories(),
                apiService.getTasks()
            ]);

            // Update current project with API data
            const currentProj = projects[currentProjectId];
            if (currentProj) {
                updateProject(currentProjectId, {
                    tasks: tasksResponse.tasks || [],
                    priorityCategories: categoriesResponse.categories || DEFAULT_PRIORITY_CATEGORIES
                });
            }

            setLastApiSync(new Date().toISOString());
            setApiStatus('success');
            setSyncMode('api');
            return true;
        } catch (error) {
            handleApiError(error);
            return false;
        }
    }, [isOnline, projects, currentProjectId]);

    const pushToApi = useCallback(async (task) => {
        if (!isOnline || syncMode === 'localStorage') return null;
        
        try {
            const result = await apiService.createTask(task);
            return result;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    }, [isOnline, syncMode, handleApiError]);

    const updateTaskOnApi = useCallback(async (taskId, taskData) => {
        if (!isOnline || syncMode === 'localStorage') return null;
        
        try {
            const result = await apiService.updateTask(taskId, taskData);
            return result;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    }, [isOnline, syncMode, handleApiError]);

    const deleteTaskOnApi = useCallback(async (taskId) => {
        if (!isOnline || syncMode === 'localStorage') return null;
        
        try {
            await apiService.deleteTask(taskId);
            return true;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    }, [isOnline, syncMode, handleApiError]);

    // =================
    // INITIALIZE DATA (enhanced)
    // =================

    useEffect(() => {
        const initializeApp = async () => {
            // Load from localStorage first (existing logic)
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

            // NEW: Try to connect to API
            const apiConnected = await testApiConnection();
            if (apiConnected) {
                console.log('✅ Connected to API - Cloud sync available');
                // Optional: sync data on startup
                // await syncWithApi();
            } else {
                console.log('📱 Running in offline mode - Using localStorage');
            }
        };

        initializeApp();
    }, [loadFromLocalStorage, testApiConnection]);

    // =================
    // AUTO-SAVE LOGIC (enhanced)
    // =================

    const scheduleAutoSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        setOverallSaveState(AUTOSAVE_STATES.SAVING);
        
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                // Always save to localStorage
                const success1 = saveToLocalStorage('multiProjects', projects);
                const success2 = saveToLocalStorage('currentProject', currentProjectId);
                
                if (success1 && success2) {
                    setOverallSaveState(AUTOSAVE_STATES.SAVED);
                    lastSaveRef.current = Date.now();
                    
                    // NEW: If online and in API mode, also sync to API
                    if (isOnline && syncMode === 'api') {
                        // Note: This is a basic sync - in production you'd want more sophisticated logic
                        console.log('💾 Saved locally + API sync available');
                    }
                    
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
    }, [projects, currentProjectId, saveToLocalStorage, isOnline, syncMode]);

    // Trigger auto-save when projects change (existing)
    useEffect(() => {
        if (Object.keys(projects).length > 0) {
            scheduleAutoSave();
        }
    }, [projects, scheduleAutoSave]);

    // =================
    // DERIVED STATE (existing)
    // =================

    const currentProject = projects[currentProjectId] || null;
    const tasks = currentProject?.tasks || [];
    const priorityCategories = currentProject?.priorityCategories || DEFAULT_PRIORITY_CATEGORIES;
    const savedProjects = currentProject?.savedProjects || DEFAULT_PROJECTS;

    // =================
    // PROJECT MANAGEMENT (existing)
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
    // CURRENT PROJECT OPERATIONS (existing)
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
    // DATA EXPORT/IMPORT (existing + enhanced)
    // =================

    const exportAllData = useCallback(() => {
        try {
            const exportData = {
                projects,
                currentProjectId,
                exportedAt: new Date().toISOString(),
                version: '1.0',
                syncMode,
                lastApiSync
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
    }, [projects, currentProjectId, syncMode, lastApiSync]);

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

    // NEW: Cloud migration
    const migrateToCloud = useCallback(async () => {
        if (!isOnline) {
            throw new Error('Cannot migrate to cloud - offline');
        }

        try {
            setApiStatus('loading');
            
            // Prepare localStorage data for migration
            const localStorageData = {
                tasks: JSON.stringify(tasks),
                priorityCategories: JSON.stringify(priorityCategories),
                userProgress: localStorage.getItem('userProgress')
            };

            const result = await apiService.migrateFromLocalStorage(localStorageData);
            
            if (result.success) {
                setSyncMode('api');
                setLastApiSync(new Date().toISOString());
                setApiStatus('success');
                return { success: true, message: 'Migration completed successfully!' };
            } else {
                throw new Error('Migration failed');
            }
        } catch (error) {
            handleApiError(error);
            return { success: false, error: error.message };
        }
    }, [isOnline, tasks, priorityCategories, handleApiError]);

    // =================
    // FORCE SAVE (existing)
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
    // CLEANUP (existing)
    // =================

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // =================
    // CONTEXT VALUE (enhanced)
    // =================

    const contextValue = useMemo(() => ({
        // Multi-project state (existing)
        projects,
        currentProjectId,
        currentProject,
        
        // Current project data (existing - for backward compatibility)
        tasks,
        priorityCategories,
        savedProjects,
        
        // Project management (existing)
        createProject,
        deleteProject,
        updateProject,
        switchProject,
        
        // Current project operations (existing)
        setTasks,
        setPriorityCategories,
        setSavedProjects,
        
        // Auto-save (existing)
        overallSaveState,
        forceSave,
        AUTOSAVE_STATES,
        
        // Export/Import (existing)
        exportAllData,
        importAllData,
        
        // NEW: API integration
        apiStatus,
        isOnline,
        syncMode,
        lastApiSync,
        apiError,
        clearApiError,
        testApiConnection,
        syncWithApi,
        migrateToCloud,
        pushToApi,
        updateTaskOnApi,
        deleteTaskOnApi,
        
        // Direct API access
        apiService
    }), [
        // Existing dependencies
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
        importAllData,
        // New dependencies
        apiStatus,
        isOnline,
        syncMode,
        lastApiSync,
        apiError,
        clearApiError,
        testApiConnection,
        syncWithApi,
        migrateToCloud,
        pushToApi,
        updateTaskOnApi,
        deleteTaskOnApi
    ]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};
