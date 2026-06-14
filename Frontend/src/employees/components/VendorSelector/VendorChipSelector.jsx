import React from 'react';

function VendorChipSelector({
  styles,
  dynamicVendorTypes,
  selectedVendors,
  toggleVendorChip,
  label = "Select type of vendors required",
}) {
  return (
    <div className={styles.vendorChipsArea}>
      <label className={styles.label}>{label}</label>
      <div className={styles.chipsRow}>
        {dynamicVendorTypes.map(vendor => {
          const isActive = selectedVendors.includes(vendor);
          return (
            <button
              key={vendor}
              type="button"
              className={`${styles.chip} ${isActive ? styles.activeChip : ''}`}
              onClick={() => toggleVendorChip(vendor)}
            >
              {isActive && '✓ '}
              {vendor}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default VendorChipSelector;