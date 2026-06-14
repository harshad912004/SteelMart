import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActionMenu from '../../components/ActionMenu/ActionMenu';
import DirectoryToolbar from '../../components/DirectoryToolbar/DirectoryToolbar';
import EmployeeForm from '../../components/EmployeeForm/EmployeeForm';
import EmployeeTable from '../../components/EmployeeTable';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination/Pagination';
import Navbar from '../../components/EmployeeTopNav';
import { Toast } from '../../components/Toast';
import {
  ActiveStatusIcon,
  BlockIcon,
  DeleteIcon,
  EditIcon,
  InactiveStatusIcon,
  UnblockIcon,
  ViewIcon,
} from '../../components/Icons';
import useEmployeeActions from '../../hooks/useEmployeeActions';
import usePagedDirectory from '../../hooks/usePagedDirectory';
import useToastState from '../../hooks/useToastState';
import { ROLE_OPTIONS } from '../../constants/roles';
import { getEmployees, addEmployee, updateEmployee } from '../../../common/services/api';
import {
  buildEmployeePayload,
  EMPTY_ADD_EMPLOYEE_FORM,
  EMPTY_EDIT_EMPLOYEE_FORM,
  mapEmployeeToForm,
  validateEmployeeForm,
} from '../../utils/employeeFormPayload';
import { getRoleLabel } from '../../constants/roles';
import { formatEmployeeJoinedDate, formatEmployeeLastLogin } from '../../utils/employeeStatusDate';
import styles from './EmployeesPage.module.css';

const actionsByStatus = {
  Active: ['View', 'Edit', 'Inactive', 'Block', 'Delete'],
  InActive: ['View', 'Edit', 'Active', 'Block', 'Delete'],
  Blocked: ['View', 'Edit', 'Unblock', 'Delete'],
  Deleted: ['View', 'Edit', 'Active'],
};

