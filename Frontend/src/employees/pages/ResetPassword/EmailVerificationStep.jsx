import React, { useEffect, useRef, useState } from 'react';
import TextField from '../../components/AuthForm/TextField';
import { sendPasswordResetOtp, verifyPasswordResetOtp } from '../../../common/services/api';
import { isValidEmail, validateOTP as validateOtpValue } from '../../utils/validation';
import styles from '../../styles/authForm.module.css';

export default function EmailVerificationStep({ onSubmit, initialEmail = '', firstLogin = false }) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [showOtpField, setShowOtpField] = useState(false);
  const [isLoadingEmailVerify, setIsLoadingEmailVerify] = useState(false);
  const [isLoadingOtpVerify, setIsLoadingOtpVerify] = useState(false);
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (firstLogin && initialEmail) {
      const autoTrigger = async () => {
        setIsLoadingEmailVerify(true);
        try {
          await sendPasswordResetOtp(initialEmail.trim());
          setShowOtpField(true);
        } catch (error) {
          console.error('Error auto-sending OTP:', error);
          setErrors({ email: error.message || 'Error sending OTP. Please try again.' });
        } finally {
          setIsLoadingEmailVerify(false);
        }
      };
      autoTrigger();
    }
  }, [firstLogin, initialEmail]);

  const validateEmail = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email ID is required';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    return nextErrors;
  };

  const validateOtpForm = () => {
    const nextErrors = {};
    const otpValidation = validateOtpValue(otp);

    if (!otpValidation.valid) {
      nextErrors.otp = otpValidation.message;
    }

    return nextErrors;
  };

  const handleEmailVerify = async (event) => {
    event.preventDefault();
    const nextErrors = validateEmail();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsLoadingEmailVerify(true);
    setErrors({});

    try {
      await sendPasswordResetOtp(email.trim());
      setShowOtpField(true);

      if (otpInputRef.current) {
        setTimeout(() => otpInputRef.current?.focus(), 100);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setErrors({ email: error.message || 'Error sending OTP. Please try again.' });
    } finally {
      setIsLoadingEmailVerify(false);
    }
  };

  const handleOtpVerify = async (event) => {
    event.preventDefault();
    const nextErrors = validateOtpForm();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsLoadingOtpVerify(true);
    setErrors({});

    try {
      const data = await verifyPasswordResetOtp(email.trim(), otp.trim());
      onSubmit(email.trim(), data.resetToken);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setErrors({ otp: error.message || 'Error verifying OTP. Please try again.' });
    } finally {
      setIsLoadingOtpVerify(false);
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleChangeEmail = () => {
    setShowOtpField(false);
    setOtp('');
    setErrors({});
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Reset Password</h1>
      <p className={styles.description}>
        Enter your email ID here so we can help you reset your password
      </p>

      {!showOtpField ? (
        <form className={styles.form} onSubmit={handleEmailVerify} noValidate>
          <TextField
            id="emailId"
            type="email"
            label="Enter Email ID"
            placeholder="Enter Email ID"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearError('email');
            }}
            autoComplete="email"
            disabled={isLoadingEmailVerify}
            error={errors.email}
            required
          />

          <button type="submit" className={styles.submitBtn} disabled={isLoadingEmailVerify}>
            {isLoadingEmailVerify ? 'Sending...' : 'Send'}
          </button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={handleOtpVerify} noValidate>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email</label>
            <div className={styles.emailDisplay}>
              <span>{email}</span>
              <button type="button" className={styles.inlineAction} onClick={handleChangeEmail}>
                Change
              </button>
            </div>
          </div>

          <p className={styles.infoText}>
            A one-time password has been sent to {email}. Please enter it here.
          </p>

          <TextField
            id="otp"
            ref={otpInputRef}
            type="text"
            label="Enter OTP"
            placeholder="000000"
            value={otp}
            onChange={(event) => {
              setOtp(event.target.value);
              clearError('otp');
            }}
            maxLength="6"
            disabled={isLoadingOtpVerify}
            error={errors.otp}
            required
            inputMode="numeric"
          />

          <button type="submit" className={styles.submitBtn} disabled={isLoadingOtpVerify}>
            {isLoadingOtpVerify ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      )}
    </div>
  );
}