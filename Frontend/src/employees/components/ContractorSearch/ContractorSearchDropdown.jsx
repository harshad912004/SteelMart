import React from 'react';

function ContractorSearchDropdown({
  styles,
  isViewOnly,
  generalContractorSearch,
  isContractorSearchOpen,
  setIsContractorSearchOpen,
  onSearchChange,
  isLoadingContractors,
  contractorEmployeeOptions,
  selectedGeneralContractors,
  selectedEmployees,
  toggleContractor,
  toggleEmployee,
  setShowAddNewGCModal,
}) {
  return (
    <div className={styles.formGroup}>
      <label>General Contractor *</label>
      <div className={styles.searchBox}>
        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 21L16.65 16.65" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search for Employee or General Contractor"
          value={generalContractorSearch}
          readOnly={isViewOnly}
          onFocus={() => !isViewOnly && setIsContractorSearchOpen(true)}
          onChange={(e) => !isViewOnly && onSearchChange(e.target.value)}
        />
      </div>
      {isContractorSearchOpen && !isViewOnly && (
        <div className={styles.listContainer}>
          {isLoadingContractors ? (
            <div className={styles.emptyList}>Loading general contractors…</div>
          ) : contractorEmployeeOptions.length === 0 ? (
            <div className={styles.emptyList}>No general contractors found</div>
          ) : (
            contractorEmployeeOptions.map(({ contractor, employee }) => {
              if (!employee) {
                const checked = selectedGeneralContractors?.some(
                  (item) => item.id === contractor.id
                );

                return (
                  <label key={`${contractor.id}-contractor`} className={styles.listItem}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleContractor(contractor)}
                    />
                    <div className={styles.employeeOptionInfo}>
                      <span className={styles.strongText}>{contractor.name || 'General Contractor'}</span>
                      <span className={styles.contractorMeta}>No employees yet</span>
                    </div>
                  </label>
                );
              }

              const employeeName = employee.firstName || employee.lastName
                ? `${employee.firstName} ${employee.lastName}`.trim()
                : employee.fallbackName || employee.email || employee.phone || 'Employee';
              const checked = selectedEmployees?.some(
                (item) => item.id === employee.id && item.contractorId === contractor.id
              );

              return (
                <label key={`${contractor.id}-${employee.id}`} className={styles.listItem}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleEmployee(contractor, employee)}
                  />
                  <div className={styles.employeeOptionInfo}>
                    <span className={styles.strongText}>{employeeName}</span>
                    <span className={styles.contractorMeta}>{contractor.name}</span>
                  </div>
                </label>
              );
            })
          )}
        </div>
      )}
      {!isViewOnly && (
        <button className={styles.outlineButton} type="button" onClick={() => setShowAddNewGCModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New GC
        </button>
      )}
    </div>
  );
}

export default ContractorSearchDropdown;
