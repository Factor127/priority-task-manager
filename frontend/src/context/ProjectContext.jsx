// src/context/ProjectContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Project Context
const ProjectContext = createContext();

// Default project templates
const DEFAULT_PROJECTS = {
    personal: {
        id: 'personal',
        name: 'אישי',
        description: 'משימות אישיות ופיתוח עצמי',
        priority: 50,
        color: '#4f46e5',
        tasks: [],
        savedProjects: ['פיתוח אישי', 'בריאות', 'משפחה', 'למידה'],
        priorityCategories: [
            { id: 'income', english: 'Income/Revenue', hebrew: 'הכנסה לשוטף', weight: 40, color: '#10B981' },
            { id: 'home', english: 'Home Management', hebrew: 'ניהול בית', weight: 15, color: '#3B82F6' },
            { id: 'plan', english: '5-Year Plan', hebrew: 'תוכנית חומש', weight: 5, color: '#8B5CF6' },
            { id: 'social', english: 'Social', hebrew: 'סוציאל', weight: 20, color: '#F59E0B' },
            { id: 'relationship', english: 'Relationship', hebrew: 'זוגיות', weight: 5, color: '#EF4444' },
            { id: 'personal', english: 'Personal', hebrew: 'עצמי', weight: 20, color: '#06B6D4' },
            { id: 'children', english: 'Children', hebrew: 'ילדים', weight: 30, color: '#84CC16' }
        ],
        createdAt: new Date().toISOString()
    },
    work: {
        id: 'work',
        name: 'עבודה',
        description: 'משימות עבודה ופרויקטים מקצועיים',
        priority: 80,
        color: '#10b981',
        tasks: [],
        savedProjects: ['פרויקט A', 'לקוחות', 'פיתוח', 'שיווק'],
        priorityCategories: [
            { id: 'revenue', english: 'Revenue Impact', hebrew: 'השפעה על הכנסות', weight: 35, color: '#10B981' },
            { id: 'efficiency', english: 'Efficiency', hebrew: 'יעילות', weight: 25, color: '#3B82F6' },
            { id: 'growth', english: 'Growth', hebrew: 'צמיחה', weight: 20, color: '#8B5CF6' },
            { id: 'urgent', english: 'Urgency', hebrew: 'דחיפות', weight: 20, color: '#EF4444' }
        ],
        createdAt: new Date().toISOString()
    }
};

// Action types
const PROJECT_ACTIONS = {
    LOAD_PROJECTS: 'LOAD_PROJECTS',
    SET_CURRENT_PROJECT: 'SET_CURRENT_PROJECT',
    CREATE_PROJECT: 'CREATE_PROJECT',
    UPDATE_PROJECT: 'UPDATE_PROJECT',
    DELETE_PROJECT: 'DELETE_PROJECT',
    ADD_TASK: 'ADD_TASK',
    UPDATE_TASK: 'UPDATE_TASK',
    DELETE_TASK: 'DELETE_TASK',
    UPDATE_CATEGORIES: 'UPDATE_CATEGORIES',
    UPDATE_USER_STATS: 'UPDATE_USER_STATS'
};

// Initial state
const initialState = {
    projects: {},
    currentProjectId: 'personal',
    user: {
        level: 1,
        points: 0,
        achievements: []
    },
    loading: false,
    error: null
};

