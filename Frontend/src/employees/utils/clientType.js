const CLIENT_TYPE_DISPLAY_LABELS = {
  generalcontractor: 'General Contractor',
  vendor: 'Vendor',
};

const normalizeClientTypeKey = (value) => String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

export const formatClientTypeLabel = (value) => {
  const normalizedValue = normalizeClientTypeKey(value);
  return CLIENT_TYPE_DISPLAY_LABELS[normalizedValue] || value || '';
};

const EMPLOYEE_TAG_DISPLAY_LABELS = {
  detailing: 'Detailing',
  engineering: 'Engineering',
  design: 'Design',
  dockersandjoist: 'Deckers & Joist',
  welding: 'Welding',
  erection: 'Erection',
  structural: 'Structural',
  cnc: 'CNC',
};

export const formatEmployeeTag = (value) => {
  if (!value) return '';
  const normalizedValue = String(value).trim().toLowerCase();
  if (EMPLOYEE_TAG_DISPLAY_LABELS[normalizedValue]) {
    return EMPLOYEE_TAG_DISPLAY_LABELS[normalizedValue];
  }

  // Generic fallback to capitalize and add space for words
  return String(value)
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};