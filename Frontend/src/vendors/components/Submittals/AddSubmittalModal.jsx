import React, { useState, useRef } from 'react';
import { X, Calendar } from 'lucide-react';
import styles from './AddSubmittalModal.module.css';

function AddSubmittalModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
  const [file, setFile] = useState(null);

  const fileInputRef = useRef(null);
  const dateInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Submittal Name is required');
      return;
    }
    onCreate?.({ title, type, dueDate, priority, file });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Add Submittals"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className={styles.header}>
          <h2 className={styles.title}>Add Submittals</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── Body ─── */}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            {/* Row 1 */}
            <div className={styles.formGroup}>
              <label htmlFor="submittal-name">Submittal Name</label>
              <input
                id="submittal-name"
                type="text"
                placeholder="Enter submittal name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="submittal-type">Type</label>
              <select 
                id="submittal-type" 
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="" disabled>
                  Select Type
                </option>
                <option value="Shop Drawing">Shop Drawing</option>
                <option value="Product Data">Product Data</option>
                <option value="Samples">Samples</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Row 2 */}
            <div className={styles.formGroup}>
              <label htmlFor="submittal-due-date">Due Date</label>
              <div className={styles.dateWrap}>
                <input
                  ref={dateInputRef}
                  id="submittal-due-date"
                  type="date"
                  placeholder="mm-dd-yyyy"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <Calendar
                  size={16}
                  className={styles.dateIcon}
                  onClick={() => dateInputRef.current?.showPicker?.()}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="submittal-priority">Priority</label>
              <select 
                id="submittal-priority" 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="" disabled>
                  Select Priority
                </option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* File upload */}
          <div className={styles.uploadSection}>
            <label>Add Submittals</label>
            <div 
              className={styles.dropzone}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {file ? (
                <span className={styles.dropzoneText} style={{ color: '#1570ef', fontWeight: 500 }}>
                  {file.name}
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.browseBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse File
                  </button>
                  <span className={styles.dropzoneText}>or Drop file</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.createBtn}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSubmittalModal;