import { useState, useEffect, useRef, useCallback } from 'react';

const SAVE_STATES = {
    IDLE: 'idle',
    SAVING: 'saving',
    SAVED: 'saved',
    ERROR: 'error'
};

const useAutoSave = (data, saveFunction, options = {}) => {
    const {
        delay = 800,
        enableToasts = false,
        key = 'autoSave',
        onSaveSuccess,
        onSaveError
    } = options;

    const [saveStatus, setSaveStatus] = useState(SAVE_STATES.IDLE);
    const [lastSaved, setLastSaved] = useState(null);
    const [error, setError] = useState(null);
    
    // Refs to prevent memory leaks
    const timeoutRef = useRef(null);
    const isMountedRef = useRef(true);
    const lastDataRef = useRef(data);
    const isInitialRender = useRef(true);

    // Clear timeout helper
    const clearSaveTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    // Safe state updates (only if component is mounted)
    const safeSetState = useCallback((stateSetter) => {
        if (isMountedRef.current) {
            stateSetter();
        }
    }, []);

    // Perform save operation
    const performSave = useCallback(async (dataToSave) => {
        if (!isMountedRef.current) return;

        try {
            safeSetState(() => {
                setSaveStatus(SAVE_STATES.SAVING);
                setError(null);
            });

            // Small delay to show saving state
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (!isMountedRef.current) return;

            // Perform the actual save
            if (saveFunction) {
                await saveFunction(dataToSave);
            } else {
                // Default localStorage save
                const jsonString = JSON.stringify(dataToSave);
                const sizeInBytes = new Blob([jsonString]).size;
                
                if (sizeInBytes > 5 * 1024 * 1024) {
                    throw new Error('Data too large for storage');
                }
                
                localStorage.setItem(key, jsonString);
            }

            if (!isMountedRef.current) return;

            const now = new Date().toISOString();
            safeSetState(() => {
                setSaveStatus(SAVE_STATES.SAVED);
                setLastSaved(now);
            });

            // Call success callback
            if (onSaveSuccess) {
                onSaveSuccess();
            }

            // Auto-return to idle after 3 seconds
            timeoutRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                    setSaveStatus(SAVE_STATES.IDLE);
                }
            }, 3000);

        } catch (err) {
            if (!isMountedRef.current) return;

            const errorMessage = err.message || 'Save failed';
            
            safeSetState(() => {
                setError(errorMessage);
                setSaveStatus(SAVE_STATES.ERROR);
            });

            // Call error callback
            if (onSaveError) {
                onSaveError(err);
            }

            // Auto-return to idle after 5 seconds
            timeoutRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                    setSaveStatus(SAVE_STATES.IDLE);
                    setError(null);
                }
            }, 5000);
        }
    }, [saveFunction, key, onSaveSuccess, onSaveError, safeSetState]);

    // Trigger save with debouncing
    const triggerSave = useCallback((dataToSave) => {
        clearSaveTimeout();
        
        timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                performSave(dataToSave);
            }
        }, delay);
    }, [delay, performSave, clearSaveTimeout]);

    // Force immediate save
    const forceSave = useCallback(() => {
        clearSaveTimeout();
        if (isMountedRef.current) {
            performSave(data);
        }
    }, [data, performSave, clearSaveTimeout]);

    // Main effect to handle data changes
    useEffect(() => {
        // Skip saving on initial render
        if (isInitialRender.current) {
            isInitialRender.current = false;
            lastDataRef.current = data;
            return;
        }

        // Skip if data hasn't actually changed
        if (JSON.stringify(data) === JSON.stringify(lastDataRef.current)) {
            return;
        }

        // Update reference and trigger save
        lastDataRef.current = data;
        triggerSave(data);
    }, [data, triggerSave]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            clearSaveTimeout();
        };
    }, [clearSaveTimeout]);

    return {
        saveStatus,
        lastSaved,
        error,
        forceSave,
        clearError: () => {
            if (isMountedRef.current) {
                setError(null);
                setSaveStatus(SAVE_STATES.IDLE);
            }
        }
    };
};

export default useAutoSave;