import React from 'react';
import { GENDER_OPTIONS, ROLE_OPTIONS } from '../../constants/roles';
import { capitalizeFirstCharacter, sanitizePhoneNumberInput } from '../../utils/inputFormat';

function EmployeeForm({
  styles,
  value,
  onChange,
  roles = ROLE_OPTIONS,
  genders = GENDER_OPTIONS,
}) {
  return (
    <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label htmlFor="employee-first-name">First Name *</label>
        <input
          id="employee-first-name"
          type="text"
          placeholder="Enter first name"
          value={value.firstName || ''}
          onChange={(event) => onChange('firstName', capitalizeFirstCharacter(event.target.value))}
          autoComplete="given-name"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="employee-last-name">Last Name *</label>
        <input
          id="employee-last-name"
          type="text"
          placeholder="Enter last name"
          value={value.lastName || ''}
          onChange={(event) => onChange('lastName', capitalizeFirstCharacter(event.target.value))}
          autoComplete="family-name"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="employee-email">Email *</label>
        <input
          id="employee-email"
          type="email"
          placeholder="Enter email"
          value={value.email || ''}
          onChange={(event) => onChange('email', event.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="employee-phone">Phone *</label>
        <input
          id="employee-phone"
          type="tel"
          placeholder="Enter phone"
          value={value.phone || ''}
          onChange={(event) => onChange('phone', sanitizePhoneNumberInput(event.target.value))}
          autoComplete="tel"
          inputMode="numeric"
          maxLength={10}
          pattern="[0-9]{10}"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="employee-address">Address</label>
        <input
          id="employee-address"
          type="text"
          placeholder="Enter address"
          value={value.address || ''}
          onChange={(event) => onChange('address', capitalizeFirstCharacter(event.target.value))}
          autoComplete="street-address"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="employee-date-of-birth">Date of Birth</label>
        <input
          id="employee-date-of-birth"
          type="date"
          value={value.dateOfBirth || ''}
          onChange={(event) => onChange('dateOfBirth', event.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="employee-gender">Gender *</label>
        <select
          id="employee-gender"
          value={value.gender || 'male'}
          onChange={(event) => onChange('gender', event.target.value)}
          required
        >
          {genders.map((gender) => (
            <option key={gender} value={gender}>
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="employee-role">Role *</label>
        <select
          id="employee-role"
          value={value.role || ''}
          onChange={(event) => onChange('role', event.target.value)}
          required
        >
          <option value="">Select Role</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default EmployeeForm;