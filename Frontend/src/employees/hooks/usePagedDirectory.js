import { useCallback, useMemo, useState } from 'react';

const getPageNumbers = (current, total) => {
  const pages = [];

  for (let page = 1; page <= total; page += 1) {
    if (
      page === 1 ||
      page === total ||
      (page >= current - 1 && page <= current + 1)
    ) {
      pages.push(page);
    } else if (
      (page === current - 2 && current > 3) ||
      (page === current + 2 && current < total - 2)
    ) {
      pages.push('...');
    }
  }

  return pages.filter((page, index, items) => page !== '...' || items[index - 1] !== '...');
};

export default function usePagedDirectory({ initialPage = 1, initialPerPage = 5 } = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    perPage: initialPerPage,
    totalPages: 1,
    totalRecords: 0,
  });

  const syncPagination = useCallback((nextPagination, fallbackPage = currentPage) => {
    const resolvedPagination = nextPagination || {
      currentPage: fallbackPage,
      perPage: initialPerPage,
      totalPages: 1,
      totalRecords: 0,
    };

    setPagination(resolvedPagination);
    setCurrentPage(resolvedPagination.currentPage || fallbackPage);
  }, [currentPage, initialPerPage]);

  const handlePageChange = useCallback((page) => {
    const nextPage = Math.min(Math.max(page, 1), pagination.totalPages || 1);
    setCurrentPage(nextPage);
  }, [pagination.totalPages]);

  const pageNumbers = useMemo(() => (
    getPageNumbers(pagination.currentPage || currentPage, pagination.totalPages || 1)
  ), [currentPage, pagination.currentPage, pagination.totalPages]);

  const firstItemNumber = useMemo(() => (
    pagination.totalRecords === 0
      ? 0
      : (pagination.currentPage - 1) * pagination.perPage + 1
  ), [pagination]);

  const lastItemNumber = useMemo(() => (
    Math.min(pagination.currentPage * pagination.perPage, pagination.totalRecords)
  ), [pagination]);

  return {
    currentPage,
    setCurrentPage,
    pagination,
    setPagination: syncPagination,
    handlePageChange,
    pageNumbers,
    firstItemNumber,
    lastItemNumber,
  };
}