import React from 'react';

const EmptyState = ({ taskCount, onCreateTask }) => {
    const emptyStateStyle = {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#6b7280'
    };

    const titleStyle = {
        fontSize: '20px',
        marginBottom: '10px',
        color: '#374151'
    };

    const textStyle = {
        fontSize: '16px',
        marginBottom: '20px'
    };

    const tipStyle = {
        fontSize: '14px',
        color: '#9ca3af',
        marginTop: '10px'
    };

    const subtipStyle = {
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '5px'
    };

    const createBtnStyle = {
        padding: '10px 16px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        background: '#4f46e5',
        color: 'white',
        transition: 'all 0.2s ease',
        marginTop: '10px'
    };

    return (
        <div style={emptyStateStyle}>
            <h3 style={titleStyle}>No tasks found</h3>
            <p style={textStyle}>
                {taskCount === 0 
                    ? "Get started by creating your first task!"
                    : "Try adjusting your search or filters."
                }
            </p>
            <p style={tipStyle}>
                💡 Tip: Click on any task to expand and edit it inline
            </p>
            <p style={subtipStyle}>
                🔄 Auto-save is enabled - your changes are saved automatically
            </p>
            {taskCount === 0 && (
                <button 
                    style={createBtnStyle} 
                    onClick={onCreateTask}
                    onMouseOver={(e) => e.target.style.background = '#3b38d9'}
                    onMouseOut={(e) => e.target.style.background = '#4f46e5'}
                >
                    Create Your First Task
                </button>
            )}
        </div>
    );
};

export default EmptyState;