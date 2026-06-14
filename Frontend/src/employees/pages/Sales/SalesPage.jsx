import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './SalesPage.module.css';
import { useLocation, useNavigate } from 'react-router-dom';
import ActionMenu from '../../components/ActionMenu/ActionMenu';
import BidTable from '../../components/BidTable';
import { Toast } from '../../components/Toast';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import usePagedDirectory from '../../hooks/usePagedDirectory';
import useToastState from '../../hooks/useToastState';
import { ClearIcon, DeleteIcon, EditIcon } from '../../components/Icons';
import CreateBidModal from './CreateBidModal';
import AddNewGCModal from '../../components/Client/AddNewGCModal';
import AddEmployeeModal from '../../components/Client/AddEmployeeModal';
import SoWExclusionModal from '../../components/SoWExclusionModal/SoWExclusionModal';
import BidDetailsViewModal from '../../components/BidDetailsViewModal/BidDetailsViewModal';
import ProjectOnboardingModal from '../CRM/ProjectOnboardingModal';
import {
  getBids,
  getBid,
  createBid,
  updateBid,
  updateBids,
  deleteBid,
  archiveBid,
  unarchiveBid,
  getBidCostDetails,
  saveBidCostDetails,
  previewEstimatePdf,
  downloadEstimatePdf,
  sendEstimatePdf,
  uploadBidRootFile,
  createBidFolder,
  getBidFolders,
  uploadBidFolderFile,
  pinBid,
  unpinBid,
} from '../../../common/services/api';
import { formatValidationMessages, validateBidForm } from '../../utils/validation';
import { getRoleLabel } from '../../constants/roles';
import { getDecodedToken } from '../../utils/authSession';

import {
  getBidStatus,
  normalizeBidStatusKey,
  isSalesPipelineBid,
  isBidOverdue,
  getBidCreatedTime,
  formatShortDate,
  formatBidDetailDate,
  formatDateTime,
  getBidDisplayId,
  toToggleValue,
  toToggleBoolean,
  getBidContributors,
  getCurrentUserId,
  getRecipientName,
  getInitialBidItems,
  getEstimateFileBaseName,
  createDefaultEstimateRow,
  normalizeEstimateItemsFromApi,
  buildEstimateExcelContent,
  triggerBlobDownload,
  formatManagedFileSize,
  buildBidFileManagerPath,
  createManagedEntry,
  upsertManagedEntry,
  buildBidUpdatePayload,
} from '../../utils/bidHelpers';

const TABS = ['All Bids', 'Bid In Progress', 'Archived', 'Deleted'];

const TAB_FILTERS = {
  'Bid In Progress': 'bidinprogress',
  'Archived': 'archived',
  Deleted: 'deleted',
};

const normalizeBidStatus = (bid) => {
  if (bid?.project_status === 'archived' || bid?.status === 'archived' || bid?.bid_status === 'archived') return 'archived';
  const status = normalizeBidStatusKey(bid);
  if (status === 'bidinprogress') return 'bidInProgress';
  if (status === 'senttoclient') return 'sentToClient';
  return status || 'bidInProgress';
};

const formatBidForTable = (bid) => ({
  ...bid,
  original_status: bid?.original_status || bid?.status,
  status: normalizeBidStatus(bid),
  status_extra: isBidOverdue(bid) ? 'Overdue' : bid?.status_extra,
});

const isBidInTab = (bid, tab) => {
  if (tab === 'All Bids') return isSalesPipelineBid(bid, { includeDeleted: false }) && bid?.project_status !== 'archived';

  const status = normalizeBidStatusKey(bid);
  const targetStatus = TAB_FILTERS[tab];

  if (tab === 'Overdue') {
    return status === 'overdue' || isBidOverdue(bid);
  }

  if (tab === 'Archived') {
    return bid?.project_status === 'archived';
  }

  return status?.toLowerCase() === targetStatus?.toLowerCase() && bid?.project_status !== 'archived';
};

