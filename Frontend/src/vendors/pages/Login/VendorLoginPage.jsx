import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PasswordField from '../../../employees/components/AuthForm/PasswordField';
import TextField from '../../../employees/components/AuthForm/TextField';
import { Toast } from '../../../employees/components/Toast';
import VendorAuthShell from '../../components/VendorAuthShell';
import useToastState from '../../../employees/hooks/useToastState';
import { useAuth } from '../../../common/hooks/useAuth';
import { getAuthenticatedHome } from '../../../common/auth/session';
import { loginVendor } from '../../services/api';
import { VENDOR_RESET_PASSWORD_PATH } from '../../routes';
import styles from '../../../employees/styles/authForm.module.css';
import { isValidEmail } from '../../../employees/utils/validation';

export default function VendorLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast, showToast, closeToast } = useToastState();
  const footer = (
    <Link to="/vendor/reset-password" className={styles.footerLink}>
      Forgot Password?
    </Link>
  );

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, !location.state.isError);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, showToast]);

  const validate = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email ID is required';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    }

    return nextErrors;
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await loginVendor(email.trim(), password);

      if (response.success) {
        if (response.is_password_changed === 0) {
          showToast('First login detected. Please reset your password.', true);
          setEmail('');
          setPassword('');
          setTimeout(() => {
            navigate(VENDOR_RESET_PASSWORD_PATH, { state: { email: email.trim(), firstLogin: true } });
          }, 1000);
          return;
        }

        login({
          token: response.token,
          email: response.email,
          accountType: 'vendor',
          user: {
            email: response.email,
            role: response.role,
            companyName: response.companyName,
            accountType: 'vendor',
          },
        });

        showToast(response.message || 'Login successful!', true);
        setEmail('');
        setPassword('');

        setTimeout(() => {
          navigate(getAuthenticatedHome() || '/vendor/dashboard');
        }, 500);
      } else {
        showToast(response.message || 'Login failed. Please try again.', false);
      }
    } catch (error) {
      const errorMessage = error.data?.message || error.message || 'Login failed. Please try again.';
      showToast(errorMessage, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VendorAuthShell footer={footer}>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        isSuccess={toast.isSuccess}
        onClose={closeToast}
        duration={3000}
      />

      <div className={styles.container}>
        <h1 className={styles.heading}>Welcome to SteelMart DSC Portal</h1>
        <h3 className={styles.subheading}>Sign in to continue to SteelMart</h3>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            id="vendorEmailId"
            type="email"
            label="Email ID"
            placeholder="Enter Email ID"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearError('email');
            }}
            autoComplete="email"
            error={errors.email}
            required
          />

          <PasswordField
            id="vendorPassword"
            label="Password"
            placeholder="Enter Password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearError('password');
            }}
            autoComplete="current-password"
            error={errors.password}
            required
          />

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Login'}
          </button>
        </form>
      </div>
    </VendorAuthShell>
  );
}