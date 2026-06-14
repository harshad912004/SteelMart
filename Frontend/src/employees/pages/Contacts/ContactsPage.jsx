import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ContactCompanyForm from '../../components/ContactCompanyForm';
import {
  addClientEmployee,
  blockClient,
  createClient,
  deleteClient,
  getAllClients,
  getBids,
  getClientEmployeeAdmins,
  getClientEmployees,
  getClientTypes,
  getEmployeeTags,
  updateClient,
} from '../../../common/services/api';
import styles from './ContactsPage.module.css';
import Modal from '../../components/Modal';
import ContactEmployeeForm from '../../components/ContactEmployeeForm';
import { Toast } from '../../components/Toast';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useToastState from '../../hooks/useToastState';
import {
  ClearIcon,
  SearchIcon,
  PersonIcon as AvatarIcon,
  PhoneIcon,
  EditIcon,
  BlockIcon,
  DeleteIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LocationPinIcon,
} from '../../components/Icons';
import {
  validateClientEmployeeRows,
  validateCompanyForm,
} from '../../utils/validation';
import { formatTimeOpen } from '../../utils/dateFormat';
import { getStatusDisplayLabel } from '../../utils/bidHelpers';
import { formatClientTypeLabel, formatEmployeeTag } from '../../utils/clientType';
import { getRoleLabel } from '../../constants/roles';
import MasterDetailLayout from '../../components/MasterDetail/MasterDetailLayout';
import SearchInput from '../../components/SearchInput/SearchInput';

const DETAIL_TABS = ['Employee Details', 'Bids with', 'Projects with'];
const CONTACT_TYPE_TABS = ['All', 'General Contractors', 'Vendors'];
const EMPLOYEES_PER_PAGE = 3;
const CLIENT_EMPLOYEES_FETCH_LIMIT = 1000;
const CONTACT_BIDS_FETCH_LIMIT = 1000;
const EMPLOYEE_DESIGNATIONS = ['admin', 'team lead', 'project lead', 'legal team', 'employee'];

const EMPTY_CONTACT_FORM = {
  companyName: '',
  companyWebsite: '',
  officeNumber: '',
  address: '',
  clientTypeId: '',
  description: '',
  vendorTags: [],
};

const createEmptyEmployeeRow = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  designation: '',
  tag: '',
  isPrimaryContact: false,
});

const normalizeTypeId = (value) => (
  value === undefined || value === null || value === '' ? '' : String(value)
);

const extractEmployees = (response) => {
  const payload = response?.employees ?? response?.data?.employees ?? response?.data?.data ?? response?.data;
  return Array.isArray(payload) ? payload : [];
};

const extractAdmins = (response) => {
  const payload = response?.admins ?? response?.data?.admins ?? response?.data?.data ?? response?.data;
  return Array.isArray(payload) ? payload : [];
};

const extractClients = (response) => {
  const payload =
    response?.contacts ??
    response?.clients ??
    response?.companies ??
    response?.data?.contacts ??
    response?.data?.clients ??
    response?.data?.companies ??
    response?.data?.data ??
    response?.data;

  return Array.isArray(payload) ? payload : [];
};

const formatContact = (contact) => ({
  id: contact.id || contact._id || contact.client_id || contact.clientId,
  companyName: contact.company_name || contact.companyName || contact.name || '',
  companyWebsite: contact.website || contact.companyWebsite || '',
  officeNumber: contact.office_number || contact.officeNumber || contact.phone || '-',
  address: contact.address || contact.office_address || contact.officeAddress || contact.company_address || contact.companyAddress || '-',
  clientTypeId: normalizeTypeId(contact.client_type_id || contact.clientTypeId),
  description: contact.description || '',
  clientTypeName: formatClientTypeLabel(contact.client_type || contact.clientType || ''),
  employeeCount: contact.employee_count || contact.employees_count || contact.employeeCount || contact.employeesCount || 0,
});

const buildContactPayload = (form) => ({
  company_name: form.companyName.trim(),
  website: form.companyWebsite.trim(),
  office_number: form.officeNumber.trim() || null,
  address: form.address?.trim() || null,
  client_type_id: form.clientTypeId || null,
  description: form.description?.trim() || null,
});

const extractClientId = (response) => (
  response?.client?.id ??
  response?.company?.id ??
  response?.data?.client?.id ??
  response?.data?.company?.id ??
  response?.data?.data?.id ??
  response?.data?.id ??
  response?.id ??
  null
);

