// src/components/ui/Toast.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import styles from '../../styles/components/Toast.module.css';

const Toast = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  isVisible = false 
}) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const handleClose = () => {
    setShow(false);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className={styles.icon} />;
      case 'error':
        return <AlertCircle className={styles.icon} />;
      case 'info':
      default:
        return <Info className={styles.icon} />;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return styles.success;
      case 'error':
        return styles.error;
      case 'info':
      default:
        return styles.info;
    }
  };

  if (!message) return null;

  return (
    <div className={`${styles.toastContainer} ${show ? styles.show : styles.hide}`}>
      <div className={`${styles.toast} ${getTypeClass()}`}>
        <div className={styles.content}>
          {getIcon()}
          <span className={styles.message}>{message}</span>
        </div>
        <button 
          onClick={handleClose}
          className={styles.closeButton}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;