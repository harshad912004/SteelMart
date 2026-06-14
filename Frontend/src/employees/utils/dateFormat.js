const DATE_FORMAT_OPTIONS = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

const DATE_TIME_FORMAT_OPTIONS = {
  ...DATE_FORMAT_OPTIONS,
  hour: 'numeric',
  minute: '2-digit',
};

const toValidDate = (value) => {
  if (!value) {
    return null;
  }

  // For date-only strings (YYYY-MM-DD), parse manually to avoid UTC midnight shift
  const str = String(value);
  const dateOnly = str.split('T')[0];
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const date = new Date(y, m, d);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  // Fallback for other date formats (timestamps, etc.)
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatShortDate = (value) => {
  const date = toValidDate(value);
  return date ? date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS) : '-';
};

export const formatDateTime = (value) => {
  const date = toValidDate(value);
  return date ? date.toLocaleString('en-US', DATE_TIME_FORMAT_OPTIONS) : '-';
};

export const formatRelativeTime = (value) => {
  const date = toValidDate(value);
  if (!date) {
    return '-';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 1) {
    return 'Just now';
  }

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }

  if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }

  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
  }

  return `${diffYears} year${diffYears !== 1 ? 's' : ''}`;
};

export const formatTimeOpen = (value) => {
  const date = toValidDate(value);
  if (!date) return '-';

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return '+0 Days';
  if (diffDays < 30) return `+${diffDays} Days`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `+${diffMonths} Months`;

  const diffYears = Math.floor(diffMonths / 12);
  return `+${diffYears} Years`;
};