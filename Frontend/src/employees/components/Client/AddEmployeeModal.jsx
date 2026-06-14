import React, { useState } from 'react';
import Modal from '../Modal';
import { capitalizeFirstCharacter, sanitizePhoneNumberInput } from '../../utils/inputFormat';
import { validateClientEmployeeRows } from '../../utils/validation';
import styles from './AddNewGCModal.module.css';

function AddEmployeeModal({ isOpen, onClose, onSubmit, companyName = "SteelMart" }) {
  const [employees, setEmployees] = useState([
    { id: 1, first_name: '', last_name: '', phone: '', email: '', designation: '' }
  ]);
  const [error, setError] = useState('');

  const handleEmployeeChange = (id, field, value) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, [field]: value } : emp));
    setError('');
  };

  const addEmployeeRow = () => {
    setEmployees(prev => [
      ...prev,
      { id: Date.now(), first_name: '', last_name: '', phone: '', email: '', designation: '' }
    ]);
  };

  const removeEmployeeRow = (id) => {
    if (employees.length > 1) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  const handleSubmit = () => {
    const validationMessage = validateClientEmployeeRows(employees);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    onSubmit({ employees });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Employee for "${companyName}"`} width="900px">
      <div className={styles.modalContent} style={{ paddingTop: '8px' }}>
        <div className={styles.employeeHeaderGrid}>
          <label>First Name *</label>
          <label>Last Name *</label>
          <label>Phone</label>
          <label>Email *</label>
          <label>Designation *</label>
          <div></div>
        </div>

        <div className={styles.employeeRowsContainer} style={{ maxHeight: '300px' }}>
          {employees.map((emp, index) => (
            <div key={emp.id} className={styles.employeeRowGrid}>
              <input
                type="text"
                placeholder="First Name"
                value={emp.first_name}
                onChange={(e) => handleEmployeeChange(emp.id, 'first_name', capitalizeFirstCharacter(e.target.value))}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={emp.last_name}
                onChange={(e) => handleEmployeeChange(emp.id, 'last_name', capitalizeFirstCharacter(e.target.value))}
              />
              <input
                type="text"
                placeholder="Phone No."
                value={emp.phone}
                onChange={(e) => handleEmployeeChange(emp.id, 'phone', sanitizePhoneNumberInput(e.target.value))}
                inputMode="numeric"
                maxLength={10}
              />
              <input
                type="email"
                placeholder="Email ID"
                value={emp.email}
                onChange={(e) => handleEmployeeChange(emp.id, 'email', e.target.value)}
              />
              <input
                type="text"
                placeholder="Designation"
                value={emp.designation}
                onChange={(e) => handleEmployeeChange(emp.id, 'designation', capitalizeFirstCharacter(e.target.value))}
              />
              
              {index === 0 ? (
                <button type="button" className={styles.iconButtonPlus} onClick={addEmployeeRow}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              ) : (
                <button type="button" className={styles.iconButtonMinus} onClick={() => removeEmployeeRow(emp.id)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {error ? <div className={styles.errorMessage}>{error}</div> : null}

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button className={styles.submitButton} onClick={handleSubmit}>Add</button>
        </div>
      </div>
    </Modal>
  );
}

export default AddEmployeeModal;