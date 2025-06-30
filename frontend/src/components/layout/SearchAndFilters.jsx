// SearchAndFilters.jsx - Fixed with proper IDs and names
import React from 'react';

const SearchAndFilters = ({ 
    searchQuery, 
    onSearchChange, 
    statusFilter, 
    onStatusFilterChange,
    taskStats,
    onClearFilters 
}) => {
    // Generate unique IDs for this component instance
    const searchId = `search-input-${Math.random().toString(36).substr(2, 9)}`;
    const statusFilterId = `status-filter-${Math.random().toString(36).substr(2, 9)}`;

    const containerStyle = {
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    };

    const searchStyle = {
        padding: '12px 16px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        width: '100%',
        background: '#f9fafb',
        transition: 'all 0.2s ease'
    };

    const filtersStyle = {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap'
    };

    const selectStyle = {
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        background: 'white',
        fontSize: '14px'
    };

    const statsStyle = {
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap'
    };

    const statChipStyle = {
        background: '#f3f4f6',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#374151'
    };

    const clearBtnStyle = {
        padding: '6px 12px',
        background: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        cursor: 'pointer'
    };

    const hasFilters = searchQuery || statusFilter !== 'all';

    return (
        <div style={containerStyle}>
            {/* Search Input - Fixed with proper ID and name */}
            <div>
                <label 
                    htmlFor={searchId}
                    style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontSize: '14px', 
                        fontWeight: '500',
                        color: '#374151'
                    }}
                >
                    Search Tasks
                </label>
                <input
                    id={searchId} // ✅ Unique ID
                    name="searchQuery" // ✅ Proper name
                    type="text"
                    placeholder="🔍 Search tasks by title, project, goal, or notes..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{
                        ...searchStyle,
                        borderColor: searchQuery ? '#4f46e5' : '#e5e7eb'
                    }}
                    aria-describedby={`${searchId}-help`}
                />
                <div 
                    id={`${searchId}-help`}
                    style={{ 
                        fontSize: '12px', 
                        color: '#6b7280', 
                        marginTop: '4px' 
                    }}
                >
                    Search across all task fields including title, project, goal, and notes
                </div>
            </div>

            {/* Filters and Stats */}
            <div style={filtersStyle}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label 
                        htmlFor={statusFilterId}
                        style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#374151' 
                        }}
                    >
                        Filter:
                    </label>
                    <select 
                        id={statusFilterId} // ✅ Unique ID
                        name="statusFilter" // ✅ Proper name
                        value={statusFilter} 
                        onChange={(e) => onStatusFilterChange(e.target.value)}
                        style={selectStyle}
                        aria-describedby={`${statusFilterId}-help`}
                    >
                        <option value="all">All Tasks ({taskStats.total})</option>
                        <option value="active">Active ({taskStats.active})</option>
                        <option value="completed">Completed ({taskStats.completed})</option>
                    </select>
                    <div 
                        id={`${statusFilterId}-help`}
                        style={{ 
                            fontSize: '12px', 
                            color: '#6b7280',
                            display: 'none' // Hidden but available for screen readers
                        }}
                    >
                        Filter tasks by completion status
                    </div>
                    
                    {hasFilters && (
                        <button 
                            style={clearBtnStyle} 
                            onClick={onClearFilters}
                            type="button"
                            aria-label="Clear all filters"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                <div style={statsStyle}>
                    <div style={statChipStyle} role="status" aria-label={`${taskStats.total} total tasks`}>
                        📊 {taskStats.total} Total
                    </div>
                    <div style={statChipStyle} role="status" aria-label={`${taskStats.active} active tasks`}>
                        ⚡ {taskStats.active} Active
                    </div>
                    <div style={statChipStyle} role="status" aria-label={`${taskStats.completed} completed tasks`}>
                        ✅ {taskStats.completed} Done
                    </div>
                    {taskStats.overdue > 0 && (
                        <div 
                            style={{...statChipStyle, background: '#fee2e2', color: '#dc2626'}}
                            role="alert"
                            aria-label={`${taskStats.overdue} overdue tasks`}
                        >
                            🚨 {taskStats.overdue} Overdue
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchAndFilters;