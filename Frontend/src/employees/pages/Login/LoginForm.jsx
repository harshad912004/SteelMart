import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PasswordField from '../../components/AuthForm/PasswordField';
import TextField from '../../components/AuthForm/TextField';
import { Toast } from '../../components/Toast';
import useToastState from '../../hooks/useToastState';
import { useAuth } from '../../../common/hooks/useAuth';
import { loginUser } from '../../services/api';
import { getAuthenticatedHome } from '../../utils/authSession';
import { isValidEmail } from '../../utils/validation';
import { EMPLOYEE_RESET_PASSWORD_PATH } from '../../routes';
import styles from '../../styles/authForm.module.css';

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast, showToast, closeToast } = useToastState();

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

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, !location.state.isError);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, showToast]);

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
      const response = await loginUser(email.trim(), password);

      if (response.success) {
        if (response.is_password_changed === 0) {
          showToast('First login detected. Please reset your password.', true);
          setEmail('');
          setPassword('');
          setTimeout(() => {
            navigate(EMPLOYEE_RESET_PASSWORD_PATH, { state: { email: email.trim(), firstLogin: true } });
          }, 1000);
          return;
        }

        login({
          token: response.token,
          email: response.email,
          user: {
            email: response.email,
            role: response.role,
          },
        });

        showToast(response.message || 'Login successful!', true);
        setEmail('');
        setPassword('');

        setTimeout(() => {
          navigate(getAuthenticatedHome() || '/dashboard');
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

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
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

      <div className={styles.container}>
        <h1 className={styles.heading}>Welcome to SteelMart</h1>
        <h3 className={styles.subheading}>Sign in to continue to SteelMart</h3>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            id="emailId"
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
            id="password"
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
    </>
  );
}