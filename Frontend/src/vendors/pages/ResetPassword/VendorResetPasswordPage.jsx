import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PasswordField from '../../../employees/components/AuthForm/PasswordField';
import TextField from '../../../employees/components/AuthForm/TextField';
import { Toast } from '../../../employees/components/Toast';
import VendorAuthShell from '../../components/VendorAuthShell';
import useToastState from '../../../employees/hooks/useToastState';
import {
  resetVendorPassword,
  sendVendorPasswordResetOtp,
  verifyVendorPasswordResetOtp,
} from '../../services/api';
import styles from '../../../employees/styles/authForm.module.css';
import { isValidEmail, validateOTP, validatePassword, validatePasswordMatch } from '../../../employees/utils/validation';

const STEPS = {
  EMAIL: 'email',
  OTP: 'otp',
  PASSWORD: 'password',
  SUCCESS: 'success',
};

export default function VendorResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const otpInputRef = useRef(null);
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast, showToast, closeToast } = useToastState();

  useEffect(() => {
    if (location.state?.firstLogin && location.state?.email) {
      const autoTrigger = async () => {
        setLoading(true);
        try {
          await sendVendorPasswordResetOtp(location.state.email.trim());
          setStep(STEPS.OTP);
          setTimeout(() => otpInputRef.current?.focus(), 100);
        } catch (error) {
          console.error('Error auto-sending OTP:', error);
          setErrors({ email: error.data?.message || error.message || 'Error sending OTP. Please try again.' });
        } finally {
          setLoading(false);
        }
      };
      autoTrigger();
    }
  }, [location.state]);

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email ID is required';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await sendVendorPasswordResetOtp(email.trim());
      setStep(STEPS.OTP);
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch (error) {
      setErrors({ email: error.data?.message || error.message || 'Error sending OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    const otpValidation = validateOTP(otp);

    if (!otpValidation.valid) {
      setErrors({ otp: otpValidation.message });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const data = await verifyVendorPasswordResetOtp(email.trim(), otp.trim());
      setResetToken(data.resetToken);
      setStep(STEPS.PASSWORD);
    } catch (error) {
      setErrors({ otp: error.data?.message || error.message || 'Error verifying OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const passwordValidation = validatePassword(password);
    const confirmValidation = validatePasswordMatch(password, confirmPassword);

    if (!passwordValidation.valid) {
      nextErrors.password = passwordValidation.message;
    }

    if (!confirmValidation.valid) {
      nextErrors.confirmPassword = confirmValidation.message;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await resetVendorPassword(resetToken, password, confirmPassword);
      setStep(STEPS.SUCCESS);
      showToast('Password reset successful!', true);
    } catch (error) {
      setErrors({ submit: error.data?.message || error.message || 'Error resetting password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setStep(STEPS.EMAIL);
    setOtp('');
    setResetToken('');
    setErrors({});
  };

  const footer = step !== STEPS.SUCCESS ? (
    <button type="button" className={styles.footerLink} onClick={() => navigate('/vendor/login')}>
      Back to Login
    </button>
  ) : null;

  return (
    <VendorAuthShell footer={footer}>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        isSuccess={toast.isSuccess}
        onClose={closeToast}
        duration={3000}
      />

      {step === STEPS.EMAIL ? (
        <div className={styles.container}>
          <h1 className={styles.heading}>Reset Password</h1>
          <p className={styles.description}>
            Enter your email ID here so we can help you reset your password
          </p>

          <form className={styles.form} onSubmit={handleEmailSubmit} noValidate>
            <TextField
              id="vendorResetEmailId"
              type="email"
              label="Enter Email ID"
              placeholder="Enter Email ID"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearError('email');
              }}
              autoComplete="email"
              disabled={loading}
              error={errors.email}
              required
            />

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Sending...' : 'Next'}
            </button>
          </form>
        </div>
      ) : null}

      {step === STEPS.OTP ? (
        <div className={styles.container}>
          <h1 className={styles.heading}>Reset Password</h1>
          <p className={styles.description}>
            A one time password has been sent to {email}. Please enter it here.
          </p>

          <button
            type="button"
            className={styles.inlineAction}
            onClick={handleChangeEmail}
          >
            Change Email ID
          </button>

          <form className={styles.form} onSubmit={handleOtpSubmit} noValidate>
            <TextField
              id="vendorOtp"
              ref={otpInputRef}
              type="text"
              label="Enter OTP"
              placeholder="Enter OTP"
              value={otp}
              onChange={(event) => {
                setOtp(event.target.value);
                clearError('otp');
              }}
              maxLength="6"
              disabled={loading}
              error={errors.otp}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
            />

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      ) : null}

      {step === STEPS.PASSWORD ? (
        <div className={styles.container}>
          <h1 className={styles.heading}>Reset Password</h1>
          <p className={styles.description}>
            Your one time password has been confirmed. Please enter a new password below
          </p>

          <form className={styles.form} onSubmit={handlePasswordSubmit} noValidate>
            <PasswordField
              id="vendorNewPassword"
              label="Enter New Password"
              placeholder="Enter Password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearError('password');
              }}
              disabled={loading}
              error={errors.password}
              hint="Password should be 8 characters long at least, with 1 number and 1 special character"
              required
            />

            <PasswordField
              id="vendorConfirmPassword"
              label="Confirm New Password"
              placeholder="Enter Password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                clearError('confirmPassword');
              }}
              disabled={loading}
              error={errors.confirmPassword}
              hint="Password and Confirm Password should match"
              required
            />

            {errors.submit ? (
              <div className={styles.errorContainer}>
                <span className={styles.errorMsg}>{errors.submit}</span>
              </div>
            ) : null}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      ) : null}

      {step === STEPS.SUCCESS ? (
        <div className={styles.container}>
          <h1 className={styles.heading}>All Done!</h1>
          <p className={styles.description}>
            Congratulations! You have reset your password. Head back to the login page to enter your dashboard.
          </p>

          <button type="button" className={styles.submitBtn} onClick={() => navigate('/vendor/login')}>
            Login
          </button>
        </div>
      ) : null}
    </VendorAuthShell>
  );
}