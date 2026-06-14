const normalizePagination = (page = 1, limit = 10) => {
     const parsedPage = parseInt(page, 10);
     const parsedLimit = parseInt(limit, 10);
     const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
     const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

     return {
          page: safePage,
          limit: safeLimit,
          offset: (safePage - 1) * safeLimit
     };
};

const buildPagination = ({ page, limit, total, pages }) => ({
     currentPage: page,
     perPage: limit,
     totalPages: pages,
     totalRecords: total
});

module.exports = { normalizePagination, buildPagination };