// Reducer function
function projectReducer(state, action) {
    switch (action.type) {
        case PROJECT_ACTIONS.LOAD_PROJECTS:
            return {
                ...state,
                projects: action.payload.projects,
                currentProjectId: action.payload.currentProjectId,
                user: action.payload.user || state.user,
                loading: false
            };

        case PROJECT_ACTIONS.SET_CURRENT_PROJECT:
            return {
                ...state,
                currentProjectId: action.payload
            };

        case PROJECT_ACTIONS.CREATE_PROJECT:
            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.payload.id]: action.payload
                },
                currentProjectId: action.payload.id
            };

        case PROJECT_ACTIONS.UPDATE_PROJECT:
            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.payload.id]: {
                        ...state.projects[action.payload.id],
                        ...action.payload.updates
                    }
                }
            };

        case PROJECT_ACTIONS.DELETE_PROJECT:
            const { [action.payload]: deletedProject, ...remainingProjects } = state.projects;
            const newCurrentId = state.currentProjectId === action.payload 
                ? Object.keys(remainingProjects)[0] || 'personal'
                : state.currentProjectId;
            
            return {
                ...state,
                projects: remainingProjects,
                currentProjectId: newCurrentId
            };

        case PROJECT_ACTIONS.ADD_TASK:
            const currentProject = state.projects[state.currentProjectId];
            if (!currentProject) return state;

            return {
                ...state,
                projects: {
                    ...state.projects,
                    [state.currentProjectId]: {
                        ...currentProject,
                        tasks: [...(currentProject.tasks || []), action.payload]
                    }
                }
            };

        case PROJECT_ACTIONS.UPDATE_TASK:
            const targetProject = state.projects[state.currentProjectId];
            if (!targetProject || !targetProject.tasks) return state;

            return {
                ...state,
                projects: {
                    ...state.projects,
                    [state.currentProjectId]: {
                        ...targetProject,
                        tasks: targetProject.tasks.map(task =>
                            task.id === action.payload.id
                                ? { ...task, ...action.payload.updates, updatedAt: new Date().toISOString() }
                                : task
                        )
                    }
                }
            };

        case PROJECT_ACTIONS.DELETE_TASK:
            const projectWithTask = state.projects[state.currentProjectId];
            if (!projectWithTask || !projectWithTask.tasks) return state;

            return {
                ...state,
                projects: {
                    ...state.projects,
                    [state.currentProjectId]: {
                        ...projectWithTask,
                        tasks: projectWithTask.tasks.filter(task => task.id !== action.payload)
                    }
                }
            };

        case PROJECT_ACTIONS.UPDATE_CATEGORIES:
            const projectToUpdate = state.projects[state.currentProjectId];
            if (!projectToUpdate) return state;

            return {
                ...state,
                projects: {
                    ...state.projects,
                    [state.currentProjectId]: {
                        ...projectToUpdate,
                        priorityCategories: action.payload
                    }
                }
            };

        case PROJECT_ACTIONS.UPDATE_USER_STATS:
            return {
                ...state,
                user: {
                    ...state.user,
                    ...action.payload
                }
            };

        default:
            return state;
    }
}

