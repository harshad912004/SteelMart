import React, { useState, useRef } from 'react';
import styles from './AddHistoryModal.module.css';
import { addBidRFIHistory } from '../../services/api';

function AddHistoryModal({ isOpen, onClose, bidId, rfiId, onAdded }) {
  const [notes, setNotes] = useState('');
  const [replyOnly, setReplyOnly] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSave = async () => {
    if (!notes.trim() && !file) {
      alert('Please enter a message or upload a file.');
      return;
    }

    try {
      setLoading(true);
      await addBidRFIHistory(bidId, rfiId, file, notes, replyOnly);
      if (onAdded) onAdded();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to add history entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Add To History</h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes</label>
            <input
              type="text"
              className={styles.notesInput}
              placeholder="Enter your notes here"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Add File</label>
            <div className={styles.fileUploadArea} onClick={handleBrowseClick} style={{ cursor: 'pointer' }}>
              {file ? (
                <span style={{ color: '#3047f7' }}>{file.name}</span>
              ) : (
                <>
                  <button type="button" className={styles.browseButton}>
                    Browse File
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 8 }}>
                      <path d="M2 10v2.667A1.333 1.333 0 003.333 14h9.334A1.333 1.333 0 0014 12.667V10M11.333 5.333L8 2m0 0L4.667 5.333M8 2v8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className={styles.dropText}>or Drop file</span>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
            </div>
          </div>
        </div>

        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            id="replyOnly"
            className={styles.checkbox}
            checked={replyOnly}
            onChange={(e) => setReplyOnly(e.target.checked)}
          />
          <label htmlFor="replyOnly" className={styles.checkboxLabel}>Reply Only</label>
        </div>

        <div className={styles.footerButtons}>
          <button type="button" className={styles.cancelButton} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="button" className={styles.addButton} onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddHistoryModal;