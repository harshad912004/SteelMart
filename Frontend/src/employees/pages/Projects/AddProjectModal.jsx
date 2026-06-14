import React, { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { createBid, getAllClients, getClientEmployees, createBidFolder } from '../../../common/services/api';
import { capitalizeFirstCharacter } from '../../utils/inputFormat';
import styles from './AddProjectModal.module.css';

const INITIAL_FORM = {
  project_name: '',
  general_contractor_id: '',
  address: '',
  tax_exempt: false,
  db_wage_rate: false,
  fringes_amount: '',
  base_amount: '',
  due_date: '',
};

const toBooleanFlag = (value) => (value ? 1 : 0);

const isNonNegativeNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return true;
  }

  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0;
};

const getClientsFromResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

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

const getEmployeesFromResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

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

const normalizeContractor = (contractor) => ({
  id: String(contractor?.id ?? contractor?.client_id ?? contractor?._id ?? ''),
  name: contractor?.company_name || contractor?.companyName || contractor?.name || '',
});

const pickDefaultEmployee = (employees = []) => {
  const normalizedEmployees = employees
    .map((employee) => ({
      id: employee?.id ?? employee?.client_employee_id ?? employee?.employee_id ?? employee?._id ?? null,
      is_admin: employee?.is_admin ?? employee?.isAdmin ?? 0,
    }))
    .filter((employee) => employee.id);

  return normalizedEmployees.find((employee) => Number(employee.is_admin) === 1) || normalizedEmployees[0] || null;
};

