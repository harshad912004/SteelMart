import React, { useEffect, useRef, useState } from 'react';
import Modal from '../../components/Modal';
import { getAllClients, getClientEmployees, getClientTypes, createClient, addClientEmployee } from '../../../common/services/api';
import AddNewGCModal from '../../components/Client/AddNewGCModal';
import AddEmployeeModal from '../../components/Client/AddEmployeeModal';
import ContractorSearchDropdown from '../../components/ContractorSearch/ContractorSearchDropdown';
import SelectedEmployeesPanel from '../../components/ContractorSearch/SelectedEmployeesPanel';
import SharePopup from '../../components/SharePopup/SharePopup';
import { capitalizeFirstCharacter } from '../../utils/inputFormat';
import { getRoleLabel } from '../../constants/roles';
import { formatValidationMessages, validateBidForm } from '../../utils/validation';
import styles from './CreateBidModal.module.css';



function CreateBidModal({ isOpen, onClose, onSubmit, initialData }) {
  const formatDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [contractors, setContractors] = useState([]);
  const [isLoadingContractors, setIsLoadingContractors] = useState(false);
  const [isContractorSearchOpen, setIsContractorSearchOpen] = useState(false);
  const [showAddNewGCModal, setShowAddNewGCModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [currentContractorForEmployee, setCurrentContractorForEmployee] = useState(null);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [shareSearchTerm, setShareSearchTerm] = useState('');
  const [clientTypes, setClientTypes] = useState([]);

  const [selectedShareOption, setSelectedShareOption] = useState('');
  const [errors, setErrors] = useState({});
  const contractorSearchRef = useRef(null);

  const getInitialFormData = () => ({
    project_name: '',
    due_date: '',
    address: '',
    general_contractor_search: '',
    selected_general_contractors: [],
    selected_employees: [],
    selected_vendor_employees: [],
    dwg_date: '',
    dwg_description: '',
    db_wage_rate: false,
    tax_exempt: false,
    fringes_amount: '',
    base_contract_amount: ''
  });

  const [formData, setFormData] = useState(getInitialFormData());

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const isViewOnly = Boolean(initialData?.viewOnly);
  const isCreateMode = !initialData?.id;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDueDate = formatDateInputValue(tomorrow);
  const today = new Date();
  const minDwgDate = formatDateInputValue(today);

  const extractEmployees = (response) => {
    // Handle various API shapes
    if (Array.isArray(response)) return response;
    const payload =
      response?.employees ??
      response?.client_employees ??
      response?.data?.employees ??
      response?.data?.client_employees ??
      response?.data?.data ??
      response?.data ??
      response;
    return Array.isArray(payload) ? payload : [];
  };

  const extractClients = (response) => {
    if (Array.isArray(response)) return response;
    const payload =
      response?.contacts ??
      response?.clients ??
      response?.companies ??
      response?.data?.contacts ??
      response?.data?.clients ??
      response?.data?.companies ??
      response?.data?.data ??
      response?.data ??
      response;
    return Array.isArray(payload) ? payload : [];
  };

  const normalizeId = (value) => (
    value === undefined || value === null || value === '' ? null : String(value)
  );

  const getEntityId = (entity) => normalizeId(
    entity?.id || entity?._id || entity?.client_id || entity?.clientId || entity?.employee_id || entity?.client_employee_id || entity?.employeeId || null
  );

  const getEmployeeId = (employee) => getEntityId(employee);

  const formatContractor = (contractor) => ({
    id: getEntityId(contractor),
    name: contractor.company_name || contractor.companyName || contractor.name || '',
    clientType: contractor.client_type || contractor.clientType || '',
    officeNumber: contractor.office_number || contractor.officeNumber || contractor.phone || '-',
    employees: Array.isArray(contractor.employees) ? contractor.employees : [],
  });

  const formatEmployee = (employee, contractorId) => {
    const id = getEmployeeId(employee);
    if (!id) return null;

    return {
      id,
      firstName: employee.first_name || employee.firstName || '',
      lastName: employee.last_name || employee.lastName || '',
      designation: getRoleLabel(employee.designation || employee.role) || '',
      email: employee.email || employee.email_address || '',
      phone: employee.phone || employee.mobile || employee.phone_number || '',
      contractorId: normalizeId(contractorId),
      fallbackName: employee.name || employee.employee_name || employee.full_name || '',
    };
  };

  const fetchClientTypes = async () => {
    try {
      const data = await getClientTypes();
      const list = data?.data || data?.types || data?.client_types || [];
      setClientTypes(Array.isArray(list) ? list : []);
    } catch {
      setClientTypes([]);
    }
  };

  const getGeneralContractorTypeId = () => {
    const match = clientTypes.find((type) => {
      const label = String(type.type_name || type.client_type || type.name || '').toLowerCase();
      return label.includes('general contractor');
    });
    return match?.id || null;
  };

  const fetchContractors = async (search = '') => {
    setIsLoadingContractors(true);
    try {
      const trimmedSearch = search.trim().toLowerCase();
      const responses = await Promise.all([
        getAllClients(1, 50, search, 'General Contractors'),
        trimmedSearch ? getAllClients(1, 50, '', 'General Contractors') : null,
      ]);
      const list = responses.flatMap(extractClients);
      const uniqueClients = list.reduce((acc, contractor) => {
        const id = getEntityId(contractor);
        if (id && !acc.some((item) => getEntityId(item) === id)) {
          acc.push(contractor);
        }
        return acc;
      }, []);
      const formattedContractors = uniqueClients.map(formatContractor).filter((contractor) => contractor.id);
      const contractorsWithEmployees = await Promise.all(
        formattedContractors.map(async (contractor) => ({
          ...contractor,
          employees: await loadContractorEmployees(contractor.id),
        }))
      );
      const filteredContractors = trimmedSearch
        ? contractorsWithEmployees.filter((contractor) => {
          const contractorMatches = `${contractor.name} ${contractor.clientType}`.toLowerCase().includes(trimmedSearch);
          const employeeMatches = contractor.employees.some((employee) => (
            `${employee.firstName} ${employee.lastName} ${employee.fallbackName} ${employee.email} ${employee.designation}`
              .toLowerCase()
              .includes(trimmedSearch)
          ));
          return contractorMatches || employeeMatches;
        })
        : contractorsWithEmployees;
      setContractors(filteredContractors);
    } catch (err) {
      setContractors([]);
    } finally {
      setIsLoadingContractors(false);
    }
  };

  const loadContractorEmployees = async (contractorId) => {
    try {
      console.log(' Fetching employees for contractor:', contractorId);
      const data = await getClientEmployees(contractorId, 1, 100);
      console.log(' Raw API response:', data);
      const employees = extractEmployees(data)
        .map((employee) => formatEmployee(employee, contractorId))
        .filter(Boolean);
      console.log(' Mapped employees:', employees);
      return employees;
    } catch (err) {
      console.error(' Employee fetch error:', err);
      return [];
    }
  };

  const toggleContractor = async (contractor) => {
    console.log(' Toggle contractor:', contractor);
    setErrors(prev => ({
      ...prev,
      selected_general_contractors: undefined,
      selected_employees: undefined,
    }));

    // Determine if we're adding or removing by checking current state
    const isCurrentlySelected = (formData.selected_general_contractors || []).some(
      (item) => item.id === contractor.id
    );

    if (isCurrentlySelected) {
      // REMOVE: uncheck contractor and strip its employees immediately
      console.log('Removing contractor:', contractor.id);
      setFormData((prev) => {
        const next = (prev.selected_general_contractors || []).filter(
          (item) => item.id !== contractor.id
        );
        const filteredEmployees = (prev.selected_employees || []).filter(
          (emp) => emp.contractorId !== contractor.id
        );
        return { ...prev, selected_general_contractors: next, selected_employees: filteredEmployees };
      });
      return; // no employee loading needed
    }

    // ADD contractor first
    console.log(' Adding contractor:', contractor.id);
    setFormData((prev) => ({
      ...prev,
      selected_general_contractors: [
        ...(prev.selected_general_contractors || []),
        contractor,
      ],
    }));

    // Then fetch and store its employees
    const employees = await loadContractorEmployees(contractor.id);
    console.log(' Employees fetched for', contractor.name, ':', employees);

    setFormData((prev) => {
      // Guard: only add employees if contractor is still checked
      const stillSelected = (prev.selected_general_contractors || []).some(
        (c) => c.id === contractor.id
      );
      if (!stillSelected) return prev;

      const existing = prev.selected_employees || [];
      const combined = [...existing, ...employees];
      const unique = combined.reduce((acc, emp) => {
        if (!acc.some((item) => item.id === emp.id)) acc.push(emp);
        return acc;
      }, []);
      console.log('🎯 Final unique employees:', unique);
      return { ...prev, selected_employees: unique };
    });
  };

  const toggleEmployee = (contractor, employee) => {
    setErrors(prev => ({ ...prev, selected_employees: undefined }));
    setFormData((prev) => {
      const selectedEmployees = prev.selected_employees || [];
      const selectedContractors = prev.selected_general_contractors || [];
      const isSelected = selectedEmployees.some(
        (item) => item.id === employee.id && item.contractorId === contractor.id
      );

      if (isSelected) {
        const nextEmployees = selectedEmployees.filter(
          (item) => !(item.id === employee.id && item.contractorId === contractor.id)
        );
        const contractorStillHasEmployees = nextEmployees.some(
          (item) => item.contractorId === contractor.id
        );
        const nextContractors = contractorStillHasEmployees
          ? selectedContractors
          : selectedContractors.filter((item) => item.id !== contractor.id);

        return {
          ...prev,
          selected_general_contractors: nextContractors,
          selected_employees: nextEmployees,
        };
      }

      const nextContractors = selectedContractors.some((item) => item.id === contractor.id)
        ? selectedContractors
        : [...selectedContractors, contractor];

      return {
        ...prev,
        selected_general_contractors: nextContractors,
        selected_employees: [...selectedEmployees, employee],
      };
    });
  };

  const handleAddNewGCSubmit = async (gcData) => {
    try {
      console.log('📋 Submitting new GC:', gcData);
      const payload = {
        company_name: gcData.company,
        office_number: gcData.phone,
        website: gcData.website?.trim() || null,
        address: gcData.address?.trim() || null,
        client_type_id: getGeneralContractorTypeId(),
        client_type: getGeneralContractorTypeId() ? undefined : 'General Contractor',
      };

      const response = await createClient(Object.fromEntries(Object.entries(payload).filter(([_, value]) => value != null)));
      console.log('✅ New GC created:', response);

      const clientResponse = response?.client || response?.data?.client || response?.data || response;
      const newGCId = getEntityId(clientResponse);
      if (!newGCId) {
        console.error('❌ No GC ID returned from API');
        setShowAddNewGCModal(false);
        await fetchContractors(formData.general_contractor_search);
        return;
      }

      const newContractor = formatContractor({
        id: newGCId,
        company_name: gcData.company,
        office_number: gcData.phone,
        client_type: 'General Contractor',
      });

      const addedEmployees = [];
      if (gcData.employees && gcData.employees.length > 0) {
        console.log('👥 Adding employees to GC...');
        for (const emp of gcData.employees) {
          if (emp.first_name || emp.last_name) {
            const employeeResponse = await addClientEmployee(newGCId, {
              first_name: emp.first_name,
              last_name: emp.last_name,
              email: emp.email,
              phone: emp.phone,
              designation: emp.designation,
            });
            const employeePayload = employeeResponse?.employee || employeeResponse?.data?.employee || employeeResponse?.data || employeeResponse;
            const employeeId = getEntityId(employeePayload);
            addedEmployees.push({
              id: employeeId || `${newGCId}-${Date.now()}-${addedEmployees.length}`,
              firstName: emp.first_name || '',
              lastName: emp.last_name || '',
              email: emp.email || '',
              phone: emp.phone || '',
              designation: emp.designation || '',
              contractorId: newGCId,
            });
          }
        }
      }

      setFormData((prev) => ({
        ...prev,
        selected_general_contractors: [
          ...(prev.selected_general_contractors || []),
          newContractor,
        ],
        selected_employees: [
          ...(prev.selected_employees || []),
          ...addedEmployees,
        ],
      }));
      setErrors(prev => ({ ...prev, selected_employees: undefined }));

      console.log('GC and employees added successfully');
      setShowAddNewGCModal(false);
      await fetchContractors(formData.general_contractor_search);
    } catch (err) {
      console.error('Error creating new GC:', err);
    }
  };

  const handleOpenAddEmployee = (contractor) => {
    setCurrentContractorForEmployee(contractor);
    setShowAddEmployeeModal(true);
  };

  const handleAddEmployeeModalSubmit = async ({ employees }) => {
    if (!currentContractorForEmployee) {
      setShowAddEmployeeModal(false);
      return;
    }

    const persistedEmployees = [];
    for (const emp of employees || []) {
      if (!emp.first_name && !emp.last_name && !emp.email && !emp.phone) {
        continue;
      }

      try {
        const response = await addClientEmployee(currentContractorForEmployee.id, {
          first_name: emp.first_name || emp.firstName || '',
          last_name: emp.last_name || emp.lastName || '',
          email: emp.email || '',
          phone: emp.phone || '',
          designation: emp.designation || '',
        });

        const persistedPayload = response?.employee || response?.data?.employee || response?.data || response;
        const persistedId = getEntityId(persistedPayload) || `${currentContractorForEmployee.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        persistedEmployees.push({
          id: persistedId,
          firstName: emp.first_name || emp.firstName || '',
          lastName: emp.last_name || emp.lastName || '',
          email: emp.email || '',
          phone: emp.phone || '',
          designation: emp.designation || '',
          contractorId: currentContractorForEmployee.id,
        });
      } catch (error) {
        console.error('Failed to persist new employee:', error);
      }
    }

    setFormData((prev) => ({
      ...prev,
      selected_employees: [
        ...(prev.selected_employees || []),
        ...persistedEmployees,
      ],
    }));
    setErrors(prev => ({ ...prev, selected_employees: undefined }));
    setShowAddEmployeeModal(false);
  };

  const selectedGroups = (formData.selected_general_contractors || []).map((contractor) => ({
    contractor,
    employees: (formData.selected_employees || []).filter(
      (emp) => emp.contractorId === contractor.id
    ),
  }));

  const shareOptions = (formData.selected_general_contractors || [])
    .map((contractor) => ({
      id: `company-${contractor.id}`,
      label: contractor.name,
    }))
    .filter((option) => option.label);

  const uniqueShareOptions = shareOptions.filter((option, index, options) => (
    options.findIndex((item) => item.label === option.label) === index
  ));

  const filteredShareOptions = uniqueShareOptions.filter((option) => (
    option.label.toLowerCase().includes(shareSearchTerm.trim().toLowerCase())
  ));

  const contractorSearchTerm = formData.general_contractor_search.trim().toLowerCase();
  const contractorEmployeeOptions = contractors.flatMap((contractor) => (
    (contractor.employees || []).length === 0
      ? [{
        contractor,
        employee: null,
      }]
      : (contractor.employees || [])
        .filter((employee) => {
          if (!contractorSearchTerm) return true;

          const employeeMatches = `${employee.firstName} ${employee.lastName} ${employee.fallbackName} ${employee.email} ${employee.designation}`
            .toLowerCase()
            .includes(contractorSearchTerm);
          const contractorMatches = `${contractor.name} ${contractor.clientType}`
            .toLowerCase()
            .includes(contractorSearchTerm);

          return employeeMatches || contractorMatches;
        })
        .map((employee) => ({
          contractor,
          employee,
        }))
  ));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contractorSearchRef.current && !contractorSearchRef.current.contains(event.target)) {
        setIsContractorSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData && Object.keys(initialData).length > 0) {
        setFormData({
          ...getInitialFormData(),
          ...initialData,
          selected_general_contractors: Array.isArray(initialData.selected_general_contractors)
            ? initialData.selected_general_contractors
            : [],
          selected_employees: Array.isArray(initialData.selected_employees)
            ? initialData.selected_employees
            : [],
        });
      } else {
        setFormData(getInitialFormData());
      }
      setContractors([]);
      setIsContractorSearchOpen(false);
      setShowSharePopup(false);
      setShareSearchTerm('');
      setSelectedShareOption('');
      setErrors({});
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    fetchClientTypes();
  }, []);

  // contractor search debounce
  useEffect(() => {
    if (!isContractorSearchOpen) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchContractors(formData.general_contractor_search);
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.general_contractor_search, isContractorSearchOpen]);


  const modalTitle = isViewOnly
    ? 'Bid Details'
    : initialData?.id
      ? 'Edit Bid'
      : 'Create New Bid';

  const handleSubmit = () => {
    if (isViewOnly) {
      onClose();
      return;
    }

    const nextErrors = validateBidForm(formData, {
      requireFutureDueDate: isCreateMode,
      requireFutureDwgDate: isCreateMode
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} width="800px">
      <div className={styles.modalContent}>
        {/* Basic Information Section */}
        <div className={styles.sectionTitle}>Basic Information</div>
        <div className={styles.formGrid2}>
          <div className={styles.formGroup}>
            <label>Project Name *</label>
            <input
              type="text"
              placeholder="Project Name"
              value={formData.project_name}
              disabled={isViewOnly}
              onChange={(e) => !isViewOnly && handleChange('project_name', capitalizeFirstCharacter(e.target.value))}
              required
            />
            {errors.project_name ? <span className={styles.errorMessage}>{errors.project_name}</span> : null}
          </div>
          <div className={styles.formGroup}>
            <label>Due Date *</label>
            <input
              type="date"
              value={formData.due_date}
              min={isCreateMode ? minDueDate : undefined}
              disabled={isViewOnly}
              onChange={(e) => !isViewOnly && handleChange('due_date', e.target.value)}
              required
            />
            {errors.due_date ? <span className={styles.errorMessage}>{errors.due_date}</span> : null}
          </div>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Address *</label>
            <input
              type="text"
              placeholder="Enter Address"
              value={formData.address}
              disabled={isViewOnly}
              onChange={(e) => !isViewOnly && handleChange('address', capitalizeFirstCharacter(e.target.value))}
              required
            />
            {errors.address ? <span className={styles.errorMessage}>{errors.address}</span> : null}
          </div>
        </div>

        {/* Project Details Section */}
        <div className={styles.sectionTitle}>Project Details</div>
        <div className={styles.formGrid2}>
          <ContractorSearchDropdown
            styles={styles}
            isViewOnly={isViewOnly}
            generalContractorSearch={formData.general_contractor_search}
            isContractorSearchOpen={isContractorSearchOpen}
            setIsContractorSearchOpen={setIsContractorSearchOpen}
            onSearchChange={(val) => handleChange('general_contractor_search', val)}
            isLoadingContractors={isLoadingContractors}
            contractorEmployeeOptions={contractorEmployeeOptions}
            selectedGeneralContractors={formData.selected_general_contractors}
            selectedEmployees={formData.selected_employees}
            toggleContractor={toggleContractor}
            toggleEmployee={toggleEmployee}
            setShowAddNewGCModal={setShowAddNewGCModal}
          />

          <SelectedEmployeesPanel
            styles={styles}
            selectedGroups={selectedGroups}
            isViewOnly={isViewOnly}
            handleOpenAddEmployee={handleOpenAddEmployee}
            errors={errors}
          />

          <div className={styles.formGroup}>
            <label>DWG Date *</label>
            <input
              type="date"
              value={formData.dwg_date}
              min={isCreateMode ? minDwgDate : undefined}
              disabled={isViewOnly}
              onChange={(e) => !isViewOnly && handleChange('dwg_date', e.target.value)}
              required
            />
            {errors.dwg_date ? <span className={styles.errorMessage}>{errors.dwg_date}</span> : null}
          </div>
          <div className={styles.formGroup}>
            <label>DWG Description</label>
            <input
              type="text"
              placeholder="Enter DWG Description"
              value={formData.dwg_description}
              disabled={isViewOnly}
              onChange={(e) => !isViewOnly && handleChange('dwg_description', capitalizeFirstCharacter(e.target.value))}
            />
            {errors.dwg_description ? <span className={styles.errorMessage}>{errors.dwg_description}</span> : null}
          </div>
        </div>

        {/* Financials Section */}
        <div className={styles.sectionTitle}>Financials</div>
        <div className={styles.formGrid2}>

          <div className={`${styles.formGroup} ${styles.toggleFormGroup}`}>
            <label>DB Wage Rate</label>
            <div className={styles.toggleWrapper}>
              <span className={styles.toggleLabel}>{formData.db_wage_rate ? 'Yes' : 'No'}</span>
              <div
                className={`${styles.toggleSwitch} ${formData.db_wage_rate ? styles.toggleOn : ''}`}
                onClick={() => !isViewOnly && handleChange('db_wage_rate', !formData.db_wage_rate)}
              >
                <div className={styles.toggleThumb} />
              </div>
            </div>
          </div>

          {formData.db_wage_rate && (
            <>
              <div className={`${styles.formGroup} ${styles.toggleFormGroup}`}>
                <label>Tax Exempt</label>
                <div className={styles.toggleWrapper}>
                  <span className={styles.toggleLabel} style={{ color: '#98A2B3' }}>{formData.tax_exempt ? 'Yes' : 'No'}</span>
                  <div
                    className={`${styles.toggleSwitch} ${formData.tax_exempt ? styles.toggleOn : styles.toggleOff}`}
                    onClick={() => !isViewOnly && handleChange('tax_exempt', !formData.tax_exempt)}
                  >
                    <div className={styles.toggleThumb} />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Fringes Amount <span className={styles.currencyLabel}>(in USD)</span></label>
                <div className={styles.inputWithSymbol}>
                  <input
                    type="number"
                    placeholder="Enter Amount"
                    value={formData.fringes_amount}
                    disabled={isViewOnly}
                    onChange={(e) => !isViewOnly && handleChange('fringes_amount', e.target.value)}
                    min="0"
                  />
                  <span className={styles.symbol}>$</span>
                </div>
                {errors.fringes_amount ? <span className={styles.errorMessage}>{errors.fringes_amount}</span> : null}
              </div>

              <div className={styles.formGroup}>
                <label>Base Contract Amount <span className={styles.currencyLabel}>(in USD)</span></label>
                <div className={styles.inputWithSymbol}>
                  <input
                    type="number"
                    placeholder="Enter Amount"
                    value={formData.base_contract_amount}
                    disabled={isViewOnly}
                    onChange={(e) => !isViewOnly && handleChange('base_contract_amount', e.target.value)}
                    min="0"
                  />
                  <span className={styles.symbol}>$</span>
                </div>
                {errors.base_contract_amount ? <span className={styles.errorMessage}>{errors.base_contract_amount}</span> : null}
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          {isViewOnly && (
            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
          )}
          {isViewOnly && (
            <button
              type="button"
              className={styles.submitButton}
              onClick={() => {
                setSelectedShareOption((current) => current || uniqueShareOptions[0]?.id || '');
                setShowSharePopup(true);
              }}
            >
              Share
            </button>
          )}
          {!isViewOnly && (
            <button className={styles.submitButton} onClick={handleSubmit}>
              {initialData?.id ? 'Save' : 'Add'}
            </button>
          )}
        </div>
      </div>

      <SharePopup
        styles={styles}
        showSharePopup={showSharePopup}
        setShowSharePopup={setShowSharePopup}
        shareSearchTerm={shareSearchTerm}
        setShareSearchTerm={setShareSearchTerm}
        filteredShareOptions={filteredShareOptions}
        selectedShareOption={selectedShareOption}
        setSelectedShareOption={setSelectedShareOption}
      />

      <AddNewGCModal
        isOpen={showAddNewGCModal}
        onClose={() => setShowAddNewGCModal(false)}
        onSubmit={handleAddNewGCSubmit}
      />
      <AddEmployeeModal
        isOpen={showAddEmployeeModal}
        onClose={() => setShowAddEmployeeModal(false)}
        onSubmit={handleAddEmployeeModalSubmit}
        companyName={currentContractorForEmployee?.name || 'Selected Contractor'}
      />
    </Modal>
  );
}

export default CreateBidModal;