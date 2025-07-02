// src/components/layout/ProjectTabs.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import styles from './ProjectTabs.module.css';

const ProjectTabs = ({ onNewProject, onManageCategories }) => {
    const {
        projects,
        currentProjectId,
        setCurrentProject,
        deleteProject,
        updateProject,
        getProjectsSortedByPriority
    } = useProjects();

    const [showPriorityControls, setShowPriorityControls] = useState(false);
    const [tempPriority, setTempPriority] = useState(50);

    const sortedProjects = getProjectsSortedByPriority();
    const currentProject = projects[currentProjectId];

    const handleTabClick = (projectId) => {
        setCurrentProject(projectId);
        const project = projects[projectId];
        if (project) {
            setTempPriority(project.priority);
        }
    };

    const handleDeleteProject = (projectId, event) => {
        event.stopPropagation();
        
        if (projectId === 'personal') {
            alert('לא ניתן למחוק את הפרויקט האישי');
            return;
        }

        const project = projects[projectId];
        if (window.confirm(`האם אתה בטוח שברצונך למחוק את הפרויקט "${project.name}"? כל המשימות יימחקו לצמיתות.`)) {
            try {
                deleteProject(projectId);
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const handlePriorityUpdate = () => {
        if (currentProject && tempPriority >= 1 && tempPriority <= 100) {
            updateProject(currentProjectId, { priority: tempPriority });
            setShowPriorityControls(false);
        }
    };

    const adjustPriority = (delta) => {
        const newValue = Math.max(1, Math.min(100, tempPriority + delta));
        setTempPriority(newValue);
    };

    const getTaskCount = (project) => {
        const tasks = project.tasks || [];
        return tasks.filter(task => !task.completed).length;
    };

    return (
        <div className={styles.projectTabsContainer}>
            {/* Tab Header */}
            <div className={styles.tabHeader}>
                <h3>פרויקטים</h3>
                <div className={styles.tabControls}>
                    <button 
                        className={styles.btnSecondary}
                        onClick={onNewProject}
                        title="צור פרויקט חדש"
                    >
                        + פרויקט חדש
                    </button>
                </div>
            </div>

            {/* Tab List */}
            <div className={styles.tabList}>
                {sortedProjects.map(project => {
                    const taskCount = getTaskCount(project);
                    const isActive = currentProjectId === project.id;
                    
                    return (
                        <button
                            key={project.id}
                            className={`${styles.tab} ${isActive ? styles.active : ''}`}
                            onClick={() => handleTabClick(project.id)}
                            style={{ borderBottom: `3px solid ${project.color}` }}
                        >
                            <span className={styles.tabName}>{project.name}</span>
                            <span className={`${styles.tabBadge} ${isActive ? styles.activeBadge : ''}`}>
                                {taskCount}
                            </span>
                            {project.id !== 'personal' && (
                                <button
                                    className={styles.tabClose}
                                    onClick={(e) => handleDeleteProject(project.id, e)}
                                    title="מחק פרויקט"
                                    aria-label={`מחק פרויקט ${project.name}`}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Project Settings */}
            {currentProject && currentProject.id !== 'personal' && (
                <div className={styles.projectSettings}>
                    <div className={styles.projectPriorityControl}>
                        <span>עדיפות פרויקט:</span>
                        <div className={styles.priorityControls}>
                            <input
                                type="number"
                                className={styles.priorityInput}
                                value={tempPriority}
                                onChange={(e) => setTempPriority(parseInt(e.target.value) || 50)}
                                min="1"
                                max="100"
                            />
                            <div className={styles.priorityButtons}>
                                <button
                                    className={styles.priorityBtn}
                                    onClick={() => adjustPriority(-10)}
                                    title="הקטן ב-10"
                                >
                                    --
                                </button>
                                <button
                                    className={styles.priorityBtn}
                                    onClick={() => adjustPriority(-1)}
                                    title="הקטן ב-1"
                                >
                                    -
                                </button>
                                <button
                                    className={styles.priorityBtn}
                                    onClick={() => adjustPriority(1)}
                                    title="הגדל ב-1"
                                >
                                    +
                                </button>
                                <button
                                    className={styles.priorityBtn}
                                    onClick={() => adjustPriority(10)}
                                    title="הגדל ב-10"
                                >
                                    ++
                                </button>
                            </div>
                            <button
                                className={styles.btnSecondary}
                                onClick={handlePriorityUpdate}
                            >
                                עדכן
                            </button>
                        </div>
                    </div>
                    
                    <div className={styles.projectActions}>
                        <button
                            className={styles.btnSecondary}
                            onClick={onManageCategories}
                        >
                            נהל קטגוריות עדיפות
                        </button>
                        <div className={styles.projectInfo}>
                            <span className={styles.projectName}>{currentProject.name}</span>
                            {currentProject.description && (
                                <span className={styles.projectDescription}>
                                    {currentProject.description}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectTabs;