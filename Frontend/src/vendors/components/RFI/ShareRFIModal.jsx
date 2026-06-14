import React, { useState } from 'react';
import { X, Search, Check } from 'lucide-react';

const employees = [
  { id: 1, name: 'Anugrah Prasetya', company: 'Aquil Tech Labs', defaultChecked: true },
  { id: 2, name: 'Anugrah Prasetya', company: 'SteelMart', defaultChecked: false },
  { id: 3, name: 'Silvia Cintia', company: 'Aquil Tech Labs', defaultChecked: false },
  { id: 4, name: 'Ashish Singh', company: 'Perspiciatis', defaultChecked: true },
  { id: 5, name: 'Ashish Singh', company: 'Doloremque', defaultChecked: false },
];

const s = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#fff', borderRadius: '14px', width: '480px', maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px 0',
  },
  title: { fontSize: '18px', fontWeight: 700, color: '#101828' },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer', color: '#667085',
    padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center',
  },
  subtitle: {
    fontSize: '14px', color: '#667085', padding: '8px 24px 16px',
  },
  searchWrap: {
    padding: '0 24px 16px', position: 'relative',
  },
  searchIcon: {
    position: 'absolute', left: '36px', top: '50%', transform: 'translateY(-50%)',
    color: '#98a2b3', pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', padding: '10px 14px 10px 40px', borderRadius: '8px',
    border: '1px solid #d0d5dd', fontSize: '14px', color: '#101828',
    fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
  },
  list: {
    maxHeight: '260px', overflowY: 'auto', padding: '0 24px',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 0', borderBottom: '1px solid #f2f4f7', cursor: 'pointer',
  },
  checkbox: (checked) => ({
    width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
    border: checked ? '2px solid #1570ef' : '2px solid #d0d5dd',
    background: checked ? '#1570ef' : '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s ease',
  }),
  empName: { fontSize: '14px', fontWeight: 600, color: '#101828' },
  empCompany: { fontSize: '13px', color: '#667085', marginLeft: '4px' },
  footer: {
    padding: '16px 24px 20px',
  },
  sendingTo: {
    fontSize: '13px', color: '#344054', marginBottom: '6px',
  },
  sendingNames: { fontWeight: 600 },
  note: {
    fontSize: '12px', color: '#667085', fontStyle: 'italic', marginBottom: '16px',
    lineHeight: 1.5,
  },
  sendBtn: {
    width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
    background: '#1570ef', color: '#fff', fontSize: '14px', fontWeight: 600,
    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
    transition: 'background 0.2s ease',
  },
};

function ShareRFIModal({ isOpen, onClose, onSend }) {
  const [selected, setSelected] = useState(
    employees.filter((e) => e.defaultChecked).map((e) => e.id)
  );
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.company.toLowerCase().includes(search.toLowerCase())
  );

  const selectedNames = [
    ...new Set(employees.filter((e) => selected.includes(e.id)).map((e) => e.name)),
  ];

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.card} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <span style={s.title}>Share RFI</span>
          <button style={s.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        <div style={s.subtitle}>Select a employee or company name</div>
        <div style={s.searchWrap}>
          <div style={s.searchIcon}><Search size={16} /></div>
          <input
            style={s.searchInput}
            placeholder="Search employee or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={s.list}>
          {filtered.map((emp) => {
            const checked = selected.includes(emp.id);
            return (
              <div key={emp.id} style={s.row} onClick={() => toggle(emp.id)}>
                <div style={s.checkbox(checked)}>
                  {checked && <Check size={14} color="#fff" strokeWidth={3} />}
                </div>
                <div>
                  <span style={s.empName}>{emp.name}</span>
                  <span style={s.empCompany}>| {emp.company}</span>
                </div>
              </div>
            );
          })}
        </div>
        {/* <div style={s.footer}>
          {selectedNames.length > 0 && (
            <div style={s.sendingTo}>
              Sending Mail To:{' '}
              <span style={s.sendingNames}>{selectedNames.join(', ')}</span>
            </div>
          )}
          <div style={s.note}>
            Please note that all selected employee will be CCd in one mail
          </div>
          <button
            style={s.sendBtn}
            onClick={() => onSend && onSend(selected)}
            onMouseEnter={(e) => (e.target.style.background = '#1260cc')}
            onMouseLeave={(e) => (e.target.style.background = '#1570ef')}
          >
            Send Email
          </button>
        </div> */}
      </div>
    </div>
  );
}

export default ShareRFIModal;