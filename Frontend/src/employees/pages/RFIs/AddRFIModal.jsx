import React, { useState, useRef } from 'react';
import Modal from '../../components/Modal';
import styles from './AddRFIModal.module.css';
import { createBidRFI, addBidRFIHistory } from '../../services/api';

function AddRFIModal({ isOpen, onClose, bidId, onCreated }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleCreate = async () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    try {
      setLoading(true);
      // 1. Create RFI
      const rfiRes = await createBidRFI(bidId, {
        title,
        notes,
        description: '', // Optional description
        ball_in_court: '', // Default or optional
      });

      const newRfi = rfiRes.rfi || (rfiRes.data && rfiRes.data.rfi);
      if (newRfi && newRfi.id) {
        // 2. Upload file as history if provided
        if (file) {
          await addBidRFIHistory(bidId, newRfi.id, file, 'Attached File', false);
        }
      }

      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      console.error('Error creating RFI:', err);
      alert('Failed to create RFI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New RFI" width="540px">
      <div className={styles.formGroup}>
        <label>Title</label>
        <input 
          type="text" 
          placeholder="Enter RFI Title" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Notes</label>
        <textarea 
          placeholder="Enter your notes here" 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Add RFI</label>
        <div className={styles.fileUploadArea} onClick={handleBrowseClick} style={{ cursor: 'pointer' }}>
          {file ? (
            <span style={{ color: '#3047f7' }}>{file.name}</span>
          ) : (
            <>
              <button type="button" className={styles.browseBtn}>
                Browse File
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v10M4 5l4-4 4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1 11v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className={styles.orDropText}>or Drop file</span>
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

      <div className={styles.modalFooter}>
        <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="button" className={styles.createBtn} onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </Modal>
  );
}

export default AddRFIModal;