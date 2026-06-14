import React from 'react';
import { capitalizeFirstCharacter, sanitizePhoneNumberInput } from '../../utils/inputFormat';
import { formatClientTypeLabel } from '../../utils/clientType';

function ContactCompanyForm({
  styles,
  form,
  clientTypes,
  onChange,
}) {
  return (
    <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label htmlFor="contact-company-name">Company Name *</label>
        <input
          id="contact-company-name"
          type="text"
          placeholder="Enter company name"
          value={form.companyName}
          onChange={(event) => onChange('companyName', capitalizeFirstCharacter(event.target.value))}
          autoComplete="organization"
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="contact-company-website">Company Website</label>
        <input
          id="contact-company-website"
          type="url"
          placeholder="Enter company website"
          value={form.companyWebsite}
          onChange={(event) => onChange('companyWebsite', event.target.value)}
          autoComplete="url"
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="contact-office-number">Office Number</label>
        <input
          id="contact-office-number"
          type="tel"
          placeholder="Enter office number"
          value={form.officeNumber}
          onChange={(event) => onChange('officeNumber', sanitizePhoneNumberInput(event.target.value))}
          autoComplete="tel"
          inputMode="numeric"
          maxLength={10}
          pattern="[0-9]{10}"
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="contact-company-type">Company Type</label>
        <select
          id="contact-company-type"
          value={form.clientTypeId}
          onChange={(event) => onChange('clientTypeId', event.target.value)}
        >
          <option value="">Select Company Type</option>
          {clientTypes.map((type) => (
            <option key={type.id} value={String(type.id)}>
              {formatClientTypeLabel(type.type_name)}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="contact-address">Address</label>
        <input
          id="contact-address"
          type="text"
          placeholder="Enter address"
          value={form.address || ''}
          onChange={(event) => onChange('address', capitalizeFirstCharacter(event.target.value))}
          autoComplete="street-address"
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="contact-company-description">Description</label>
        <input
          id="contact-company-description"
          type="text"
          placeholder="e.g. Notes about this company"
          value={form.description || ''}
          onChange={(event) => onChange('description', capitalizeFirstCharacter(event.target.value))}
        />
      </div>
    </div>
  );
}

export default ContactCompanyForm;
