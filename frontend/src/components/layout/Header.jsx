// Header.jsx - Fixed with proper IDs and accessibility
import React from 'react';

const AutosaveIndicator = ({ overallSaveState, AUTOSAVE_STATES }) => {
    const getIndicatorContent = () => {
        switch (overallSaveState) {
            case AUTOSAVE_STATES.SAVING:
                return {
                    text: 'Saving...',
                    color: '#4f46e5',
                    background: '#eff6ff',
                    borderColor: '#4f46e5',
                    showDot: true,
                    pulsing: true
                };
            case AUTOSAVE_STATES.SAVED:
                return {
                    text: 'Saved',
                    color: '#10b981',
                    background: '#f0fdf4',
                    borderColor: '#10b981',
                    showDot: true,
                    pulsing: false
                };
            case AUTOSAVE_STATES.ERROR:
                return {
                    text: 'Save Error',
                    color: '#ef4444',
                    background: '#fef2f2',
                    borderColor: '#ef4444',
                    showDot: true,
                    pulsing: false
                };
            default:
                return {
                    text: 'Auto-save',
                    color: '#6b7280',
                    background: '#f9fafb',
                    borderColor: '#e5e7eb',
                    showDot: true,
                    pulsing: false
                };
        }
    };

    const { text, color, background, borderColor, showDot, pulsing } = getIndicatorContent();

    return (
        <div 
            style={{
                fontSize: '12px',
                color: color,
                background: background,
                padding: '4px 8px',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}
            role="status"
            aria-label={`Autosave status: ${text}`}
        >
            {showDot && (
                <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: color,
                    animation: pulsing ? 'pulse 1.5s infinite' : 'none'
                }}></div>
            )}
            <span>{text}</span>
        </div>
    );
};

const Header = ({ onCreateTask, onShowFiles, onShowSettings, onForceSave, overallSaveState, AUTOSAVE_STATES }) => {
    // Generate unique IDs for buttons
    const createTaskBtnId = `create-task-btn-${Math.random().toString(36).substr(2, 9)}`;
    const filesBtnId = `files-btn-${Math.random().toString(36).substr(2, 9)}`;
    const settingsBtnId = `settings-btn-${Math.random().toString(36).substr(2, 9)}`;
    const saveBtnId = `save-btn-${Math.random().toString(36).substr(2, 9)}`;

    const headerStyle = {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        color: 'white'
    };

    const logoStyle = {
        fontSize: '24px',
        fontWeight: 'bold',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    const userStatsStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '10px 15px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)'
    };

    const buttonStyle = {
        padding: '10px 16px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        fontSize: '14px'
    };

    const primaryButtonStyle = {
        ...buttonStyle,
        background: 'rgba(255, 255, 255, 0.9)',
        color: '#4f46e5'
    };

    const secondaryButtonStyle = {
        ...buttonStyle,
        background: 'rgba(255, 255, 255, 0.1)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.3)'
    };

    return (
        <header style={headerStyle} role="banner">
            <div style={logoStyle}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>
                    🎯 Priority Task Manager
                </h1>
            </div>
            
            <div style={userStatsStyle}>
                <AutosaveIndicator 
                    overallSaveState={overallSaveState} 
                    AUTOSAVE_STATES={AUTOSAVE_STATES} 
                />
            </div>
            
            <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} role="navigation" aria-label="Main actions">
                <button 
                    id={createTaskBtnId}
                    name="createTask"
                    style={primaryButtonStyle} 
                    onClick={onCreateTask}
                    type="button"
                    aria-label="Create a new task"
                >
                    + New Task
                </button>
                <button 
                    id={filesBtnId}
                    name="showFiles"
                    style={secondaryButtonStyle} 
                    onClick={onShowFiles}
                    type="button"
                    aria-label="Open file manager"
                >
                    📁 Files
                </button>
                <button 
                    id={settingsBtnId}
                    name="showSettings"
                    style={secondaryButtonStyle} 
                    onClick={onShowSettings}
                    type="button"
                    aria-label="Open settings"
                >
                    ⚙️ Settings
                </button>
                <button 
                    id={saveBtnId}
                    name="forceSave"
                    style={secondaryButtonStyle} 
                    onClick={onForceSave}
                    type="button"
                    aria-label="Force save all data now"
                >
                    💾 Save Now
                </button>
            </nav>
        </header>
    );
};

export default Header;