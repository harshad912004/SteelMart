import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../Modal';
import { Toast } from '../Toast';
import useToastState from '../../hooks/useToastState';
import { GENDER_OPTIONS, getRoleLabel } from '../../constants/roles';
import { getAdminProfile, updateAdminProfile } from '../../../common/services/api';
import { getCurrentUserSummary } from '../../utils/authSession';
import {
  buildEmployeePayload,
  validateEmployeeForm,
} from '../../utils/employeeFormPayload';
import { capitalizeFirstCharacter, sanitizePhoneNumberInput } from '../../utils/inputFormat';
import styles from './AdminProfileModal.module.css';

const EMPTY_PROFILE_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  dateOfBirth: '',
  gender: 'male',
  role: 'Administrator',
};

const mapProfileToForm = (employee) => ({
  firstName: employee?.first_name || '',
  lastName: employee?.last_name || '',
  email: employee?.email || '',
  phone: employee?.phone || '',
  password: '',
  dateOfBirth: employee?.date_of_birth ? String(employee.date_of_birth).slice(0, 10) : '',
  gender: employee?.gender || 'male',
  role: getRoleLabel(employee?.role || employee?.role_id) || 'Administrator',
});

function AdminProfileModal({ isOpen, onClose }) {
  const userSummary = useMemo(() => getCurrentUserSummary(), []);
  const adminId = userSummary?.decoded?.id;
  const [formData, setFormData] = useState(EMPTY_PROFILE_FORM);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const { toast, showToast, closeToast } = useToastState();

  useEffect(() => {
    if (!isOpen || !adminId) {
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      setIsLoadingProfile(true);

      try {
        const response = await getAdminProfile(adminId);
        if (!isMounted) {
          return;
        }

        setFormData(mapProfileToForm(response?.employee));
        setIsProfileLoaded(true);
      } catch (error) {
        if (isMounted) {
          showToast(error.message || 'Failed to load profile details', false);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [adminId, isOpen, showToast]);

  useEffect(() => {
    if (!isOpen) {
      setFormData(EMPTY_PROFILE_FORM);
      setIsProfileLoaded(false);
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!adminId) {
      showToast('Unable to identify the logged-in admin', false);
      return;
    }

    const validationMessage = validateEmployeeForm(formData);
    if (validationMessage) {
      showToast(validationMessage, false);
      return;
    }

    const payload = buildEmployeePayload(formData);
    delete payload.email;
    delete payload.role;

    setIsSavingProfile(true);

    try {
      const response = await updateAdminProfile(adminId, payload);
      setFormData(mapProfileToForm(response?.employee));
      setIsProfileLoaded(true);
      showToast(response.message || 'Profile updated successfully', true);
    } catch (error) {
      showToast(error.message || 'Failed to update profile', false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        isSuccess={toast.isSuccess}
        onClose={closeToast}
        duration={3000}
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="My Profile"
        width="760px"
        contentClassName={styles.modalContent}
      >
        {isLoadingProfile ? (
          <div className={styles.stateMessage}>Loading profile details...</div>
        ) : !isProfileLoaded ? (
          <div className={styles.stateMessage}>Profile details are unavailable right now.</div>
        ) : (
          <>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="admin-first-name">First Name *</label>
                <input
                  id="admin-first-name"
                  type="text"
                  value={formData.firstName}
                  onChange={(event) => handleChange('firstName', capitalizeFirstCharacter(event.target.value))}
                  placeholder="Enter first name"
                  autoComplete="given-name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="admin-last-name">Last Name *</label>
                <input
                  id="admin-last-name"
                  type="text"
                  value={formData.lastName}
                  onChange={(event) => handleChange('lastName', capitalizeFirstCharacter(event.target.value))}
                  placeholder="Enter last name"
                  autoComplete="family-name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="admin-email">Email</label>
                <input
                  id="admin-email"
                  type="email"
                  value={formData.email}
                  disabled
                  readOnly
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="admin-role">Role</label>
                <input
                  id="admin-role"
                  type="text"
                  value={formData.role}
                  disabled
                  readOnly
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="admin-phone">Phone</label>
                <input
                  id="admin-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => handleChange('phone', sanitizePhoneNumberInput(event.target.value))}
                  placeholder="Enter phone"
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="admin-date-of-birth">Date of Birth</label>
                <input
                  id="admin-date-of-birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(event) => handleChange('dateOfBirth', event.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="admin-gender">Gender *</label>
                <select
                  id="admin-gender"
                  value={formData.gender}
                  onChange={(event) => handleChange('gender', event.target.value)}
                >
                  {GENDER_OPTIONS.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  placeholder="Leave blank to keep current password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className={styles.note}>
              Email and role are fixed for the admin profile and cannot be changed here.
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={onClose}>
                Close
              </button>
              <button type="button" className={styles.primaryButton} onClick={handleSave} disabled={isSavingProfile}>
                {isSavingProfile ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

export default AdminProfileModal;