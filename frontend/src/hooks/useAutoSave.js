// src/hooks/useAutoSave.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './useToast';

const useAutoSave = (
  data, 
  saveFunction, 
  options = {}
) => {
  const {
    delay = 800,
    key = 'appData',
    onSaveSuccess = null,
    onSaveError = null,
    enableToasts = true
  } = options;

  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  
  const { showToast } = useToast();
  const timeoutRef = useRef(null);
  const isInitialRender = useRef(true);
  const lastDataRef = useRef(data);

  // Clear any pending save timeout
  const clearSaveTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Perform the actual save operation
  const performSave = useCallback(async (dataToSave) => {
    setSaveStatus('saving');
    setError(null);

    try {
      // Use provided save function or default to localStorage
      if (saveFunction) {
        await saveFunction(dataToSave);
      } else {
        localStorage.setItem(key, JSON.stringify(dataToSave));
      }

      const now = new Date().toISOString();
      setLastSaved(now);
      setSaveStatus('saved');

      // Call success callback if provided
      if (onSaveSuccess) {
        onSaveSuccess(dataToSave, now);
      }

      // Show success toast if enabled
      if (enableToasts) {
        showToast('Data saved successfully', 'success');
      }

      // Auto-return to idle after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);

    } catch (err) {
      const errorMessage = err.message || 'Failed to save data';
      setError(errorMessage);
      setSaveStatus('error');

      // Call error callback if provided
      if (onSaveError) {
        onSaveError(err);
      }

      // Show error toast if enabled
      if (enableToasts) {
        showToast(`Save failed: ${errorMessage}`, 'error');
      }

      // Auto-return to idle after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setError(null);
      }, 5000);
    }
  }, [saveFunction, key, onSaveSuccess, onSaveError, enableToasts, showToast]);

  // Trigger save with debouncing
  const triggerSave = useCallback((dataToSave) => {
    clearSaveTimeout();
    
    timeoutRef.current = setTimeout(() => {
      performSave(dataToSave);
    }, delay);
  }, [delay, performSave, clearSaveTimeout]);

  // Force immediate save (for manual save button)
  const forceSave = useCallback(() => {
    clearSaveTimeout();
    performSave(data);
  }, [data, performSave, clearSaveTimeout]);

  // Main effect to handle data changes
  useEffect(() => {
    // Skip saving on initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
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
      clearSaveTimeout();
    };
  }, [clearSaveTimeout]);

  // Load initial data and set last saved time
  useEffect(() => {
    if (!saveFunction) {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          // Try to get last modified time from localStorage metadata
          const metaKey = `${key}_meta`;
          const meta = localStorage.getItem(metaKey);
          if (meta) {
            const { lastSaved: savedTime } = JSON.parse(meta);
            setLastSaved(savedTime);
          }
        }
      } catch (err) {
        console.warn('Failed to load save metadata:', err);
      }
    }
  }, [key, saveFunction]);

  // Save metadata alongside data for localStorage
  useEffect(() => {
    if (!saveFunction && lastSaved) {
      try {
        const metaKey = `${key}_meta`;
        localStorage.setItem(metaKey, JSON.stringify({ lastSaved }));
      } catch (err) {
        console.warn('Failed to save metadata:', err);
      }
    }
  }, [lastSaved, key, saveFunction]);

  return {
    saveStatus,
    lastSaved,
    error,
    forceSave,
    clearError: () => {
      setError(null);
      setSaveStatus('idle');
    }
  };
};

export default useAutoSave;