/**
 * Validation Utilities
 * Common validation functions for forms and data
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email || '').trim());
};

export const isBlank = (value) => String(value || '').trim().length === 0;

export const isValidPhone = (phone) => {
  const value = String(phone || '').trim();
  if (!value) return true;
  return /^\d{10}$/.test(value);
};

export const isValidUrl = (url) => {
  const value = String(url || '').trim();
  if (!value) return true;

  try {
    const normalized = /^[a-z][a-z\d+\-.]*:\/\//i.test(value) ? value : `https://${value}`;
    const parsed = new URL(normalized);
    return Boolean(parsed.hostname.includes('.') && ['http:', 'https:'].includes(parsed.protocol));
  } catch {
    return false;
  }
};

export const isValidPastDate = (date) => {
  if (!date) return true;
  const value = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(value.getTime()) && value <= today;
};

export const isValidFutureDate = (date) => {
  if (!date) return false;
  const value = new Date(date);
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return !Number.isNaN(value.getTime()) && value >= tomorrow;
};

export const isValidTodayOrFutureDate = (date) => {
  if (!date) return false;
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  let inputStr = '';
  if (typeof date === 'string') {
    inputStr = date.split('T')[0];
  } else if (date instanceof Date) {
    const inputYear = date.getFullYear();
    const inputMonth = String(date.getMonth() + 1).padStart(2, '0');
    const inputDay = String(date.getDate()).padStart(2, '0');
    inputStr = `${inputYear}-${inputMonth}-${inputDay}`;
  } else {
    return false;
  }

  return inputStr >= todayStr;
};

export const isValidNonNegativeNumber = (value) => {
  if (value === '' || value === null || value === undefined) return true;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0;
};

export const getFirstErrorMessage = (errors) => {
  if (!errors) return '';
  if (typeof errors === 'string') return errors;
  const values = Object.values(errors);
  for (const value of values) {
    if (!value) continue;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      const nested = getFirstErrorMessage(value);
      if (nested) return nested;
    }
  }
  return '';
};

export const getErrorMessages = (errors) => {
  if (!errors) return [];
  if (typeof errors === 'string') return errors ? [errors] : [];
  if (Array.isArray(errors)) return errors.flatMap(getErrorMessages);

  return Object.values(errors).flatMap((value) => getErrorMessages(value));
};

export const formatValidationMessages = (errors) => (
  getErrorMessages(errors).filter(Boolean).join('\n')
);

export const validateEmailValue = (email, label = 'Email') => {
  if (isBlank(email)) {
    return `${label} is required`;
  }
  if (!isValidEmail(email)) {
    return 'Enter a valid email address';
  }
  return '';
};

export const validatePhoneValue = (phone, label = 'Phone') => {
  if (!isValidPhone(phone)) {
    return `Enter a valid ${label.toLowerCase()} number`;
  }
  return '';
};

export const validateWebsiteValue = (url, label = 'Website') => {
  if (!isValidUrl(url)) {
    return `Enter a valid ${label.toLowerCase()} URL`;
  }
  return '';
};

export const validateCompanyForm = (form) => {
  const errors = [];

  if (isBlank(form?.companyName)) {
    errors.push('Company name is required');
  }

  const websiteMessage = validateWebsiteValue(form?.companyWebsite, 'company website');
  if (websiteMessage) errors.push(websiteMessage);

  const phoneMessage = validatePhoneValue(form?.officeNumber, 'office phone');
  if (phoneMessage) errors.push(phoneMessage);

  return errors.join('\n');
};

export const validateClientEmployeeRow = (row, index = 0) => {
  const rowLabel = `employee ${index + 1}`;
  const errors = [];

  if (isBlank(row?.firstName) && isBlank(row?.first_name)) {
    errors.push(`First name is required for ${rowLabel}`);
  }
  if (isBlank(row?.lastName) && isBlank(row?.last_name)) {
    errors.push(`Last name is required for ${rowLabel}`);
  }

  const email = row?.email;
  if (isBlank(email)) {
    errors.push(`Email is required for ${rowLabel}`);
  }
  if (!isBlank(email) && !isValidEmail(email)) {
    errors.push(`Enter a valid email address for ${rowLabel}`);
  }

  const phoneMessage = validatePhoneValue(row?.phone, `${rowLabel} phone`);
  if (phoneMessage) errors.push(phoneMessage);

  const designation = row?.designation || row?.role;
  if (isBlank(designation)) {
    errors.push(`Designation is required for ${rowLabel}`);
  }

  return errors.join('\n');
};

export const validateClientEmployeeRows = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 'At least one employee is required';
  }

  return rows
    .map((row, index) => validateClientEmployeeRow(row, index))
    .filter(Boolean)
    .join('\n');
};

export const validateBidForm = (form, options = {}) => {
  const errors = {};
  const { requireFutureDueDate = false, requireFutureDwgDate = false } = options;

  if (isBlank(form?.project_name)) {
    errors.project_name = 'Project name is required';
  }
  if (isBlank(form?.due_date)) {
    errors.due_date = 'Due date is required';
  } else if (requireFutureDueDate && !isValidFutureDate(form?.due_date)) {
    errors.due_date = 'Due date must be a future date';
  }
  if (isBlank(form?.address)) {
    errors.address = 'Address is required';
  }
  if (!Array.isArray(form?.selected_employees) || form.selected_employees.length === 0) {
    errors.selected_employees = 'Select at least one employee';
  }
  if (isBlank(form?.dwg_date)) {
    errors.dwg_date = 'DWG date is required';
  } else if (requireFutureDwgDate && !isValidTodayOrFutureDate(form?.dwg_date)) {
    errors.dwg_date = 'DWG date must be today or a future date';
  }
  // dwg_description is optional
  /*
  if (isBlank(form?.dwg_description)) {
    errors.dwg_description = 'DWG description is required';
  }
  */
  if (form?.db_wage_rate && !isValidNonNegativeNumber(form?.fringes_amount)) {
    errors.fringes_amount = 'Enter a valid fringes amount';
  }
  if (form?.db_wage_rate && !isValidNonNegativeNumber(form?.base_contract_amount)) {
    errors.base_contract_amount = 'Enter a valid base contract amount';
  }
  return errors;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with status and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (password.length > 25) {
    return { valid: false, message: 'Password must be at most 25 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least 1 uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least 1 lowercase letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least 1 number' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least 1 special character' };
  }
  return { valid: true, message: 'Password is valid' };
};

/**
 * Validate if two passwords match
 * @param {string} password - First password
 * @param {string} confirmPassword - Confirm password
 * @returns {object} Validation result
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  return { valid: true, message: 'Passwords match' };
};

/**
 * Validate OTP (6 digits)
 * @param {string} otp - OTP to validate
 * @returns {object} Validation result
 */
export const validateOTP = (otp) => {
  if (!otp) {
    return { valid: false, message: 'OTP is required' };
  }
  if (!/^\d{6}$/.test(otp)) {
    return { valid: false, message: 'OTP must be 6 digits' };
  }
  return { valid: true, message: 'OTP is valid' };
};

/**
 * Trim all string values in an object
 * @param {object} obj - Object to trim
 * @returns {object} Object with trimmed strings
 */
export const trimObject = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = typeof obj[key] === 'string' ? obj[key].trim() : obj[key];
    return acc;
  }, {});
};