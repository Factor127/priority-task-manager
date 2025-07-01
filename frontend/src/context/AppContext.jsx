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
    { id: 'income', hebrew: 'הכנסה לשוטף', english: 'Income/Revenue', weight: 40, color: '#10B981' },
    { id: 'home', hebrew: 'ניהול בית', english: 'Home Management', weight: 15, color: '#3B82F6' },
    { id: 'plan', hebrew: 'תוכנית חומש', english: '5-Year Plan', weight: 5, color: '#8B5CF6' },
    { id: 'social', hebrew: 'סוציאל', english: 'Social', weight: 20, color: '#F59E0B' },
    { id: 'relationship', hebrew: 'זוגיות', english: 'Relationship', weight: 5, color: '#EF4444' },
    { id: 'personal', hebrew: 'עצמי', english: 'Personal', weight: 20, color: '#06B6D4' },
    { id: 'children', hebrew: 'ילדים', english: 'Children', weight: 30, color: '#84CC16' }
];

const DEFAULT_PROJECTS = [
    'Personal Development', 'Business Growth', 'Family', 
    'Health', 'Learning', 'Finance'
];

// =================
// SAFE LOCALSTORAGE FUNCTIONS
// =================

const safeLoadFromStorage = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        
        // Handle all possible corrupted states
        if (!item || item === 'undefined' || item === 'null' || item === '') {
            console.log(`localStorage key "${key}" is empty, using default`);
            return defaultValue;
        }
        
        const parsed = JSON.parse(item);
        
        // Validate data structure
        if (parsed === null || parsed === undefined) {
            console.log(`localStorage key "${key}" contains null/undefined, using default`);
            return defaultValue;
        }
        
        return parsed;
    } catch (error) {
        console.error(`localStorage corruption detected for "${key}":`, error);
        
        // Try to recover from backup
        try {
            const backupKey = `${key}_backup`;
            const backup = localStorage.getItem(backupKey);
            if (backup && backup !== 'undefined') {
                const backupData = JSON.parse(backup);
                console.log(`Recovered data from backup for "${key}"`);
                return backupData;
            }
        } catch (backupError) {
            console.error('Backup also corrupted');
        }
        
        // Clear corrupted data and use default
        try {
            localStorage.removeItem(key);
        } catch (clearError) {
            console.error('Failed to clear corrupted data');
        }
        
        return defaultValue;
    }
};

const safeSaveToStorage = async (key, data) => {
    // Create a lock to prevent concurrent saves
    const lockKey = `${key}_lock`;
    const lockTimeout = 5000; // 5 second timeout
    
    try {
        // Check for existing lock
        const existingLock = localStorage.getItem(lockKey);
        if (existingLock) {
            const lockTime = parseInt(existingLock);
            const now = Date.now();
            
            // If lock is older than timeout, clear it
            if (now - lockTime > lockTimeout) {
                localStorage.removeItem(lockKey);
            } else {
                throw new Error('Save operation already in progress');
            }
        }
        
        // Set lock
        localStorage.setItem(lockKey, Date.now().toString());
        
        // Create backup before saving
        const existing = localStorage.getItem(key);
        if (existing && existing !== 'undefined') {
            localStorage.setItem(`${key}_backup`, existing);
        }
        
        // Convert to JSON
        const jsonString = JSON.stringify(data);
        
        // Check size (5MB limit for localStorage)
        const sizeInBytes = new Blob([jsonString]).size;
        if (sizeInBytes > 5 * 1024 * 1024) {
            throw new Error('Data too large for localStorage');
        }
        
        // Save data
        localStorage.setItem(key, jsonString);
        
        // Verify save
        const saved = localStorage.getItem(key);
        if (saved !== jsonString) {
            throw new Error('Data verification failed after save');
        }
        
        return true;
        
    } catch (error) {
        console.error(`Failed to save "${key}":`, error);
        throw error;
    } finally {
        // Always release lock
        try {
            localStorage.removeItem(lockKey);
        } catch (lockError) {
            console.error('Failed to release save lock');
        }
    }
};

