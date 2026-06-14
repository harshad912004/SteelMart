import React from 'react';

export function ActiveStatusIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 16.17L5.83 12L4.41 13.41L10 19L20 9L18.59 7.59L10 16.17Z" fill="currentColor" />
    </svg>
  );
}

export function InactiveStatusIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="33" cy="24" r="9" fill="gray" />
      <path d="M20 48c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="gray" />
      <circle cx="50" cy="50" r="12" fill="white" stroke="darkgray" strokeWidth="2" />
      <rect x="49.5" y="42" width="2.5" height="9" fill="gray" />
      <circle cx="50.8" cy="55" r="2" fill="gray" />
    </svg>
  );
}