import React from 'react';
import { SearchIcon, ClearIcon } from '../Icons';
import styles from './SearchInput.module.css';

function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  onClear,
  hideClear = false,
}) {
  const preventSearchSubmit = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  return (
    <div className={`${styles.searchContainer} ${className}`}>
      <span className={styles.searchIcon}><SearchIcon /></span>
      <input
        className={styles.searchInput}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={preventSearchSubmit}
      />
      {value && !hideClear && (
        <button
          className={styles.clearButton}
          type="button"
          aria-label="Clear search"
          title="Clear search"
          onClick={handleClear}
        >
          <ClearIcon />
        </button>
      )}
    </div>
  );
}

export default SearchInput;