const getContactFormFromContact = (contact) => ({
  companyName: contact?.companyName || '',
  companyWebsite: contact?.companyWebsite || '',
  officeNumber: contact?.officeNumber === '-' ? '' : (contact?.officeNumber || ''),
  address: contact?.address === '-' ? '' : (contact?.address || ''),
  clientTypeId: contact?.clientTypeId || '',
  description: contact?.description || '',
});

const getCount = (counts, keys) => keys.reduce((total, key) => total + Number(counts?.[key] || 0), 0);

const normalizeClientTypeLabel = (value) => String(value || '').trim().toLowerCase();

const getDefaultClientTypeIdForTab = (activeTab, clientTypes) => {
  const normalizedTab = normalizeClientTypeLabel(activeTab);

  if (normalizedTab === 'general contractors') {
    const matchedType = clientTypes.find((type) => {
      const normalizedType = normalizeClientTypeLabel(type.type_name).replace(/\s+/g, '');
      return normalizedType === 'generalcontractor';
    });
    return matchedType ? String(matchedType.id) : '';
  }

  if (normalizedTab === 'vendors') {
    const matchedType = clientTypes.find((type) => normalizeClientTypeLabel(type.type_name) === 'vendor');
    return matchedType ? String(matchedType.id) : '';
  }

  return '';
};

const getBidStatsFromResponse = (data, bids) => {
  const counts = data?.data?.statusCounts || data?.statusCounts || {};
  const pagination = data?.pagination || data?.data?.pagination || {};
  const total = Number(pagination.totalRecords ?? counts.all ?? bids.length) || 0;
  const won = getCount(counts, ['won', 'approved']);
  const lost = getCount(counts, ['lost', 'cancelled', 'canceled']);
  const pending = getCount(counts, ['bidinprogress', 'sentToClient', 'pending', 'open']);

  return {
    total,
    lost,
    won,
    open: pending,
  };
};


