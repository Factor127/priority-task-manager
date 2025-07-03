// frontend/src/components/ConnectionStatus.js
import React from 'react';
import { useApp } from '../context/AppContext';
import './ConnectionStatus.css';

function ConnectionStatus() {
  const { apiStatus, isOffline, loading, error, syncData, migrateFromLocalStorage } = useApp();

  if (apiStatus === 'success' && !isOffline) {
    return null; // Don't show anything when connected
  }

  const handleSync = async () => {
    const result = await syncData();
    if (result.success) {
      console.log('Sync successful');
    }
  };

  const handleMigration = async () => {
    const result = await migrateFromLocalStorage();
    if (result.success) {
      console.log('Migration successful');
    }
  };

  return (
    <div className="connection-status">
      {loading && (
        <div className="status-banner status-loading">
          <span>🔄 Connecting to server...</span>
        </div>
      )}
      
      {isOffline && (
        <div className="status-banner status-offline">
          <span>📡 Offline Mode - Using local data</span>
          <button onClick={handleSync} className="sync-button">
            Try Reconnect
          </button>
        </div>
      )}
      
      {error && !isOffline && (
        <div className="status-banner status-error">
          <span>⚠️ Connection Error: {error}</span>
          <button onClick={handleSync} className="sync-button">
            Retry
          </button>
        </div>
      )}
      
      {apiStatus === 'success' && !isOffline && (
        <div className="status-banner status-migration">
          <span>🚀 Connected to cloud! Migrate your data?</span>
          <button onClick={handleMigration} className="migrate-button">
            Migrate Data
          </button>
        </div>
      )}
    </div>
  );
}

export default ConnectionStatus;