import BidOverviewPage from '../../components/BidOverview/BidOverviewPage';

function SalesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [activeTab, setActiveTab] = useState('All Bids');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingBids, setIsLoadingBids] = useState(false);

  // Modals state
  const [showCreateBid, setShowCreateBid] = useState(false);
  const [showAddNewGC, setShowAddNewGC] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [viewBid, setViewBid] = useState(null);
  const [selectedActionBid, setSelectedActionBid] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [modalKey, setModalKey] = useState(0); // increments to force full remount on each "Add New"
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [bidFilesById, setBidFilesById] = useState({});
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const { toast, setToast, closeToast } = useToastState();
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

  const fetchBids = useCallback(async (page = 1, status = '', search = '', tab = '') => {
    try {
      setIsLoadingBids(true);
      const data = await getBids(page, status, search, tab !== 'All Bids' ? TAB_FILTERS[tab] || tab.toLowerCase() : '', '', 'sales');
      if (data?.success === false) {
        throw new Error(data?.message || 'Failed to fetch Bids');
      }

      const responseBids = data?.bids || data?.data?.bids || data?.data || [];
      const responsePagination = data?.pagination || data?.data?.pagination || {
        currentPage: page,
        perPage: 10,
        totalPages: 1,
        totalRecords: Array.isArray(responseBids) ? responseBids.length : 0,
      };

      const formattedBids = (Array.isArray(responseBids) ? responseBids : []).map(formatBidForTable);
      setBids(formattedBids.filter((bid) => isBidInTab(bid, tab || 'All Bids')));
      setPagination(responsePagination, page);
    } catch (error) {
      setBids([]);
      setPagination(null, page);
      setToast({ isOpen: true, message: error.message || 'Failed to load bids', isSuccess: false });
    } finally {
      setIsLoadingBids(false);
    }
  }, [setPagination, setToast]);

  useEffect(() => {
    fetchBids(currentPage, selectedStatus, debouncedSearchTerm, activeTab);
  }, [activeTab, currentPage, debouncedSearchTerm, fetchBids, selectedStatus, viewBid]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const bidId = searchParams.get('bid');

    if (!bidId) {
      setViewBid(null);
    } else if (!viewBid || String(viewBid.id) !== String(bidId)) {
      setIsLoadingBids(true);
      resolveBidDetails({ id: bidId })
        .then((detailedBid) => {
          const initialData = {
            id: detailedBid.id,
            project_name: detailedBid.project_name || '',
            due_date: detailedBid.due_date ? String(detailedBid.due_date).split('T')[0] : '',
            address: detailedBid.address || '',
            general_contractor_search: '',
            selected_general_contractors: buildSelectedGeneralContractors(detailedBid),
            selected_employees: buildSelectedEmployees(detailedBid),
            dwg_date: detailedBid.drawing_date ? String(detailedBid.drawing_date).split('T')[0] : '',
            dwg_description: detailedBid.drawing_description || '',
            db_wage_rate: toToggleBoolean(detailedBid.db_wage_rate),
            tax_exempt: toToggleBoolean(detailedBid.tax_exempt),
            fringes_amount: detailedBid.fringes_amount || '',
            base_contract_amount: detailedBid.base_contract_amount || '',
            status: detailedBid.status || 'bid in progress',
          };
          setViewBid({
            ...detailedBid,
            ...initialData,
            drawing_date: initialData.dwg_date,
            drawing_description: initialData.dwg_description,
          });
        })
        .catch(() => {
          setViewBid({ id: bidId });
        })
        .finally(() => {
          setIsLoadingBids(false);
        });
    }
  }, [location.search]);

  useEffect(() => {
    const openBidId = location.state?.openBidId;
    if (!openBidId) return;

    handleBidClick({ id: openBidId });
    navigate('/dashboard/sales', { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const normalizeId = (value) => {
    if (value === undefined || value === null || value === '') return null;
    return String(value);
  };

  const normalizeContractor = (contractor, fallbackId) => {
    if (!contractor) return null;
    if (typeof contractor === 'object') {
      const id = normalizeId(contractor.id || contractor._id || contractor.client_id || contractor.company_id || fallbackId);
      return {
        id: id || '',
        name: contractor.company_name || contractor.companyName || contractor.name || contractor.client_name || contractor.general_contractor || String(id || fallbackId || ''),
      };
    }

    return {
      id: normalizeId(fallbackId) || String(contractor),
      name: String(contractor),
    };
  };

  const buildSelectedGeneralContractors = (bid) => {
    if (Array.isArray(bid.clients)) {
      return bid.clients
        .map((client, index) => normalizeContractor(client, Array.isArray(bid.client_ids) ? bid.client_ids[index] : undefined))
        .filter((contractor) => contractor && contractor.id);
    }

    if (Array.isArray(bid.client_ids) || Array.isArray(bid.client_names)) {
      const ids = Array.isArray(bid.client_ids) ? bid.client_ids : bid.client_names.map((_, index) => bid.client_ids?.[index]);
      const names = Array.isArray(bid.client_names) ? bid.client_names : bid.client_name ? [bid.client_name] : [];

      return ids.map((id, index) => ({
        id,
        name: names[index] || bid.client || bid.general_contractor || String(id),
      })).filter((contractor) => contractor.id);
    }

    if (bid.client_id || bid.client_name || bid.client || bid.general_contractor) {
      return [{
        id: bid.client_id || bid.client_ids?.[0] || bid.id || '',
        name: bid.client_name || bid.client || bid.general_contractor || '',
      }];
    }

    return [];
  };

  const normalizeEmployee = (employee, fallbackContractorId) => {
    if (!employee) return null;

    const id = normalizeId(
      employee.id || employee._id || employee.employee_id || employee.client_employee_id || employee.client_employee_ids?.[0] || employee.emp_id || employee.employeeId
    );
    const contractorId = normalizeId(
      employee.contractorId || employee.client_id || employee.clientId || employee.company_id || employee.companyId || fallbackContractorId
    );

    if (!id) return null;

    const firstName = employee.first_name || employee.firstName || employee.name?.split?.(' ')[0] || '';
    const lastName = employee.last_name || employee.lastName || employee.name?.split?.(' ')[1] || '';
    const email = employee.email || employee.email_address || employee.emailAddress || '';
    const phone = employee.phone || employee.mobile || employee.phone_number || employee.mobile_number || '';
    const fallbackName = employee.name || employee.employee_name || employee.full_name || '';

    return {
      id,
      firstName,
      lastName,
      email,
      phone,
      designation: getRoleLabel(employee.designation || employee.role) || '',
      contractorId,
      fallbackName,
    };
  };

  const buildSelectedEmployees = (bid) => {
    const fallbackContractorId = normalizeId(bid.client_id || (Array.isArray(bid.client_ids) ? bid.client_ids[0] : null));

    if (Array.isArray(bid.clients)) {
      return bid.clients.flatMap((client) => {
        const contractorId = normalizeId(client.id || client._id || client.client_id || client.company_id);
        const employees = Array.isArray(client.employees) ? client.employees : [];

        return employees
          .map((employee) => normalizeEmployee(employee, contractorId || fallbackContractorId))
          .filter(Boolean);
      });
    }

    if (Array.isArray(bid.employees)) {
      return bid.employees
        .map((employee) => normalizeEmployee(employee, fallbackContractorId))
        .filter(Boolean);
    }

    if (Array.isArray(bid.client_employees)) {
      return bid.client_employees
        .map((employee) => normalizeEmployee(employee, fallbackContractorId))
        .filter(Boolean);
    }

    if (Array.isArray(bid.client_employee_ids)) {
      const names = Array.isArray(bid.client_employee_names) ? bid.client_employee_names : [];
      return bid.client_employee_ids.map((id, index) => ({
        id: normalizeId(id),
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        designation: '',
        contractorId: fallbackContractorId,
        fallbackName: names[index] || `Employee ${index + 1}`,
      }));
    }

    if (bid.client_employee_id) {
      return [{
        id: normalizeId(bid.client_employee_id),
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        designation: '',
        contractorId: fallbackContractorId,
        fallbackName: bid.client_employee_name || 'Employee',
      }];
    }

    return [];
  };

  const handleBidClick = async (bid) => {
    let detailedBid = bid;
    try {
      detailedBid = await resolveBidDetails(bid);
    } catch (error) {
      setToast({ isOpen: true, message: error.message || 'Failed to load bid details', isSuccess: false });
      return;
    }

    const initialData = {
      id: detailedBid.id,
      project_name: detailedBid.project_name || '',
      due_date: detailedBid.due_date ? String(detailedBid.due_date).split('T')[0] : '',
      address: detailedBid.address || '',
      general_contractor_search: '',
      selected_general_contractors: buildSelectedGeneralContractors(detailedBid),
      selected_employees: buildSelectedEmployees(detailedBid),
      dwg_date: detailedBid.drawing_date ? String(detailedBid.drawing_date).split('T')[0] : '',
      dwg_description: detailedBid.drawing_description || '',
      db_wage_rate: toToggleBoolean(detailedBid.db_wage_rate),
      tax_exempt: toToggleBoolean(detailedBid.tax_exempt),
      fringes_amount: detailedBid.fringes_amount || '',
      base_contract_amount: detailedBid.base_contract_amount || '',
      status: detailedBid.status || bid.status || 'bid in progress',
    };

    setViewBid({
      ...detailedBid,
      ...initialData,
      drawing_date: initialData.dwg_date,
      drawing_description: initialData.dwg_description,
    });
    navigate(`/dashboard/sales?bid=${detailedBid.id}`);
  };


  const resolveBidDetails = async (bid) => {
    const data = await getBid(bid.id);
    if (data?.success === false) {
      throw new Error(data?.message || 'Failed to fetch bid details');
    }

    return data?.bid || data?.data?.bid || data?.data || bid;
  };

  const handleActionClick = async (action, bid, rect) => {
    if (action === 'edit' || action === 'view') {
      setShowActionMenu(null);
      let detailedBid = bid;
      try {
        detailedBid = await resolveBidDetails(bid);
      } catch (error) {
        setToast({ isOpen: true, message: error.message || 'Failed to load bid details', isSuccess: false });
        return;
      }

      const initialData = {
        id: detailedBid.id,
        project_name: detailedBid.project_name || '',
        due_date: detailedBid.due_date ? String(detailedBid.due_date).split('T')[0] : '',
        address: detailedBid.address || '',
        general_contractor_search: '',
        selected_general_contractors: buildSelectedGeneralContractors(detailedBid),
        selected_employees: buildSelectedEmployees(detailedBid),
        dwg_date: detailedBid.drawing_date ? String(detailedBid.drawing_date).split('T')[0] : '',
        dwg_description: detailedBid.drawing_description || '',
        db_wage_rate: toToggleBoolean(detailedBid.db_wage_rate),
        tax_exempt: toToggleBoolean(detailedBid.tax_exempt),
        fringes_amount: detailedBid.fringes_amount || '',
        base_contract_amount: detailedBid.base_contract_amount || '',
        status: detailedBid.status || bid.status || 'bid in progress',
        viewOnly: action === 'view',
      };

      if (action === 'view') {
        setSelectedBid(detailedBid);
        setIsViewModalOpen(true);
        return;
      }

      setSelectedBid(initialData);
      setShowCreateBid(true);
    } else if (action === 'archive') {
      setShowActionMenu(null);
      handleArchiveBid(bid);
    } else if (action === 'unarchive') {
      setShowActionMenu(null);
      handleUnarchiveBid(bid);
    } else if (action === 'delete') {
      setShowActionMenu(null);
      handleDeleteBid(bid);
    } else if (action === 'send') {
      setToast({ isOpen: true, message: 'Send functionality not yet implemented.', isSuccess: true });
    } else if (action === 'won') {
      let detailedBid = bid;
      try {
        detailedBid = await resolveBidDetails(bid);
      } catch (error) {
        setToast({ isOpen: true, message: error.message || 'Failed to load bid details', isSuccess: false });
        return;
      }
      setSelectedBid(detailedBid);
      setIsOnboardingModalOpen(true);
    } else if (action === 'award') {
      setToast({ isOpen: true, message: 'Award functionality not yet implemented', isSuccess: true });
    } else if (action === 'pin' || action === 'unpin') {
      if (!bid) return;
      try {
        const response = action === 'pin' ? await pinBid(bid.id) : await unpinBid(bid.id);
        if (!response?.success) {
          throw new Error(response?.message || 'Failed to update pinned state');
        }

        setToast({
          isOpen: true,
          message: response.message || `Project ${action === 'pin' ? 'pinned' : 'unpinned'} successfully`,
          isSuccess: true,
        });

        fetchBids(currentPage, selectedStatus, debouncedSearchTerm, activeTab);
      } catch (error) {
        setToast({
          isOpen: true,
          message: error.message || 'Failed to update pinned status',
          isSuccess: false,
        });
      }
    } else if (action === 'more') {
      if (showActionMenu === bid.id) {
        setShowActionMenu(null);
        return;
      }

      setSelectedActionBid(bid);
      setShowActionMenu(bid.id);
      if (rect) {
        setMenuPosition({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX - 96 });
      }
    }
  };

  const handleArchiveBid = async (bid) => {
    if (!bid) return;

    if (!window.confirm("Are you sure you want to archive this bid?")) return;

    try {
      const data = await archiveBid(bid.id);
      if (!data?.success) {
        throw new Error(data?.message || 'Failed to archive bid');
      }

      setToast({ isOpen: true, message: data.message || 'Bid archived successfully', isSuccess: true });
      const nextPage = bids.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(nextPage);
      fetchBids(nextPage, selectedStatus, debouncedSearchTerm, activeTab);
    } catch (error) {
      setToast({ isOpen: true, message: error.message || 'Failed to archive Bid', isSuccess: false });
    }
  };

  const handleUnarchiveBid = async (bid) => {
    if (!bid) return;

    if (!window.confirm("Are you sure you want to unarchive this bid?")) return;

    try {
      const data = await unarchiveBid(bid.id);
      if (!data?.success) {
        throw new Error(data?.message || 'Failed to unarchive bid');
      }

      setToast({ isOpen: true, message: data.message || 'Bid unarchived successfully', isSuccess: true });
      const nextPage = bids.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(nextPage);
      fetchBids(nextPage, selectedStatus, debouncedSearchTerm, activeTab);
    } catch (error) {
      setToast({ isOpen: true, message: error.message || 'Failed to unarchive Bid', isSuccess: false });
    }
  };

  const handleDeleteBid = async (bid) => {
    if (!bid) return;

    if (!window.confirm("Are you sure you want to delete this bid?")) return;

    try {
      const data = await deleteBid(bid.id);
      if (!data?.success) {
        throw new Error(data?.message || 'Failed to delete bid');
      }

      setToast({ isOpen: true, message: data.message || 'Bid deleted successfully', isSuccess: true });
      const nextPage = bids.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(nextPage);
      fetchBids(nextPage, selectedStatus, debouncedSearchTerm, activeTab);
    } catch (error) {
      setToast({ isOpen: true, message: error.message || 'Failed to delete Bid', isSuccess: false });
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSelectedSort(value);
    setCurrentPage(1);
  };

  const getBidDueTime = (bid) => {
    const dateStr = bid?.due_date || bid?.dueDate;
    if (!dateStr) return 0;
    const parsed = Date.parse(dateStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  const visibleBids = useMemo(() => {
    const filteredBids = (bids || []).filter((bid) => isBidInTab(bid, activeTab));
    const sortType = selectedSort || 'due_desc';

    return [...filteredBids].sort((a, b) => {
      const direction = sortType === 'due_asc' ? 1 : -1;
      return (getBidDueTime(a) - getBidDueTime(b)) * direction;
    });
  }, [activeTab, bids, selectedSort]);

  const actionMenuItems = [
    {
      label: 'Update',
      icon: <EditIcon />,
      onClick: () => selectedActionBid && handleActionClick('edit', selectedActionBid),
    },
    {
      label: selectedActionBid?.project_status === 'archived' ? 'Unarchive' : 'Archive',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      ),
      disabled: getBidStatus(selectedActionBid) === 'deleted',
      onClick: () => selectedActionBid && handleActionClick(selectedActionBid?.project_status === 'archived' ? 'unarchive' : 'archive', selectedActionBid),
    },
    {
      label: 'Delete',
      icon: <DeleteIcon />,
      isDanger: true,
      disabled: getBidStatus(selectedActionBid) === 'deleted',
      onClick: () => selectedActionBid && handleActionClick('delete', selectedActionBid),
    },
  ];

  const handleCreateBidSubmit = async (data) => {
    const validationErrors = validateBidForm(data, {
      requireFutureDueDate: !data?.id,
      requireFutureDwgDate: !data?.id
    });
    const validationMessage = formatValidationMessages(validationErrors);
    if (validationMessage) {
      setToast({ isOpen: true, message: validationMessage, isSuccess: false });
      return;
    }

    const isUpdate = !!data.id;
    const currentUserId = getCurrentUserId();
    const selectedGeneralContractorIds = Array.isArray(data.selected_general_contractors)
      ? data.selected_general_contractors.map((contractor) => contractor.id).filter(Boolean)
      : [];
    const selectedEmployeeIds = Array.isArray(data.selected_employees)
      ? data.selected_employees.map((employee) => employee.id).filter(Boolean)
      : [];

    const payload = {
      project_name: data.project_name.trim(),
      address: data.address.trim(),
      due_date: data.due_date,
      client_ids: selectedGeneralContractorIds,
      client_employee_ids: selectedEmployeeIds,
      drawing_date: data.dwg_date,
      drawing_description: (data.dwg_description || '').trim(),
      db_wage_rate: toToggleValue(data.db_wage_rate),
      tax_exempt: toToggleValue(data.tax_exempt),
      fringes_amount: Number(data.fringes_amount) || 0,
      base_contract_amount: Number(data.base_contract_amount) || 0,
      status: isUpdate ? data.status || 'bid in progress' : 'bid in progress',
    };

    if (data.bid_value !== undefined && data.bid_value !== null && data.bid_value !== '') {
      payload.grand_total = Number(data.bid_value) || 0;
    }

    if (!isUpdate && currentUserId) {
      payload.created_by = currentUserId;
    }

    try {
      const resData = isUpdate ? await updateBid(data.id, payload) : await createBid(payload);

      if (!resData?.success) {
        throw new Error(resData?.message || 'Failed to process Bid');
      }

      if (!isUpdate) {
        const newBidId = resData.id || resData.data?.id;
        if (newBidId) {
          try {
            await createBidFolder(newBidId, { folder_name: 'Contract', parent_id: null });
            await createBidFolder(newBidId, { folder_name: 'Markup Contract', parent_id: null });
          } catch (folderErr) {
            console.error('Failed to create default folders:', folderErr);
          }
        }
      }

      setToast({ isOpen: true, message: isUpdate ? resData.message || 'Bid updated successfully' : 'Bid created successfully', isSuccess: true });
      setShowCreateBid(false);
      setSelectedBid(null);
      setViewBid(null);
      setCurrentPage(1);
      setActiveTab('All Bids');
      setSelectedStatus('');
      setSelectedSort('');
      setSearchTerm('');
      fetchBids(1, '', '', 'All Bids');
    } catch (error) {
      setToast({ isOpen: true, message: error.message || 'Failed to process Bid', isSuccess: false });
    }
  };

  const handleAddNewGCSubmit = () => {
    setToast({ isOpen: true, message: 'Add GC logic pending implementation', isSuccess: true });
    setShowAddNewGC(false);
  };

  const handleAddEmployeeSubmit = () => {
    setToast({ isOpen: true, message: 'Add Employee logic pending implementation', isSuccess: true });
    setShowAddEmployee(false);
  };

  if (viewBid) {
    return (
      <>
        <Toast
          isOpen={toast.isOpen}
          message={toast.message}
          isSuccess={toast.isSuccess}
          onClose={closeToast}
          duration={3000}
        />
        <BidOverviewPage
          bid={viewBid}
          showPin={false}
          isSalesOrCRM={true}
          files={bidFilesById[viewBid.id] || []}
          onFilesChange={(updater) => {
            setBidFilesById((currentFilesById) => {
              const existingEntries = currentFilesById[viewBid.id] || [];
              const nextEntries = typeof updater === 'function' ? updater(existingEntries) : updater;

              return {
                ...currentFilesById,
                [viewBid.id]: nextEntries,
              };
            });
          }}
          onBack={() => {
            setViewBid(null);
            navigate('/dashboard/sales');
          }}
          onEdit={() => {
            const bidToEdit = viewBid;
            handleActionClick('edit', bidToEdit);
          }}
          onBidUpdated={(updatedBid) => {
            setViewBid((currentBid) => ({
              ...currentBid,
              ...updatedBid,
            }));
            setBids((currentBids) => currentBids.map((currentBid) => (
              currentBid.id === updatedBid.id
                ? formatBidForTable({ ...currentBid, ...updatedBid })
                : currentBid
            )));
          }}
          onNotify={(message, isSuccess) => setToast({ isOpen: true, message, isSuccess })}
        />
        <CreateBidModal
          isOpen={showCreateBid}
          onClose={() => setShowCreateBid(false)}
          onSubmit={handleCreateBidSubmit}
          initialData={selectedBid}
          key={selectedBid ? `edit-${selectedBid.id}` : `new-${modalKey}`}
        />
        <AddNewGCModal
          isOpen={showAddNewGC}
          onClose={() => setShowAddNewGC(false)}
          onSubmit={handleAddNewGCSubmit}
        />
        <AddEmployeeModal
          isOpen={showAddEmployee}
          onClose={() => setShowAddEmployee(false)}
          onSubmit={handleAddEmployeeSubmit}
          companyName="SteelMart"
        />
        <BidDetailsViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedBid(null);
          }}
          bid={selectedBid}
          onActionClick={handleActionClick}
          allowedActions={['edit', 'archive', 'delete']}
        />
      </>
    );
  }

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
        <div className={styles.tabsContainer}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
              onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.container} onClick={() => setShowActionMenu(null)}>
          <div className={styles.filterSection}>
            <div className={styles.leftFilters}>
              <div className={styles.filterGroup}>
                <select
                  className={styles.filterDropdown}
                  value={selectedSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="">Sort by: Due Date</option>
                  <option value="due_asc">Ascending</option>
                  <option value="due_desc">Descending</option>
                </select>
              </div>
            </div>

            <div className={styles.rightFilters}>
              <div className={styles.searchContainer}>
                <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 21L16.65 16.65" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Search"
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className={styles.clearButton}
                    aria-label="Clear search"
                    title="Clear search"
                    onClick={() => handleSearchChange('')}
                  >
                    <ClearIcon />
                  </button>
                )}
              </div>
              <button
                className={styles.addButton}
                onClick={() => {
                  setViewBid(null);
                  setSelectedBid(null);
                  setModalKey(prev => prev + 1); // force clean remount
                  setShowCreateBid(true);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Add New
              </button>
            </div>
          </div>

          <BidTable
            bids={visibleBids}
            onBidClick={handleBidClick}
            onActionClick={handleActionClick}
            isLoading={isLoadingBids}
            isDeletedView={activeTab === 'Deleted'}
            showPin={false}
          />

          {showActionMenu ? (
            <ActionMenu styles={styles} position={menuPosition} actions={actionMenuItems} />
          ) : null}

          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Showing data {firstItemNumber} to {lastItemNumber} of {pagination.totalRecords} entries
            </span>
            <div className={styles.paginationButtons}>
              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoadingBids}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.41 16.59L10.83 12L15.41 7.41L14 6L8 12L14 18L15.41 16.59Z" fill="currentColor" /></svg>
              </button>

              {pageNumbers.map((page, index) => (
                <span
                  key={index}
                  className={page === pagination.currentPage ? styles.pageNumber : styles.pageNumberInactive}
                  style={{ cursor: page !== '...' ? 'pointer' : 'default' }}
                  onClick={() => page !== '...' && handlePageChange(page)}
                >
                  {page}
                </span>
              ))}

              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= (pagination.totalPages || 1) || isLoadingBids}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="currentColor" /></svg>
              </button>
            </div>
          </div>

          <CreateBidModal
            isOpen={showCreateBid}
            onClose={() => setShowCreateBid(false)}
            onSubmit={handleCreateBidSubmit}
            initialData={selectedBid}
            key={selectedBid ? `edit-${selectedBid.id}` : `new-${modalKey}`}
          />

          <AddNewGCModal
            isOpen={showAddNewGC}
            onClose={() => setShowAddNewGC(false)}
            onSubmit={handleAddNewGCSubmit}
          />

          <AddEmployeeModal
            isOpen={showAddEmployee}
            onClose={() => setShowAddEmployee(false)}
            onSubmit={handleAddEmployeeSubmit}
            companyName="SteelMart"
          />

          <BidDetailsViewModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedBid(null);
            }}
            bid={selectedBid}
            onActionClick={handleActionClick}
            allowedActions={['edit', 'delete']}
          />

          <ProjectOnboardingModal
            isOpen={isOnboardingModalOpen}
            onClose={() => {
              setIsOnboardingModalOpen(false);
              setSelectedBid(null);
            }}
            bid={selectedBid}
            onSubmit={async (payload, projectContractFiles) => {
              try {
                const data = await updateBid(selectedBid.id, payload);
                if (!data?.success) throw new Error(data?.message || 'Failed to onboard project');

                try {
                  await createBidFolder(selectedBid.id, { folder_name: 'Contract', parent_id: null });
                  await createBidFolder(selectedBid.id, { folder_name: 'Markup Contract', parent_id: null });
                } catch (folderErr) {
                  console.error('Failed to create default folders:', folderErr);
                }

                if (projectContractFiles && projectContractFiles.length > 0) {
                  for (const file of projectContractFiles) {
                    const relativePath = file.webkitRelativePath || '';
                    if (relativePath) {
                      const pathParts = relativePath.split('/').filter(Boolean);
                      const fileName = pathParts.pop() || file.name;
                      const folderPath = pathParts.join('/');

                      const uploadResponse = await uploadBidRootFile(selectedBid.id, file, folderPath, fileName);
                      if (!uploadResponse?.success) {
                        throw new Error(uploadResponse?.message || `Failed to upload file ${fileName} under ${folderPath}`);
                      }
                    } else {
                      const uploadResponse = await uploadBidRootFile(selectedBid.id, file);
                      if (!uploadResponse?.success) {
                        throw new Error(uploadResponse?.message || `Failed to upload file ${file.name}`);
                      }
                    }
                  }
                }

                setToast({ isOpen: true, message: 'Project onboarded successfully!', isSuccess: true });
                setIsOnboardingModalOpen(false);
                setSelectedBid(null);
                fetchBids(currentPage, selectedStatus, debouncedSearchTerm, activeTab);
              } catch (err) {
                setToast({ isOpen: true, message: err.message || 'Onboarding failed', isSuccess: false });
              }
            }}
          />

        </div>
      </div>
    </>
  );
}

export default SalesPage;