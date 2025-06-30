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
// ADVANCED LOCALSTORAGE HOOK
// =================

const useLocalStorageWithAutosave = (key, defaultValue, options = {}) => {
    const { 
        debounceMs = 800,  // 800ms like your original
        onSaveStart = () => {},
        onSaveSuccess = () => {},
        onSaveError = () => {}
    } = options;

    const [value, setValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            // Handle corrupted or invalid data
            if (item === null || item === undefined || item === 'undefined' || item === '') {
                console.log(`LocalStorage key "${key}" is empty, using default value`);
                return defaultValue;
            }
            
            const parsed = JSON.parse(item);
            console.log(`Loaded ${key} from localStorage:`, parsed);
            return parsed;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            console.log(`Clearing corrupted localStorage key "${key}"`);
            
            // Clear corrupted data
            try {
                window.localStorage.removeItem(key);
            } catch (clearError) {
                console.error(`Error clearing localStorage key "${key}":`, clearError);
            }
            
            onSaveError(error);
            return defaultValue;
        }
    });

    const [saveState, setSaveState] = useState(AUTOSAVE_STATES.IDLE);
    const saveTimeoutRef = useRef(null);
    const pendingValueRef = useRef(null);
    const isSavingRef = useRef(false);

    // Save function with error handling
    const saveToStorage = useCallback(async (valueToSave) => {
        if (isSavingRef.current) return; // Prevent concurrent saves
        
        try {
            isSavingRef.current = true;
            setSaveState(AUTOSAVE_STATES.SAVING);
            onSaveStart();
            
            // Add small delay to show saving state
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Validate data before saving
            if (valueToSave === null || valueToSave === undefined) {
                throw new Error('Cannot save null or undefined value');
            }
            
            // Ensure we're saving valid JSON
            const jsonString = JSON.stringify(valueToSave);
            
            // Check localStorage quota
            const currentSize = new Blob([jsonString]).size;
            const maxSize = 5 * 1024 * 1024; // 5MB typical localStorage limit
            
            if (currentSize > maxSize) {
                throw new Error(`Data too large (${Math.round(currentSize/1024)}KB). Consider cleaning old tasks.`);
            }
            
            // Save to localStorage
            window.localStorage.setItem(key, jsonString);
            
            console.log(`Successfully saved ${key} to localStorage (${Math.round(currentSize/1024)}KB)`);
            
            setSaveState(AUTOSAVE_STATES.SAVED);
            onSaveSuccess();
            
            // Auto-return to idle after 2 seconds
            setTimeout(() => {
                setSaveState(AUTOSAVE_STATES.IDLE);
            }, 2000);
            
        } catch (error) {
            console.error(`Error saving localStorage key "${key}":`, error);
            setSaveState(AUTOSAVE_STATES.ERROR);
            onSaveError(error);
            
            // Auto-return to idle after 3 seconds on error
            setTimeout(() => {
                setSaveState(AUTOSAVE_STATES.IDLE);
            }, 3000);
        } finally {
            isSavingRef.current = false;
        }
    }, [key, onSaveStart, onSaveSuccess, onSaveError]);

    // Debounced setter
    const setStoredValue = useCallback((newValue) => {
        setValue(newValue);
        pendingValueRef.current = newValue;
        
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        // Set new timeout for debounced save
        saveTimeoutRef.current = setTimeout(() => {
            if (pendingValueRef.current !== null && !isSavingRef.current) {
                saveToStorage(pendingValueRef.current);
                pendingValueRef.current = null;
            }
        }, debounceMs);
        
    }, [saveToStorage, debounceMs]);

    // Force save function
    const forceSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        if (pendingValueRef.current !== null && !isSavingRef.current) {
            saveToStorage(pendingValueRef.current);
            pendingValueRef.current = null;
        }
    }, [saveToStorage]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return [value, setStoredValue, { saveState, forceSave }];
};