// =================
// CONTEXT SETUP
// =================

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    // Core data state
    const [projects, setProjects] = useState({});
    const [currentProjectId, setCurrentProjectId] = useState('default');
    const [priorityCategories, setPriorityCategories] = useState(DEFAULT_PRIORITY_CATEGORIES);
    const [savedProjects, setSavedProjects] = useState(DEFAULT_PROJECTS);
    const [userProgress, setUserProgress] = useState({ points: 0, level: 1 });
    
    // UI state
    const [overallSaveState, setOverallSaveState] = useState(AUTOSAVE_STATES.IDLE);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Refs for cleanup
    const saveTimeoutRef = useRef(null);
    const lastSaveRef = useRef(Date.now());
    const isInitialLoadRef = useRef(true);

    // =================
    // INITIALIZATION
    // =================

    useEffect(() => {
        const initializeApp = async () => {
            try {
                setIsLoading(true);
                
                // Load all data safely
                const loadedProjects = safeLoadFromStorage('multiProjects', { default: { name: 'Main Project', tasks: [] } });
                const loadedCurrentProject = safeLoadFromStorage('currentProject', 'default');
                const loadedCategories = safeLoadFromStorage('priorityCategories', DEFAULT_PRIORITY_CATEGORIES);
                const loadedSavedProjects = safeLoadFromStorage('savedProjects', DEFAULT_PROJECTS);
                const loadedProgress = safeLoadFromStorage('userProgress', { points: 0, level: 1 });
                
                setProjects(loadedProjects);
                setCurrentProjectId(loadedCurrentProject);
                setPriorityCategories(loadedCategories);
                setSavedProjects(loadedSavedProjects);
                setUserProgress(loadedProgress);
                
                isInitialLoadRef.current = false;
                
            } catch (error) {
                console.error('Failed to initialize app:', error);
                setError('Failed to load saved data. Using defaults.');
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
    }, []);

    // =================
    // AUTO-SAVE SYSTEM
    // =================

    const performSave = useCallback(async () => {
        if (isInitialLoadRef.current) return;
        
        try {
            setOverallSaveState(AUTOSAVE_STATES.SAVING);
            
            // Save all data with safe method
            await safeSaveToStorage('multiProjects', projects);
            await safeSaveToStorage('currentProject', currentProjectId);
            await safeSaveToStorage('priorityCategories', priorityCategories);
            await safeSaveToStorage('savedProjects', savedProjects);
            await safeSaveToStorage('userProgress', userProgress);
            
            setOverallSaveState(AUTOSAVE_STATES.SAVED);
            lastSaveRef.current = Date.now();
            
            // Auto-return to idle after 2 seconds
            setTimeout(() => {
                setOverallSaveState(AUTOSAVE_STATES.IDLE);
            }, 2000);
            
        } catch (error) {
            console.error('Auto-save failed:', error);
            setOverallSaveState(AUTOSAVE_STATES.ERROR);
            setError('Failed to save data. Your changes may not be preserved.');
            
            // Auto-return to idle after 5 seconds
            setTimeout(() => {
                setOverallSaveState(AUTOSAVE_STATES.IDLE);
                setError(null);
            }, 5000);
        }
    }, [projects, currentProjectId, priorityCategories, savedProjects, userProgress]);

    const debouncedSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            performSave();
        }, 800);
    }, [performSave]);

    // Trigger auto-save when data changes
    useEffect(() => {
        if (!isInitialLoadRef.current && Object.keys(projects).length > 0) {
            debouncedSave();
        }
    }, [projects, currentProjectId, priorityCategories, savedProjects, userProgress, debouncedSave]);

    // Force save function
    const forceSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        performSave();
    }, [performSave]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // =================
    // COMPUTED VALUES
    // =================

    const currentProject = useMemo(() => {
        return projects[currentProjectId] || { name: 'Main Project', tasks: [] };
    }, [projects, currentProjectId]);

    const tasks = useMemo(() => {
        return currentProject.tasks || [];
    }, [currentProject]);

    // =================
    // CONTEXT VALUE
    // =================

    const contextValue = {
        // Data
        projects,
        setProjects,
        currentProjectId,
        setCurrentProjectId,
        currentProject,
        tasks,
        priorityCategories,
        setPriorityCategories,
        savedProjects,
        setSavedProjects,
        userProgress,
        setUserProgress,
        
        // UI State
        saveState: overallSaveState,
        isLoading,
        error,
        setError,
        
        // Actions
        forceSave,
        
        // Export/Import functions (will be added later)
        exportAllData: () => {},
        importAllData: () => {}
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#6b7280'
            }}>
                Loading Priority Task Manager...
            </div>
        );
    }

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export default AppProvider;