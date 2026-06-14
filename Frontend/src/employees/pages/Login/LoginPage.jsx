import React from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../../components/AuthShell';
import styles from '../../styles/authForm.module.css';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <AuthShell
      footer={(
        <Link to="/employee/reset-password" className={styles.footerLink}>
          Forgot Password?
        </Link>
      )}
    >
      <LoginForm />
    </AuthShell>
  );
}