import React from 'react';

const SearchAndFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    statusFilter, 
    setStatusFilter,
    projectFilter,
    setProjectFilter,
    uniqueProjects 
}) => {
    const sectionStyle = {
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    };

    const searchInputStyle = {
        width: '100%',
        padding: '12px 16px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '16px',
        marginBottom: '15px',
        transition: 'border-color 0.2s ease'
    };

    const filtersStyle = {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
    };

    const filterBtnStyle = {
        padding: '8px 16px',
        border: '2px solid #e5e7eb',
        background: 'white',
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '14px'
    };

    const activeFilterStyle = {
        ...filterBtnStyle,
        background: '#4f46e5',
        color: 'white',
        borderColor: '#4f46e5'
    };

    return (
        <div style={sectionStyle}>
            <input
                type="text"
                style={searchInputStyle}
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            
            <div style={filtersStyle}>
                <button
                    style={statusFilter === 'all' ? activeFilterStyle : filterBtnStyle}
                    onClick={() => setStatusFilter('all')}
                >
                    All
                </button>
                <button
                    style={statusFilter === 'active' ? activeFilterStyle : filterBtnStyle}
                    onClick={() => setStatusFilter('active')}
                >
                    Active
                </button>
                <button
                    style={statusFilter === 'completed' ? activeFilterStyle : filterBtnStyle}
                    onClick={() => setStatusFilter('completed')}
                >
                    Completed
                </button>
                
                {uniqueProjects.length > 0 && (
                    <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        style={{ ...filterBtnStyle, padding: '8px 16px' }}
                    >
                        <option value="all">All Projects</option>
                        {uniqueProjects.map(project => (
                            <option key={project} value={project}>{project}</option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
};

export default SearchAndFilters;