import React, { forwardRef } from 'react';
import styles from '../../styles/authForm.module.css';

const TextField = forwardRef(function TextField({
  id,
  label,
  error,
  className = '',
  inputClassName = '',
  labelClassName = '',
  errorClassName = '',
  containerClassName = '',
  type = 'text',
  ...inputProps
}, ref) {
  return (
    <div className={`${styles.fieldGroup} ${containerClassName}`.trim()}>
      {label ? (
        <label className={`${styles.label} ${labelClassName}`.trim()} htmlFor={id}>
          {label}
        </label>
      ) : null}

      <input
        ref={ref}
        id={id}
        type={type}
        className={`${styles.input} ${error ? styles.inputErr : ''} ${inputClassName} ${className}`.trim()}
        {...inputProps}
      />

      {error ? (
        <span className={`${styles.errorMsg} ${errorClassName}`.trim()}>
          {error}
        </span>
      ) : null}
    </div>
  );
});

export default TextField;