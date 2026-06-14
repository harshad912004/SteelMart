import React, { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';

const s = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#fff', borderRadius: '14px', width: '540px', maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid #e4e7ec',
  },
  title: { fontSize: '18px', fontWeight: 700, color: '#101828' },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer', color: '#667085',
    padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center',
  },
  body: { padding: '24px' },
  field: { marginBottom: '20px' },
  label: {
    display: 'block', fontSize: '14px', fontWeight: 500, color: '#344054',
    marginBottom: '6px',
  },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #d0d5dd', fontSize: '14px', color: '#101828',
    fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  textarea: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #d0d5dd', fontSize: '14px', color: '#101828',
    fontFamily: "'Inter', sans-serif", outline: 'none', resize: 'vertical',
    minHeight: '100px', boxSizing: 'border-box', transition: 'border-color 0.2s',
  },
  uploadArea: {
    border: '2px dashed #d0d5dd', borderRadius: '8px', padding: '24px',
    textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s',
    background: '#f9fafb',
  },
  uploadIcon: {
    width: '40px', height: '40px', borderRadius: '50%', background: '#eef3f8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 12px',
  },
  browseBtn: {
    display: 'inline-block', padding: '8px 18px', borderRadius: '8px',
    background: '#1d2939', color: '#fff', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', border: 'none', fontFamily: "'Inter', sans-serif",
    marginBottom: '8px',
  },
  orDrop: {
    fontSize: '13px', color: '#667085',
  },
  fileName: {
    fontSize: '13px', color: '#1570ef', marginTop: '8px', fontWeight: 500,
  },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: '12px',
    padding: '16px 24px', borderTop: '1px solid #e4e7ec',
  },
  btnBase: {
    padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
    cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
  },
};

function AddRFIModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  if (!isOpen) return null;

  const handleCreate = () => {
    onCreate && onCreate({ title, notes, file });
    setTitle('');
    setNotes('');
    setFile(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.card} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <span style={s.title}>New RFI</span>
          <button style={s.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        <div style={s.body}>
          <div style={s.field}>
            <label style={s.label}>Title</label>
            <input
              style={s.input}
              placeholder="Enter RFI title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = '#1570ef')}
              onBlur={(e) => (e.target.style.borderColor = '#d0d5dd')}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Notes</label>
            <textarea
              style={s.textarea}
              placeholder="Enter notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = '#1570ef')}
              onBlur={(e) => (e.target.style.borderColor = '#d0d5dd')}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Add RFI Reply</label>
            <div
              style={s.uploadArea}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div style={s.uploadIcon}>
                <Upload size={20} color="#667085" />
              </div>
              <button
                style={s.browseBtn}
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                Browse File
              </button>
              <div style={s.orDrop}>or Drop file</div>
              {file && <div style={s.fileName}>{file.name}</div>}
              <input
                ref={fileRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        </div>
        <div style={s.footer}>
          <button
            style={{
              ...s.btnBase,
              background: '#fff',
              border: '1px solid #d0d5dd',
              color: '#344054',
            }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{
              ...s.btnBase,
              background: '#1570ef',
              border: '1px solid #1570ef',
              color: '#fff',
            }}
            onClick={handleCreate}
            onMouseEnter={(e) => (e.target.style.background = '#1260cc')}
            onMouseLeave={(e) => (e.target.style.background = '#1570ef')}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddRFIModal;