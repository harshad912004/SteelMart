import React, { useEffect } from 'react';
import styles from './Toast.module.css';

/**
 * Toast Component
 * Displays success/error messages in a toast format
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether toast is visible
 * @param {string} props.message - Toast message
 * @param {boolean} props.isSuccess - True for green success toast, false for red error toast
 * @param {Function} props.onClose - Callback when toast closes
 * @param {number} props.duration - Duration in ms before auto-close (default: 3000)
 */
export default function Toast({ isOpen, message, isSuccess = true, onClose, duration = 3000 }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen || !message) return null;

  return (
    <div className={`${styles.toast} ${isSuccess ? styles.success : styles.error}`}>
      <div className={styles.content}>
        <span className={styles.icon}>
          {isSuccess ? '✓' : '✕'}
        </span>
        <span className={styles.message}>{message}</span>
      </div>
      <button
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Close toast"
      >
        ×
      </button>
    </div>
  );
}