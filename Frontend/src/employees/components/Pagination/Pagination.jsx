import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';

function Pagination({
  styles,
  currentPage,
  totalPages,
  totalRecords,
  firstItemNumber,
  lastItemNumber,
  pageNumbers,
  isLoading = false,
  onPageChange,
}) {
  return (
    <div className={styles.pagination}>
      <span className={styles.paginationInfo}>
        {firstItemNumber}-{lastItemNumber} of {totalRecords} items
      </span>

      <div className={styles.paginationButtons}>
        <button
          type="button"
          className={styles.pageButton}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
        >
          <ChevronLeftIcon />
        </button>

        {pageNumbers.map((page, index) => (
          <span
            key={`${page}-${index}`}
            className={page === currentPage ? styles.pageNumber : styles.pageNumberInactive}
            style={{ cursor: page !== '...' ? 'pointer' : 'default' }}
            onClick={() => page !== '...' && onPageChange(page)}
          >
            {page}
          </span>
        ))}

        <button
          type="button"
          className={styles.pageButton}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}

export default Pagination;