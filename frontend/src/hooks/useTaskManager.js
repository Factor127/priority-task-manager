import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { calculatePriorityScore } from '../utils/taskHelpers';

export const useTaskManager = () => {
    const { 
        tasks, 
        setTasks, 
        priorityCategories,
        userProgress, 
        setUserProgress
    } = useApp();

    // Create a new task
    const handleCreateTask = useCallback((taskData) => {
        const newTask = {
            id: Date.now(),
            title: taskData.title || 'New Task',
            project: taskData.project || '',
            goal: taskData.goal || '',
            update: taskData.update || '',
            type: taskData.type || '',
            status: taskData.status || 'לא התחיל',
            dueDate: taskData.dueDate || '',
            link: taskData.link || '',
            priorityRatings: taskData.priorityRatings || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null
        };
        
        setTasks(prev => [...prev, newTask]);
        return `Task "${newTask.title}" created successfully!`;
    }, [setTasks]);

    // Update existing task
    const handleUpdateTask = useCallback((updatedTask) => {
        const oldTask = tasks.find(t => t.id === updatedTask.id);
        
        setTasks(prev => prev.map(task => 
            task.id === updatedTask.id ? {
                ...updatedTask,
                updatedAt: new Date().toISOString()
            } : task
        ));
        
        // Handle completion points
        if (updatedTask.status === 'הושלם' && oldTask?.status !== 'הושלם') {
            const priorityWeights = {};
            priorityCategories.forEach(cat => {
                priorityWeights[cat.id] = cat.weight;
            });
            
            const points = Math.round(calculatePriorityScore(updatedTask, priorityCategories, priorityWeights) * 10);
            const newPoints = userProgress.points + points;
            const newLevel = Math.floor(newPoints / 1000) + 1;
            
            setUserProgress(prev => ({
                ...prev,
                points: newPoints,
                level: newLevel
            }));
            
            return `Task completed! +${points} points`;
        }
        
        return null;
    }, [tasks, setTasks, priorityCategories, userProgress, setUserProgress]);

    // Delete task
    const handleDeleteTask = useCallback((taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setTasks(prev => prev.filter(task => task.id !== taskId));
            return 'Task deleted successfully!';
        }
        return null;
    }, [setTasks]);

    // Toggle task completion
    const handleToggleComplete = useCallback((taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return null;

        const isCompleting = task.status !== 'הושלם';
        const updatedTask = {
            ...task,
            status: isCompleting ? 'הושלם' : 'בעבודה',
            completedAt: isCompleting ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString()
        };

        return handleUpdateTask(updatedTask);
    }, [tasks, handleUpdateTask]);

    return {
        handleCreateTask,
        handleUpdateTask,
        handleDeleteTask,
        handleToggleComplete
    };
};