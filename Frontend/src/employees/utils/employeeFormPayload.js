import {
  isValidPastDate,
  validateEmailValue,
  validatePhoneValue,
} from './validation';

export const EMPTY_EMPLOYEE_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  gender: 'male',
  role: '',
  hourlyRate: '',
};

export const EMPTY_ADD_EMPLOYEE_FORM = { ...EMPTY_EMPLOYEE_FORM };
export const EMPTY_EDIT_EMPLOYEE_FORM = { ...EMPTY_EMPLOYEE_FORM };

export const mapEmployeeToForm = (employee) => ({
  firstName: employee?.firstName || '',
  lastName: employee?.lastName || '',
  email: employee?.email || '',
  phone: employee?.phone === '-' ? '' : (employee?.phone || ''),
  address: employee?.address || '',
  dateOfBirth: employee?.dateOfBirth || '',
  gender: employee?.gender || 'male',
  role: employee?.role || '',
  hourlyRate: employee?.hourlyRate || '',
});

export const validateEmployeeForm = (form) => {
  const errors = [];

  if (!form.firstName?.trim()) {
    errors.push('First name is required');
  }
  if (!form.lastName?.trim()) {
    errors.push('Last name is required');
  }

  const emailMessage = validateEmailValue(form.email);
  if (emailMessage) {
    errors.push(emailMessage);
  }

  const phoneMessage = validatePhoneValue(form.phone);
  if (phoneMessage) {
    errors.push(phoneMessage);
  }

  if (!isValidPastDate(form.dateOfBirth)) {
    errors.push('Date of birth cannot be in the future');
  }

  if (!form.gender) {
    errors.push('Gender is required');
  }
  if (!form.role) {
    errors.push('Role is required');
  }

  return errors.join('\n');
};

export const buildEmployeePayload = (form) => {
  const payload = {
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    address: form.address?.trim() || null,
    date_of_birth: form.dateOfBirth || null,
    gender: form.gender,
    role: form.role,
  };

  return payload;
};
