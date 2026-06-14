import React from 'react';
import { formatEmployeeTag } from '../../utils/clientType';

const MAP_CHIP_TO_TAG = {
  'Detailing': 'detailing',
  'Engineering': 'engineering',
  'Design': 'design',
  'Deckers & Joist': 'dockersAndJoist',
  'Welding': 'welding',
  'Erection': 'erection',
  'Structural': 'structural',
  'CNC': 'cnc'
};

const mapChipToTag = (chip) => {
  return MAP_CHIP_TO_TAG[chip] || chip.toLowerCase();
};

function SubContractorAccordion({
  styles,
  isAccordionOpen,
  toggleAccordion,
  selectedVendors,
  vendorSearch,
  setVendorSearch,
  allVendorsList,
  selectedItems,
  toggleEmployeeCheckbox,
  removeSelected,
  biddingDueDate,
  setBiddingDueDate,
}) {
  return (
    <div className={styles.accordion}>
      <div 
        className={`${styles.accordionHeader} ${isAccordionOpen ? styles.open : ''}`} 
        onClick={toggleAccordion}
      >
        <span className={styles.accordionTitle}>Assign Employees</span>
        <svg 
          className={`${styles.accordionIcon} ${isAccordionOpen ? styles.rotated : ''}`} 
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {isAccordionOpen && (
        <div className={styles.accordionBody}>
          <div className={styles.accordionGrid}>
            
            {/* Left Column: Suggested Employees list */}
            <div className={styles.vendorPanel}>
              <span className={styles.panelTitle}>Suggested Employees</span>
              <div className={styles.searchWrapper}>
                <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className={styles.vendorSearchInput}
                  placeholder="Search Employee Name"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                />
              </div>

              <div className={styles.vendorList}>
                {allVendorsList
                  .filter(emp => {
                    if (selectedVendors.length === 0) return false;
                    return emp.tag && selectedVendors.some(sv => mapChipToTag(sv) === emp.tag);
                  })
                  .map(emp => {
                    const isEmpSelected = selectedItems.some(item => item.id === emp.id);
                    const empName = emp.first_name || emp.last_name ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : emp.employee_name || emp.name || emp.email;
                    
                    // Apply search filter to employee name
                    const searchTxt = vendorSearch.toLowerCase();
                    if (searchTxt && !empName.toLowerCase().includes(searchTxt)) return null;

                    return (
                      <div 
                        key={emp.id} 
                        className={styles.vendorItem}
                        onClick={() => toggleEmployeeCheckbox(emp)}
                      >
                        <input
                          type="checkbox"
                          className={styles.vendorItemCheckbox}
                          checked={isEmpSelected}
                          onChange={() => toggleEmployeeCheckbox(emp)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className={styles.vendorItemLabel}>
                          {empName} <span style={{ color: '#667085', fontSize: '12px', marginLeft: '4px' }}>({emp.tag ? formatEmployeeTag(emp.tag) : (emp.role || 'Employee')})</span>
                        </span>
                      </div>
                    );
                  }).filter(Boolean)
                }
              </div>
            </div>

            {/* Right Column: Selected Employees list */}
            <div className={styles.vendorPanel}>
              <span className={styles.panelTitle}>Selected Employees</span>
              <div className={styles.selectedVendorList}>
                {selectedItems.map(item => (
                  <div className={styles.selectedVendorRow} key={`e-${item.id}`}>
                    <span className={styles.selectedVendorName}>
                      {item.name} <span style={{ color: '#667085', fontSize: '12px', marginLeft: '4px' }}>({item.tag ? formatEmployeeTag(item.tag) : (item.role || 'Employee')})</span>
                    </span>
                    <div className={styles.selectedVendorActions}>
                      <button 
                        type="button" 
                        className={styles.vendorActionBtn} 
                        title="Remove"
                        onClick={() => removeSelected(item)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bidding Due & Accordion Actions */}
          <div className={styles.biddingDueSection}>
            <div className={styles.dueInputGroup}>
              <span className={styles.dueLabel}>Due Date for Bidding</span>
              <input
                type="date"
                className={styles.dueInput}
                value={biddingDueDate}
                onChange={(e) => setBiddingDueDate(e.target.value)}
              />
            </div>
            <button 
              type="button" 
              className={styles.accordionSaveBtn}
              onClick={() => {
                toggleAccordion();
              }}
            >
              Save
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default SubContractorAccordion;