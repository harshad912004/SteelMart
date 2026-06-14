import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  fontFamily: "'Inter', sans-serif",
};

const cardStyle = {
  background: '#fff',
  borderRadius: '14px',
  padding: '32px 36px',
  width: '420px',
  maxWidth: '90vw',
  textAlign: 'center',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
};

const iconWrapStyle = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  background: '#fef3f2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
};

const titleStyle = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#101828',
  marginBottom: '8px',
  lineHeight: 1.5,
};

const subtitleStyle = {
  fontSize: '14px',
  color: '#667085',
  marginBottom: '28px',
};

const btnRowStyle = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
};

const btnBase = {
  padding: '10px 32px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  transition: 'all 0.2s ease',
};

const btnNo = {
  ...btnBase,
  background: '#fff',
  border: '1px solid #d0d5dd',
  color: '#344054',
};

const btnYes = {
  ...btnBase,
  background: '#1570ef',
  border: '1px solid #1570ef',
  color: '#fff',
};

function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName }) {
  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={iconWrapStyle}>
          <AlertCircle size={28} color="#f97316" strokeWidth={2} />
        </div>
        <div style={titleStyle}>
          Are you sure you want to remove {itemName || 'this item'}?
        </div>
        <div style={subtitleStyle}>This action cannot be undone</div>
        <div style={btnRowStyle}>
          <button style={btnNo} onClick={onClose} onMouseEnter={(e) => e.target.style.background = '#f9fafb'} onMouseLeave={(e) => e.target.style.background = '#fff'}>
            No
          </button>
          <button style={btnYes} onClick={onConfirm} onMouseEnter={(e) => e.target.style.background = '#1260cc'} onMouseLeave={(e) => e.target.style.background = '#1570ef'}>
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;