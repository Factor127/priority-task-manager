import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Default priority categories (same as your original)
const DEFAULT_PRIORITY_CATEGORIES = [
    { id: 'income', hebrew: 'הכנסה לשוטף', english: 'Income/Revenue', weight: 40, color: '#10B981' },
    { id: 'home', hebrew: 'ניהול בית', english: 'Home Management', weight: 15, color: '#3B82F6' },
    { id: 'plan', hebrew: 'תוכנית חומש', english: '5-Year Plan', weight: 5, color: '#8B5CF6' },
    { id: 'social', hebrew: 'סוציאל', english: 'Social', weight: 20, color: '#F59E0B' },
    { id: 'relationship', hebrew: 'זוגיות', english: 'Relationship', weight: 5, color: '#EF4444' },
    { id: 'personal', hebrew: 'עצמי', english: 'Personal', weight: 20, color: '#06B6D4' },
    { id: 'children', hebrew: 'ילדים', english: 'Children', weight: 30, color: '#84CC16' }
];

const AUTOSAVE_STATES = {
    IDLE: 'idle',
    SAVING: 'saving',
    SAVED: 'saved',
    ERROR: 'error'
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
    // State for all our data
    const [tasks, setTasks] = useState([]);
    const [priorityCategories, setPriorityCategories] = useState(DEFAULT_PRIORITY_CATEGORIES);
    const [userProgress, setUserProgress] = useState({ points: 0, level: 1, achievements: [] });

    // Simple context value for now
    const contextValue = {
        tasks,
        setTasks,
        priorityCategories,
        setPriorityCategories,
        userProgress,
        setUserProgress,
        AUTOSAVE_STATES,
        DEFAULT_PRIORITY_CATEGORIES
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

// Hook to use the context
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};