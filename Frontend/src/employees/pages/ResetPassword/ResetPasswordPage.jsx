import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/AuthShell';
import { Toast } from '../../components/Toast';
import useToastState from '../../hooks/useToastState';
import formStyles from '../../styles/authForm.module.css';
import EmailVerificationStep from './EmailVerificationStep';
import NewPasswordStep from './NewPasswordStep';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const firstLogin = location.state?.firstLogin || false;
  const [step, setStep] = useState('emailVerification');
  const [email, setEmail] = useState(location.state?.email || '');
  const [resetToken, setResetToken] = useState('');
  const { toast, showToast, closeToast } = useToastState();

  const handleEmailVerificationSubmit = (emailValue, resetTokenValue) => {
    setEmail(emailValue);
    setResetToken(resetTokenValue);
    setStep('newPassword');
  };

  const handlePasswordSubmit = () => {
    showToast('Password reset successful!', true);

    setTimeout(() => {
      navigate('/');
    }, 1500);
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

      <AuthShell
        footer={(
          <button
            type="button"
            className={formStyles.footerLink}
            onClick={() => navigate('/')}
          >
            Back to Login
          </button>
        )}
      >
        {step === 'emailVerification' ? (
          <EmailVerificationStep
            initialEmail={email}
            firstLogin={firstLogin}
            onSubmit={handleEmailVerificationSubmit}
          />
        ) : (
          <NewPasswordStep
            email={email}
            resetToken={resetToken}
            onSubmit={handlePasswordSubmit}
          />
        )}
      </AuthShell>
    </>
  );
}