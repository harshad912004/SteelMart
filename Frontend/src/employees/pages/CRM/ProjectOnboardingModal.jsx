import React, { useState, useEffect } from 'react';
import { getEmployees } from '../../../common/services/api';
import VendorChipSelector from '../../components/VendorSelector/VendorChipSelector';
import SubContractorAccordion from '../../components/VendorSelector/SubContractorAccordion';
import FileDropzone from '../../components/FileDropzone/FileDropzone';
import { capitalizeFirstCharacter } from '../../utils/inputFormat';
import styles from './ProjectOnboardingModal.module.css';

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

function ProjectOnboardingModal({ isOpen, onClose, bid, onSubmit }) {
  if (!isOpen || !bid) return null;

  // Section 1: Internal Employee/Personnel Details State
  const [vendorRequirements, setVendorRequirements] = useState('No');
  const [selectedVendors, setSelectedVendors] = useState([]);

  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  const [allEmployeesList, setAllEmployeesList] = useState([]);
  const [dynamicVendorTypes, setDynamicVendorTypes] = useState([
    'Detailing', 'Engineering', 'Design', 'Deckers & Joist', 'Welding', 'Erection', 'Structural', 'CNC'
  ]);

  useEffect(() => {
    if (isOpen) {
      const fetchEmployees = async () => {
        try {
          const empData = await getEmployees(1, '', '', 'active', 1000, 'vendor');
          const emps = empData?.employees ?? empData?.data?.employees ?? empData?.data?.data ?? empData?.data ?? empData ?? [];
          const validEmps = Array.isArray(emps) ? emps : [];
          setAllEmployeesList(validEmps);
        } catch (err) {
          console.error("Failed to fetch employees", err);
        }
      };
      fetchEmployees();
    }
  }, [isOpen]);

  const toggleEmployeeCheckbox = (employee) => {
    setSelectedItems(prev => {
      const isEmployeeSelected = prev.some(e => e.id === employee.id);

      if (isEmployeeSelected) {
        return prev.filter(e => e.id !== employee.id);
      } else {
        const empName = employee.first_name || employee.last_name ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() : employee.employee_name || employee.email;
        return [...prev, { ...employee, isEmployee: true, name: empName }];
      }
    });
  };

  const removeSelected = (item) => {
    setSelectedItems(prev => prev.filter(i => i.id !== item.id));
  };



  const [biddingDueDate, setBiddingDueDate] = useState('');

  // Section 2: Administrative Details State
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [awardNumber, setAwardNumber] = useState('');
  const [bidValue, setBidValue] = useState('');
  const [taxExempt, setTaxExempt] = useState('No');
  const [davisBacon, setDavisBacon] = useState('No');
  const [fringesAmount, setFringesAmount] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [overhead, setOverhead] = useState('10');
  const [profit, setProfit] = useState('10');

  // File drag & drop
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Initializing state with bid details
  useEffect(() => {
    if (bid) {
      setProjectName(bid.project_name || '');
      setProjectAddress(bid.address || '');
      setAwardNumber((bid.award_number && Number(bid.award_number) !== 0) ? String(bid.award_number) : '');
      setBidValue(bid.bid_value ?? bid.grand_total ?? '');
      setBaseAmount(bid.base_contract_amount ?? '');
      setFringesAmount(bid.fringes_amount || '');
      setTaxExempt(bid.tax_exempt === 1 ? 'Yes' : 'No');
      setDavisBacon(bid.db_wage_rate === 1 ? 'Yes' : 'No');
      const savedVendorEmployees = Array.isArray(bid.vendor_employees) ? bid.vendor_employees : [];
      setVendorRequirements(savedVendorEmployees.length > 0 ? 'Yes' : 'No');
      setSelectedVendors(Array.from(new Set(savedVendorEmployees.map((employee) => {
        const tags = ['Detailing', 'Engineering', 'Design', 'Deckers & Joist', 'Welding', 'Erection', 'Structural', 'CNC'];
        return tags.find(t => mapChipToTag(t) === employee.designation) || employee.designation;
      }).filter(Boolean))));
      setSelectedItems(savedVendorEmployees.map((employee) => {
        const empName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.email;
        return {
          ...employee,
          id: employee.employee_id || employee.id,
          isEmployee: true,
          name: empName,
        };
      }));

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const minDateStr = tomorrow.toISOString().split('T')[0];
      const defaultDueDate = bid.due_date && new Date(bid.due_date) >= tomorrow
        ? bid.due_date.split('T')[0]
        : minDateStr;
      setBiddingDueDate(defaultDueDate);

      setOverhead(String(bid.overhead ?? '10'));
      setProfit(String(bid.profit ?? '10'));
    }
  }, [bid]);

  const toggleAccordion = () => {
    setIsAccordionOpen(prev => !prev);
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const files = [];
      const traverseEntry = async (entry, path = '') => {
        if (entry.isFile) {
          const file = await new Promise((resolve) => entry.file(resolve));
          const relPath = path ? `${path}/${file.name}` : file.name;
          Object.defineProperty(file, 'webkitRelativePath', {
            value: relPath,
            writable: true,
            configurable: true,
            enumerable: true
          });
          files.push(file);
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const readEntries = async () => {
            return new Promise((resolve) => {
              dirReader.readEntries((entries) => resolve(entries), () => resolve([]));
            });
          };

          let entries = await readEntries();
          let allEntries = [...entries];
          while (entries.length > 0) {
            entries = await readEntries();
            allEntries.push(...entries);
          }

          for (const subEntry of allEntries) {
            await traverseEntry(subEntry, path ? `${path}/${entry.name}` : entry.name);
          }
        }
      };

      const promises = [];
      for (const item of e.dataTransfer.items) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          promises.push(traverseEntry(entry));
        }
      }
      await Promise.all(promises);
      if (files.length > 0) {
        setUploadedFiles(files);
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const handleFolderSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const toggleVendorChip = (vendor) => {
    if (selectedVendors.includes(vendor)) {
      setSelectedVendors(selectedVendors.filter(v => v !== vendor));
    } else {
      setSelectedVendors([...selectedVendors, vendor]);
      setIsAccordionOpen(true);
    }
  };



  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('Project Name is required.');
      return;
    }

    if (!awardNumber || isNaN(Number(awardNumber)) || Number(awardNumber) < 0 || Number(awardNumber) > 9999999999.99) {
      alert('Award Number is required and must be a valid non-negative number within decimal(12,2) range.');
      return;
    }

    const employeeSelections = vendorRequirements === 'Yes'
      ? selectedItems
        .map((item) => ({
          id: item.id,
          client_employee_id: item.id,
          vendor_id: item.company_id || 1,
          vendor_category: item.tag || selectedVendors.find((tagType) => (
            String(item.tag || '').toLowerCase().includes(String(tagType).toLowerCase())
          )) || null,
        }))
      : [];

    const payload = {
      project_name: projectName,
      address: projectAddress,
      award_number: Number(awardNumber),
      bid_value: Number(bidValue) || 0,
      tax_exempt: taxExempt === 'Yes' ? 1 : 0,
      db_wage_rate: davisBacon === 'Yes' ? 1 : 0,
      fringes_amount: Number(fringesAmount) || 0,
      base_contract_amount: Number(baseAmount) || 0,
      due_date: biddingDueDate || undefined,
      overhead: Number(overhead) || 0,
      profit: Number(profit) || 0,
      vendor_employee_ids: employeeSelections,
      status: 'won',
      onboarding_source: 'crm'
    };

    onSubmit(payload, uploadedFiles);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Project Onboarding</h2>
            <p className={styles.subtitle}>Complete the Sub-Contractor and administrative details to onboard the won project.</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="#667085" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className={styles.divider}></div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className={styles.formBody}>

          {/* SECTION 1: Internal Team Details */}
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>1</div>
            <h3 className={styles.sectionTitle}>Internal Team Details</h3>
          </div>

          <div className={styles.vendorSetupArea}>
            {/* Q1: Are employees required? */}
            <div className={styles.inputGroupFull}>
              <label className={styles.label}>Are internal team members required for this project?</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="vendorRequirements"
                    value="Yes"
                    checked={vendorRequirements === 'Yes'}
                    onChange={() => setVendorRequirements('Yes')}
                  />
                  <span>Yes</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="vendorRequirements"
                    value="No"
                    checked={vendorRequirements === 'No'}
                    onChange={() => setVendorRequirements('No')}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {vendorRequirements === 'Yes' && (
              <>
                <VendorChipSelector
                  styles={styles}
                  dynamicVendorTypes={dynamicVendorTypes}
                  selectedVendors={selectedVendors}
                  toggleVendorChip={toggleVendorChip}
                  label="Select employee tags required"
                />

                {selectedVendors.length > 0 && (
                  <SubContractorAccordion
                    styles={styles}
                    isAccordionOpen={isAccordionOpen}
                    toggleAccordion={toggleAccordion}
                    selectedVendors={selectedVendors}
                    vendorSearch={vendorSearch}
                    setVendorSearch={setVendorSearch}
                    allVendorsList={allEmployeesList}
                    selectedItems={selectedItems}
                    toggleEmployeeCheckbox={toggleEmployeeCheckbox}
                    removeSelected={removeSelected}
                    biddingDueDate={biddingDueDate}
                    setBiddingDueDate={setBiddingDueDate}
                  />
                )}
              </>
            )}
          </div>

          <div className={styles.divider} style={{ margin: '16px 0' }}></div>

          {/* SECTION 2: Administrative Details */}
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>2</div>
            <h3 className={styles.sectionTitle}>Administrative Details</h3>
          </div>

          <div className={styles.grid}>
            {/* Project Name */}
            <div className={styles.inputGroupFull}>
              <label className={styles.label}>Project Name *</label>
              <input
                type="text"
                className={styles.input}
                value={projectName}
                onChange={(e) => setProjectName(capitalizeFirstCharacter(e.target.value))}
                placeholder="Enter Project Name"
                required
              />
            </div>

            {/* Project Address */}
            <div className={styles.inputGroupFull}>
              <label className={styles.label}>Project Address</label>
              <input
                type="text"
                className={styles.input}
                value={projectAddress}
                onChange={(e) => setProjectAddress(capitalizeFirstCharacter(e.target.value))}
                placeholder="Enter Project Address"
              />
            </div>

            {/* Bid Value */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Bid Value</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  className={styles.input}
                  value={bidValue}
                  onChange={(e) => setBidValue(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Enter Bid Value"
                />
                <span className={styles.unitText}>$</span>
              </div>
            </div>

            {/* Award Number */}
            <div className={styles.inputGroup}>
              {/* <label className={styles.label}>Award Number / Contract ID *</label> */}
              <label className={styles.label}>Award Number *</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  step="0.01"
                  className={styles.input}
                  value={awardNumber}
                  onChange={(e) => setAwardNumber(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Enter Award No."
                  required
                />
              </div>
            </div>

            {/* Davis Bacon Wage Rate */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Davis Bacon Wage Rate?</label>
              <div className={styles.radioWithIcon}>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="davisBacon"
                      value="Yes"
                      checked={davisBacon === 'Yes'}
                      onChange={() => setDavisBacon('Yes')}
                    />
                    <span>Yes</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="davisBacon"
                      value="No"
                      checked={davisBacon === 'No'}
                      onChange={() => setDavisBacon('No')}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </div>

            {davisBacon === 'Yes' && (
              <>
                {/* Tax Exempt */}
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Tax Exempt?</label>
                  <div className={styles.radioWithIcon}>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="taxExempt"
                          value="Yes"
                          checked={taxExempt === 'Yes'}
                          onChange={() => setTaxExempt('Yes')}
                        />
                        <span>Yes</span>
                      </label>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="taxExempt"
                          value="No"
                          checked={taxExempt === 'No'}
                          onChange={() => setTaxExempt('No')}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Fringes Amount */}
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Fringes Amount</label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      className={styles.input}
                      value={fringesAmount}
                      onChange={(e) => setFringesAmount(e.target.value)}
                      placeholder="Enter Amount"
                      disabled={davisBacon !== 'Yes'}
                    />
                    <span className={styles.unitText}>$</span>
                  </div>
                </div>

                {/* Base Contract Amount */}
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Base Contract Amount</label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      className={styles.input}
                      value={baseAmount}
                      onChange={(e) => setBaseAmount(e.target.value)}
                      placeholder="Enter Amount"
                    />
                    <span className={styles.unitText}>$</span>
                  </div>
                </div>
              </>
            )}

            {/* Signed Project Contract Dropzone */}
            <FileDropzone
              styles={styles}
              label="Project Contract"
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
              handleFileDrop={handleFileDrop}
              handleFileSelect={handleFileSelect}
              handleFolderSelect={handleFolderSelect}
            />

            {/* Overhead */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Overhead</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  className={styles.input}
                  value={overhead}
                  onChange={(e) => setOverhead(e.target.value)}
                  placeholder="Enter Overhead"
                />
                <span className={styles.unitText}>%</span>
              </div>
            </div>

            {/* Profit */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Profit</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  className={styles.input}
                  value={profit}
                  onChange={(e) => setProfit(e.target.value)}
                  placeholder="Enter Profit"
                />
                <span className={styles.unitText}>%</span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Save
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default ProjectOnboardingModal;