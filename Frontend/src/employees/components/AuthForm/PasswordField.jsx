import React, { useState } from 'react';
import { EyeOffIcon, EyeOnIcon } from '../Icons';
import styles from '../../styles/authForm.module.css';

function PasswordField({
  id,
  label,
  error,
  hint,
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  wrapperClassName = '',
  ...inputProps
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`${styles.fieldGroup} ${containerClassName}`.trim()}>
      {label ? (
        <label className={`${styles.label} ${labelClassName}`.trim()} htmlFor={id}>
          {label}
        </label>
      ) : null}

      <div className={`${styles.passwordWrapper} ${error ? styles.inputErr : ''} ${wrapperClassName}`.trim()}>
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          className={`${styles.passwordInput} ${inputClassName}`.trim()}
          {...inputProps}
        />
        <button
          type="button"
          className={styles.eyeBtn}
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
          disabled={inputProps.disabled}
        >
          {isVisible ? <EyeOnIcon /> : <EyeOffIcon />}
        </button>
      </div>

      {error ? <span className={styles.errorMsg}>{error}</span> : null}
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}

export default PasswordField;
