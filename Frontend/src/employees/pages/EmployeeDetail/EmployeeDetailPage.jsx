import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EmployeeForm from '../../components/EmployeeForm/EmployeeForm';
import {
  ActiveStatusIcon,
  BlockIcon,
  DeleteIcon,
  EditIcon,
  InactiveStatusIcon,
  UnblockIcon,
} from '../../components/Icons';
import Modal from '../../components/Modal';
import { Toast } from '../../components/Toast';
import useEmployeeActions from '../../hooks/useEmployeeActions';
import useToastState from '../../hooks/useToastState';
import { getEmployee, updateEmployee } from '../../../common/services/api';
import { formatShortDate } from '../../utils/dateFormat';
import {
  buildEmployeePayload,
  EMPTY_EDIT_EMPLOYEE_FORM,
  mapEmployeeToForm,
  validateEmployeeForm,
} from '../../utils/employeeFormPayload';
import {
  formatEmployeeJoinedDate,
  formatEmployeeLastLogin,
  getEmployeeStatus,
} from '../../utils/employeeStatusDate';
import { getRoleLabel } from '../../constants/roles';
import styles from './EmployeeDetailPage.module.css';

const appendAgo = (value) => (
  value === '-' || value === 'Just now' ? value : `${value} ago`
);

const mapEmployee = (employee) => {
  const name = employee.employee_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();

  return {
    id: employee.id,
    name,
    role: getRoleLabel(employee.role),
    firstName: employee.first_name || '',
    lastName: employee.last_name || '',
    phone: employee.phone || '-',
    email: employee.email || '-',
    address: employee.address || '-',
    dateOfBirth: employee.date_of_birth ? String(employee.date_of_birth).slice(0, 10) : '',
    gender: employee.gender || 'male',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || employee.email || employee.id)}`,
    lastLogin: appendAgo(formatEmployeeLastLogin(employee.last_login)),
    employeeSince: formatShortDate(employee.joined_date),
    joinedDate: employee.joined_date ? formatEmployeeJoinedDate(employee.joined_date) : '-',
    updatedAt: appendAgo(formatEmployeeLastLogin(employee.updated_at)),
    status: getEmployeeStatus(employee),
  };
};

function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_EDIT_EMPLOYEE_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast, showToast, closeToast } = useToastState();
  const {
    activateEmployeeAccount,
    deactivateEmployeeAccount,
    blockEmployeeAccount,
    unblockEmployeeAccount,
    removeEmployee,
  } = useEmployeeActions({ showToast });

  const fetchEmployee = async () => {
    setIsLoading(true);

    try {
      const data = await getEmployee(id);
      const mappedEmployee = mapEmployee(data.employee);
      setEmployee(mappedEmployee);
      setFormData(mapEmployeeToForm(mappedEmployee));
    } catch (error) {
      showToast(error.message || 'Failed to fetch employee details', false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const handleFormChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!employee) {
      return;
    }

    const validationMessage = validateEmployeeForm(formData);
    if (validationMessage) {
      showToast(validationMessage, false);
      return;
    }

    setIsUpdating(true);

    try {
      const data = await updateEmployee(employee.id, buildEmployeePayload(formData));
      showToast(data.message || 'Employee updated successfully', true);
      setShowEditModal(false);
      await fetchEmployee();
    } catch (error) {
      showToast(error.message || 'Failed to update employee', false);
    } finally {
      setIsUpdating(false);
    }
  };

  const navigateBackToDirectory = () => {
    setTimeout(() => {
      navigate('/dashboard/employee');
    }, 300);
  };

  return (
    <>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        isSuccess={toast.isSuccess}
        onClose={closeToast}
        duration={3000}
      />

      <div className={styles.pageWrapper}>
        <div className={styles.topHeader}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbLink} onClick={() => navigate('/dashboard/employee')}>Employees</span>
            <span>&gt;</span>
            <span>{employee?.name || 'Employee Details'}</span>
          </div>
        </div>

        <div className={styles.container}>
          {isLoading ? <div className={styles.infoSection}>Loading employee details...</div> : null}
          {!isLoading && !employee ? <div className={styles.infoSection}>Employee not found.</div> : null}
          {!isLoading && employee ? (
            <>
              <div className={styles.topSection}>
                <div className={styles.profileCard}>
                  <div className={styles.profileHeader}>
                    <div className={`${styles.profileAvatar} ${employee.status === 'Blocked' ? styles.blockedProfileAvatar : ''}`}>
                      <img src={employee.avatar} alt={employee.name} className={styles.profileImage} />
                    </div>
                    <div>
                      <h1>{employee.name}</h1>
                      <p>{employee.role}</p>
                    </div>
                  </div>
                  <div className={styles.profileActions}>
                    {employee.status === 'Blocked' ? (
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.iconDanger}`}
                        title="Unblock"
                        onClick={() => unblockEmployeeAccount(employee, navigateBackToDirectory)}
                      >
                        <UnblockIcon size={24} />
                      </button>
                    ) : null}

                    {employee.status === 'Inactive' ? (
                      <button
                        type="button"
                        className={styles.iconButton}
                        title="Activate"
                        onClick={() => activateEmployeeAccount(employee, navigateBackToDirectory)}
                      >
                        <ActiveStatusIcon />
                      </button>
                    ) : null}

                    {employee.status === 'Active' ? (
                      <button
                        type="button"
                        className={styles.iconButton}
                        title="Inactive"
                        onClick={() => deactivateEmployeeAccount(employee, navigateBackToDirectory)}
                      >
                        <InactiveStatusIcon />
                      </button>
                    ) : null}

                    {employee.status === 'Active' || employee.status === 'Inactive' ? (
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.iconDanger}`}
                        title="Block"
                        onClick={() => blockEmployeeAccount(employee, navigateBackToDirectory)}
                      >
                        <BlockIcon size={24} />
                      </button>
                    ) : null}

                    {employee.status !== 'Deleted' ? (
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.iconDanger}`}
                        title="Delete"
                        onClick={() => removeEmployee(employee, navigateBackToDirectory)}
                      >
                        <DeleteIcon size={24} />
                      </button>
                    ) : null}

                    <button type="button" className={styles.editButton} onClick={() => setShowEditModal(true)}>
                      <EditIcon />
                      Edit Details
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.infoSection}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>Phone Number</label>
                    <span>{employee.phone}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Email</label>
                    <span>{employee.email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Address</label>
                    <span>{employee.address}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Gender</label>
                    <span>{employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1)}</span>
                  </div>
                  {/* <div className={styles.infoItem}>
                    <label>Date of Birth</label>
                    <span>{formatShortDate(employee.dateOfBirth)}</span>
                  </div> */}
                </div>
              </div>

              <div className={styles.detailsSection}>
                <h2 className={styles.sectionTitle}>{employee.firstName}&apos;s Details</h2>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailsItem}>
                    <label>Last Login</label>
                    <span>{employee.lastLogin}</span>
                  </div>
                  <div className={styles.detailsItem}>
                    <label>Employee Since</label>
                    <span>{employee.employeeSince}</span>
                  </div>
                  <div className={styles.detailsItem}>
                    <label>Joining Date</label>
                    <span>{employee.joinedDate}</span>
                  </div>
                  <div className={styles.detailsItem}>
                    <label>Last Updated</label>
                    <span>{employee.updatedAt}</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Update Employee Details"
          >
            <EmployeeForm
              styles={styles}
              value={formData}
              onChange={handleFormChange}
            />

            <button type="button" className={styles.updateButton} onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update'}
            </button>
          </Modal>
        </div>
      </div>
    </>
  );
}

export default EmployeeDetailPage;