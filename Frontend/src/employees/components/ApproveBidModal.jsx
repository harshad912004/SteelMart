import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Check } from 'lucide-react';

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
  width: '460px',
  maxWidth: '90vw',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const titleStyle = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#101828',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#667085',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const subtitleStyle = {
  fontSize: '14px',
  color: '#667085',
  marginBottom: '20px',
  lineHeight: 1.4,
};

const clientListStyle = {
  maxHeight: '200px',
  overflowY: 'auto',
  border: '1px solid #eaecf0',
  borderRadius: '8px',
  padding: '12px',
  marginBottom: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const clientRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
  userSelect: 'none',
  padding: '6px 8px',
  borderRadius: '6px',
  transition: 'background-color 0.2s',
};

const checkboxStyle = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
};

const clientNameStyle = {
  fontSize: '14px',
  color: '#344054',
  fontWeight: 500,
};

const btnRowStyle = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
};

const btnBase = {
  padding: '10px 20px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  transition: 'all 0.2s ease',
};

const btnCancel = {
  ...btnBase,
  background: '#fff',
  border: '1px solid #d0d5dd',
  color: '#344054',
};

const btnApprove = {
  ...btnBase,
  background: '#1570ef',
  border: '1px solid #1570ef',
  color: '#fff',
};

function ApproveBidModal({ isOpen, onClose, onConfirm, bid }) {
  const [selectedClients, setSelectedClients] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedClients([]);
    }
  }, [isOpen]);

  if (!isOpen || !bid) return null;

  const clients = Array.isArray(bid.clients) ? bid.clients : [];

  const handleToggleClient = (clientId) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSave = () => {
    if (selectedClients.length === 0) {
      alert('Please select at least one General Contractor.');
      return;
    }
    onConfirm(selectedClients);
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={titleStyle}>Approve Bid</div>
          <button style={closeBtnStyle} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div style={subtitleStyle}>
          Select the General Contractor(s) (GC) that approved this bid:
        </div>

        {clients.length === 0 ? (
          <div style={{ ...subtitleStyle, color: '#d92d20', fontStyle: 'italic' }}>
            No General Contractors are currently associated with this bid.
          </div>
        ) : (
          <div style={clientListStyle}>
            {clients.map((client) => {
              const clientId = client.client_id || client.id;
              const clientName = client.client_name || client.name || client.company_name || 'N/A';
              const isChecked = selectedClients.includes(clientId);

              return (
                <div
                  key={clientId}
                  style={{
                    ...clientRowStyle,
                    backgroundColor: isChecked ? '#f9fafb' : 'transparent',
                  }}
                  onClick={() => handleToggleClient(clientId)}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Handled by row click
                    style={checkboxStyle}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span style={clientNameStyle}>{clientName}</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={btnRowStyle}>
          <button
            style={btnCancel}
            onClick={onClose}
            onMouseEnter={(e) => (e.target.style.background = '#f9fafb')}
            onMouseLeave={(e) => (e.target.style.background = '#fff')}
          >
            Cancel
          </button>
          <button
            style={btnApprove}
            disabled={clients.length === 0}
            onClick={handleSave}
            onMouseEnter={(e) => (e.target.style.background = '#1260cc')}
            onMouseLeave={(e) => (e.target.style.background = '#1570ef')}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApproveBidModal;
