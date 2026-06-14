import React, { useState, useRef } from 'react';
import Modal from '../../components/Modal';
import styles from '../RFIs/AddRFIModal.module.css'; // Reusing modal styles
import { createBidSubmittal, addBidSubmittalVersion } from '../../services/api';

function AddSubmittalModal({ isOpen, onClose, bidId, onCreated }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
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
      // 1. Create Submittal
      const res = await createBidSubmittal(bidId, {
        title,
        type,
        due_date: dueDate,
        priority,
        ball_in_court: '',
      });

      const newSubmittal = res.submittal || (res.data && res.data.submittal);
      if (newSubmittal && newSubmittal.id) {
        // 2. Upload initial version if file exists
        if (file) {
          await addBidSubmittalVersion(bidId, newSubmittal.id, file, 'Initial Submission', 'open');
        } else {
          // even if no file, add an initial version entry
          await addBidSubmittalVersion(bidId, newSubmittal.id, null, 'Initial Submission', 'open');
        }
      }

      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      console.error('Error creating Submittal:', err);
      alert('Failed to create Submittal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Submittal" width="540px">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
          <label>Submittal Name</label>
          <input 
            type="text" 
            placeholder="Enter Submittal Name" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Select Type</option>
            <option value="Product Data">Product Data</option>
            <option value="Shop Drawing">Shop Drawing</option>
            <option value="Samples">Samples</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
          <label>Due Date</label>
          <input 
            type="date" 
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
          <label>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Select Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Add Submittals</label>
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

export default AddSubmittalModal;
