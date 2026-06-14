import React, { useState } from 'react';
import PasswordField from '../../components/AuthForm/PasswordField';
import { resetPassword } from '../../../common/services/api';
import { validatePassword, validatePasswordMatch } from '../../utils/validation';
import styles from '../../styles/authForm.module.css';

export default function NewPasswordStep({ resetToken, onSubmit }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const nextErrors = {};
    const passwordValidation = validatePassword(password);
    const confirmValidation = validatePasswordMatch(password, confirmPassword);

    if (!passwordValidation.valid) {
      nextErrors.password = passwordValidation.message;
    }

    if (!confirmValidation.valid) {
      nextErrors.confirmPassword = confirmValidation.message;
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await resetPassword(resetToken, password, confirmPassword);
      onSubmit();
    } catch (error) {
      console.error('Error resetting password:', error);
      setErrors({ submit: error.message || 'Error resetting password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Reset Password</h1>
      <p className={styles.description}>
        Your one time password has been confirmed. Please enter a new password below
      </p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <PasswordField
          id="password"
          label="Enter New Password"
          placeholder="Enter Password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearError('password');
          }}
          disabled={isLoading}
          error={errors.password}
          hint="Password should be 8 characters long at least, with 1 number and 1 special character"
          required
        />

        <PasswordField
          id="confirmPassword"
          label="Confirm New Password"
          placeholder="Enter Password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            clearError('confirmPassword');
          }}
          disabled={isLoading}
          error={errors.confirmPassword}
          required
        />

        {errors.submit ? (
          <div className={styles.errorContainer}>
            <span className={styles.errorMsg}>{errors.submit}</span>
          </div>
        ) : null}

        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}