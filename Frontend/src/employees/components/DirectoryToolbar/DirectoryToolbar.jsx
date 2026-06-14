import React from 'react';
import { ClearIcon, PlusIcon } from '../Icons';
import SearchInput from '../SearchInput/SearchInput';

function DirectoryToolbar({
  styles,
  filterValue,
  filterOptions = [],
  filterPlaceholder = 'Filter by',
  searchValue,
  searchPlaceholder,
  addButtonLabel,
  onFilterChange,
  onSearchChange,
  onAdd,
  onClear,
  showClear,
}) {
  return (
    <div className={styles.filterSection}>
      <div className={styles.leftFilters}>
        {filterOptions.length > 0 ? (
          <div className={styles.filterFilter}>
            <select
              className={styles.filterDropdown}
              value={filterValue}
              onChange={(event) => onFilterChange(event.target.value)}
            >
              <option value="">{filterPlaceholder}</option>
              {filterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className={styles.searchContainer}>
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            hideClear={true}
          />

          {showClear ? (
            <button
              type="button"
              className={styles.clearButton}
              aria-label="Clear search"
              title="Clear search"
              onClick={onClear}
            >
              <ClearIcon />
            </button>
          ) : null}
        </div>
      </div>

      <button type="button" className={styles.addButton} onClick={onAdd}>
        <PlusIcon />
        {addButtonLabel}
      </button>
    </div>
  );
}

export default DirectoryToolbar;