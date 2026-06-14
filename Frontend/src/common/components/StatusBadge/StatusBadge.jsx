import React, { useState, useRef, useEffect } from 'react';
import { getStatusConfig } from './statusConfig';
import styles from './StatusBadge.module.css';

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3.5 5.25l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * A central, consistent Status Badge for both Employee and Vendor portals.
 * 
 * @param {string} status The raw status from the DB (e.g. 'open', 'need_revision', 'bidInProgress')
 * @param {string} [label] Optional override for the display text
 * @param {boolean} [withArrow=false] Force display of the dropdown arrow
 * @param {function} [onStatusChange] Callback when a new status is selected from dropdown
 * @param {string[]} [statusOptions] List of status keys to show in dropdown if `onStatusChange` is provided
 * @param {string} [className] Extra CSS classes
 */
export default function StatusBadge({
  status,
  label: overrideLabel,
  withArrow = false,
  onStatusChange,
  statusOptions = [],
  className = '',
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const config = getStatusConfig(status);
  const displayLabel = overrideLabel || config.label;
  const isDropdownEnabled = !!onStatusChange && statusOptions.length > 0;
  const showArrow = withArrow || isDropdownEnabled;

  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleSelect = (e, newStatus) => {
    e.stopPropagation();
    setShowDropdown(false);
    if (onStatusChange) onStatusChange(newStatus);
  };

  const handleToggle = (e) => {
    if (isDropdownEnabled) {
      e.stopPropagation();
      setShowDropdown((prev) => !prev);
    } else if (withArrow) {
      // Just visually toggle if arrow is forced but no options
      e.stopPropagation();
      setShowDropdown((prev) => !prev);
    }
  };

  return (
    <span
      className={`${styles.statusBadge} ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        borderColor: config.border,
        cursor: showArrow ? 'pointer' : 'default'
      }}
      onClick={handleToggle}
      ref={dropdownRef}
    >
      {displayLabel}
      
      {showArrow && (
        <span className={styles.badgeArrow}>
          <ChevronDownIcon />
        </span>
      )}

      {showDropdown && isDropdownEnabled && (
        <div className={styles.dropdown}>
          {statusOptions.map((opt) => {
            const optConfig = getStatusConfig(opt);
            return (
              <button
                key={opt}
                type="button"
                className={`${styles.dropdownItem} ${opt === status ? styles.dropdownItemActive : ''}`}
                onClick={(e) => handleSelect(e, opt)}
              >
                {optConfig.label}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}