// Project Provider Component
export function ProjectProvider({ children }) {
    const [state, dispatch] = useReducer(projectReducer, initialState);

    // Load data on mount
    useEffect(() => {
        loadProjectData();
    }, []);

    // Auto-save when state changes
    useEffect(() => {
        if (Object.keys(state.projects).length > 0) {
            saveProjectData();
        }
    }, [state.projects, state.currentProjectId, state.user]);

    // Data persistence functions
    const loadProjectData = () => {
        try {
            const savedData = localStorage.getItem('priorityTaskManagerProjects');
            if (savedData) {
                const data = JSON.parse(savedData);
                dispatch({
                    type: PROJECT_ACTIONS.LOAD_PROJECTS,
                    payload: {
                        projects: data.projects || DEFAULT_PROJECTS,
                        currentProjectId: data.currentProjectId || 'personal',
                        user: data.user || initialState.user
                    }
                });
            } else {
                // Initialize with default projects
                dispatch({
                    type: PROJECT_ACTIONS.LOAD_PROJECTS,
                    payload: {
                        projects: DEFAULT_PROJECTS,
                        currentProjectId: 'personal',
                        user: initialState.user
                    }
                });
            }
        } catch (error) {
            console.error('Error loading project data:', error);
            // Fall back to defaults
            dispatch({
                type: PROJECT_ACTIONS.LOAD_PROJECTS,
                payload: {
                    projects: DEFAULT_PROJECTS,
                    currentProjectId: 'personal',
                    user: initialState.user
                }
            });
        }
    };

    const saveProjectData = () => {
        try {
            const dataToSave = {
                projects: state.projects,
                currentProjectId: state.currentProjectId,
                user: state.user,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('priorityTaskManagerProjects', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Error saving project data:', error);
        }
    };

    // Action creators
    const setCurrentProject = (projectId) => {
        if (state.projects[projectId]) {
            dispatch({
                type: PROJECT_ACTIONS.SET_CURRENT_PROJECT,
                payload: projectId
            });
        }
    };

    const createProject = (projectData) => {
        const newProject = {
            id: `project_${Date.now()}`,
            name: projectData.name,
            description: projectData.description || '',
            priority: parseInt(projectData.priority) || 50,
            color: projectData.color || '#4f46e5',
            tasks: [],
            savedProjects: [],
            priorityCategories: [...DEFAULT_PROJECTS.personal.priorityCategories],
            createdAt: new Date().toISOString()
        };

        dispatch({
            type: PROJECT_ACTIONS.CREATE_PROJECT,
            payload: newProject
        });

        return newProject;
    };

    const updateProject = (projectId, updates) => {
        dispatch({
            type: PROJECT_ACTIONS.UPDATE_PROJECT,
            payload: { id: projectId, updates }
        });
    };

    const deleteProject = (projectId) => {
        if (projectId === 'personal') {
            throw new Error('Cannot delete personal project');
        }
        
        dispatch({
            type: PROJECT_ACTIONS.DELETE_PROJECT,
            payload: projectId
        });
    };

    const addTask = (taskData) => {
        const currentProject = state.projects[state.currentProjectId];
        if (!currentProject) return null;

        const newTask = {
            id: `task_${Date.now()}`,
            title: taskData.title,
            project: taskData.project || '',
            goal: taskData.goal || '',
            update: taskData.update || '',
            type: taskData.type || '',
            status: taskData.status || 'לא התחיל',
            dueDate: taskData.dueDate || null,
            repeatInterval: taskData.repeatInterval || '',
            link: taskData.link || '',
            priorityRatings: taskData.priorityRatings || {},
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Calculate priority score
        newTask.calculatedPriority = calculateTaskPriority(newTask, currentProject.priorityCategories);

        dispatch({
            type: PROJECT_ACTIONS.ADD_TASK,
            payload: newTask
        });

        return newTask;
    };

    const updateTask = (taskId, updates) => {
        dispatch({
            type: PROJECT_ACTIONS.UPDATE_TASK,
            payload: { id: taskId, updates }
        });
    };

    const deleteTask = (taskId) => {
        dispatch({
            type: PROJECT_ACTIONS.DELETE_TASK,
            payload: taskId
        });
    };

    const updateCategories = (categories) => {
        dispatch({
            type: PROJECT_ACTIONS.UPDATE_CATEGORIES,
            payload: categories
        });
    };

    const updateUserStats = (updates) => {
        dispatch({
            type: PROJECT_ACTIONS.UPDATE_USER_STATS,
            payload: updates
        });
    };

    // Utility functions
    const getCurrentProject = () => {
        return state.projects[state.currentProjectId] || null;
    };

    const getCurrentTasks = () => {
        const currentProject = getCurrentProject();
        return currentProject ? currentProject.tasks || [] : [];
    };

    const getProjectsSortedByPriority = () => {
        return Object.values(state.projects).sort((a, b) => b.priority - a.priority);
    };

    const calculateTaskPriority = (task, categories) => {
        if (!task.priorityRatings || !categories) return 0;

        let totalScore = 0;

        categories.forEach(category => {
            const rating = task.priorityRatings[category.id] || 0;
            const weight = category.weight / 100;
            totalScore += rating * weight;
        });

        // Add urgency bonus
        if (task.dueDate && !task.completed) {
            const dueDate = new Date(task.dueDate);
            const now = new Date();
            const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

            if (daysUntilDue <= 0) {
                totalScore += 0.5; // Overdue bonus
            } else if (daysUntilDue <= 1) {
                totalScore += 0.3; // Due today/tomorrow
            } else if (daysUntilDue <= 7) {
                totalScore += 0.15; // Due this week
            }
        }

        return Math.min(totalScore, 5); // Cap at 5
    };

    // Context value
    const value = {
        // State
        projects: state.projects,
        currentProjectId: state.currentProjectId,
        user: state.user,
        loading: state.loading,
        error: state.error,

        // Actions
        setCurrentProject,
        createProject,
        updateProject,
        deleteProject,
        addTask,
        updateTask,
        deleteTask,
        updateCategories,
        updateUserStats,

        // Computed values
        getCurrentProject,
        getCurrentTasks,
        getProjectsSortedByPriority,
        calculateTaskPriority
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
}

// Custom hook to use project context
export function useProjects() {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
}

// Export actions for external use
export { PROJECT_ACTIONS };