function AddProjectModal({ isOpen, onClose, onCreated, onNotify }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [contractors, setContractors] = useState([]);
  const [isLoadingContractors, setIsLoadingContractors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    setForm(INITIAL_FORM);
    setErrors({});

    const fetchContractors = async () => {
      setIsLoadingContractors(true);
      try {
        const response = await getAllClients(1, 100, '', 'General Contractors');
        const uniqueContractors = getClientsFromResponse(response).reduce((accumulator, contractor) => {
          const normalized = normalizeContractor(contractor);
          if (normalized.id && normalized.name && !accumulator.some((item) => item.id === normalized.id)) {
            accumulator.push(normalized);
          }
          return accumulator;
        }, []);

        setContractors(uniqueContractors);
      } catch (error) {
        setContractors([]);
        onNotify?.(error.message || 'Failed to load general contractors', false);
      } finally {
        setIsLoadingContractors(false);
      }
    };

    fetchContractors();
    return undefined;
  }, [isOpen, onNotify]);

  const handleChange = (field, value) => {
    setForm((current) => {
      if (field === 'db_wage_rate') {
        return {
          ...current,
          db_wage_rate: value,
          tax_exempt: value ? current.tax_exempt : false,
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });

    setErrors((current) => {
      if (field === 'db_wage_rate') {
        return {
          ...current,
          db_wage_rate: undefined,
          tax_exempt: undefined,
          fringes_amount: undefined,
          base_amount: undefined,
          submit: undefined,
        };
      }

      return {
        ...current,
        [field]: undefined,
        submit: undefined,
      };
    });
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!String(form.project_name || '').trim()) {
      nextErrors.project_name = 'Project name is required';
    }

    if (!String(form.general_contractor_id || '').trim()) {
      nextErrors.general_contractor_id = 'General contractor is required';
    }

    if (!String(form.address || '').trim()) {
      nextErrors.address = 'Address is required';
    }

    if (!String(form.due_date || '').trim()) {
      nextErrors.due_date = 'Due date is required';
    }

    if (form.db_wage_rate) {
      if (!String(form.fringes_amount || '').trim()) {
        nextErrors.fringes_amount = 'Fringes amount is required';
      } else if (!isNonNegativeNumber(form.fringes_amount)) {
        nextErrors.fringes_amount = 'Enter a valid fringes amount';
      }

      if (!String(form.base_amount || '').trim()) {
        nextErrors.base_amount = 'Base amount is required';
      } else if (!isNonNegativeNumber(form.base_amount)) {
        nextErrors.base_amount = 'Enter a valid base amount';
      }
    }

    return nextErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const selectedContractor = contractors.find((contractor) => contractor.id === form.general_contractor_id);
    if (!selectedContractor) {
      setErrors({ general_contractor_id: 'Select a valid general contractor' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const employeeResponse = await getClientEmployees(selectedContractor.id, 1, 100);
      const defaultEmployee = pickDefaultEmployee(getEmployeesFromResponse(employeeResponse));

      if (!defaultEmployee) {
        throw new Error('The selected general contractor has no active employee. Add an employee first.');
      }

      const baseAmount =
        form.db_wage_rate && form.base_amount !== '' ? Number(form.base_amount) : null;
      const fringesAmount =
        form.db_wage_rate && form.fringes_amount !== '' ? Number(form.fringes_amount) : null;

      const payload = {
        project_name: form.project_name.trim(),
        address: form.address.trim(),
        client_ids: [Number(selectedContractor.id)],
        client_employee_ids: [Number(defaultEmployee.id)],
        due_date: form.due_date,
        drawing_date: form.due_date,
        drawing_description: 'External Project',
        db_wage_rate: toBooleanFlag(form.db_wage_rate),
        tax_exempt: toBooleanFlag(form.db_wage_rate ? form.tax_exempt : false),
        fringes_amount: fringesAmount,
        base_amount: baseAmount,
        grand_total: baseAmount,
        status: 'approved',
      };

      const response = await createBid(payload);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to add project');
      }

      const newProjectId = response.id || response.data?.id;
      if (newProjectId) {
        try {
          await createBidFolder(newProjectId, { folder_name: 'Contract', parent_id: null });
          await createBidFolder(newProjectId, { folder_name: 'Markup Contract', parent_id: null });
        } catch (folderErr) {
          console.error('Failed to create default folders:', folderErr);
        }
      }

      onNotify?.(response?.message || 'Project added successfully', true);
      onCreated?.();
      onClose?.();
    } catch (error) {
      const message = error.message || 'Failed to add project';
      setErrors({ submit: message });
      onNotify?.(message, false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add External Project" width="620px">
      <div className={styles.form}>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="project-name">Project Name</label>
            <input
              id="project-name"
              type="text"
              placeholder="Enter Project Name"
              value={form.project_name}
              onChange={(event) => handleChange('project_name', capitalizeFirstCharacter(event.target.value))}
            />
            {errors.project_name ? <span className={styles.error}>{errors.project_name}</span> : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="general-contractor">General Contractor</label>
            <select
              id="general-contractor"
              value={form.general_contractor_id}
              onChange={(event) => handleChange('general_contractor_id', event.target.value)}
              disabled={isLoadingContractors}
            >
              <option value="">{isLoadingContractors ? 'Loading contractors...' : 'Select General Contractor'}</option>
              {contractors.map((contractor) => (
                <option key={contractor.id} value={contractor.id}>
                  {contractor.name}
                </option>
              ))}
            </select>
            {errors.general_contractor_id ? <span className={styles.error}>{errors.general_contractor_id}</span> : null}
          </div>

          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label htmlFor="project-address">Address</label>
            <input
              id="project-address"
              type="text"
              placeholder="Enter Address"
              value={form.address}
              onChange={(event) => handleChange('address', capitalizeFirstCharacter(event.target.value))}
            />
            {errors.address ? <span className={styles.error}>{errors.address}</span> : null}
          </div>

          <div className={styles.field}>
            <label>DB Wage Rate</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="db_wage_rate"
                  checked={form.db_wage_rate}
                  onChange={() => handleChange('db_wage_rate', true)}
                />
                <span>Yes</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="db_wage_rate"
                  checked={!form.db_wage_rate}
                  onChange={() => handleChange('db_wage_rate', false)}
                />
                <span>No</span>
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="active-since">Due Date</label>
            <input
              id="active-since"
              type="date"
              value={form.due_date}
              onChange={(event) => handleChange('due_date', event.target.value)}
            />
            {errors.due_date ? <span className={styles.error}>{errors.due_date}</span> : null}
          </div>

          {form.db_wage_rate ? (
            <>
              <div className={styles.field}>
                <label>Tax Exempt</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="tax_exempt"
                      checked={form.tax_exempt}
                      onChange={() => handleChange('tax_exempt', true)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="tax_exempt"
                      checked={!form.tax_exempt}
                      onChange={() => handleChange('tax_exempt', false)}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="fringes-amount">Fringes Amount</label>
                <input
                  id="fringes-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter Fringes Amount"
                  value={form.fringes_amount}
                  onChange={(event) => handleChange('fringes_amount', event.target.value)}
                />
                {errors.fringes_amount ? <span className={styles.error}>{errors.fringes_amount}</span> : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="base-amount">Base Amount</label>
                <input
                  id="base-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter Base Amount"
                  value={form.base_amount}
                  onChange={(event) => handleChange('base_amount', event.target.value)}
                />
                {errors.base_amount ? <span className={styles.error}>{errors.base_amount}</span> : null}
              </div>
            </>
          ) : null}
        </div>

        {errors.submit ? <div className={styles.submitError}>{errors.submit}</div> : null}

        <div className={styles.actions}>
          <button type="button" className={styles.submitButton} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Project'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default AddProjectModal;