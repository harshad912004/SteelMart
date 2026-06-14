import React from 'react';

export function EditPencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" />
      <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" />
    </svg>
  );
}

export function ContactActionIcon({ type }) {
  if (type === 'mail') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1.2 1.2 0 0 1 1.2-.3c1 .3 2.1.5 3.2.5.7 0 1.2.5 1.2 1.2V20c0 .7-.5 1.2-1.2 1.2C10.5 21.2 2.8 13.5 2.8 4.2 2.8 3.5 3.3 3 4 3h3.4c.7 0 1.2.5 1.2 1.2 0 1.1.2 2.2.5 3.2.1.4 0 .9-.3 1.2l-2.2 2.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TogglePreview({ styles, checked }) {
  return (
    <span className={`${styles.detailToggle} ${checked ? styles.detailToggleOn : ''}`}>
      <span />
    </span>
  );
}

export function AmountPreview({ styles, value }) {
  return (
    <span className={styles.detailAmountInput}>
      <span>{value || '0'}</span>
      <span>$</span>
    </span>
  );
}

export function LocationPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-6.4 7-12A7 7 0 0 0 5 9c0 5.6 7 12 7 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 11.5A2.5 2.5 0 1 0 12 6.5a2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16.5v1.2A2.3 2.3 0 0 0 7.3 20h9.4a2.3 2.3 0 0 0 2.3-2.3v-1.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function ExcelIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l5 5v13H7V3Z" fill="#F7FFFB" stroke="#178044" strokeWidth="1.4" />
      <path d="M14 3v5h5" stroke="#178044" strokeWidth="1.4" />
      <path d="M3 8.5h9v8H3v-8Z" fill="#178044" />
      <path d="m5.4 14 1.4-1.7-1.3-1.6h1.2l.7.9.7-.9h1.2L8 12.3 9.4 14H8.2l-.8-1-.8 1H5.4Z" fill="#FFFFFF" />
      <path d="M14 12h3.5M14 15h3.5M14 18h2.2" stroke="#178044" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function FolderRowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l1.5 2H19.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10Z" fill="#1570EF" />
      <path d="M3 10h18" stroke="#B2DDFF" strokeWidth="1.2" />
    </svg>
  );
}

export function FileRowIcon({ extension = '' }) {
  const normalizedExtension = extension.toLowerCase();
  const accentColor = normalizedExtension === 'xls' || normalizedExtension === 'xlsx' ? '#178044' : '#D92D20';

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l5 5v13H7V3Z" fill="#FFFFFF" stroke="#D0D5DD" strokeWidth="1.4" />
      <path d="M14 3v5h5" stroke="#D0D5DD" strokeWidth="1.4" />
      <path d="M9 14.5h6M9 17h6" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SearchOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LinkActionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.91 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 1 0 7.07 7.07L13.09 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MoreActionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="5" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="19" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}
