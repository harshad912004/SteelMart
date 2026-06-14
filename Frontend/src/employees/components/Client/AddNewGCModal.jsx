import React, { useState } from 'react';
import Modal from '../Modal';
import { capitalizeFirstCharacter, sanitizePhoneNumberInput } from '../../utils/inputFormat';
import {
  validateClientEmployeeRows,
  validatePhoneValue,
  validateWebsiteValue,
} from '../../utils/validation';
import styles from './AddNewGCModal.module.css';

function AddNewGCModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    company: '',
    website: '',
    address: '',
    phone: '',
  });

  const [employees, setEmployees] = useState([
    { id: 1, first_name: '', last_name: '', phone: '', email: '', designation: '' }
  ]);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

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
    const validationMessages = [];

    if (!formData.company.trim()) {
      validationMessages.push('Company is required');
    }

    const websiteMessage = validateWebsiteValue(formData.website, 'website');
    if (websiteMessage) {
      validationMessages.push(websiteMessage);
    }

    const phoneMessage = validatePhoneValue(formData.phone, 'office phone');
    if (phoneMessage) {
      validationMessages.push(phoneMessage);
    }

    const employeeMessage = validateClientEmployeeRows(employees);
    if (employeeMessage) {
      validationMessages.push(employeeMessage);
    }

    if (validationMessages.length > 0) {
      setError(validationMessages.join('\n'));
      return;
    }

    onSubmit({ ...formData, employees });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New GC" width="900px">
      <div className={styles.modalContent}>
        <div className={styles.formGrid3}>
          <div className={styles.formGroup}>
            <label>Company *</label>
            <input
              type="text"
              placeholder="Enter Company"
              value={formData.company}
              onChange={(e) => handleChange('company', capitalizeFirstCharacter(e.target.value))}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Website</label>
            <input
              type="text"
              placeholder="Enter Website"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Office Phone</label>
            <input
              type="text"
              placeholder="Enter Phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', sanitizePhoneNumberInput(e.target.value))}
              inputMode="numeric"
              maxLength={10}
            />
          </div>
          <div className={`${styles.formGroup} ${styles.colSpan3}`}>
            <label>Address</label>
            <input
              type="text"
              placeholder="Enter Address"
              value={formData.address}
              onChange={(e) => handleChange('address', capitalizeFirstCharacter(e.target.value))}
            />
          </div>
        </div>

        <div className={styles.employeeSection}>
          <div className={styles.sectionTitle}>Add Employee Details</div>
          
          <div className={styles.employeeHeaderGrid}>
            <label>First Name *</label>
            <label>Last Name *</label>
            <label>Phone</label>
            <label>Email *</label>
            <label>Designation *</label>
            <div></div>
          </div>

          <div className={styles.employeeRowsContainer}>
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

export default AddNewGCModal;