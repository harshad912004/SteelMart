import React from 'react';

function DataTable({
  styles,
  columns,
  rows,
  isLoading = false,
  loadingMessage = 'Loading...',
  emptyMessage = 'No records found',
  renderRow,
}) {
  return (
    <div className={styles.tableRef}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column} 
                scope="col"
                style={{ textAlign: column === 'Actions' ? 'right' : undefined }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyState}>
                {loadingMessage}
              </td>
            </tr>
          ) : null}

          {!isLoading && rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyState}>
                {emptyMessage}
              </td>
            </tr>
          ) : null}

          {!isLoading ? rows.map(renderRow) : null}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