function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState('All');
  const [selectedContact, setSelectedContact] = useState(null);
  const [clientTypes, setClientTypes] = useState([]);
  const [employeeTags, setEmployeeTags] = useState([]);
  const [isAddingNewCompany, setIsAddingNewCompany] = useState(false);
  const [contactBids, setContactBids] = useState([]);
  const [bidStats, setBidStats] = useState({ total: 0, lost: 0, won: 0, open: 0 });
  const [isLoadingContactBids, setIsLoadingContactBids] = useState(false);

  const [detailTab, setDetailTab] = useState('Employee Details');
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [bidSearch, setBidSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const debouncedProjectSearch = useDebouncedValue(projectSearch);
  const [employeePage, setEmployeePage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_CONTACT_FORM);
  const [editForm, setEditForm] = useState(EMPTY_CONTACT_FORM);
  const [employeeCompanyForm, setEmployeeCompanyForm] = useState(EMPTY_CONTACT_FORM);
  const [employeeRows, setEmployeeRows] = useState([createEmptyEmployeeRow()]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingEmployees, setIsAddingEmployees] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { toast, setToast, closeToast } = useToastState();
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const debouncedEmployeeSearch = useDebouncedValue(empSearch);
  const debouncedBidSearch = useDebouncedValue(bidSearch);

  const resetEmployeeTable = useCallback(() => {
    setEmployees([]);
    setEmployeePage(1);
  }, []);

  const handleSelectContact = useCallback((contact) => {
    if (String(selectedContact?.id) === String(contact.id)) {
      return;
    }

    setSelectedContact(contact);
    setDetailTab('Employee Details');
    setEmpSearch('');
    setBidSearch('');
    setProjectSearch('');
    setIsLoadingEmployees(true);
    resetEmployeeTable();
  }, [resetEmployeeTable, selectedContact?.id]);

  const fetchContacts = useCallback(async (search = '', type = '') => {
    setIsLoadingContacts(true);
    try {
      const data = await getAllClients(1, 100, search, type);
      const list = extractClients(data);
      const formattedContacts = list.map(formatContact);
      setContacts(formattedContacts);
      setSelectedContact((prev) => {
        const refreshedContact = prev ? formattedContacts.find((contact) => contact.id === prev.id) : null;
        return refreshedContact || null;
      });
      return formattedContacts;
    } catch (err) {
      setToast({ isOpen: true, message: err.message || 'Failed to load contacts', isSuccess: false });
      return [];
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  const fetchClientTypeOptions = useCallback(async () => {
    try {
      const data = await getClientTypes();
      const list = data.data || data.types || [];
      setClientTypes(Array.isArray(list) ? list : []);
    } catch {
      setClientTypes([]);
    }
  }, []);

  const fetchEmployeeTagsOptions = useCallback(async () => {
    try {
      const data = await getEmployeeTags();
      const list = data.data?.tags || data.tags || [];
      setEmployeeTags(Array.isArray(list) ? list : []);
    } catch {
      setEmployeeTags([]);
    }
  }, []);

  useEffect(() => {
    fetchClientTypeOptions();
    fetchEmployeeTagsOptions();
  }, [fetchClientTypeOptions, fetchEmployeeTagsOptions]);

  useEffect(() => {
    fetchContacts(debouncedSearchTerm, activeTypeTab === 'All' ? '' : activeTypeTab);
  }, [activeTypeTab, debouncedSearchTerm, fetchContacts]);

  const fetchEmployees = useCallback(async (contactId, search = '') => {
    setIsLoadingEmployees(true);
    setEmployees([]);
    try {
      const data = await getClientEmployees(contactId, 1, CLIENT_EMPLOYEES_FETCH_LIMIT, search);
      const employeeList = extractEmployees(data);
      const mappedEmployees = employeeList.map((emp) => ({
        ...emp,
        designation: getRoleLabel(emp.designation || emp.role) || '',
      }));
      setEmployees(mappedEmployees);
    } catch {
      setEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedContact || detailTab !== 'Employee Details') {
      return;
    }

    fetchEmployees(selectedContact.id, debouncedEmployeeSearch);
  }, [debouncedEmployeeSearch, detailTab, fetchEmployees, selectedContact]);

  const fetchContactBids = useCallback(async (clientId, search = '') => {
    if (!clientId) {
      setContactBids([]);
      setBidStats({ total: 0, lost: 0, won: 0, open: 0 });
      return;
    }

    setIsLoadingContactBids(true);
    try {
      const data = await getBids(1, '', search, '', String(clientId), '', CONTACT_BIDS_FETCH_LIMIT);
      const responseBids = data?.data?.bids || data?.bids || data?.data || [];
      const bidList = Array.isArray(responseBids) ? responseBids : [];

      setContactBids(bidList);
      setBidStats(getBidStatsFromResponse(data, bidList));
    } catch (err) {
      setContactBids([]);
      setBidStats({ total: 0, lost: 0, won: 0, open: 0 });
    } finally {
      setIsLoadingContactBids(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedContact || (detailTab !== 'Bids with' && detailTab !== 'Projects with')) {
      return;
    }

    const searchTerm = detailTab === 'Projects with' ? debouncedProjectSearch : debouncedBidSearch;
    fetchContactBids(selectedContact.id, searchTerm);
  }, [debouncedBidSearch, debouncedProjectSearch, detailTab, fetchContactBids, selectedContact]);

  const getClientTypeNameById = useCallback((typeId, fallback = '') => {
    if (!typeId) return fallback;
    const matchedType = clientTypes.find((item) => String(item.id) === String(typeId));
    return formatClientTypeLabel(matchedType?.type_name || fallback);
  }, [clientTypes]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const preventSearchSubmit = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    if (!empSearch.trim()) return true;

    const query = empSearch.trim().toLowerCase();
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim().toLowerCase();

    return (
      fullName.includes(query) ||
      (employee.first_name || '').toLowerCase().includes(query) ||
      (employee.last_name || '').toLowerCase().includes(query) ||
      (employee.email || '').toLowerCase().includes(query) ||
      String(employee.phone || employee.phone_number || '').toLowerCase().includes(query) ||
      String(getRoleLabel(employee.designation || employee.role) || '').toLowerCase().includes(query)
    );
  }), [empSearch, employees]);

  const totalEmployeePages = Math.max(1, Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE));
  const currentEmployeePage = Math.min(employeePage, totalEmployeePages);
  const paginatedEmployees = useMemo(() => filteredEmployees.slice(
    (currentEmployeePage - 1) * EMPLOYEES_PER_PAGE,
    currentEmployeePage * EMPLOYEES_PER_PAGE
  ), [currentEmployeePage, filteredEmployees]);

  const projectTotals = useMemo(() => {
    const totalValue = contactBids.reduce((sum, bid) => sum + Number(bid.grand_total ?? bid.bid_value ?? 0), 0);
    const activeStatuses = ['bidinprogress', 'senttoclient'];
    const completedStatuses = ['won', 'approved'];

    const normalizedStatus = (status) => String(status || '').toLowerCase().replace(/\s|-/g, '');
    const activeCount = contactBids.filter((bid) => activeStatuses.includes(normalizedStatus(bid.status))).length;
    const completedCount = contactBids.filter((bid) => completedStatuses.includes(normalizedStatus(bid.status))).length;

    return {
      totalValue,
      activeCount,
      completedCount,
    };
  }, [contactBids]);

  useEffect(() => {
    if (employeePage > totalEmployeePages) {
      setEmployeePage(totalEmployeePages);
    }
  }, [employeePage, totalEmployeePages]);

  const handleEmpSearchChange = (value) => {
    setEmpSearch(value);
    setEmployeePage(1);
  };

  const handleEmployeePageChange = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalEmployeePages);
    setEmployeePage(nextPage);
  };

  const employeeRangeStart = filteredEmployees.length === 0
    ? 0
    : (currentEmployeePage - 1) * EMPLOYEES_PER_PAGE + 1;
  const employeeRangeEnd = Math.min(
    currentEmployeePage * EMPLOYEES_PER_PAGE,
    filteredEmployees.length
  );

  const closeAddContactModal = () => {
    setShowAddModal(false);
    setAddForm(EMPTY_CONTACT_FORM);
  };

  const closeAddEmployeeModal = () => {
    setShowAddEmployeeModal(false);
    setEmployeeCompanyForm(EMPTY_CONTACT_FORM);
    setEmployeeRows([createEmptyEmployeeRow()]);
  };

  const handleOpenEmployeeModal = () => {
    const defaultClientTypeId = getDefaultClientTypeIdForTab(activeTypeTab, clientTypes);
    setIsAddingNewCompany(true);
    setEmployeeCompanyForm({
      ...EMPTY_CONTACT_FORM,
      clientTypeId: defaultClientTypeId,
    });
    setEmployeeRows([createEmptyEmployeeRow()]);
    setShowAddEmployeeModal(true);
  };

  const handleOpenAddEmployeeModal = () => {
    if (!selectedContact) return;
    setIsAddingNewCompany(false);
    setEmployeeCompanyForm(getContactFormFromContact(selectedContact));
    setEmployeeRows([createEmptyEmployeeRow()]);
    setShowAddEmployeeModal(true);
  };

  const handleAdd = async () => {
    const validationMessage = validateCompanyForm(addForm);
    if (validationMessage) {
      setToast({ isOpen: true, message: validationMessage, isSuccess: false });
      return;
    }

    setIsAdding(true);
    try {
      const data = await createClient(buildContactPayload(addForm));
      setToast({ isOpen: true, message: data.message || 'Contact added', isSuccess: true });
      closeAddContactModal();
      await fetchContacts();
    } catch (err) {
      setToast({ isOpen: true, message: err.message || 'Failed to add contact', isSuccess: false });
    } finally {
      setIsAdding(false);
    }
  };

  const openEditModal = () => {
    if (!selectedContact) return;
    setEditForm(getContactFormFromContact(selectedContact));
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedContact) return;

    const validationMessage = validateCompanyForm(editForm);
    if (validationMessage) {
      setToast({ isOpen: true, message: validationMessage, isSuccess: false });
      return;
    }

    setIsUpdating(true);
    try {
      const data = await updateClient(selectedContact.id, buildContactPayload(editForm));
      setToast({ isOpen: true, message: data.message || 'Contact updated', isSuccess: true });
      setShowEditModal(false);
      await fetchContacts();
      setSelectedContact((prev) => (
        prev ? {
          ...prev,
          ...formatContact({
            id: prev.id,
            company_name: editForm.companyName.trim(),
            website: editForm.companyWebsite.trim(),
            office_number: editForm.officeNumber.trim() || '-',
            address: editForm.address?.trim() || '-',
            client_type_id: editForm.clientTypeId,
            description: editForm.description?.trim() || '',
            client_type: getClientTypeNameById(editForm.clientTypeId, prev.clientTypeName),
            employee_count: prev.employeeCount,
          }),
        } : prev
      ));
    } catch (err) {
      setToast({ isOpen: true, message: err.message || 'Failed to update contact', isSuccess: false });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedContact) return;

    try {
      await deleteClient(selectedContact.id);
      setToast({ isOpen: true, message: 'Contact deleted', isSuccess: true });
      setSelectedContact(null);
      await fetchContacts();
    } catch (err) {
      setToast({ isOpen: true, message: err.message || 'Failed to delete', isSuccess: false });
    }
  };

  const handleBlock = async () => {
    if (!selectedContact) return;

    try {
      await blockClient(selectedContact.id);
      setToast({ isOpen: true, message: 'Contact blocked', isSuccess: true });
      setSelectedContact(null);
      await fetchContacts();
    } catch (err) {
      setToast({ isOpen: true, message: err.message || 'Failed to block', isSuccess: false });
    }
  };

  const handleEmployeeCompanyChange = (field, value) => {
    setEmployeeCompanyForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmployeeRowChange = (index, field, value) => {
    setEmployeeRows((prev) => prev.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    )));
  };

  const handlePrimaryEmployeeSelect = async (index) => {
    const nextRow = employeeRows[index];
    const isSelectingPrimary = nextRow && !nextRow.isPrimaryContact;

    if (isSelectingPrimary && selectedContact?.id) {
      try {
        const data = await getClientEmployeeAdmins(selectedContact.id);
        const admins = extractAdmins(data);

        if (admins.length > 0) {
          setToast({
            isOpen: true,
            message: 'This company already has a contact person.',
            isSuccess: false,
          });
          return;
        }
      } catch (err) {
        setToast({
          isOpen: true,
          message: err.message || 'Unable to check existing contact person',
          isSuccess: false,
        });
        return;
      }
    }

    setEmployeeRows((prev) => prev.map((row, rowIndex) => ({
      ...row,
      isPrimaryContact: rowIndex === index ? !row.isPrimaryContact : false,
    })));
  };

  const handleAddEmployeeRow = () => {
    setEmployeeRows((prev) => [...prev, createEmptyEmployeeRow()]);
  };

  const handleRemoveEmployeeRow = (index) => {
    setEmployeeRows((prev) => (
      prev.length === 1 ? prev : prev.filter((_, rowIndex) => rowIndex !== index)
    ));
  };

  const handleAddEmployees = async () => {
    const companyValidationMessage = validateCompanyForm(employeeCompanyForm);
    const employeeValidationMessage = validateClientEmployeeRows(employeeRows);

    const validationMessage = [companyValidationMessage, employeeValidationMessage]
      .filter(Boolean)
      .join('\n');

    if (validationMessage) {
      setToast({ isOpen: true, message: validationMessage, isSuccess: false });
      return;
    }

    setIsAddingEmployees(true);
    try {
      let targetClientId = isAddingNewCompany ? null : (selectedContact?.id || null);
      const selectedPrimaryRows = employeeRows.filter((row) => row.isPrimaryContact);
      const ensureNoExistingContactPerson = async (clientId) => {
        const data = await getClientEmployeeAdmins(clientId);
        const admins = extractAdmins(data);

        if (admins.length > 0) {
          throw new Error('This company already has a contact person.');
        }
      };

      if (targetClientId && selectedPrimaryRows.length > 0) {
        await ensureNoExistingContactPerson(targetClientId);
      }

      if (targetClientId) {
        await updateClient(targetClientId, buildContactPayload(employeeCompanyForm));
      } else {
        const createdClient = await createClient(buildContactPayload(employeeCompanyForm));
        targetClientId = extractClientId(createdClient);

        if (!targetClientId) {
          throw new Error('Company was created, but its ID could not be found.');
        }
      }

      if (isAddingNewCompany && selectedPrimaryRows.length > 0) {
        await ensureNoExistingContactPerson(targetClientId);
      }

      // For vendor companies, retrieve the tag from the employee row
      const selectedTypeName = clientTypes.find((t) => String(t.id) === String(employeeCompanyForm.clientTypeId))?.type_name || '';
      const isVendorCompany = String(selectedTypeName).trim().toLowerCase() === 'vendor';

      for (const row of employeeRows) {
        await addClientEmployee(targetClientId, {
          client_id: targetClientId,
          first_name: row.firstName.trim(),
          last_name: row.lastName.trim(),
          email: row.email.trim(),
          phone: row.phone.trim() || null,
          phone_number: row.phone.trim() || null,
          designation: row.designation,
          tag: isVendorCompany ? (row.tag || null) : null,
          is_admin: row.isPrimaryContact,
        });
      }

      const refreshedContacts = await fetchContacts();
      const matchedContact = refreshedContacts.find((contact) => String(contact.id) === String(targetClientId));

      if (matchedContact) {
        handleSelectContact(matchedContact);
        await fetchEmployees(matchedContact.id);
      }

      closeAddEmployeeModal();
      setToast({
        isOpen: true,
        message: employeeRows.length > 1 ? 'Employees added successfully' : 'Employee added successfully',
        isSuccess: true,
      });
    } catch (err) {
      setToast({ isOpen: true, message: err.message || 'Failed to add employees', isSuccess: false });
    } finally {
      setIsAddingEmployees(false);
    }
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
        <div className={styles.topBar}>
          <div className={styles.tabs}>
            {CONTACT_TYPE_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`${styles.tab} ${activeTypeTab === tab ? styles.tabActive : ''}`}
                onClick={() => setActiveTypeTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <button type="button" className={styles.addButton} onClick={handleOpenEmployeeModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
            Add New
          </button>
        </div>

        <MasterDetailLayout
          listPanel={
            <>
              <div className={styles.searchBox}>
                <SearchInput
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <div className={styles.contactList}>
                {isLoadingContacts && <div className={styles.emptyList}>Loading...</div>}
                {!isLoadingContacts && contacts.length === 0 && (
                  <div className={styles.emptyList}>No contacts found</div>
                )}
                {!isLoadingContacts && contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`${styles.contactCard} ${selectedContact?.id === contact.id ? styles.contactCardActive : ''}`}
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className={styles.avatarCircle}><AvatarIcon /></div>
                    <div className={styles.contactCardInfo}>
                      <div className={styles.contactCardName}>
                        {contact.companyName}
                        {contact.clientTypeName && <span className={styles.typeBadge}>| {contact.clientTypeName}</span>}
                      </div>
                      <div className={styles.contactCardMeta}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#98A2B3" /></svg>
                        {contact.employeeCount} Employees
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          }
          detailPanel={
            !selectedContact ? (
              <div className={styles.emptyDetail}>Select a contact to view details</div>
            ) : (
              <>
                <div className={styles.detailHeader}>
                  <div className={styles.detailHeaderLeft}>
                    <span className={styles.detailCompanyName}>{selectedContact.companyName}</span>
                    <span className={styles.detailTypeBadge}>{selectedContact.clientTypeName || 'N/A'}</span>
                  </div>
                  <div className={styles.detailHeaderActions}>
                    <button type="button" className={styles.iconBtn} title="Edit" onClick={openEditModal}><EditIcon /></button>
                    <button type="button" className={styles.iconBtn} title="Block" onClick={handleBlock}><BlockIcon /></button>
                    <button type="button" className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete" onClick={handleDelete}><DeleteIcon /></button>
                  </div>
                </div>

                <div className={styles.contactInfoRow}>
                  <div className={styles.detailAvatar}><AvatarIcon size={36} /></div>
                  <div className={styles.infoItems}>
                    <div className={styles.infoItem}>
                      <PhoneIcon />
                      <div className={styles.infoItemContent}>
                        <div className={styles.infoLabel}>Phone Number</div>
                        <div className={styles.infoValue}>{selectedContact.officeNumber}</div>
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <LocationPinIcon />
                      <div className={styles.infoItemContent}>
                        <div className={styles.infoLabel}>Address</div>
                        <div className={styles.infoValue}>{selectedContact.address}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.detailTabs}>
                  {DETAIL_TABS.map((tab) => (
                    <button
                      type="button"
                      key={tab}
                      className={`${styles.detailTab} ${detailTab === tab ? styles.detailTabActive : ''}`}
                      onClick={() => setDetailTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className={styles.detailBody}>
                  {detailTab === 'Employee Details' && (
                    <div className={styles.tableSection}>
                      <div className={styles.tableSectionHeader}>
                        <span className={styles.tableSectionTitle}>Employee Details</span>
                        <div className={styles.headerActionGroup}>
                          <div className={styles.tableSearch}>
                            <SearchIcon />
                            <input
                              className={styles.tableSearchInput}
                              type="text"
                              placeholder="Search"
                              value={empSearch}
                              onChange={(e) => handleEmpSearchChange(e.target.value)}
                              onKeyDown={preventSearchSubmit}
                            />
                            {empSearch && (
                              <button
                                className={styles.tableClearButton}
                                type="button"
                                aria-label="Clear employee search"
                                title="Clear employee search"
                                onClick={() => handleEmpSearchChange('')}
                              >
                                <ClearIcon />
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            className={styles.addEmployeeBtn}
                            onClick={handleOpenAddEmployeeModal}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                            Add Employee
                          </button>
                        </div>
                      </div>
                       <table className={styles.detailTable}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Phone Number</th>
                            <th>Email</th>
                            <th>Designation</th>
                            {selectedContact?.clientTypeName === 'Vendor' && <th>Tag</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {isLoadingEmployees && (
                            <tr className={styles.loadingRow}><td colSpan={selectedContact?.clientTypeName === 'Vendor' ? 5 : 4}>Loading employees...</td></tr>
                          )}
                          {!isLoadingEmployees && paginatedEmployees.length === 0 && (
                            <tr className={styles.emptyRow}><td colSpan={selectedContact?.clientTypeName === 'Vendor' ? 5 : 4}>No employees found</td></tr>
                          )}
                          {!isLoadingEmployees && paginatedEmployees.map((employee) => (
                            <tr key={employee.id}>
                              <td>{`${employee.first_name || ''} ${employee.last_name || ''}`.trim() || '-'}</td>
                              <td>{employee.phone || employee.phone_number || '-'}</td>
                              <td>{employee.email || '-'}</td>
                              <td>{getRoleLabel(employee.designation || employee.role) || '-'}</td>
                              {selectedContact?.clientTypeName === 'Vendor' && <td>{formatEmployeeTag(employee.tag) || '-'}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!isLoadingEmployees && filteredEmployees.length > 0 && (
                        <div className={styles.tableFooter}>
                          <span className={styles.paginationSummary}>
                            Showing {employeeRangeStart}-{employeeRangeEnd} of {filteredEmployees.length} employees
                          </span>
                          <div className={styles.paginationControls}>
                            <button
                              type="button"
                              className={styles.paginationButton}
                              onClick={() => handleEmployeePageChange(currentEmployeePage - 1)}
                              disabled={currentEmployeePage === 1 || isLoadingEmployees}
                            >
                              <ChevronLeftIcon size={20} />
                            </button>
                            <span className={styles.pageIndicator}>
                              Page {currentEmployeePage} of {totalEmployeePages}
                            </span>
                            <button
                              type="button"
                              className={styles.paginationButton}
                              onClick={() => handleEmployeePageChange(currentEmployeePage + 1)}
                              disabled={currentEmployeePage === totalEmployeePages || isLoadingEmployees}
                            >
                              <ChevronRightIcon size={20} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {detailTab === 'Bids with' && (
                    <div className={styles.tableSection}>
                      <div className={styles.statCards}>
                        <div className={`${styles.statCard} ${styles.statCardBgWhite}`}>
                          <span className={`${styles.statValue} ${styles.statValueBlack}`}>{bidStats.total}</span>
                          <span className={styles.statLabel}>Total Bids</span>
                        </div>
                        <div className={`${styles.statCard} ${styles.statCardBgRed}`}>
                          <span className={`${styles.statValue} ${styles.statValueRed}`}>{bidStats.lost}</span>
                          <span className={styles.statLabel}>Lost / Withdrawn Bids</span>
                        </div>
                        <div className={`${styles.statCard} ${styles.statCardBgGreen}`}>
                          <span className={`${styles.statValue} ${styles.statValueGreen}`}>{bidStats.won}</span>
                          <span className={styles.statLabel}>Won Bids</span>
                        </div>
                        <div className={`${styles.statCard} ${styles.statCardBgBlue}`}>
                          <span className={`${styles.statValue} ${styles.statValueBlue}`}>{bidStats.open}</span>
                          <span className={styles.statLabel}>Pending / Open Bids</span>
                        </div>
                      </div>
                      <div className={styles.tableSectionHeader}>
                        <span className={styles.tableSectionTitle}>Bids</span>
                        <div className={styles.tableSearch}>
                          <SearchIcon />
                          <input
                            className={styles.tableSearchInput}
                            type="text"
                            placeholder="Search"
                            value={bidSearch}
                            onChange={(e) => setBidSearch(e.target.value)}
                            onKeyDown={preventSearchSubmit}
                          />
                          {bidSearch && (
                            <button
                              className={styles.tableClearButton}
                              type="button"
                              aria-label="Clear bids search"
                              title="Clear bids search"
                              onClick={() => setBidSearch('')}
                            >
                              <ClearIcon />
                            </button>
                          )}
                        </div>
                      </div>
                      <table className={styles.detailTable}>
                        <thead>
                          <tr>
                            <th>Project Name &amp; Number</th>
                            <th>$Value</th>
                            <th>Time Open</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoadingContactBids && (
                            <tr className={styles.loadingRow}><td colSpan="4">Loading bids...</td></tr>
                          )}
                          {!isLoadingContactBids && contactBids.length === 0 && (
                            <tr className={styles.emptyRow}><td colSpan="4">No bids found</td></tr>
                          )}
                          {!isLoadingContactBids && contactBids.map((bid) => (
                            <tr key={bid.id}>
                              <td>{bid.project_name || '-'}</td>
                              <td>{(bid.grand_total != null || bid.bid_value != null) ? `$${Number(bid.grand_total ?? bid.bid_value).toLocaleString()}` : '-'}</td>
                              <td>
                                {bid.created_at ? (
                                  <span className={styles.timeBadge}>{formatTimeOpen(bid.created_at)}</span>
                                ) : '-'}
                              </td>
                              <td>{getStatusDisplayLabel(bid)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {detailTab === 'Projects with' && (
                    <div className={styles.tableSection}>
                      <div className={styles.statCards3}>
                        <div className={`${styles.statCard} ${styles.statCardBgGreen}`}>
                          <span className={`${styles.statValue} ${styles.statValueGreen}`}>${projectTotals.totalValue.toLocaleString()}</span>
                          <span className={styles.statLabel}>Total Value</span>
                        </div>
                        <div className={`${styles.statCard} ${styles.statCardBgRed}`}>
                          <span className={`${styles.statValue} ${styles.statValueRed}`}>{projectTotals.activeCount}</span>
                          <span className={styles.statLabel}>Active Projects</span>
                        </div>
                        <div className={`${styles.statCard} ${styles.statCardBgBlue}`}>
                          <span className={`${styles.statValue} ${styles.statValueBlue}`}>{projectTotals.completedCount}</span>
                          <span className={styles.statLabel}>Completed Projects</span>
                        </div>
                      </div>
                      <div className={styles.tableSectionHeader}>
                        <span className={styles.tableSectionTitle}>Projects</span>
                        <div className={styles.tableSearch}>
                          <SearchIcon />
                          <input
                            className={styles.tableSearchInput}
                            type="text"
                            placeholder="Search"
                            value={projectSearch}
                            onChange={(e) => setProjectSearch(e.target.value)}
                            onKeyDown={preventSearchSubmit}
                          />
                          {projectSearch && (
                            <button
                              className={styles.tableClearButton}
                              type="button"
                              aria-label="Clear projects search"
                              title="Clear projects search"
                              onClick={() => setProjectSearch('')}
                            >
                              <ClearIcon />
                            </button>
                          )}
                        </div>
                      </div>
                      <table className={styles.detailTable}>
                        <thead>
                          <tr>
                            <th>Project Name &amp; Number</th>
                            <th>$Value</th>
                            <th>Time Open</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoadingContactBids && (
                            <tr className={styles.loadingRow}><td colSpan="4">Loading projects...</td></tr>
                          )}
                          {!isLoadingContactBids && contactBids.length === 0 && (
                            <tr className={styles.emptyRow}><td colSpan="4">No projects found</td></tr>
                          )}
                          {!isLoadingContactBids && contactBids.map((bid) => (
                            <tr key={bid.id}>
                              <td>{bid.project_name || '-'}</td>
                              <td>{(bid.grand_total != null || bid.bid_value != null) ? `$${Number(bid.grand_total ?? bid.bid_value).toLocaleString()}` : '-'}</td>
                              <td>{bid.created_at ? <span className={styles.timeBadge}>{formatTimeOpen(bid.created_at)}</span> : '-'}</td>
                              <td>{getStatusDisplayLabel(bid)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )
          }
        />
      </div>

      <Modal isOpen={showAddModal} onClose={closeAddContactModal} title="Add Contact">
        <ContactCompanyForm
          styles={styles}
          form={addForm}
          clientTypes={clientTypes}
          onChange={(field, value) => setAddForm((form) => ({ ...form, [field]: value }))}
        />
        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelButton} onClick={closeAddContactModal}>Cancel</button>
          <button type="button" className={styles.updateButton} onClick={handleAdd} disabled={isAdding}>{isAdding ? 'Adding...' : 'Add Contact'}</button>
        </div>
      </Modal>

      <Modal
        isOpen={showAddEmployeeModal}
        onClose={closeAddEmployeeModal}
        title="Add Contact"
        contentClassName={styles.employeeModalContent}
        bodyClassName={styles.employeeModalBody}
      >
        <ContactEmployeeForm
          companyForm={employeeCompanyForm}
          clientTypes={clientTypes}
          employeeRows={employeeRows}
          designationOptions={EMPLOYEE_DESIGNATIONS}
          employeeTags={employeeTags}
          showTags={activeTypeTab === 'Vendors'}
          onCompanyChange={handleEmployeeCompanyChange}
          onEmployeeChange={handleEmployeeRowChange}
          onAddEmployee={handleAddEmployeeRow}
          onRemoveEmployee={handleRemoveEmployeeRow}
          onPrimarySelect={handlePrimaryEmployeeSelect}
          onCancel={closeAddEmployeeModal}
          onSubmit={handleAddEmployees}
          isSubmitting={isAddingEmployees}
          submitLabel={employeeRows.length > 1 ? 'Add Employees' : 'Add Employee'}
        />
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Update Contact Details">
        <ContactCompanyForm
          styles={styles}
          form={editForm}
          clientTypes={clientTypes}
          onChange={(field, value) => setEditForm((form) => ({ ...form, [field]: value }))}
        />
        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelButton} onClick={() => setShowEditModal(false)}>Cancel</button>
          <button type="button" className={styles.updateButton} onClick={handleUpdate} disabled={isUpdating}>{isUpdating ? 'Updating...' : 'Update'}</button>
        </div>
      </Modal>
    </>
  );
}

export default ContactsPage;