import React from 'react';
import Modal from '../../../employees/components/Modal';
import styles from './VendorProfileModal.module.css';

function VendorProfileModal({ isOpen, onClose, vendorData }) {
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(vendorData?.email || 'Vendor')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Profile"
      width="600px"
      contentClassName={styles.modalContent}
    >
      <div className={styles.profileSummary}>
        <img src={avatarUrl} alt={vendorData?.email} className={styles.avatar} />
        <div className={styles.profileSummaryText}>
          <div className={styles.profileName}>{vendorData?.companyName || 'Vendor'}</div>
          <div className={styles.profileRole}>{vendorData?.role || 'Vendor'}</div>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="vendor-company-name">Company Name</label>
          <input
            id="vendor-company-name"
            type="text"
            value={vendorData?.companyName || ''}
            disabled
            readOnly
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="vendor-email">Email Address</label>
          <input
            id="vendor-email"
            type="email"
            value={vendorData?.email || ''}
            disabled
            readOnly
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="vendor-role">Role</label>
          <input
            id="vendor-role"
            type="text"
            value={vendorData?.role || 'Vendor'}
            disabled
            readOnly
          />
        </div>
      </div>

      <div className={styles.note}>
        Vendor profile details are managed by the administrator and cannot be modified here.
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}

export default VendorProfileModal;