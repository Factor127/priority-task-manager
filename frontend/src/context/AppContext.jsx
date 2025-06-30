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
    const [currentProjectId, setCurrentProjectId] = useState('family');
    const [overallSaveState, setOverallSaveState] = useState(AUTOSAVE_STATES.IDLE);
    
    // Derived state for current project
    const currentProject = projects[currentProjectId] || null;
    const tasks = currentProject?.tasks || [];
    const priorityCategories = currentProject?.priorityCategories || DEFAULT_PRIORITY_CATEGORIES;
    const savedProjects = currentProject?.savedProjects || DEFAULT_PROJECTS;

    // Auto-save state management
    const saveTimeoutRef = useRef(null);
    const lastSaveRef = useRef(Date.now());

    // =================
    // INITIALIZATION
    // =================

    useEffect(() => {
        console.log('🔧 Initializing multi-project system...');
        
        // Load existing data and migrate if needed
        const existingTasks = loadFromLocalStorage('priorityTasks', []);
        const existingCategories = loadFromLocalStorage('priorityCategories', DEFAULT_PRIORITY_CATEGORIES);
        const existingProjects = loadFromLocalStorage('savedProjects', DEFAULT_PROJECTS);
        const lastProject = loadFromLocalStorage('currentProject', 'family');
        
        // Load multi-project data or create from existing
        let initialProjects = loadFromLocalStorage('multiProjects', {});
        
        // Migration: If we have old single-project data, migrate it
        if (Object.keys(initialProjects).length === 0 && existingTasks.length > 0) {
            console.log('🔄 Migrating existing data to multi-project format...');
            initialProjects = {
                family: {
                    id: 'family',
                    name: 'Family',
                    tasks: existingTasks,
                    priorityCategories: existingCategories,
                    savedProjects: existingProjects,
                    createdAt: new Date().toISOString()
                }
            };
        }
        
        // Ensure we have at least default projects
        if (Object.keys(initialProjects).length === 0) {
            console.log('🏗️ Creating default projects...');
            initialProjects = {
                family: {
                    id: 'family',
                    name: 'Family',
                    tasks: [],
                    priorityCategories: [...DEFAULT_PRIORITY_CATEGORIES],
                    savedProjects: [...DEFAULT_PROJECTS],
                    createdAt: new Date().toISOString()
                },
                work: {
                    id: 'work', 
                    name: 'Work',
                    tasks: [],
                    priorityCategories: [
                        { id: 'revenue', english: 'Revenue Impact', hebrew: 'השפעה על הכנסות', weight: 35, color: '#10B981' },
                        { id: 'efficiency', english: 'Efficiency', hebrew: 'יעילות', weight: 25, color: '#3B82F6' },
                        { id: 'growth', english: 'Growth', hebrew: 'צמיחה', weight: 20, color: '#8B5CF6' },
                        { id: 'urgent', english: 'Urgency', hebrew: 'דחיפות', weight: 20, color: '#EF4444' }
                    ],
                    savedProjects: ['Client Work', 'Internal Projects', 'Training', 'Administration'],
                    createdAt: new Date().toISOString()
                },
                personal: {
                    id: 'personal',
                    name: 'Personal',
                    tasks: [],
                    priorityCategories: [
                        { id: 'health', english: 'Health', hebrew: 'בריאות', weight: 30, color: '#10B981' },
                        { id: 'relationships', english: 'Relationships', hebrew: 'יחסים', weight: 25, color: '#EF4444' },
                        { id: 'growth', english: 'Personal Growth', hebrew: 'צמיחה אישית', weight: 25, color: '#8B5CF6' },
                        { id: 'fun', english: 'Fun & Recreation', hebrew: 'בילוי ונופש', weight: 20, color: '#F59E0B' }
                    ],
                    savedProjects: ['Fitness', 'Learning', 'Hobbies', 'Social'],
                    createdAt: new Date().toISOString()
                }
            };
        }
        
        setProjects(initialProjects);
        setCurrentProjectId(lastProject);
        
        console.log(`✅ Loaded ${Object.keys(initialProjects).length} projects, current: ${lastProject}`);
    }, []);

    // =================
    // UTILITY FUNCTIONS
    // =================

    const loadFromLocalStorage = useCallback((key, defaultValue) => {
        try {
            const item = localStorage.getItem(key);
            if (item && item !== 'undefined' && item !== 'null') {
                return JSON.parse(item);
            }
        } catch (error) {
            console.warn(`LocalStorage key "${key}" is empty, using default value`, error);
        }
        return defaultValue;
    }, []);

    const saveToLocalStorage = useCallback((key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Failed to save to localStorage key "${key}":`, error);
            return false;
        }
    }, []);

    // =================
    // AUTO-SAVE SYSTEM
    // =================

    const debouncedSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        setOverallSaveState(AUTOSAVE_STATES.SAVING);

        saveTimeoutRef.current = setTimeout(() => {
            try {
                // Save multi-project data
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

    // Trigger auto-save when data changes
    useEffect(() => {
        if (Object.keys(projects).length > 0) {
            debouncedSave();
        }
    }, [projects, currentProjectId, debouncedSave]);

    // =================
    // PROJECT MANAGEMENT
    // =================

    const createProject = useCallback((projectData) => {
        const newId = Date.now().toString();
        const newProject = {
            id: newId,
            name: projectData.name,
            tasks: [],
            priorityCategories: projectData.priorityCategories || [...DEFAULT_PRIORITY_CATEGORIES],
            savedProjects: [...DEFAULT_PROJECTS],
            createdAt: new Date().toISOString()
        };
        
        setProjects(prev => ({
            ...prev,
            [newId]: newProject
        }));
        
        return newId;
    }, []);

    const deleteProject = useCallback((projectId) => {
        setProjects(prev => {
            const newProjects = { ...prev };
            delete newProjects[projectId];
            return newProjects;
        });
        
        // Switch to first available project if current was deleted
        if (projectId === currentProjectId) {
            const remainingIds = Object.keys(projects).filter(id => id !== projectId);
            if (remainingIds.length > 0) {
                setCurrentProjectId(remainingIds[0]);
            }
        }
    }, [currentProjectId, projects]);

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

    const switchProject = useCallback((projectId) => {
        if (projects[projectId]) {
            setCurrentProjectId(projectId);
            console.log(`🔄 Switched to project: ${projects[projectId].name}`);
        }
    }, [projects]);

    // =================
    // CURRENT PROJECT OPERATIONS
    // =================

    const setTasks = useCallback((tasksOrUpdater) => {
        if (!currentProjectId || !projects[currentProjectId]) return;
        
        const newTasks = typeof tasksOrUpdater === 'function' 
            ? tasksOrUpdater(projects[currentProjectId].tasks)
            : tasksOrUpdater;
            
        updateProject(currentProjectId, { tasks: newTasks });
    }, [currentProjectId, projects, updateProject]);

    const setPriorityCategories = useCallback((categoriesOrUpdater) => {
        if (!currentProjectId || !projects[currentProjectId]) return;
        
        const newCategories = typeof categoriesOrUpdater === 'function'
            ? categoriesOrUpdater(projects[currentProjectId].priorityCategories)
            : categoriesOrUpdater;
            
        updateProject(currentProjectId, { priorityCategories: newCategories });
    }, [currentProjectId, projects, updateProject]);

    const setSavedProjects = useCallback((projectsOrUpdater) => {
        if (!currentProjectId || !projects[currentProjectId]) return;
        
        const newSavedProjects = typeof projectsOrUpdater === 'function'
            ? projectsOrUpdater(projects[currentProjectId].savedProjects)
            : projectsOrUpdater;
            
        updateProject(currentProjectId, { savedProjects: newSavedProjects });
    }, [currentProjectId, projects, updateProject]);

    // =================
    // EXPORT/IMPORT
    // =================

    const exportAllData = useCallback(() => {
        try {
            const exportData = {
                projects,
                currentProjectId,
                exportDate: new Date().toISOString(),
                version: '2.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `priority-tasks-multiproject-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return 'Multi-project data exported successfully!';
        } catch (error) {
            console.error('Export failed:', error);
            return 'Export failed: ' + error.message;
        }
    }, [projects, currentProjectId]);

    const importAllData = useCallback((importData) => {
        try {
            if (importData.version === '2.0' && importData.projects) {
                // Multi-project format
                setProjects(importData.projects);
                setCurrentProjectId(importData.currentProjectId || Object.keys(importData.projects)[0]);
                return `Imported ${Object.keys(importData.projects).length} projects successfully!`;
            } else if (importData.tasks) {
                // Legacy single-project format - import into current project
                if (currentProjectId && projects[currentProjectId]) {
                    updateProject(currentProjectId, {
                        tasks: importData.tasks,
                        priorityCategories: importData.priorityCategories || priorityCategories
                    });
                    return 'Legacy data imported into current project!';
                }
            }
            return 'Invalid import format';
        } catch (error) {
            console.error('Import failed:', error);
            return 'Import failed: ' + error.message;
        }
    }, [currentProjectId, projects, priorityCategories, updateProject]);

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