const formatEmployeeForTable = (employee) => {
  const name = employee.employee_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
  const lastLogin = formatEmployeeLastLogin(employee.last_login);

  return {
    id: employee.id,
    firstName: employee.first_name || '',
    lastName: employee.last_name || '',
    name,
    email: employee.email,
    phone: employee.phone || '-',
    address: employee.address || '',
    dateOfBirth: employee.date_of_birth ? String(employee.date_of_birth).slice(0, 10) : '',
    gender: employee.gender || '-',
    roleId: employee.role_id,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || employee.email || employee.id)}`,
    role: getRoleLabel(employee.role),
    status: employee.status || employee.employee_status || employee.account_status || '',
    openBids: employee.open_bids || '00',
    lastLogin: lastLogin === '-' || lastLogin === 'Just now' ? lastLogin : `${lastLogin} ago`,
    hourlyRate: employee.hourly_rate || '',
    joinedDate: employee.joined_date ? formatEmployeeJoinedDate(employee.joined_date) : '-',
  };
};

function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState(EMPTY_EDIT_EMPLOYEE_FORM);
  const [addFormData, setAddFormData] = useState(EMPTY_ADD_EMPLOYEE_FORM);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false);
  const { toast, showToast, closeToast } = useToastState();
  const {
    currentPage,
    setCurrentPage,
    pagination,
    setPagination,
    handlePageChange,
    pageNumbers,
    firstItemNumber,
    lastItemNumber,
  } = usePagedDirectory({ initialPerPage: 5 });
  const {
    activateEmployeeAccount,
    deactivateEmployeeAccount,
    blockEmployeeAccount,
    unblockEmployeeAccount,
    removeEmployee,
  } = useEmployeeActions({ showToast });

  const fetchEmployees = useCallback(async (page = currentPage, role = selectedRole, search = searchTerm, status = selectedStatus) => {
    setIsLoadingEmployees(true);

    try {
      const data = await getEmployees(page, role, search, status);
      setEmployees((data.employees || []).map(formatEmployeeForTable));
      setPagination(data.pagination, page);
    } catch (error) {
      setEmployees([]);
      setPagination(null, page);
      showToast(error.message || 'Failed to fetch employees', false);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [currentPage, searchTerm, selectedRole, selectedStatus, setPagination, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees(currentPage, selectedRole, searchTerm, selectedStatus);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPage, selectedRole, searchTerm, selectedStatus, fetchEmployees]);

  const handleEmployeeClick = (employee) => {
    navigate(`/dashboard/employee/${employee.id}`);
  };

  const handleActionClick = (employee, rect) => {
    if (showActionMenu === employee.id) {
      setShowActionMenu(null);
      return;
    }

    setShowActionMenu(employee.id);
    setSelectedEmployee(employee);

    if (rect) {
      setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left - 100 });
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleAddFormChange = (field, value) => {
    setAddFormData((current) => ({ ...current, [field]: value }));
  };

  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setFormData(mapEmployeeToForm(employee));
    setShowEditModal(true);
    setShowActionMenu(null);
  };

  const refreshEmployeesAfterMutation = useCallback(async () => {
    setShowActionMenu(null);
    const nextPage = employees.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
    setCurrentPage(nextPage);
    await fetchEmployees(nextPage, selectedRole, searchTerm, selectedStatus);
  }, [currentPage, employees.length, fetchEmployees, searchTerm, selectedRole, selectedStatus, setCurrentPage]);

  const handleUpdateClick = async () => {
    if (!selectedEmployee) {
      return;
    }

    const validationMessage = validateEmployeeForm(formData);
    if (validationMessage) {
      showToast(validationMessage, false);
      return;
    }

    setIsUpdatingEmployee(true);

    try {
      const data = await updateEmployee(selectedEmployee.id, buildEmployeePayload(formData));
      showToast(data.message || 'Employee updated successfully', true);
      setShowEditModal(false);
      await fetchEmployees(currentPage, selectedRole, searchTerm, selectedStatus);
    } catch (error) {
      showToast(error.message || 'Failed to update employee', false);
    } finally {
      setIsUpdatingEmployee(false);
    }
  };

  const handleAddEmployeeSubmit = async () => {
    const validationMessage = validateEmployeeForm(addFormData);
    if (validationMessage) {
      showToast(validationMessage, false);
      return;
    }

    setIsAddingEmployee(true);

    try {
      const data = await addEmployee(buildEmployeePayload(addFormData));
      showToast(data.message || 'Employee added successfully', true);
      setShowAddModal(false);
      setAddFormData(EMPTY_ADD_EMPLOYEE_FORM);
      setCurrentPage(1);
      await fetchEmployees(1, selectedRole, searchTerm, selectedStatus);
    } catch (error) {
      showToast(error.message || 'Failed to add employee', false);
    } finally {
      setIsAddingEmployee(false);
    }
  };

  const actionIcons = {
    View: <ViewIcon />,
    Edit: <EditIcon />,
    Inactive: <InactiveStatusIcon size={20} />,
    Active: <ActiveStatusIcon />,
    Block: <BlockIcon />,
    Unblock: <UnblockIcon />,
    Delete: <DeleteIcon />,
  };

  const actionHandlers = {
    View: () => {
      handleEmployeeClick(selectedEmployee);
      setShowActionMenu(null);
    },
    Edit: () => handleEditClick(selectedEmployee),
    Inactive: () => deactivateEmployeeAccount(selectedEmployee, refreshEmployeesAfterMutation),
    Active: () => activateEmployeeAccount(selectedEmployee, refreshEmployeesAfterMutation),
    Block: () => blockEmployeeAccount(selectedEmployee, refreshEmployeesAfterMutation),
    Unblock: () => unblockEmployeeAccount(selectedEmployee, refreshEmployeesAfterMutation),
    Delete: () => removeEmployee(selectedEmployee, refreshEmployeesAfterMutation),
  };

  const activeActionStatus = selectedEmployee?.status || selectedStatus;
  const actionMenuItems = (actionsByStatus[activeActionStatus] || actionsByStatus.Active).map((action) => ({
    label: action,
    icon: actionIcons[action],
    isDanger: action === 'Delete',
    onClick: actionHandlers[action],
  }));

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
        <Navbar activeTab={selectedStatus} onTabChange={(status) => {
          setSelectedStatus(status);
          setCurrentPage(1);
        }}
        />

        <div className={styles.container} onClick={() => setShowActionMenu(null)}>
          <DirectoryToolbar
            styles={styles}
            filterValue={selectedRole}
            filterOptions={ROLE_OPTIONS}
            filterPlaceholder="Filter by: Role"
            searchValue={searchTerm}
            searchPlaceholder="Search Employees"
            addButtonLabel="Add Employee"
            onFilterChange={(value) => {
              setSelectedRole(value);
              setCurrentPage(1);
            }}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            onAdd={() => setShowAddModal(true)}
            onClear={() => {
              setSearchTerm('');
              setSelectedRole('');
              setCurrentPage(1);
            }}
            showClear={Boolean(selectedRole || searchTerm)}
          />

          <EmployeeTable
            employees={employees}
            onEmployeeClick={handleEmployeeClick}
            onActionClick={handleActionClick}
            isLoading={isLoadingEmployees}
            isBlockedView={selectedStatus === 'Blocked'}
          />

          {showActionMenu ? (
            <ActionMenu styles={styles} position={menuPosition} actions={actionMenuItems} />
          ) : null}

          <Pagination
            styles={styles}
            currentPage={currentPage}
            totalPages={pagination.totalPages || 1}
            totalRecords={pagination.totalRecords}
            firstItemNumber={firstItemNumber}
            lastItemNumber={lastItemNumber}
            pageNumbers={pageNumbers}
            isLoading={isLoadingEmployees}
            onPageChange={handlePageChange}
          />

          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Update Employee Details"
          >
            <EmployeeForm
              styles={styles}
              value={formData}
              onChange={handleFormChange}
              roles={ROLE_OPTIONS}
            />

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.updateButton}
                onClick={handleUpdateClick}
                disabled={isUpdatingEmployee}
              >
                {isUpdatingEmployee ? 'Updating...' : 'Update'}
              </button>
            </div>
          </Modal>

          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add Employee"
          >
            <EmployeeForm
              styles={styles}
              value={addFormData}
              onChange={handleAddFormChange}
              roles={ROLE_OPTIONS}
            />

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: '#F5F5F5',
                  color: '#000',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginRight: '12px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEmployeeSubmit}
                className={styles.updateButton}
                disabled={isAddingEmployee}
              >
                {isAddingEmployee ? 'Adding...' : 'Add Employee'}
              </button>
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
}

export default EmployeesPage;