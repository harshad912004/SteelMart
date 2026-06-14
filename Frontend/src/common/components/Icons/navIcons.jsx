import React from 'react';

function NavIcon({ children, size = 20, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props) {
  return (
    <NavIcon {...props}>
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="15" width="7" height="6" rx="1.5" />
    </NavIcon>
  );
}

export function EmployeeIcon(props) {
  return (
    <NavIcon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8" cy="10" r="2" />
      <path d="M5.5 15c.8-1.5 2-2.2 3.5-2.2s2.7.7 3.5 2.2" />
      <line x1="14" y1="9" x2="18" y2="9" />
      <line x1="14" y1="13" x2="18" y2="13" />
    </NavIcon>
  );
}

export function ContactsIcon(props) {
  return (
    <NavIcon {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 3.75A.75.75 0 0 1 .75 3h7.497c1.566 0 2.945.8 3.751 2.014A4.495 4.495 0 0 1 15.75 3h7.5a.75.75 0 0 1 .75.75v15.063a.752.752 0 0 1-.755.75l-7.682-.052a3 3 0 0 0-2.142.878l-.89.891a.75.75 0 0 1-1.061 0l-.902-.901a2.996 2.996 0 0 0-2.121-.879H.75a.75.75 0 0 1-.75-.75Zm12.75 15.232a4.503 4.503 0 0 1 2.823-.971l6.927.047V4.5h-6.75a3 3 0 0 0-3 3ZM11.247 7.497a3 3 0 0 0-3-2.997H1.5V18h6.947c1.018 0 2.006.346 2.803.98Z" />
    </NavIcon>
  );
}

export function SalesIcon(props) {
  return (
    <NavIcon {...props}>
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M9 4.5h6" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="13" y2="14" />
    </NavIcon>
  );
}

export function CRMIcon(props) {
  return (
    <NavIcon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 10l3 2-3 2" />
      <line x1="12" y1="16" x2="16" y2="16" />
    </NavIcon>
  );
}
