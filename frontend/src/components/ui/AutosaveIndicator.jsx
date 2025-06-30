// src/components/ui/AutosaveIndicator.jsx
import React from 'react';
import { Save, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import styles from '../../styles/components/AutosaveIndicator.module.css';

const AutosaveIndicator = ({ 
  status = 'idle', 
  lastSaved = null, 
  error = null,
  className = '' 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Save,
          text: 'Saving...',
          className: styles.saving,
          showPulse: true
        };
      case 'saved':
        return {
          icon: CheckCircle,
          text: 'Saved',
          className: styles.saved,
          showPulse: false
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: error || 'Save Error',
          className: styles.error,
          showPulse: false
        };
      case 'idle':
      default:
        return {
          icon: Clock,
          text: 'Auto-save',
          className: styles.idle,
          showPulse: false
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const formatLastSaved = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const saved = new Date(timestamp);
    const diffInSeconds = Math.floor((now - saved) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else {
      return saved.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  return (
    <div className={`${styles.container} ${config.className} ${className}`}>
      <div className={styles.iconWrapper}>
        <IconComponent 
          className={`${styles.icon} ${config.showPulse ? styles.pulse : ''}`}
          size={16}
        />
      </div>
      
      <div className={styles.content}>
        <span className={styles.statusText}>
          {config.text}
        </span>
        
        {lastSaved && status !== 'saving' && (
          <span className={styles.timestamp}>
            {formatLastSaved(lastSaved)}
          </span>
        )}
      </div>
      
      {/* Pulse animation dot for saving state */}
      {config.showPulse && (
        <div className={styles.pulseContainer}>
          <div className={styles.pulseDot} />
        </div>
      )}
    </div>
  );
};

export default AutosaveIndicator;