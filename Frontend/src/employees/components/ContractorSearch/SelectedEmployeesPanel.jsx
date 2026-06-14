import React from 'react';

function SelectedEmployeesPanel({
  styles,
  selectedGroups,
  isViewOnly,
  handleOpenAddEmployee,
  errors,
}) {
  return (
    <div className={styles.formGroup}>
      <label>Selected Employees *</label>
      <div className={styles.selectedEmployeesBox}>
        {selectedGroups.length > 0 ? (
          selectedGroups.map(({ contractor, employees }) => (
            <div key={contractor.id} className={styles.employeeGroup}>
              <div className={styles.employeeGroupHeader}>
                <span className={styles.employeeGroupTitle}>{contractor.name}</span>
                {!isViewOnly && (
                  <button
                    type="button"
                    className={styles.addEmployeeLink}
                    onClick={() => handleOpenAddEmployee(contractor)}
                  >
                    + Add Employee
                  </button>
                )}
              </div>
              {employees.length > 0 ? (
                employees.map((employee) => (
                  <div key={`${employee.contractorId}-${employee.id}`} className={styles.selectedRow}>
                    {employee.firstName || employee.lastName
                      ? `${employee.firstName} ${employee.lastName}`.trim()
                      : employee.fallbackName || employee.email || employee.phone || 'Employee'}
                    {employee.designation ? ` — ${employee.designation}` : ''}
                  </div>
                ))
              ) : (
                <div className={styles.emptyList}>No selected employees yet</div>
              )}
            </div>
          ))
        ) : (
          <div className={styles.emptyList}>No selected employees yet</div>
        )}
      </div>
      {errors.selected_employees ? <span className={styles.errorMessage}>{errors.selected_employees}</span> : null}
    </div>
  );
}

export default SelectedEmployeesPanel;