// =================
// CONTEXT PROVIDER
// =================

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // Auto-save handlers
    const handleSaveStart = useCallback(() => {
        console.log('Auto-save started...');
    }, []);

    const handleSaveSuccess = useCallback(() => {
        console.log('Auto-save completed successfully');
    }, []);

    const handleSaveError = useCallback((error) => {
        console.error('Auto-save failed:', error);
        // Could show user notification here
    }, []);

    // Enhanced localStorage hooks with auto-save
    const [tasks, setTasks, { saveState: tasksSaveState, forceSave: forceTasksSave }] = useLocalStorageWithAutosave(
        'priorityTasks', 
        [], 
        { 
            debounceMs: 800,  // Exact same as your original
            onSaveStart: handleSaveStart,
            onSaveSuccess: handleSaveSuccess,
            onSaveError: handleSaveError 
        }
    );

    const [priorityCategories, setPriorityCategories, { saveState: categoriesSaveState, forceSave: forceCategoriesSave }] = useLocalStorageWithAutosave(
        'priorityCategories', 
        DEFAULT_PRIORITY_CATEGORIES,
        { 
            debounceMs: 1000,
            onSaveStart: handleSaveStart,
            onSaveSuccess: handleSaveSuccess,
            onSaveError: handleSaveError 
        }
    );

    const [savedProjects, setSavedProjects, { saveState: projectsSaveState, forceSave: forceProjectsSave }] = useLocalStorageWithAutosave(
        'savedProjects', 
        DEFAULT_PROJECTS,
        { 
            debounceMs: 1000,
            onSaveStart: handleSaveStart,
            onSaveSuccess: handleSaveSuccess,
            onSaveError: handleSaveError 
        }
    );

    // Overall save state (shows worst state)
    const overallSaveState = useMemo(() => {
        const states = [tasksSaveState, categoriesSaveState, projectsSaveState];
        
        // Priority: ERROR > SAVING > SAVED > IDLE
        if (states.includes(AUTOSAVE_STATES.ERROR)) return AUTOSAVE_STATES.ERROR;
        if (states.includes(AUTOSAVE_STATES.SAVING)) return AUTOSAVE_STATES.SAVING;
        if (states.includes(AUTOSAVE_STATES.SAVED)) return AUTOSAVE_STATES.SAVED;
        return AUTOSAVE_STATES.IDLE;
    }, [tasksSaveState, categoriesSaveState, projectsSaveState]);

    // Force save all data
    const forceAllSave = useCallback(() => {
        forceTasksSave();
        forceCategoriesSave();
        forceProjectsSave();
    }, [forceTasksSave, forceCategoriesSave, forceProjectsSave]);
    
    // Priority weights calculation
    const priorityWeights = useMemo(() => {
        const weights = {};
        priorityCategories.forEach(category => {
            weights[category.id] = category.weight;
        });
        return weights;
    }, [priorityCategories]);

    // Data export functionality
    const exportAllData = useCallback(() => {
        const exportData = {
            tasks,
            priorityCategories,
            savedProjects,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `priority-tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        return 'Data exported successfully!';
    }, [tasks, priorityCategories, savedProjects]);

    // Data import functionality
    const importAllData = useCallback((importData) => {
        try {
            if (importData.tasks) setTasks(importData.tasks);
            if (importData.priorityCategories) setPriorityCategories(importData.priorityCategories);
            if (importData.savedProjects) setSavedProjects(importData.savedProjects);
                    
            return 'Data imported successfully!';
        } catch (error) {
            console.error('Import error:', error);
            throw new Error('Failed to import data. Please check the file format.');
        }
    }, [setTasks, setPriorityCategories, setSavedProjects]);

    // Context value
    const contextValue = {
        // Core State
        tasks,
        priorityCategories,
        savedProjects,
        priorityWeights,
        
        // Setters
        setTasks,
        setPriorityCategories,
        setSavedProjects,
        
        // Auto-save State & Actions
        overallSaveState,
        forceSave: forceAllSave,
        
        // Data Management
        exportAllData,
        importAllData,
        
        // Constants
        AUTOSAVE_STATES,
        DEFAULT_PRIORITY_CATEGORIES,
        DEFAULT_PROJECTS
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};