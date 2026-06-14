import React, { useState, useRef, useEffect } from 'react';
import { capitalizeFirstCharacter, sanitizePhoneNumberInput } from '../../utils/inputFormat';
import { formatClientTypeLabel } from '../../utils/clientType';
import styles from './ContactEmployeeForm.module.css';

// Vendor-specific tags
const VENDOR_TAGS = [
  { value: 'detailing',       label: 'Detailing' },
  { value: 'engineering',     label: 'Engineering' },
  { value: 'design',          label: 'Design' },
  { value: 'dockersAndJoist', label: 'Deckers & Joist' },
  { value: 'welding',         label: 'Welding' },
  { value: 'erection',        label: 'Erection' },
  { value: 'structural',      label: 'Structural' },
  { value: 'cnc',             label: 'CNC' },
];

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UserSelectIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 18C4.5 15.5147 6.51472 13.5 9 13.5H11C13.4853 13.5 15.5 15.5147 15.5 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 8.5V15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14.5 12H21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Multi-select tag picker that matches the image style */
function TagSelector({ selectedTags, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (value) => {
    const next = selectedTags.includes(value)
      ? selectedTags.filter((t) => t !== value)
      : [...selectedTags, value];
    onChange(next);
  };

  const selectedLabels = VENDOR_TAGS.filter((t) => selectedTags.includes(t.value));

  return (
    <div className={styles.tagSelector} ref={ref}>
      <button
        type="button"
        className={styles.tagSelectorTrigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedLabels.length === 0 ? (
          <span className={styles.tagSelectorPlaceholder}>Select Tags</span>
        ) : (
          <span className={styles.tagSelectorChips}>
            {selectedLabels.map((t) => (
              <span key={t.value} className={styles.tagChip}>
                {t.label}
                <span
                  className={styles.tagChipRemove}
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${t.label}`}
                  onClick={(e) => { e.stopPropagation(); toggle(t.value); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggle(t.value); } }}
                >
                  ×
                </span>
              </span>
            ))}
          </span>
        )}
        <span className={`${styles.tagSelectorArrow} ${open ? styles.tagSelectorArrowOpen : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div className={styles.tagDropdown} role="listbox" aria-multiselectable="true">
          {VENDOR_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag.value);
            return (
              <div
                key={tag.value}
                className={`${styles.tagDropdownItem} ${isSelected ? styles.tagDropdownItemSelected : ''}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => toggle(tag.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') toggle(tag.value); }}
                tabIndex={0}
              >
                <span className={styles.tagDropdownCheckbox}>
                  {isSelected && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {tag.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContactEmployeeForm({
  companyForm,
  clientTypes,
  employeeRows,
  designationOptions = [],
  employeeTags = [],
  showTags = false,
  onCompanyChange,
  onEmployeeChange,
  onAddEmployee,
  onRemoveEmployee,
  onPrimarySelect,
  onCancel,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Add Employee',
}) {
  // Detect vendor type from selected company type
  const selectedTypeName = clientTypes.find((t) => String(t.id) === String(companyForm.clientTypeId))?.type_name || '';
  const isVendorType = String(selectedTypeName).trim().toLowerCase() === 'vendor';



  return (
    <div className={styles.wrapper}>
      {/* ── Add Company Details ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Add Company Details</h3>
        <div className={styles.companyGrid}>
          {/* Company Name */}
          <div className={styles.formGroup}>
            <label htmlFor="employee-company-name">Company</label>
            <input
              id="employee-company-name"
              type="text"
              placeholder="Enter Company"
              value={companyForm.companyName}
              onChange={(e) => onCompanyChange('companyName', capitalizeFirstCharacter(e.target.value))}
              required
            />
          </div>

          {/* Company Website */}
          <div className={styles.formGroup}>
            <label htmlFor="employee-company-website">Company Website</label>
            <input
              id="employee-company-website"
              type="text"
              placeholder="Enter URL"
              value={companyForm.companyWebsite}
              onChange={(e) => onCompanyChange('companyWebsite', e.target.value)}
            />
          </div>

          {/* Office Number */}
          <div className={styles.formGroup}>
            <label htmlFor="employee-office-number">Office Number</label>
            <input
              id="employee-office-number"
              type="tel"
              placeholder="Enter Number"
              value={companyForm.officeNumber}
              onChange={(e) => onCompanyChange('officeNumber', sanitizePhoneNumberInput(e.target.value))}
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
            />
          </div>

          {/* Company Type */}
          <div className={styles.formGroup}>
            <label htmlFor="employee-company-type">Company Type</label>
            <select
              id="employee-company-type"
              value={companyForm.clientTypeId}
              onChange={(e) => onCompanyChange('clientTypeId', e.target.value)}
            >
              <option value="">Select company type</option>
              {clientTypes.map((type) => (
                <option key={type.id} value={String(type.id)}>
                  {formatClientTypeLabel(type.type_name)}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div className={styles.formGroup}>
            <label htmlFor="employee-address">Address</label>
            <input
              id="employee-address"
              type="text"
              placeholder="Enter Address"
              value={companyForm.address || ''}
              onChange={(e) => onCompanyChange('address', capitalizeFirstCharacter(e.target.value))}
            />
          </div>

          {/* Empty spacer to keep grid alignment */}
          <div />
        </div>
      </div>

      {/* ── Add Employee Details ── */}
      <div className={styles.section}>
        <div className={styles.employeeSectionHeader}>
          <h3 className={styles.sectionTitle}>Add Employee Details</h3>
        </div>

        <div className={styles.employeeTableScroll}>
          <div className={styles.employeeTable}>
            {/* Header — tag column added after designation for vendor type */}
            <div className={`${styles.employeeTableHeader} ${isVendorType ? styles.hasTags : ''}`}>
              <div className={styles.headerCell}>First Name</div>
              <div className={styles.headerCell}>Last Name</div>
              <div className={styles.headerCell}>Phone</div>
              <div className={styles.headerCell}>Email</div>
              <div className={styles.headerCell}>Designation</div>
              {isVendorType && <div className={styles.headerCell}>Tag</div>}
              <div className={`${styles.headerCell} ${styles.actionsHeaderCell}`}>
                <button
                  type="button"
                  className={styles.addRowButton}
                  onClick={onAddEmployee}
                  aria-label="Add another employee"
                  title="Add another employee"
                >
                  <PlusIcon />
                </button>
              </div>
            </div>

            {/* Rows */}
            <div className={styles.employeeRows}>
              {employeeRows.map((employee, index) => {
                const primaryActionLabel = employee.isPrimaryContact
                  ? `Deselect employee ${index + 1} as contact person`
                  : `Select employee ${index + 1} as contact person`;

                return (
                  <div key={`employee-row-${index}`} className={`${styles.employeeRow} ${isVendorType ? styles.hasTags : ''}`}>
                    <div className={styles.cell}>
                      <input
                        id={`employee-first-name-${index}`}
                        type="text"
                        aria-label={`Employee ${index + 1} first name`}
                        placeholder="First Name"
                        value={employee.firstName}
                        onChange={(e) => onEmployeeChange(index, 'firstName', capitalizeFirstCharacter(e.target.value))}
                        required
                      />
                    </div>
                    <div className={styles.cell}>
                      <input
                        id={`employee-last-name-${index}`}
                        type="text"
                        aria-label={`Employee ${index + 1} last name`}
                        placeholder="Last Name"
                        value={employee.lastName}
                        onChange={(e) => onEmployeeChange(index, 'lastName', capitalizeFirstCharacter(e.target.value))}
                        required
                      />
                    </div>
                    <div className={styles.cell}>
                      <input
                        id={`employee-phone-${index}`}
                        type="tel"
                        aria-label={`Employee ${index + 1} phone number`}
                        placeholder="Phone Number"
                        value={employee.phone}
                        onChange={(e) => onEmployeeChange(index, 'phone', sanitizePhoneNumberInput(e.target.value))}
                        inputMode="numeric"
                        maxLength={10}
                        pattern="[0-9]{10}"
                      />
                    </div>
                    <div className={styles.cell}>
                      <input
                        id={`employee-email-${index}`}
                        type="email"
                        aria-label={`Employee ${index + 1} email`}
                        placeholder="Email ID"
                        value={employee.email}
                        onChange={(e) => onEmployeeChange(index, 'email', e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.cell}>
                      <select
                        id={`employee-designation-${index}`}
                        aria-label={`Employee ${index + 1} designation`}
                        value={employee.designation}
                        onChange={(e) => onEmployeeChange(index, 'designation', e.target.value)}
                        required
                      >
                        <option value="">Designation</option>
                        {designationOptions.map((option) => (
                          <option key={option} value={option}>{capitalizeFirstCharacter(option)}</option>
                        ))}
                      </select>
                    </div>
                    {isVendorType && (
                      <div className={styles.cell}>
                        <select
                          id={`employee-tag-${index}`}
                          aria-label={`Employee ${index + 1} tag`}
                          value={employee.tag || ''}
                          onChange={(e) => onEmployeeChange(index, 'tag', e.target.value)}
                        >
                          <option value="">Tag</option>
                          {VENDOR_TAGS.map((tag) => (
                            <option key={tag.value} value={tag.value}>{tag.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className={`${styles.cell} ${styles.actionsCell}`}>
                      <button
                        type="button"
                        className={`${styles.iconActionButton} ${styles.primaryActionButton} ${employee.isPrimaryContact ? styles.primaryActionButtonSelected : ''}`}
                        onClick={() => onPrimarySelect(index)}
                        aria-pressed={employee.isPrimaryContact}
                        aria-label={primaryActionLabel}
                        title={employee.isPrimaryContact ? 'Deselect contact person' : 'Select as contact person'}
                      >
                        <UserSelectIcon />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconActionButton} ${styles.removeRowButton}`}
                        onClick={() => onRemoveEmployee(index)}
                        disabled={employeeRows.length === 1}
                        aria-label={`Remove employee ${index + 1}`}
                        title="Remove employee"
                      >
                        <MinusIcon />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={styles.submitButton} onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </div>
  );
}

export default ContactEmployeeForm;