import React, { useEffect, useId } from 'react';
import styles from './Modal.module.css';
import { ClearIcon } from '../Icons';

function Modal({ isOpen, onClose, title, children, contentClassName = '', bodyClassName = '', width = '90%' }) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${styles.modalContent} ${contentClassName}`.trim()}
        style={{ width }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 id={titleId}>{title}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label={`Close ${title}`}>
            <ClearIcon />
          </button>
        </div>
        <div className={`${styles.modalBody} ${bodyClassName}`.trim()}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;