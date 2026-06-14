import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from '../../pages/Sales/SalesPage.module.css';
import RFIsPage from '../../pages/RFIs/RFIsPage';
import SubmittalsPage from '../../pages/Submittals/SubmittalsPage';
import GalleryPage from '../../pages/Gallery/GalleryPage';
import FinancialsAdminTab from './FinancialsAdminTab';
import { ChevronLeft } from 'lucide-react';
import { ClearIcon } from '../Icons';
import {
  EditPencilIcon,
  ContactActionIcon,
  TogglePreview,
  AmountPreview,
  LocationPinIcon,
  DownloadIcon,
  ExcelIcon,
  FolderRowIcon,
  FileRowIcon,
  SearchOutlineIcon,
  LinkActionIcon,
  MoreActionIcon,
} from '../Icons/BidIcons';

const PinIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(45deg)' }}>
    <path
      d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z"
      fill={filled ? '#F59E0B' : 'none'}
      stroke={filled ? '#F59E0B' : '#344054'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
import SoWExclusionModal from '../SoWExclusionModal/SoWExclusionModal';
import PersonnelTeamModal from '../PersonnelTeamModal/PersonnelTeamModal';
import {
  getBid,
  getBidCostDetails,
  saveBidCostDetails,
  previewEstimatePdf,
  downloadEstimatePdf,
  sendEstimatePdf,
  updateBid,
  updateBids,
  pinBid,
  unpinBid,
  getBidFolders,
  createBidFolder,
  renameBidFolder,
  deleteBidFolder,
  getBidRootFiles,
  getBidFolderFiles,
  uploadBidRootFile,
  uploadBidFolderFile,
  renameBidFolderFile,
  deleteBidFolderFile,
  downloadBidFolderFile,
  getPersonnelTeams,
  createPersonnelTeam,
  updatePersonnelTeam,
  deletePersonnelTeam,
  getBidVendors,
  getAvailableVendors,
  inviteVendorsToBid,
  approveVendorProposal,
  rejectVendorProposal,
  removeVendorFromBid,
  addExternalVendor,
  completeProject,
} from '../../../common/services/api';
import {
  formatBidDetailDate,
  formatDateTime,
  getSalesBidDisplayId,
  toToggleBoolean,
  getRecipientName,
  getInitialBidItems,
  getEstimateFileBaseName,
  normalizeEstimateItemsFromApi,
  buildEstimateExcelContent,
  triggerBlobDownload,
  formatManagedFileSize,
  buildBidUpdatePayload,
} from '../../utils/bidHelpers';
import { capitalizeFirstCharacter } from '../../utils/inputFormat';
import {
  getEstimatedTravelInfo,
  getGoogleMapsEmbedUrl,
  getGoogleMapsUrl,
} from '../../services/mapService';

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#667085' }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const PeopleEmptyIllustration = () => (
  <svg width="110" height="107" viewBox="0 0 110 107" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M54.6424 31.0436C43.1399 31.0436 33.4588 39.207 31.1862 50.0358C30.9047 51.3767 29.5894 52.2356 28.2486 51.9542C26.9078 51.6727 26.0488 50.3574 26.3303 49.0166C29.0768 35.9294 40.7529 26.082 54.6424 26.082C68.5245 26.082 79.8307 35.6181 82.8425 48.3652C83.1577 49.6985 82.3321 51.0348 80.9988 51.35C79.6652 51.665 78.3289 50.8395 78.0139 49.506C75.5144 38.9278 66.1524 31.0436 54.6424 31.0436Z" fill="#48B5EE" />
    <path fillRule="evenodd" clipRule="evenodd" d="M41.9757 6.22076C41.9757 2.7838 44.7597 0 48.1965 0H54.5937C55.964 0 57.0748 1.11072 57.0748 2.48087C57.0748 3.85099 55.964 4.96171 54.5937 4.96171H48.1965C47.4998 4.96171 46.9376 5.52411 46.9376 6.22076V16.2595C46.9376 17.3979 46.1628 18.3902 45.0583 18.6663C43.4128 19.0777 41.9723 19.5331 40.6035 20.0726C39.0247 20.695 37.5074 21.4427 35.8527 22.3955C34.8638 22.9649 33.6142 22.7863 32.8243 21.9628L25.8925 14.736C25.8917 14.7351 25.8908 14.7343 25.89 14.7334C25.4072 14.2366 24.6172 14.2308 24.1349 14.697L24.1265 14.7052L14.8805 23.5578C14.3843 24.0406 14.3786 24.8301 14.8446 25.3123L14.8513 25.3191L21.7899 32.5529C22.5646 33.3607 22.7025 34.5871 22.1268 35.5468C20.3741 38.4678 19.7325 41.0734 18.81 44.8201C18.7635 45.0089 18.7162 45.2008 18.6681 45.3958C18.3945 46.5036 17.4006 47.282 16.2595 47.282H6.22078C5.52413 47.282 4.96171 47.8444 4.96171 48.5412V61.3355C4.96171 62.7058 3.85099 63.8163 2.48087 63.8163C1.11072 63.8163 0 62.7058 0 61.3355V48.5412C0 45.1041 2.78382 42.3204 6.22078 42.3204H14.3157C14.9668 39.7104 15.6558 37.2453 16.948 34.6728L11.2772 28.7607C11.276 28.7594 11.2748 28.7581 11.2735 28.7568C8.89015 26.2872 8.98305 22.3577 11.4351 19.9873L11.4436 19.979L11.4437 19.9792L20.6913 11.125C23.161 8.74251 27.0899 8.83577 29.4598 11.2875L29.4667 11.2944L35.0872 17.1543C36.3114 16.5136 37.5229 15.9538 38.7838 15.4567C39.8144 15.0505 40.8674 14.6904 41.9757 14.3633V6.22076Z" fill="#48B5EE" />
    <path fillRule="evenodd" clipRule="evenodd" d="M68.0243 6.22076C68.0243 2.78379 65.2403 0 61.8035 0H55.4063C54.036 0 52.9253 1.11072 52.9253 2.48087C52.9253 3.85099 54.036 4.96171 55.4063 4.96171H61.8035C62.5002 4.96171 63.0625 5.52411 63.0625 6.22076V16.2595C63.0625 17.3979 63.8372 18.3902 64.9417 18.6663C66.5872 19.0777 68.0277 19.5331 69.3965 20.0726C70.9754 20.695 72.4926 21.4427 74.1473 22.3955C75.1363 22.9649 76.3858 22.7863 77.1758 21.9628L84.1075 14.736C84.1084 14.7351 84.1092 14.7343 84.1101 14.7334C84.5928 14.2366 85.3828 14.2308 85.8651 14.697L85.8735 14.7052L95.1195 23.5578C95.6158 24.0406 95.6214 24.8301 95.1554 25.3123L95.1488 25.3191L88.2102 32.5529C87.4354 33.3607 87.2975 34.5871 87.8733 35.5468C89.626 38.4678 90.2675 41.0734 91.19 44.8201C91.2367 45.0089 91.2839 45.2008 91.3321 45.3958C91.6055 46.5036 92.5994 47.282 93.7405 47.282H103.779C104.476 47.282 105.038 47.8444 105.038 48.5412V61.3355C105.038 62.7058 106.149 63.8163 107.519 63.8163C108.889 63.8163 110 62.7058 110 61.3355V48.5412C110 45.1041 107.216 42.3204 103.779 42.3204H95.6844C95.0332 39.7104 94.3442 37.2453 93.0521 34.6728L98.7229 28.7607C98.724 28.7594 98.7253 28.7581 98.7265 28.7568C101.11 26.2872 101.017 22.3577 98.565 19.9873L98.5564 19.979V19.9792L89.3087 11.125C86.839 8.74251 82.9102 8.83577 80.5402 11.2875L80.5334 11.2944L74.9128 17.1543C73.6887 16.5136 72.4771 15.9538 71.2162 15.4567C70.1856 15.0505 69.1327 14.6904 68.0243 14.3633V6.22076Z" fill="#48B5EE" />
    <path fillRule="evenodd" clipRule="evenodd" d="M89.8782 80.4499C86.7907 80.4499 83.9398 81.3784 81.6018 83.0067C80.4775 83.7896 78.9313 83.5131 78.1482 82.3886C77.3651 81.2644 77.6418 79.7181 78.7661 78.935C81.9398 76.7249 85.7812 75.4883 89.8782 75.4883C100.697 75.4883 109.435 84.2264 109.435 95.0449V106.334H84.2685C82.8982 106.334 81.7874 105.224 81.7874 103.853C81.7874 102.483 82.8982 101.372 84.2685 101.372H104.473V95.0449C104.473 86.9667 97.9564 80.4499 89.8782 80.4499Z" fill="#2324CA" />
    <path fillRule="evenodd" clipRule="evenodd" d="M89.8778 57.862C84.997 57.862 81.0404 61.8188 81.0404 66.6994C81.0404 71.5802 84.997 75.5368 89.8778 75.5368C94.7584 75.5368 98.7152 71.5802 98.7152 66.6994C98.7152 61.8188 94.7584 57.862 89.8778 57.862ZM76.0786 66.6994C76.0786 59.0784 82.2567 52.9004 89.8778 52.9004C97.4987 52.9004 103.677 59.0784 103.677 66.6994C103.677 74.3205 97.4987 80.4986 89.8778 80.4986C82.2567 80.4986 76.0786 74.3205 76.0786 66.6994Z" fill="#2324CA" />
    <path fillRule="evenodd" clipRule="evenodd" d="M2.6084 95.0449C2.6084 84.2264 11.3466 75.4883 22.165 75.4883C26.262 75.4883 30.1034 76.7249 33.2771 78.935C34.4014 79.7181 34.6781 81.2644 33.895 82.3886C33.1121 83.5131 31.5659 83.7896 30.4416 83.0067C28.1037 81.3784 25.2525 80.4499 22.165 80.4499C14.0869 80.4499 7.57011 86.9667 7.57011 95.0449V101.372H28.8576C30.2276 101.372 31.3384 102.483 31.3384 103.853C31.3384 105.224 30.2276 106.334 28.8576 106.334H2.6084V95.0449Z" fill="#2324CA" />
    <path fillRule="evenodd" clipRule="evenodd" d="M22.1645 57.8622C17.2838 57.8622 13.3272 61.8188 13.3272 66.6994C13.3272 71.5802 17.2838 75.5368 22.1645 75.5368C27.0453 75.5368 31.0018 71.5802 31.0018 66.6994C31.0018 61.8188 27.0453 57.8622 22.1645 57.8622ZM8.36548 66.6994C8.36548 59.0784 14.5435 52.9004 22.1645 52.9004C29.7856 52.9004 35.9637 59.0784 35.9637 66.6994C35.9637 74.3205 29.7856 80.4986 22.1645 80.4986C14.5435 80.4986 8.36548 74.3205 8.36548 66.6994Z" fill="#2324CA" />
    <path fillRule="evenodd" clipRule="evenodd" d="M56.3166 75.9714C46.6598 75.9714 38.769 83.8209 38.769 93.5189V101.372H73.9131V93.5189C73.9131 83.8621 66.0638 75.9714 56.3658 75.9714H56.3166ZM33.8074 93.5189C33.8074 81.0726 43.9274 71.0098 56.3166 71.0098H56.3658C68.8121 71.0098 78.8749 81.1298 78.8749 93.5189V106.334H33.8074V93.5189Z" fill="#2324CA" />
    <path fillRule="evenodd" clipRule="evenodd" d="M56.3659 49.4968C50.425 49.4968 45.6093 54.3127 45.6093 60.2533C45.6093 66.194 50.425 71.0099 56.3659 71.0099C62.3065 71.0099 67.1222 66.194 67.1222 60.2533C67.1222 54.3127 62.3065 49.4968 56.3659 49.4968ZM40.6475 60.2533C40.6475 51.5724 47.6849 44.5352 56.3659 44.5352C65.0466 44.5352 72.084 51.5724 72.084 60.2533C72.084 68.9343 65.0466 75.9717 56.3659 75.9717C47.6849 75.9717 40.6475 68.9343 40.6475 60.2533Z" fill="#2324CA" />
  </svg>
);

/* ── Vendor Status Badge ── */
const VENDOR_STATUS_CONFIG = {
  invited: { label: 'Not Replied', color: '#F59E0B', bg: '#FFFBEB', border: '#F59E0B' },
  proposal_sent: { label: 'Bid Received', color: '#039855', bg: '#ECFDF3', border: '#039855' },
  approved: { label: 'Approved', color: '#039855', bg: '#ECFDF3', border: '#039855' },
  rejected: { label: 'Rejected', color: '#D92D20', bg: '#FEF3F2', border: '#D92D20' },
  not_bidding: { label: 'Not Bidding', color: '#667085', bg: '#F2F4F7', border: '#667085' },
  external_bid: { label: 'External Bid', color: '#6366F1', bg: '#EEF2FF', border: '#6366F1' },
};

function VendorStatusBadge({ status }) {
  const cfg = VENDOR_STATUS_CONFIG[status] || VENDOR_STATUS_CONFIG.invited;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '3px 10px', borderRadius: 20,
      border: `1px solid ${cfg.border}`,
      background: cfg.bg,
      color: cfg.color,
      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

const VendorActionIcon = ({ title, onClick, color = '#344054', disabled = false, children }) => (
  <button
    type="button"
    title={title}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    style={{
      width: 28, height: 28, border: 'none', background: 'transparent',
      cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? '#D0D5DD' : color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 6, transition: 'background 0.15s',
      opacity: disabled ? 0.5 : 1,
    }}
    onMouseOver={(e) => { if (!disabled) e.currentTarget.style.background = '#f0f0f0'; }}
    onMouseOut={(e) => { if (!disabled) e.currentTarget.style.background = 'transparent'; }}
  >
    {children}
  </button>
);

function VendorsTab({ bid, onNotify, onVendorUpdated, isCompleted }) {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [availableVendors, setAvailableVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [isInviting, setIsInviting] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const [showAddExternalModal, setShowAddExternalModal] = useState(false);
  const [extCompanyName, setExtCompanyName] = useState('');
  const [extWebsite, setExtWebsite] = useState('');
  const [extOfficeNumber, setExtOfficeNumber] = useState('');
  const [extAddress, setExtAddress] = useState('');
  const [extDescription, setExtDescription] = useState('');
  const [extAdminFirstName, setExtAdminFirstName] = useState('');
  const [extAdminLastName, setExtAdminLastName] = useState('');
  const [extAdminEmail, setExtAdminEmail] = useState('');
  const [extAdminPhone, setExtAdminPhone] = useState('');
  const [isSavingExternal, setIsSavingExternal] = useState(false);

  const loadVendors = useCallback(async () => {
    if (!bid?.id) return;
    setIsLoading(true);
    try {
      const res = await getBidVendors(bid.id);
      if (res?.success !== false) {
        setVendors(res?.data?.vendors || res?.vendors || []);
        onVendorUpdated?.();
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load vendors', false);
    } finally {
      setIsLoading(false);
    }
  }, [bid?.id, onNotify, onVendorUpdated]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const loadAvailableVendors = useCallback(async (search = '') => {
    if (!bid?.id) return;
    try {
      const res = await getAvailableVendors(bid.id, search);
      if (res?.success !== false) {
        setAvailableVendors(res?.data?.vendors || res?.vendors || []);
      }
    } catch { /* silent */ }
  }, [bid?.id]);

  const handleOpenInvite = () => {
    setShowInviteModal(true);
    setSelectedVendorIds([]);
    setVendorSearch('');
    loadAvailableVendors('');
  };

  const handleOpenAddExternalVendor = () => {
    setShowAddExternalModal(true);
    setExtCompanyName('');
    setExtWebsite('');
    setExtOfficeNumber('');
    setExtAddress('');
    setExtDescription('');
    setExtAdminFirstName('');
    setExtAdminLastName('');
    setExtAdminEmail('');
    setExtAdminPhone('');
  };

  const handleAddExternalVendorSubmit = async (e) => {
    e.preventDefault();
    if (!extCompanyName || !extAdminFirstName || !extAdminEmail) {
      onNotify?.('Please fill in all required fields (Company Name, First Name, Email)', false);
      return;
    }

    setIsSavingExternal(true);
    try {
      const payload = {
        company_name: extCompanyName,
        website: extWebsite,
        office_number: extOfficeNumber,
        address: extAddress,
        description: extDescription,
        admin_first_name: extAdminFirstName,
        admin_last_name: extAdminLastName,
        admin_email: extAdminEmail,
        admin_phone: extAdminPhone
      };

      const res = await addExternalVendor(bid.id, payload);
      if (res?.success === false) throw new Error(res?.message || 'Failed to add external vendor');

      onNotify?.('Temporary external vendor added successfully', true);
      setShowAddExternalModal(false);
      loadVendors();
    } catch (err) {
      onNotify?.(err.message || 'Failed to add external vendor', false);
    } finally {
      setIsSavingExternal(false);
    }
  };

  const handleVendorSearchChange = (val) => {
    setVendorSearch(val);
    loadAvailableVendors(val);
  };

  const toggleVendorSelect = (vendorId) => {
    setSelectedVendorIds((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  const handleInviteSubmit = async () => {
    if (!selectedVendorIds.length) {
      onNotify?.('Please select at least one vendor', false);
      return;
    }
    setIsInviting(true);
    try {
      const res = await inviteVendorsToBid(bid.id, selectedVendorIds, dueDate || null, null);
      if (res?.success === false) throw new Error(res?.message || 'Failed to invite vendors');
      onNotify?.('Vendors invited successfully', true);
      setShowInviteModal(false);
      loadVendors();
    } catch (err) {
      onNotify?.(err.message || 'Failed to invite vendors', false);
    } finally {
      setIsInviting(false);
    }
  };

  const handleApprove = async (vendor) => {
    try {
      const res = await approveVendorProposal(bid.id, vendor.id);
      if (res?.success === false) throw new Error(res?.message || 'Failed to approve');
      onNotify?.('Vendor proposal approved', true);
      loadVendors();
    } catch (err) {
      onNotify?.(err.message || 'Failed to approve', false);
    }
  };

  const handleReject = async (vendor) => {
    const reason = window.prompt('Reason for rejection (optional):') ?? '';
    if (reason === null) return; // cancelled
    try {
      const res = await rejectVendorProposal(bid.id, vendor.id, reason);
      if (res?.success === false) throw new Error(res?.message || 'Failed to reject');
      onNotify?.('Vendor proposal rejected', true);
      loadVendors();
    } catch (err) {
      onNotify?.(err.message || 'Failed to reject', false);
    }
  };

  const handleRemove = async (vendor) => {
    if (!window.confirm(`Remove ${vendor.vendor_name} from this bid?`)) return;
    try {
      const res = await removeVendorFromBid(bid.id, vendor.id);
      if (res?.success === false) throw new Error(res?.message || 'Failed to remove');
      onNotify?.('Vendor removed', true);
      loadVendors();
    } catch (err) {
      onNotify?.(err.message || 'Failed to remove vendor', false);
    }
  };

  const totalPages = Math.ceil(vendors.length / PER_PAGE);
  const pagedVendors = vendors.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const selectedAvailableVendors = availableVendors.filter((v) => selectedVendorIds.includes(v.id));

  const formatCurrency = (val) => {
    const n = Number(val);
    if (!Number.isFinite(n) || !val) return '—';
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    } catch { return val; }
  };

  return (
    <div style={{ padding: '24px 30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#101828' }}>Detailing Vendor Bids</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: '#344054', fontWeight: 500 }}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isCompleted}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #D0D5DD', fontSize: 13, color: '#344054', opacity: isCompleted ? 0.5 : 1 }}
          />
          <button
            type="button"
            onClick={handleOpenAddExternalVendor}
            disabled={isCompleted}
            style={{
              padding: '8px 14px', background: '#3047F7', color: '#fff', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: isCompleted ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, opacity: isCompleted ? 0.5 : 1
            }}
          >
            + Add External Vendor
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #EAECF0', background: '#F9FAFB' }}>
                {['DSC Name', 'Status', 'Cost (in $)', 'Lead Time (in Days)', 'Due Date', 'Actions'].map((h, i) => (
                  <th key={i} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 12, fontWeight: 600, color: '#344054',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#667085' }}>Loading vendors...</td></tr>
              ) : pagedVendors.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#667085', fontStyle: 'italic' }}>No vendors invited yet. Click "+ Add External Bid" to invite vendors.</td></tr>
              ) : (
                pagedVendors.map((vendor) => (
                  <tr key={vendor.id} style={{ borderBottom: '1px solid #EAECF0' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#101828', fontWeight: 500 }}>
                      {vendor.vendor_name}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <VendorStatusBadge status={vendor.status} />
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#344054' }}>
                      {formatCurrency(vendor.proposal_price)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#344054' }}>
                      {vendor.proposal_lead_time ? `${vendor.proposal_lead_time} Days` : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#344054' }}>
                      {(() => {
                        if (vendor.proposal_lead_time && bid?.due_date) {
                          const d = new Date(bid.due_date);
                          if (!isNaN(d.getTime())) {
                            d.setDate(d.getDate() + Number(vendor.proposal_lead_time));
                            return formatDate(d);
                          }
                        }
                        return formatDate(vendor.due_date);
                      })()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {/* Approve */}
                        {!isCompleted && vendor.status !== 'approved' && vendor.status !== 'rejected' && (
                          <VendorActionIcon
                            title="Approve"
                            color="#039855"
                            disabled={vendor.status === 'invited'}
                            onClick={() => handleApprove(vendor)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                          </VendorActionIcon>
                        )}
                        {/* Reject */}
                        {!isCompleted && vendor.status !== 'approved' && vendor.status !== 'rejected' && (
                          <VendorActionIcon title="Reject" color="#D92D20" onClick={() => handleReject(vendor)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </VendorActionIcon>
                        )}
                        {/* Remove */}
                        {!isCompleted && vendor.status !== 'approved' && (
                          <VendorActionIcon title="Remove Vendor" color="#D92D20" onClick={() => handleRemove(vendor)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </VendorActionIcon>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {vendors.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #EAECF0' }}>
            <span style={{ fontSize: 13, color: '#667085' }}>
              Showing data {Math.min((page - 1) * PER_PAGE + 1, vendors.length)} to {Math.min(page * PER_PAGE, vendors.length)} of {vendors.length} entries
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ width: 30, height: 30, border: '1px solid #D0D5DD', borderRadius: 6, background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#344054' }}>‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" onClick={() => setPage(n)} style={{ width: 30, height: 30, border: n === page ? 'none' : '1px solid #D0D5DD', borderRadius: 6, background: n === page ? '#3047F7' : '#fff', color: n === page ? '#fff' : '#344054', cursor: 'pointer', fontWeight: n === page ? 600 : 400 }}>{n}</button>
              ))}
              <button type="button" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)} style={{ width: 30, height: 30, border: '1px solid #D0D5DD', borderRadius: 6, background: '#fff', cursor: (page === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', color: '#344054' }}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Invite More Vendors Button */}
      {!isCompleted && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <button
            type="button"
            onClick={handleOpenInvite}
            style={{
              padding: '10px 20px', background: '#FFFFFF', color: '#3047F7',
              border: '1px solid #3047F7', borderRadius: 8, fontSize: 14,
              fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            + Invite More Vendors
          </button>
        </div>
      )}

      {/* Invite Vendors Modal */}
      {showInviteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200,
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 14, padding: 28,
            width: 680, maxWidth: '95vw', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#101828' }}>Invite Vendors to Bid</h3>
              <button type="button" onClick={() => setShowInviteModal(false)} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#667085' }}>×</button>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              {/* Suggested Vendors */}
              <div style={{ flex: 1, border: '1px solid #EAECF0', borderRadius: 10, padding: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#344054' }}>Suggested Vendors</h4>
                <input
                  type="text"
                  placeholder="Search vendor name..."
                  value={vendorSearch}
                  onChange={(e) => handleVendorSearchChange(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D0D5DD', fontSize: 13, boxSizing: 'border-box', marginBottom: 10 }}
                />
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {availableVendors.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#667085', textAlign: 'center', padding: '16px 0' }}>No vendors found</p>
                  ) : (
                    availableVendors.map((v) => (
                      <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', cursor: 'pointer', borderBottom: '1px solid #F2F4F7' }}>
                        <input
                          type="checkbox"
                          checked={selectedVendorIds.includes(v.id) || Boolean(v.already_invited)}
                          disabled={Boolean(v.already_invited)}
                          onChange={() => !v.already_invited && toggleVendorSelect(v.id)}
                          style={{ width: 15, height: 15 }}
                        />
                        <span style={{ fontSize: 13, color: v.already_invited ? '#9CA3AF' : '#344054', flex: 1 }}>
                          {v.company_name}
                          {v.already_invited ? <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6 }}>(already invited)</span> : null}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Selected Vendors */}
              <div style={{ width: 220, border: '1px solid #EAECF0', borderRadius: 10, padding: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#344054' }}>Selected ({selectedVendorIds.length})</h4>
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {selectedAvailableVendors.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>None selected</p>
                  ) : (
                    selectedAvailableVendors.map((v) => (
                      <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #F2F4F7' }}>
                        <span style={{ fontSize: 13, color: '#344054' }}>{v.company_name}</span>
                        <button type="button" onClick={() => toggleVendorSelect(v.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#D92D20', fontSize: 16 }}>×</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setShowInviteModal(false)} style={{ padding: '9px 18px', background: '#fff', border: '1px solid #D0D5DD', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#344054' }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInviteSubmit}
                disabled={isInviting || selectedVendorIds.length === 0}
                style={{ padding: '9px 18px', background: '#3047F7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: isInviting || selectedVendorIds.length === 0 ? 'not-allowed' : 'pointer', opacity: isInviting || selectedVendorIds.length === 0 ? 0.6 : 1 }}
              >
                {isInviting ? 'Inviting...' : `Invite ${selectedVendorIds.length > 0 ? `(${selectedVendorIds.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add External Vendor Modal */}
      {showAddExternalModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200,
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 14, padding: 28,
            width: 600, maxWidth: '95vw', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#101828' }}>Add Temporary External Vendor</h3>
              <button type="button" onClick={() => setShowAddExternalModal(false)} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#667085' }}>×</button>
            </div>

            <form onSubmit={handleAddExternalVendorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Section 1: Company Details */}
              <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#3047F7' }}>Company Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#344054', marginBottom: 4 }}>Company Name *</label>
                  <input
                    type="text"
                    required
                    value={extCompanyName}
                    onChange={(e) => setExtCompanyName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D0D5DD', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#344054', marginBottom: 4 }}>Office Phone</label>
                  <input
                    type="text"
                    value={extOfficeNumber}
                    onChange={(e) => setExtOfficeNumber(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D0D5DD', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#344054', marginBottom: 4 }}>Website</label>
                  <input
                    type="text"
                    value={extWebsite}
                    onChange={(e) => setExtWebsite(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D0D5DD', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#344054', marginBottom: 4 }}>Address</label>
                  <input
                    type="text"
                    value={extAddress}
                    onChange={(e) => setExtAddress(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D0D5DD', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#344054', marginBottom: 4 }}>Description</label>
                <textarea
                  value={extDescription}
                  onChange={(e) => setExtDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D0D5DD', fontSize: 13, boxSizing: 'border-box', height: 60, resize: 'vertical' }}
                />
              </div>

              {/* Section 2: Admin Info */}
              <h4 style={{ margin: '8px 0 4px', fontSize: 14, fontWeight: 600, color: '#3047F7' }}>Admin Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#344054', marginBottom: 4 }}>First Name *</label>
                  <input
                    type="text"
                    required
                    value={extAdminFirstName}
                    onChange={(e) => setExtAdminFirstName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D0D5DD', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#344054', marginBottom: 4 }}>Last Name</label>
                  <input
                    type="text"
                    value={extAdminLastName}
                    onChange={(e) => setExtAdminLastName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D0D5DD', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#344054', marginBottom: 4 }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={extAdminEmail}
                    onChange={(e) => setExtAdminEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D0D5DD', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#344054', marginBottom: 4 }}>Phone Number</label>
                  <input
                    type="text"
                    value={extAdminPhone}
                    onChange={(e) => setExtAdminPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D0D5DD', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>


              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setShowAddExternalModal(false)} style={{ padding: '9px 18px', background: '#fff', border: '1px solid #D0D5DD', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#344054' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingExternal}
                  style={{ padding: '9px 18px', background: '#3047F7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: isSavingExternal ? 'not-allowed' : 'pointer', opacity: isSavingExternal ? 0.6 : 1 }}
                >
                  {isSavingExternal ? 'Saving...' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function BidOverviewPage({ bid, onBack, onEdit, onBidUpdated, onNotify, showPin = true, isSalesOrCRM: initialIsSalesOrCRM = false }) {
  const isCompleted = String(bid?.project_status || '').toLowerCase() === 'completed';
  const isSalesOrCRM = isCompleted ? false : initialIsSalesOrCRM;
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const [activeOverviewTab, setActiveOverviewTab] = useState(tabFromUrl);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeOverviewTab) {
      setActiveOverviewTab(tabFromUrl);
    }
  }, [tabFromUrl, activeOverviewTab]);

  const handleTabChange = (newTab) => {
    setActiveOverviewTab(newTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    }, { replace: true });
  };
  const [textEditorTab, setTextEditorTab] = useState(null);
  const [showEstimateShare, setShowEstimateShare] = useState(false);
  const [estimateShareSearch, setEstimateShareSearch] = useState('');
  const [selectedEstimateRecipients, setSelectedEstimateRecipients] = useState([]);
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [bidItems, setBidItems] = useState(() => getInitialBidItems(bid));
  const [isEstimateLoading, setIsEstimateLoading] = useState(false);
  const [isEstimateSaveLoading, setIsEstimateSaveLoading] = useState(false);
  const [isEstimateActionLoading, setIsEstimateActionLoading] = useState(false);
  const [hasSavedEstimate, setHasSavedEstimate] = useState(false);
  const [isEstimateDirty, setIsEstimateDirty] = useState(false);
  const [savedEstimateTotals, setSavedEstimateTotals] = useState({ sub_total: 0, grand_total: 0 });
  const [isFileManagerLoading, setIsFileManagerLoading] = useState(false);
  const [isFileManagerActionLoading, setIsFileManagerActionLoading] = useState(false);
  const [fileManagerEntries, setFileManagerEntries] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderTrail, setFolderTrail] = useState([]);
  const [openEntryActionId, setOpenEntryActionId] = useState(null);
  const [hasInitializedFileManager, setHasInitializedFileManager] = useState(false);
  const [previewEntry, setPreviewEntry] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');
  const [previewMime, setPreviewMime] = useState('');
  const [previewTextContent, setPreviewTextContent] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [vendors, setVendors] = useState([]);
  const uploadFileInputRef = useRef(null);
  const uploadFolderInputRef = useRef(null);
  const previewRequestIdRef = useRef(0);
  const previewBlobUrlRef = useRef('');

  /* ── Project Details Interactive States ── */
  const [activeDropdown, setActiveDropdown] = useState(null); // 'engineering' | 'deckers' | null

  const [engineeringStatus, setEngineeringStatus] = useState(() => {
    return localStorage.getItem(`project_${bid.id}_engineering_status`) || 'Released';
  });
  const [deckersJoistStatus, setDeckersJoistStatus] = useState(() => {
    return localStorage.getItem(`project_${bid.id}_deckers_joist_status`) || 'Unreleased';
  });

  const [accessNotes, setAccessNotes] = useState(bid.access_notes || 'No project access notes added yet.');

  const isNotesEmpty = (content) => {
    if (!content) return true;
    const stripped = content.replace(/<[^>]*>/g, '').trim();
    return stripped === '' || stripped === 'No project access notes added yet.';
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState([]);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  // Sync details when bid loads or bid.id changes
  useEffect(() => {
    if (bid?.id) {
      setAccessNotes(bid.access_notes || 'No project access notes added yet.');

      setEngineeringStatus(localStorage.getItem(`project_${bid.id}_engineering_status`) || 'Released');
      setDeckersJoistStatus(localStorage.getItem(`project_${bid.id}_deckers_joist_status`) || 'Unreleased');

      if (bid.teams && bid.teams.length > 0) {
        setTeams(bid.teams.map(t => ({
          ...t,
          name: t.team_name || t.name
        })));
      } else if (Array.isArray(bid.clients)) {
        const dynamicTeams = bid.clients.map((client, index) => ({
          id: client.client_id || client.id || index,
          name: client.client_name || 'Client Team',
          members: (client.employees || []).map((emp) => ({
            id: emp.employee_id || emp.id,
            name: emp.full_name || ((emp.first_name || '') + ' ' + (emp.last_name || '')).trim() || 'N/A',
            email: emp.email || 'N/A',
            phone: emp.phone || 'N/A',
            designation: emp.designation || 'N/A'
          }))
        }));
        setTeams(dynamicTeams);
      } else {
        setTeams([]);
      }
    }
  }, [bid, bid?.id]);

  const fetchVendorsForOverview = useCallback(() => {
    if (bid?.id) {
      getBidVendors(bid.id).then(res => {
        if (res?.success !== false) {
          setVendors(res?.data?.vendors || res?.vendors || []);
        }
      }).catch(() => { });
    }
  }, [bid?.id]);

  useEffect(() => {
    fetchVendorsForOverview();
  }, [fetchVendorsForOverview]);

  const handleEngineeringStatusChange = (val) => {
    setEngineeringStatus(val);
    localStorage.setItem(`project_${bid.id}_engineering_status`, val);
  };

  const handleDeckersJoistStatusChange = (val) => {
    setDeckersJoistStatus(val);
    localStorage.setItem(`project_${bid.id}_deckers_joist_status`, val);
  };



  const handleOpenAddTeam = () => {
    setEditingTeam(null);
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeam = (team) => {
    setEditingTeam(team);
    setIsTeamModalOpen(true);
  };

  const handleTeamSubmit = async (teamData) => {
    try {
      const res = await (editingTeam
        ? updatePersonnelTeam(bid.id, editingTeam.id, teamData)
        : createPersonnelTeam(bid.id, teamData));

      onNotify?.(res?.message || 'Personnel Team saved successfully', true);

      const updatedBidRes = await getBid(bid.id);
      if (updatedBidRes && updatedBidRes.success !== false) {
        const updatedBid = updatedBidRes.bid || updatedBidRes.data?.bid || updatedBidRes.data;
        onBidUpdated?.(updatedBid);
      }
      setIsTeamModalOpen(false);
    } catch (err) {
      onNotify?.(err.message || 'Failed to save Personnel Team', false);
    }
  };

  const handleConfirmDeleteTeam = async (teamId) => {
    if (confirm('Are you sure you want to delete this team?')) {
      try {
        const res = await deletePersonnelTeam(bid.id, teamId);
        onNotify?.(res?.message || 'Personnel Team deleted successfully', true);

        const updatedBidRes = await getBid(bid.id);
        if (updatedBidRes && updatedBidRes.success !== false) {
          const updatedBid = updatedBidRes.bid || updatedBidRes.data?.bid || updatedBidRes.data;
          onBidUpdated?.(updatedBid);
        }
      } catch (err) {
        onNotify?.(err.message || 'Failed to delete Personnel Team', false);
      }
    }
  };



  // Click handler to close dropdowns globally
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveDropdown(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Derive contractors from multiple possible API shapes (selected_general_contractors, clients, client_names, etc.)
  const contractors = useMemo(() => {
    if (Array.isArray(bid.selected_general_contractors) && bid.selected_general_contractors.length) return bid.selected_general_contractors;
    if (Array.isArray(bid.clients) && bid.clients.length) {
      return bid.clients.map((c, index) => {
        const id = c.client_id || c.id || c.company_id || c.clientId || c._id || (Array.isArray(bid.client_ids) ? bid.client_ids[index] : null);
        return {
          id: id ? String(id) : '',
          name: c.client_name || c.company_name || c.companyName || c.name || String(id || '')
        };
      }).filter((c) => c.id);
    }
    if (Array.isArray(bid.client_ids) || Array.isArray(bid.client_names)) {
      const ids = Array.isArray(bid.client_ids) ? bid.client_ids : (bid.client_names || []).map((_, i) => bid.client_ids?.[i]);
      const names = Array.isArray(bid.client_names) ? bid.client_names : bid.client_name ? [bid.client_name] : [];
      return ids.map((id, i) => ({
        id: id ? String(id) : '',
        name: names[i] || bid.client || bid.general_contractor || String(id || '')
      })).filter((c) => c.id);
    }
    if (bid.client_id || bid.client_name || bid.client || bid.general_contractor) {
      return [{
        id: String(bid.client_id || bid.client_ids?.[0] || bid.id || ''),
        name: bid.client_name || bid.client || bid.general_contractor || ''
      }];
    }
    return [];
  }, [bid]);

  // Derive employees from multiple shapes (selected_employees, clients[].employees, employees, client_employees)
  const employees = useMemo(() => {
    if (Array.isArray(bid.selected_employees) && bid.selected_employees.length) return bid.selected_employees;

    const fallbackContractorId = (bid.client_id || (Array.isArray(bid.client_ids) ? bid.client_ids[0] : null)) ? String(bid.client_id || (Array.isArray(bid.client_ids) ? bid.client_ids[0] : '')) : null;

    const normalizeEmp = (e, fallbackId) => {
      if (!e) return null;
      const id = e.id || e._id || e.employee_id || e.client_employee_id || e.client_employee_ids?.[0] || e.emp_id || e.employeeId;
      if (!id) return null;
      const contractorId = e.contractorId || e.client_id || e.clientId || e.company_id || e.companyId || fallbackId;
      return {
        id: String(id),
        firstName: e.first_name || e.firstName || e.name?.split?.(' ')[0] || '',
        lastName: e.last_name || e.lastName || e.name?.split?.(' ')[1] || '',
        email: e.email || e.email_address || e.emailAddress || '',
        phone: e.phone || e.mobile || e.phone_number || e.mobile_number || '',
        designation: e.designation || e.role || '',
        contractorId: contractorId ? String(contractorId) : null,
        fallbackName: e.name || e.employee_name || e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim()
      };
    };

    if (Array.isArray(bid.clients) && bid.clients.length) {
      return bid.clients.flatMap((c) => {
        const contractorId = c.id || c._id || c.client_id || c.company_id;
        const emps = Array.isArray(c.employees) ? c.employees : [];
        return emps.map((e) => normalizeEmp(e, contractorId || fallbackContractorId)).filter(Boolean);
      });
    }
    if (Array.isArray(bid.employees) && bid.employees.length) {
      return bid.employees.map((e) => normalizeEmp(e, fallbackContractorId)).filter(Boolean);
    }
    if (Array.isArray(bid.client_employees) && bid.client_employees.length) {
      return bid.client_employees.map((e) => normalizeEmp(e, fallbackContractorId)).filter(Boolean);
    }
    if (Array.isArray(bid.client_employee_ids) && bid.client_employee_ids.length) {
      const names = Array.isArray(bid.client_employee_names) ? bid.client_employee_names : [];
      return bid.client_employee_ids.map((id, index) => ({
        id: String(id),
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
        id: String(bid.client_employee_id),
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
  }, [bid]);

  const groupedContractors = useMemo(() => {
    return contractors.length > 0 ? contractors : [{ id: 'fallback', name: bid.client_name || bid.client || bid.general_contractor || 'General Contractor' }];
  }, [contractors, bid.client_name, bid.client, bid.general_contractor]);
  const getEmployeesForContractor = (contractor) => employees.filter((employee) => (
    !employee.contractorId || String(employee.contractorId) === String(contractor.id)
  ));
  const initialScopeOfWork = bid.scope_of_work || bid.scopeOfWork || bid.sow || 'No scope of work added yet.';
  const initialExclusion = bid.exclusion || bid.exclusions || 'No exclusions added yet.';
  const initialAccessNotes = bid.access_notes || 'No project access notes added yet.';
  const [scopeOfWork, setScopeOfWork] = useState(initialScopeOfWork);
  const [exclusion, setExclusion] = useState(initialExclusion);
  const createdBy = bid.created_by_name || bid.createdByName || bid.created_by || 'N/A';
  const mapAddress = (bid.address || '').trim();
  const googleMapsUrl = getGoogleMapsUrl(mapAddress);
  const googleMapsEmbedUrl = getGoogleMapsEmbedUrl(mapAddress);

  const [travelInfo, setTravelInfo] = useState({ time: 'N/A', distance: 'N/A' });

  useEffect(() => {
    if (!mapAddress) {
      setTravelInfo({ time: 'N/A', distance: 'N/A' });
      return;
    }

    let cancelled = false;

    const computeTravel = async () => {
      try {
        const estimatedTravelInfo = await getEstimatedTravelInfo(mapAddress);
        if (cancelled) return;

        setTravelInfo(estimatedTravelInfo);
      } catch {
        // Silently fail and keep N/A.
      }
    };

    computeTravel();

    return () => { cancelled = true; };
  }, [mapAddress]);
  const estimateRecipients = useMemo(() => {
    const contractorOptions = groupedContractors
      .map((contractor, index) => ({
        id: `contractor-${contractor.id || index}`,
        label: getRecipientName(contractor, `Company ${index + 1}`),
        email: contractor?.email || contractor?.company_email || contractor?.client_email || '',
        companyId: contractor.id && contractor.id !== 'fallback' ? Number(contractor.id) : null,
      }))
      .filter((option) => option.label && option.email);

    const employeeOptions = employees
      .map((employee, index) => {
        const contractorName = groupedContractors.find((contractor) => String(contractor.id) === String(employee.contractorId));
        const employeeName = getRecipientName(employee, `Employee ${index + 1}`);

        return {
          id: `employee-${employee.id || index}`,
          label: contractorName ? `${employeeName} - ${getRecipientName(contractorName)}` : employeeName,
          email: employee?.email || employee?.email_address || employee?.emailAddress || '',
          companyId: employee.contractorId && employee.contractorId !== 'fallback' ? Number(employee.contractorId) : null,
        };
      })
      .filter((option) => option.label && option.email);

    const options = [...employeeOptions, ...contractorOptions];
    const uniqueOptions = options.filter((option, index) => (
      options.findIndex((item) => item.email.toLowerCase() === option.email.toLowerCase()) === index
    ));

    return uniqueOptions;
  }, [employees, groupedContractors]);

  const filteredEstimateRecipients = estimateRecipients.filter((recipient) => (
    recipient.label.toLowerCase().includes(estimateShareSearch.trim().toLowerCase())
  ));
  const browserPath = useMemo(() => (
    ['Files', getSalesBidDisplayId(bid), ...folderTrail.map((folder) => folder.folder_name)]
      .filter(Boolean)
      .join(' > ')
  ), [bid, folderTrail]);
  const filteredFileEntries = useMemo(() => {
    const query = fileSearchTerm.trim().toLowerCase();
    if (!query) {
      return fileManagerEntries;
    }

    return fileManagerEntries.filter((entry) => entry.name.toLowerCase().includes(query));
  }, [fileManagerEntries, fileSearchTerm]);
  const totalUploadedFileSize = useMemo(() => (
    fileManagerEntries
      .reduce((sum, entry) => sum + (Number(entry.size) || 0), 0)
  ), [fileManagerEntries]);
  const totalUploadedFiles = useMemo(() => (
    fileManagerEntries.reduce((sum, entry) => (
      sum + (entry.type === 'folder' ? Number(entry.fileCount) || 0 : 1)
    ), 0)
  ), [fileManagerEntries]);

  useEffect(() => {
    setScopeOfWork(initialScopeOfWork);
    setExclusion(initialExclusion);
    setAccessNotes(initialAccessNotes);
  }, [initialExclusion, initialScopeOfWork, initialAccessNotes]);

  useEffect(() => {
    setBidItems(getInitialBidItems(bid));
    setHasSavedEstimate(false);
    setIsEstimateDirty(false);
  }, [bid?.id]);

  useEffect(() => {
    setFileSearchTerm('');
  }, [bid?.id]);

  useEffect(() => {
    setFileManagerEntries([]);
    setCurrentFolder(null);
    setFolderTrail([]);
    setOpenEntryActionId(null);
    setHasInitializedFileManager(false);
  }, [bid?.id]);

  useEffect(() => {
    const closeFileMenu = () => setOpenEntryActionId(null);
    document.addEventListener('click', closeFileMenu);

    return () => {
      document.removeEventListener('click', closeFileMenu);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadEstimateDetails = async () => {
      if (!bid?.id) {
        return;
      }

      setIsEstimateLoading(true);
      try {
        const response = await getBidCostDetails(bid.id);
        if (!isMounted || response?.success === false) {
          return;
        }

        setHasSavedEstimate(Boolean(response?.data?.is_saved ?? response?.is_saved));
        const estimateItems = response?.data?.items || response?.items || [];
        setSavedEstimateTotals({
          sub_total: Number(response?.data?.sub_total ?? response?.sub_total ?? bid?.grand_total ?? bid?.bid_value ?? 0) || 0,
          grand_total: Number(response?.data?.grand_total ?? response?.grand_total ?? bid?.grand_total ?? bid?.bid_value ?? 0) || 0,
        });
        setBidItems(normalizeEstimateItemsFromApi(estimateItems));
        setIsEstimateDirty(false);
      } catch (error) {
        if (isMounted) {
          onNotify?.(error.message || 'Failed to load estimate cost details', false);
        }
      } finally {
        if (isMounted) {
          setIsEstimateLoading(false);
        }
      }
    };

    loadEstimateDetails();

    return () => {
      isMounted = false;
    };
  }, [bid?.id, onNotify]);

  const estimateRecipientsKey = useMemo(() => estimateRecipients.map((r) => r.id).join(','), [estimateRecipients]);

  useEffect(() => {
    if (!estimateRecipients.length) {
      setSelectedEstimateRecipients([]);
      return;
    }

    setSelectedEstimateRecipients((current) => {
      // Keep already-selected ids that are still valid, otherwise pre-select the first
      const valid = current.filter((id) => estimateRecipients.some((r) => r.id === id));
      return valid.length > 0 ? valid : [estimateRecipients[0].id];
    });
  }, [estimateRecipientsKey]);

  const calculateSubTotal = () => {
    return bidItems.reduce((sum, item) => {
      const quantity = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      return sum + (quantity * rate);
    }, 0);
  };

  const subTotal = calculateSubTotal();
  const displaySubTotal = hasSavedEstimate && !isEstimateDirty ? savedEstimateTotals.sub_total : subTotal;
  const displayGrandTotal = hasSavedEstimate && !isEstimateDirty ? savedEstimateTotals.grand_total : subTotal;
  const formattedSubTotal = `$${displaySubTotal.toFixed(2)}`;
  const formattedGrandTotal = `$${displayGrandTotal.toFixed(2)}`;
  const canSaveEstimate = isEstimateDirty && !isEstimateLoading && !isEstimateSaveLoading && !isEstimateActionLoading;
  const areEstimateActionsEnabled = hasSavedEstimate && !isEstimateDirty && !isEstimateLoading && !isEstimateSaveLoading && !isEstimateActionLoading;

  const buildEstimatePayload = useCallback(() => {
    const items = bidItems
      .map((item, index) => {
        const quantity = Number(item.qty) || 0;
        const rate = Number(item.rate) || 0;
        return {
          id: item.id,
          item: item.item || `Item ${index + 1}`,
          description: item.description || '',
          quantity,
          rate,
          price: quantity * rate,
        };
      })
      .filter((item) => item.item || item.description || item.quantity || item.rate || item.price);

    return {
      items,
      sub_total: subTotal,
      grand_total: subTotal,
    };
  }, [bidItems, subTotal]);

  const persistEstimateDetails = useCallback(async () => {
    if (!bid?.id) {
      throw new Error('Bid id is missing. Unable to process estimate.');
    }

    setIsEstimateSaveLoading(true);

    try {
      const response = await saveBidCostDetails(bid.id, buildEstimatePayload());
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to save estimate cost details');
      }

      const savedItems = response?.data?.items || response?.items;
      if (Array.isArray(savedItems)) {
        setBidItems(normalizeEstimateItemsFromApi(savedItems));
      }

      const savedBidValue = Number(
        response?.data?.bid_value
        ?? response?.data?.grand_total
        ?? response?.bid_value
        ?? response?.grand_total
        ?? subTotal
      ) || 0;
      const savedSubTotal = Number(response?.data?.sub_total ?? response?.sub_total ?? subTotal) || 0;
      setSavedEstimateTotals({
        sub_total: savedSubTotal,
        grand_total: savedBidValue,
      });

      onBidUpdated?.({
        ...bid,
        grand_total: savedBidValue,
        bid_value: savedBidValue,
      });

      setHasSavedEstimate(true);
      setIsEstimateDirty(false);
      return response;
    } finally {
      setIsEstimateSaveLoading(false);
    }
  }, [bid, buildEstimatePayload, onBidUpdated, subTotal]);

  const handleSaveEstimate = useCallback(async () => {
    if (!isEstimateDirty) {
      return;
    }

    try {
      const response = await persistEstimateDetails();
      onNotify?.(response?.message || 'Estimate cost details saved successfully', true);
    } catch (error) {
      onNotify?.(error.message || 'Failed to save estimate cost details', false);
    }
  }, [isEstimateDirty, onNotify, persistEstimateDetails]);

  const mapFolderEntry = useCallback((folder) => ({
    id: `folder-${folder.id}`,
    entityId: folder.id,
    name: folder.folder_name,
    type: 'folder',
    size: Number(folder.total_size ?? folder.file_size ?? folder.size) || 0,
    fileCount: Number(folder.file_count ?? folder.fileCount) || 0,
    extension: '',
    lastModified: folder.updated_at || folder.created_at || '',
    raw: folder,
  }), []);

  const mapFileEntry = useCallback((file) => ({
    id: `file-${file.id}`,
    entityId: file.id,
    folderId: file.folder_id,
    name: file.file_name,
    type: 'file',
    size: Number(file.file_size) || 0,
    extension: String(file.file_name || '').split('.').pop() || '',
    lastModified: file.updated_at || file.created_at || '',
    raw: file,
  }), []);

  const loadFileManagerDirectory = useCallback(async (folder = null, trail = []) => {
    if (!bid?.id) {
      return;
    }

    setIsFileManagerLoading(true);
    setOpenEntryActionId(null);

    try {
      const [foldersResponse, filesResponse] = await Promise.all([
        getBidFolders(bid.id, folder?.id ?? null),
        folder?.id ? getBidFolderFiles(bid.id, folder.id) : getBidRootFiles(bid.id),
      ]);

      if (foldersResponse?.success === false) {
        throw new Error(foldersResponse?.message || 'Failed to load folders');
      }

      if (filesResponse?.success === false) {
        throw new Error(filesResponse?.message || 'Failed to load files');
      }

      const folders = foldersResponse?.folders || foldersResponse?.data?.folders || [];
      const files = filesResponse?.files || filesResponse?.data?.files || [];
      const resolvedFolder = filesResponse?.folder || filesResponse?.data?.folder || folder;

      setCurrentFolder(folder?.id ? resolvedFolder : null);
      setFolderTrail(trail);
      setFileManagerEntries([
        ...folders.map(mapFolderEntry),
        ...files.map(mapFileEntry),
      ]);
    } catch (error) {
      onNotify?.(error.message || 'Failed to load file manager data', false);
    } finally {
      setIsFileManagerLoading(false);
    }
  }, [bid?.id, mapFileEntry, mapFolderEntry, onNotify]);

  const refreshCurrentDirectory = useCallback(async () => {
    await loadFileManagerDirectory(currentFolder, folderTrail);
  }, [currentFolder, folderTrail, loadFileManagerDirectory]);

  useEffect(() => {
    if (activeOverviewTab !== 'files' || !bid?.id || hasInitializedFileManager) {
      return;
    }

    loadFileManagerDirectory(null, []);
    setHasInitializedFileManager(true);
  }, [activeOverviewTab, bid?.id, hasInitializedFileManager, loadFileManagerDirectory]);

  const resolveDownloadName = useCallback((headers, fallbackName) => {
    const contentDisposition = headers?.get?.('content-disposition') || '';
    const utf8FileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8FileNameMatch?.[1]) {
      return decodeURIComponent(utf8FileNameMatch[1]);
    }

    const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    return fileNameMatch?.[1] || fallbackName;
  }, []);

  const handlePreviewEstimate = useCallback(async () => {
    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to preview estimate.', false);
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.opener = null;
    }
    setIsEstimateActionLoading(true);

    try {
      const { blob } = await previewEstimatePdf(bid.id);
      const url = URL.createObjectURL(blob);

      if (previewWindow) {
        previewWindow.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      if (previewWindow) {
        previewWindow.close();
      }
      onNotify?.(error.message || 'Failed to preview estimate', false);
    } finally {
      setIsEstimateActionLoading(false);
    }
  }, [bid?.id, onNotify]);

  const handleDownloadEstimatePdf = useCallback(async () => {
    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to download estimate.', false);
      return;
    }

    setIsEstimateActionLoading(true);
    try {
      const { blob } = await downloadEstimatePdf(bid.id);
      triggerBlobDownload(blob, `${getEstimateFileBaseName(bid)}.pdf`);
      onNotify?.('Estimate PDF downloaded successfully', true);
    } catch (error) {
      onNotify?.(error.message || 'Failed to download estimate PDF', false);
    } finally {
      setIsEstimateActionLoading(false);
    }
  }, [bid, onNotify]);

  const handleDownloadEstimateExcel = useCallback(async () => {
    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to export estimate.', false);
      return;
    }

    setIsEstimateActionLoading(true);
    try {
      const excelContent = buildEstimateExcelContent(bid, bidItems, displaySubTotal, displayGrandTotal);
      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      triggerBlobDownload(blob, `${getEstimateFileBaseName(bid)}.xls`);
      onNotify?.('Estimate Excel exported successfully', true);
    } catch (error) {
      onNotify?.(error.message || 'Failed to export estimate Excel', false);
    } finally {
      setIsEstimateActionLoading(false);
    }
  }, [bid, bidItems, displayGrandTotal, displaySubTotal, onNotify]);

  const handleSendEstimateEmail = useCallback(async () => {
    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to send estimate.', false);
      return;
    }

    const recipientsToSend = estimateRecipients.filter((r) => selectedEstimateRecipients.includes(r.id));
    if (!recipientsToSend.length) {
      onNotify?.('Please select at least one recipient.', false);
      return;
    }

    const invalidRecipients = recipientsToSend.filter((r) => !r.email);
    if (invalidRecipients.length) {
      onNotify?.('One or more selected recipients have no email address.', false);
      return;
    }

    const emails = recipientsToSend.map((r) => r.email);
    const companyIds = recipientsToSend.map((r) => r.companyId).filter(Boolean);

    setIsEstimateActionLoading(true);
    try {
      await previewEstimatePdf(bid.id);
      // Single request — backend sends all emails and updates bid status once
      const response = await sendEstimatePdf(bid.id, emails, companyIds);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to send estimate email');
      }

      setShowEstimateShare(false);
      onNotify?.(response.message || `Estimate sent to ${emails.length} recipient${emails.length > 1 ? 's' : ''} successfully`, true);
      if (typeof onBack === 'function') {
        setTimeout(() => { onBack(); }, 1500);
      }
    } catch (error) {
      onNotify?.(error.message || 'Failed to send estimate email', false);
    } finally {
      setIsEstimateActionLoading(false);
    }
  }, [bid?.id, estimateRecipients, onNotify, onBack, selectedEstimateRecipients]);


  const handleOpenFolder = useCallback((entry) => {
    if (entry.type !== 'folder') {
      return;
    }

    const nextFolder = entry.raw;
    loadFileManagerDirectory(nextFolder, [...folderTrail, nextFolder]);
  }, [folderTrail, loadFileManagerDirectory]);

  const handleNavigateToTrailIndex = useCallback((index) => {
    if (index < 0) {
      loadFileManagerDirectory(null, []);
      return;
    }

    const nextTrail = folderTrail.slice(0, index + 1);
    loadFileManagerDirectory(nextTrail[nextTrail.length - 1], nextTrail);
  }, [folderTrail, loadFileManagerDirectory]);

  const handleCreateFolder = useCallback(async () => {
    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to create folder.', false);
      return;
    }

    const folderName = window.prompt('Enter folder name');
    if (folderName === null) {
      return;
    }

    const trimmedFolderName = folderName.trim();
    if (!trimmedFolderName) {
      onNotify?.('Folder name is required.', false);
      return;
    }

    setIsFileManagerActionLoading(true);
    try {
      const response = await createBidFolder(bid.id, {
        folder_name: trimmedFolderName,
        parent_id: currentFolder?.id ?? null,
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to create folder');
      }

      await refreshCurrentDirectory();
      onNotify?.(response.message || 'Folder created successfully', true);
    } catch (error) {
      onNotify?.(error.message || 'Failed to create folder', false);
    } finally {
      setIsFileManagerActionLoading(false);
    }
  }, [bid?.id, currentFolder?.id, onNotify, refreshCurrentDirectory]);

  const handleUploadFilesClick = useCallback(() => {
    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to upload files.', false);
      return;
    }

    uploadFileInputRef.current?.click();
  }, [bid?.id, onNotify]);

  const handleUploadFolderClick = useCallback(() => {
    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to upload folder.', false);
      return;
    }

    uploadFolderInputRef.current?.click();
  }, [bid?.id, onNotify]);

  const getOrCreateFolderByName = useCallback(async (parentFolder, folderName) => {
    const foldersResponse = await getBidFolders(bid.id, parentFolder?.id ?? null);
    if (foldersResponse?.success === false) {
      throw new Error(foldersResponse?.message || 'Failed to load folders');
    }

    const folders = foldersResponse?.folders || foldersResponse?.data?.folders || [];
    const existingFolder = folders.find((folder) => folder.folder_name?.toLowerCase() === folderName.toLowerCase());
    if (existingFolder) {
      return existingFolder;
    }

    const response = await createBidFolder(bid.id, {
      folder_name: folderName,
      parent_id: parentFolder?.id ?? null,
    });

    if (!response?.success) {
      throw new Error(response?.message || `Failed to create folder ${folderName}`);
    }

    return response?.folder || response?.data?.folder;
  }, [bid?.id]);

  const getOrCreateFolderPath = useCallback(async (pathParts) => {
    let parentFolder = currentFolder || null;

    for (const folderName of pathParts) {
      parentFolder = await getOrCreateFolderByName(parentFolder, folderName);
    }

    return parentFolder;
  }, [currentFolder, getOrCreateFolderByName]);

  const handleUploadFiles = useCallback(async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) {
      return;
    }

    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to upload files.', false);
      event.target.value = '';
      return;
    }

    setIsFileManagerActionLoading(true);
    let uploadedCount = 0;
    const failedUploads = [];

    try {
      for (const file of selectedFiles) {
        try {
          const response = currentFolder?.id
            ? await uploadBidFolderFile(bid.id, currentFolder.id, file)
            : await uploadBidRootFile(bid.id, file);
          if (!response?.success) {
            throw new Error(response?.message || 'Upload failed');
          }
          uploadedCount += 1;
        } catch (error) {
          failedUploads.push(`${file.name}: ${error.message || 'Upload failed'}`);
        }
      }

      if (uploadedCount > 0) {
        await refreshCurrentDirectory();
      }

      if (uploadedCount > 0 && failedUploads.length === 0) {
        onNotify?.(`${uploadedCount} file${uploadedCount === 1 ? '' : 's'} uploaded successfully`, true);
      } else if (uploadedCount > 0) {
        onNotify?.(`${uploadedCount} file${uploadedCount === 1 ? '' : 's'} uploaded. ${failedUploads.length} failed.`, false);
      } else if (failedUploads.length > 0) {
        onNotify?.(failedUploads[0], false);
      }
    } finally {
      event.target.value = '';
      setIsFileManagerActionLoading(false);
    }
  }, [bid?.id, currentFolder?.id, onNotify, refreshCurrentDirectory]);

  const handleUploadFolder = useCallback(async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) {
      return;
    }

    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to upload folder.', false);
      event.target.value = '';
      return;
    }

    setIsFileManagerActionLoading(true);
    let uploadedCount = 0;
    const failedUploads = [];

    try {
      for (const file of selectedFiles) {
        try {
          const relativePath = file.webkitRelativePath || file.name;
          const pathParts = relativePath.split('/').filter(Boolean);
          const fileName = pathParts.pop() || file.name;
          const targetFolder = pathParts.length > 0 ? await getOrCreateFolderPath(pathParts) : currentFolder;
          const response = targetFolder?.id
            ? await uploadBidFolderFile(bid.id, targetFolder.id, file, fileName)
            : await uploadBidRootFile(bid.id, file, '', fileName);

          if (!response?.success) {
            throw new Error(response?.message || 'Upload failed');
          }

          uploadedCount += 1;
        } catch (error) {
          failedUploads.push(`${file.name}: ${error.message || 'Upload failed'}`);
        }
      }

      if (uploadedCount > 0) {
        await refreshCurrentDirectory();
      }

      if (uploadedCount > 0 && failedUploads.length === 0) {
        onNotify?.(`${uploadedCount} file${uploadedCount === 1 ? '' : 's'} uploaded successfully`, true);
      } else if (uploadedCount > 0) {
        onNotify?.(`${uploadedCount} file${uploadedCount === 1 ? '' : 's'} uploaded. ${failedUploads.length} failed.`, false);
      } else if (failedUploads.length > 0) {
        onNotify?.(failedUploads[0], false);
      }
    } finally {
      event.target.value = '';
      setIsFileManagerActionLoading(false);
    }
  }, [bid?.id, currentFolder, getOrCreateFolderPath, onNotify, refreshCurrentDirectory]);

  const handleRenameEntry = useCallback(async (entry) => {
    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to rename item.', false);
      return;
    }

    const fieldLabel = entry.type === 'folder' ? 'folder' : 'file';
    const nextName = window.prompt(`Enter ${fieldLabel} name`, entry.name);
    setOpenEntryActionId(null);

    if (nextName === null) {
      return;
    }

    const trimmedName = nextName.trim();
    if (!trimmedName) {
      onNotify?.(`${fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1)} name is required.`, false);
      return;
    }

    if (trimmedName === entry.name) {
      return;
    }

    setIsFileManagerActionLoading(true);
    try {
      const response = entry.type === 'folder'
        ? await renameBidFolder(bid.id, entry.entityId, trimmedName)
        : await renameBidFolderFile(bid.id, entry.folderId, entry.entityId, trimmedName);

      if (!response?.success) {
        throw new Error(response?.message || `Failed to rename ${fieldLabel}`);
      }

      await refreshCurrentDirectory();
      onNotify?.(response.message || `${fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1)} renamed successfully`, true);
    } catch (error) {
      onNotify?.(error.message || `Failed to rename ${fieldLabel}`, false);
    } finally {
      setIsFileManagerActionLoading(false);
    }
  }, [bid?.id, onNotify, refreshCurrentDirectory]);

  const handleDeleteEntry = useCallback(async (entry) => {
    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to delete item.', false);
      return;
    }

    const itemLabel = entry.type === 'folder' ? 'folder' : 'file';
    const confirmed = window.confirm(`Delete ${itemLabel} "${entry.name}"?`);
    setOpenEntryActionId(null);

    if (!confirmed) {
      return;
    }

    setIsFileManagerActionLoading(true);
    try {
      const response = entry.type === 'folder'
        ? await deleteBidFolder(bid.id, entry.entityId)
        : await deleteBidFolderFile(bid.id, entry.folderId, entry.entityId);

      if (!response?.success) {
        throw new Error(response?.message || `Failed to delete ${itemLabel}`);
      }

      await refreshCurrentDirectory();
      onNotify?.(response.message || `${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} deleted successfully`, true);
    } catch (error) {
      onNotify?.(error.message || `Failed to delete ${itemLabel}`, false);
    } finally {
      setIsFileManagerActionLoading(false);
    }
  }, [bid?.id, onNotify, refreshCurrentDirectory]);

  const handleDownloadFile = useCallback(async (entry) => {
    if (!bid?.id || entry.type !== 'file') {
      return;
    }

    setIsFileManagerActionLoading(true);
    try {
      const { blob, headers } = await downloadBidFolderFile(bid.id, entry.folderId, entry.entityId);
      triggerBlobDownload(blob, resolveDownloadName(headers, entry.name));
      onNotify?.(`Downloaded ${entry.name}`, true);
    } catch (error) {
      onNotify?.(error.message || `Failed to download ${entry.name}`, false);
    } finally {
      setIsFileManagerActionLoading(false);
    }
  }, [bid?.id, onNotify, resolveDownloadName]);

  const resolvePreviewMime = useCallback((blob, extension) => {
    if (blob?.type && blob.type !== 'application/octet-stream') {
      return blob.type;
    }

    const ext = String(extension || '').toLowerCase();
    const map = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      ico: 'image/x-icon',
      txt: 'text/plain',
      log: 'text/plain',
      md: 'text/markdown',
      csv: 'text/csv',
      json: 'application/json',
      xml: 'application/xml',
      html: 'text/html',
      htm: 'text/html',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
    };
    return map[ext] || '';
  }, []);

  const revokePreviewBlobUrl = useCallback(() => {
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current);
      previewBlobUrlRef.current = '';
    }
  }, []);

  const handleClosePreview = useCallback(() => {
    previewRequestIdRef.current += 1;
    revokePreviewBlobUrl();
    setPreviewBlobUrl('');
    setPreviewEntry(null);
    setPreviewMime('');
    setPreviewTextContent('');
    setPreviewError('');
    setIsPreviewLoading(false);
  }, [revokePreviewBlobUrl]);

  const handlePreviewFile = useCallback(async (entry) => {
    if (!bid?.id || entry.type !== 'file') {
      return;
    }

    const requestId = previewRequestIdRef.current + 1;
    previewRequestIdRef.current = requestId;

    revokePreviewBlobUrl();
    setOpenEntryActionId(null);
    setPreviewEntry(entry);
    setPreviewError('');
    setPreviewTextContent('');
    setPreviewMime('');
    setPreviewBlobUrl('');
    setIsPreviewLoading(true);

    try {
      const { blob } = await downloadBidFolderFile(bid.id, entry.folderId, entry.entityId);
      if (previewRequestIdRef.current !== requestId) {
        return;
      }

      const mime = resolvePreviewMime(blob, entry.extension);
      const typedBlob = mime && blob.type !== mime ? new Blob([blob], { type: mime }) : blob;
      const objectUrl = URL.createObjectURL(typedBlob);
      previewBlobUrlRef.current = objectUrl;
      setPreviewBlobUrl(objectUrl);
      setPreviewMime(mime || typedBlob.type || '');

      const isTextLike = (
        (mime.startsWith('text/') && mime !== 'text/html')
        || mime === 'application/json'
        || mime === 'application/xml'
      );

      if (isTextLike) {
        try {
          const text = await typedBlob.text();
          if (previewRequestIdRef.current === requestId) {
            setPreviewTextContent(text);
          }
        } catch {
          // Ignore - fallback to iframe rendering.
        }
      }
    } catch (error) {
      if (previewRequestIdRef.current === requestId) {
        setPreviewError(error.message || `Failed to open ${entry.name}`);
      }
    } finally {
      if (previewRequestIdRef.current === requestId) {
        setIsPreviewLoading(false);
      }
    }
  }, [bid?.id, resolvePreviewMime, revokePreviewBlobUrl]);

  const handleOpenPreviewInNewTab = useCallback(() => {
    if (!previewBlobUrl) return;
    window.open(previewBlobUrl, '_blank', 'noopener,noreferrer');
  }, [previewBlobUrl]);

  const handleDownloadFromPreview = useCallback(async () => {
    if (!previewEntry) return;
    await handleDownloadFile(previewEntry);
  }, [previewEntry, handleDownloadFile]);

  // Revoke any active blob URL on unmount.
  useEffect(() => () => {
    revokePreviewBlobUrl();
  }, [revokePreviewBlobUrl]);

  // Close preview when the bid changes.
  useEffect(() => {
    handleClosePreview();
  }, [bid?.id, handleClosePreview]);

  // Close preview on Escape key.
  useEffect(() => {
    if (!previewEntry) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClosePreview();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [previewEntry, handleClosePreview]);

  const handleBidItemChange = (id, field, value) => {
    setIsEstimateDirty(true);
    setBidItems((items) => items.map((item) => (
      item.id === id ? (() => {
        const formattedValue = field === 'item' || field === 'description'
          ? capitalizeFirstCharacter(value)
          : value;
        const nextItem = { ...item, [field]: formattedValue };

        if (field === 'qty' || field === 'rate') {
          const qty = Number(field === 'qty' ? formattedValue : nextItem.qty) || 0;
          const rate = Number(field === 'rate' ? formattedValue : nextItem.rate) || 0;
          const price = qty * rate;
          nextItem.price = price ? price.toFixed(2) : '';
        }

        return nextItem;
      })() : item
    )));
  };

  const handleAddBidItem = (afterId) => {
    const newItem = { id: Date.now(), item: '', description: '', qty: '', rate: '', price: '' };
    setIsEstimateDirty(true);
    setBidItems((items) => {
      const index = items.findIndex((item) => item.id === afterId);
      if (index === -1) return [...items, newItem];
      return [
        ...items.slice(0, index + 1),
        newItem,
        ...items.slice(index + 1),
      ];
    });
  };

  const handleRemoveBidItem = (id) => {
    setIsEstimateDirty(true);
    setBidItems((items) => (
      items.length > 1 ? items.filter((item) => item.id !== id) : items
    ));
  };

  const saveBidChanges = async (overrides, successMessage) => {
    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to update bid.', false);
      return false;
    }

    try {
      const response = await updateBids(bid.id, buildBidUpdatePayload(bid, overrides));
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to update bid');
      }

      const updatedBid = {
        ...bid,
        ...overrides,
      };
      onBidUpdated?.(updatedBid);
      onNotify?.(response.message || successMessage, true);
      return true;
    } catch (error) {
      onNotify?.(error.message || 'Failed to update bid', false);
      return false;
    }
  };

  const handleSaveScopeExclusionAndNotes = async ({ scopeOfWork: nextScopeOfWork, exclusion: nextExclusion, accessNotes: nextAccessNotes, activeTab }) => {
    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to update bid.', false);
      return;
    }

    try {
      const payload = {};
      if (activeTab === 'sow') {
        payload.scope_of_work = nextScopeOfWork;
      } else if (activeTab === 'exclusion') {
        payload.exclusion = nextExclusion;
      } else if (activeTab === 'notes') {
        payload.access_notes = nextAccessNotes;
      }

      const response = await updateBid(bid.id, payload);

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to update bid details');
      }

      if (activeTab === 'sow') {
        setScopeOfWork(nextScopeOfWork);
        onBidUpdated?.({
          ...bid,
          scope_of_work: nextScopeOfWork,
        });
      } else if (activeTab === 'exclusion') {
        setExclusion(nextExclusion);
        onBidUpdated?.({
          ...bid,
          exclusion: nextExclusion,
        });
      } else if (activeTab === 'notes') {
        setAccessNotes(nextAccessNotes);
        onBidUpdated?.({
          ...bid,
          access_notes: nextAccessNotes,
        });
      }
      onNotify?.(response.message || 'Bid details updated successfully', true);
    } catch (error) {
      onNotify?.(error.message || 'Failed to update bid details', false);
    }
  };

  const isPinned = Boolean(bid?.is_pinned === 1 || bid?.isPinned === 1 || bid?.is_pinned === true || bid?.isPinned === true);

  const handleTogglePin = async () => {
    if (!bid?.id) {
      onNotify?.('Bid id is missing. Unable to update pin status.', false);
      return;
    }

    try {
      const response = isPinned ? await unpinBid(bid.id) : await pinBid(bid.id);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to update pin status');
      }

      onBidUpdated?.({
        ...bid,
        is_pinned: isPinned ? 0 : 1,
      });

      onNotify?.(response.message || `Project ${isPinned ? 'unpinned' : 'pinned'} successfully`, true);
    } catch (error) {
      onNotify?.(error.message || 'Failed to update pin status', false);
    }
  };

  return (
    <div className={styles.bidOverviewPage}>
      {onBack && (
        <button
          type="button"
          className={styles.bidOverviewBackArrow}
          onClick={onBack}
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <div className={styles.bidOverviewTopBar}>
        <div className={styles.bidOverviewTabs}>
          {isSalesOrCRM ? (
            <>
              <button
                type="button"
                className={`${styles.bidOverviewTab} ${activeOverviewTab === 'overview' ? styles.bidOverviewTabActive : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`${styles.bidOverviewTab} ${activeOverviewTab === 'tables' ? styles.bidOverviewTabActive : ''}`}
                onClick={() => handleTabChange('tables')}
              >
                Tables
              </button>
              <button
                type="button"
                className={`${styles.bidOverviewTab} ${activeOverviewTab === 'files' ? styles.bidOverviewTabActive : ''}`}
                onClick={() => handleTabChange('files')}
              >
                Files
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`${styles.bidOverviewTab} ${activeOverviewTab === 'overview' ? styles.bidOverviewTabActive : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`${styles.bidOverviewTab} ${activeOverviewTab === 'tables' ? styles.bidOverviewTabActive : ''}`}
                onClick={() => handleTabChange('tables')}
              >
                Table
              </button>
              <button
                type="button"
                className={`${styles.bidOverviewTab} ${activeOverviewTab === 'files' ? styles.bidOverviewTabActive : ''}`}
                onClick={() => handleTabChange('files')}
              >
                Files
              </button>
              <button
                type="button"
                className={`${styles.bidOverviewTab} ${activeOverviewTab === 'rfis' ? styles.bidOverviewTabActive : ''}`}
                onClick={() => handleTabChange('rfis')}
              >
                RFIs
              </button>
              <button
                type="button"
                className={`${styles.bidOverviewTab} ${activeOverviewTab === 'submittals' ? styles.bidOverviewTabActive : ''}`}
                onClick={() => handleTabChange('submittals')}
              >
                Submittals
              </button>
              {/* <button
                type="button"
                className={`${styles.bidOverviewTab} ${activeOverviewTab === 'documents' ? styles.bidOverviewTabActive : ''}`}
                onClick={() => handleTabChange('documents')}
              >
                Documents
              </button> */}
              <button
                type="button"
                className={`${styles.bidOverviewTab} ${activeOverviewTab === 'vendors' ? styles.bidOverviewTabActive : ''}`}
                onClick={() => handleTabChange('vendors')}
              >
                Vendors
              </button>
              <button
                type="button"
                className={`${styles.bidOverviewTab} ${activeOverviewTab === 'financials' ? styles.bidOverviewTabActive : ''}`}
                onClick={() => handleTabChange('financials')}
              >
                Financials & Admin
              </button>
              <button
                type="button"
                className={`${styles.bidOverviewTab} ${activeOverviewTab === 'gallery' ? styles.bidOverviewTabActive : ''}`}
                onClick={() => handleTabChange('gallery')}
              >
                Gallery
              </button>
              <button
                type="button"
                className={styles.headerCompleteBtn}
                disabled={String(bid?.project_status || '').toLowerCase() === 'completed' || String(bid?.status || '').toLowerCase() !== 'won' || !vendors.some((v) => v.status === 'approved')}
                title={String(bid?.status || '').toLowerCase() !== 'won' ? "Project must be 'Won' to be completed" : !vendors.some((v) => v.status === 'approved') ? "Vendor proposal must be approved by admin to complete" : "Mark Project as Completed"}
                onClick={async () => {
                  if (String(bid?.project_status || '').toLowerCase() === 'completed') {
                    if (onNotify) onNotify('Project is already completed.', false);
                    return;
                  }
                  if (!window.confirm('Are you sure you want to mark this project as COMPLETED? This action cannot be undone.')) return;
                  try {
                    const res = await completeProject(bid.id);
                    if (res?.success === false) throw new Error(res?.message || 'Failed to complete project');
                    if (onNotify) onNotify('Project marked as completed successfully', true);
                    if (onBidUpdated) onBidUpdated();
                  } catch (err) {
                    if (onNotify) onNotify(err.message || 'Failed to complete project', false);
                  }
                }}
                style={{
                  padding: '8px 16px', borderRadius: 8, background: String(bid?.project_status || '').toLowerCase() === 'completed' ? '#027A48' : '#039855',
                  color: '#fff', border: 'none', fontSize: 14, fontWeight: 500, cursor: String(bid?.project_status || '').toLowerCase() === 'completed' || String(bid?.status || '').toLowerCase() !== 'won' || !vendors.some((v) => v.status === 'approved') ? 'not-allowed' : 'pointer',
                  opacity: String(bid?.status || '').toLowerCase() !== 'won' || !vendors.some((v) => v.status === 'approved') ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {String(bid?.project_status || '').toLowerCase() === 'completed' ? 'Completed' : 'Complete'}
              </button>
            </>
          )}
        </div>
      </div>

      {activeOverviewTab === 'overview' ? (
        <>
          <div className={styles.bidOverviewCard}>
            <div className={styles.bidOverviewInfo}>
              <div className={styles.bidOverviewTitleRow}>
                <div>
                  <h1>{bid.project_name || 'Untitled Project'}</h1>
                  <p>{getSalesBidDisplayId(bid)}</p>
                </div>
                <div className={styles.bidOverviewTitleRowActions}>
                  <span>Due Date: {formatBidDetailDate(bid.due_date)}</span>
                  {onEdit && String(bid?.project_status || '').toLowerCase() !== 'completed' ? (
                    <button type="button" className={styles.bidIconButton} onClick={onEdit} aria-label="Edit bid">
                      <svg className={styles.editIconSvg} width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.84986 11.9778H12.3499M0.649902 11.9778L3.92439 11.318C4.09822 11.283 4.25784 11.1974 4.38319 11.0719L11.7134 3.73767C12.0649 3.38603 12.0647 2.81604 11.7129 2.46469L10.1601 0.913635C9.8085 0.562434 9.2388 0.562673 8.88749 0.914169L1.55647 8.24921C1.43136 8.37439 1.34594 8.53367 1.31088 8.70715L0.649902 11.9778Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              </div>

              <div className={styles.bidOverviewFields}>
                <span>General Contractor</span>
                <strong>{groupedContractors.map((c) => c.name).join(', ') || 'N/A'}</strong>
                <span>DWG Description</span>
                <strong>{bid.drawing_description || bid.dwg_description || 'N/A'}</strong>
                <span>DWG Date</span>
                <strong>{formatBidDetailDate(bid.drawing_date || bid.dwg_date)}</strong>
                <span>Tax Exempt</span>
                <TogglePreview styles={styles} checked={toToggleBoolean(bid.tax_exempt)} />
                <span>DB Wage Rate</span>
                <TogglePreview styles={styles} checked={toToggleBoolean(bid.db_wage_rate)} />
                <span>Fringes Amount (in $)</span>
                <AmountPreview styles={styles} value={bid.fringes_amount} />
                <span>Base Amount (in $)</span>
                <AmountPreview styles={styles} value={bid.base_contract_amount || bid.base_amount} />
                <span>Deckers & Joist</span>
                <TogglePreview styles={styles} checked={toToggleBoolean(bid.deckers_joist || bid.deckers_and_joist)} />
              </div>
            </div>

            <div className={styles.bidMapCard}>
              {googleMapsEmbedUrl ? (
                <iframe
                  className={styles.bidMapPreview}
                  title={`Map for ${mapAddress}`}
                  src={googleMapsEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div className={`${styles.bidMapPreview} ${styles.bidMapUnavailable}`}>
                  Address not available
                </div>
              )}
              <div className={styles.bidMapAddress}>
                <span>{bid.address || 'Address not available'}</span>
                <button
                  type="button"
                  className={styles.bidIconButton}
                  aria-label="Open address in Google Maps"
                  title="Open in Google Maps"
                  disabled={!googleMapsUrl}
                  onClick={() => {
                    if (googleMapsUrl) {
                      window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  <LocationPinIcon />
                </button>
              </div>
              <div className={styles.bidMapMeta}>
                Estimated Travel Time: {travelInfo.time} <span /> Distance: {travelInfo.distance}
              </div>
            </div>
          </div>

          <div className={styles.bidOverviewGrid}>
            <section className={styles.bidOverviewPanel}>
              <h2>General Contractor</h2>
              <div className={styles.contractorList}>
                {groupedContractors.map((contractor) => {
                  const contractorEmployees = getEmployeesForContractor(contractor);
                  return (
                    <div key={contractor.id} className={styles.contractorGroup}>
                      <h3>{contractor.name}</h3>
                      {contractorEmployees.length > 0 ? (
                        contractorEmployees.map((employee) => (
                          <div key={employee.id} className={styles.contractorPerson}>
                            <span>
                              {employee.firstName || employee.lastName
                                ? `${employee.firstName} ${employee.lastName}`.trim()
                                : employee.fallbackName || 'N/A'}
                            </span>
                            <div className={styles.contractorActions}>
                              {employee.phone ? (
                                <a
                                  href={`tel:${employee.phone}`}
                                  className={styles.bidIconButton}
                                  title={`Call ${employee.phone}`}
                                  aria-label={`Call ${employee.firstName || ''}`}
                                >
                                  <ContactActionIcon type="phone" />
                                </a>
                              ) : null}
                              {employee.email ? (
                                <a
                                  href={`mailto:${employee.email}`}
                                  className={styles.bidIconButton}
                                  title={`Email ${employee.email}`}
                                  aria-label={`Email ${employee.firstName || ''}`}
                                >
                                  <ContactActionIcon type="mail" />
                                </a>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '8px 13px', fontSize: 13, color: '#85858F' }}>
                          No contacts available
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={styles.bidOverviewPanel}>
              <div className={styles.panelTitleRow}>
                <h2>Scope of Work</h2>
                {!isCompleted && (
                  <button
                    type="button"
                    className={styles.bidIconButton}
                    aria-label="Edit scope of work"
                    onClick={() => setTextEditorTab('sow')}
                  >
                    <svg className={styles.editIconSvg} width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.84986 11.9778H12.3499M0.649902 11.9778L3.92439 11.318C4.09822 11.283 4.25784 11.1974 4.38319 11.0719L11.7134 3.73767C12.0649 3.38603 12.0647 2.81604 11.7129 2.46469L10.1601 0.913635C9.8085 0.562434 9.2388 0.562673 8.88749 0.914169L1.55647 8.24921C1.43136 8.37439 1.34594 8.53367 1.31088 8.70715L0.649902 11.9778Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
              <div className={styles.longTextPanel} dangerouslySetInnerHTML={{ __html: scopeOfWork }} />
            </section>

            <section className={styles.bidOverviewPanel}>
              <div className={styles.panelTitleRow}>
                <h2>Exclusion</h2>
                {!isCompleted && (
                  <button
                    type="button"
                    className={styles.bidIconButton}
                    aria-label="Edit exclusion"
                    onClick={() => setTextEditorTab('exclusion')}
                  >
                    <svg className={styles.editIconSvg} width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.84986 11.9778H12.3499M0.649902 11.9778L3.92439 11.318C4.09822 11.283 4.25784 11.1974 4.38319 11.0719L11.7134 3.73767C12.0649 3.38603 12.0647 2.81604 11.7129 2.46469L10.1601 0.913635C9.8085 0.562434 9.2388 0.562673 8.88749 0.914169L1.55647 8.24921C1.43136 8.37439 1.34594 8.53367 1.31088 8.70715L0.649902 11.9778Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
              <div className={styles.longTextPanel} dangerouslySetInnerHTML={{ __html: exclusion }} />
            </section>
          </div>

          {/* Project Status + Project Access Notes (Only in Projects view - i.e. when isSalesOrCRM is false) */}
          {!isSalesOrCRM && (
            <>
              {/* Row 3: Project Status + Access Notes */}
              <div className={styles.bidOverviewGrid} style={{ marginTop: 24 }}>
                {/* Left - Project Status */}
                {/* <section className={styles.bidOverviewPanel}>
                  <h2>Project Status</h2>
                  <p className={styles.statusSubtitle} style={{ fontSize: 13, color: '#667085', margin: '4px 0 16px' }}>Initiate Project</p>

                  <table className={styles.statusTable} style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #F2F4F7' }}>
                        <td style={{ padding: '10px 0', fontSize: 14, color: '#475467', width: '50%' }}>DSC Status :</td>
                        <td style={{ padding: '10px 0', fontSize: 14, fontWeight: 500, color: '#101828' }}>Briefed</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F2F4F7' }}>
                        <td style={{ padding: '10px 0', fontSize: 14, color: '#475467' }}>Contract Status :</td>
                        <td style={{ padding: '10px 0', fontSize: 14, fontWeight: 500, color: '#101828' }}>Not Signed</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F2F4F7' }}>
                        <td style={{ padding: '10px 0', fontSize: 14, color: '#475467' }}>Col Status :</td>
                        <td style={{ padding: '10px 0', fontSize: 14, fontWeight: 500, color: '#101828' }}>Approved</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F2F4F7' }}>
                        <td style={{ padding: '10px 0', fontSize: 14, color: '#475467' }}>Engineering :</td>
                        <td style={{ padding: '10px 0', fontSize: 14 }}>
                          <div className={styles.dropdownContainer} style={{ position: 'relative', display: 'inline-block' }}>
                            <span
                              className={styles.dropdownIndicator}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                cursor: 'pointer',
                                color: '#344054',
                                fontWeight: 500,
                                padding: '6px 12px',
                                borderRadius: 6,
                                background: '#FFFFFF',
                                border: '1px solid #D0D5DD',
                                fontSize: 13
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === 'engineering' ? null : 'engineering');
                              }}
                            >
                              {engineeringStatus}
                              <ChevronDownIcon />
                            </span>
                            {activeDropdown === 'engineering' && (
                              <div
                                className={styles.dropdownMenu}
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  marginTop: 4,
                                  background: '#FFFFFF',
                                  border: '1px solid #EAECF0',
                                  borderRadius: 8,
                                  boxShadow: '0px 4px 10px rgba(16, 24, 40, 0.08)',
                                  zIndex: 100,
                                  minWidth: 140
                                }}
                              >
                                <div
                                  className={styles.dropdownItem}
                                  style={{ padding: '10px 14px', fontSize: 13, color: '#344054', cursor: 'pointer' }}
                                  onClick={() => {
                                    handleEngineeringStatusChange('Released');
                                    setActiveDropdown(null);
                                  }}
                                >
                                  Released
                                </div>
                                <div
                                  className={styles.dropdownItem}
                                  style={{ padding: '10px 14px', fontSize: 13, color: '#344054', cursor: 'pointer' }}
                                  onClick={() => {
                                    handleEngineeringStatusChange('Unreleased');
                                    setActiveDropdown(null);
                                  }}
                                >
                                  Unreleased
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px 0', fontSize: 14, color: '#475467' }}>Deckers & Joist Status :</td>
                        <td style={{ padding: '10px 0', fontSize: 14 }}>
                          <div className={styles.dropdownContainer} style={{ position: 'relative', display: 'inline-block' }}>
                            <span
                              className={styles.dropdownIndicator}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                cursor: 'pointer',
                                color: '#344054',
                                fontWeight: 500,
                                padding: '6px 12px',
                                borderRadius: 6,
                                background: '#FFFFFF',
                                border: '1px solid #D0D5DD',
                                fontSize: 13
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === 'deckers' ? null : 'deckers');
                              }}
                            >
                              {deckersJoistStatus}
                              <ChevronDownIcon />
                            </span>
                            {activeDropdown === 'deckers' && (
                              <div
                                className={styles.dropdownMenu}
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  marginTop: 4,
                                  background: '#FFFFFF',
                                  border: '1px solid #EAECF0',
                                  borderRadius: 8,
                                  boxShadow: '0px 4px 10px rgba(16, 24, 40, 0.08)',
                                  zIndex: 100,
                                  minWidth: 140
                                }}
                              >
                                <div
                                  className={styles.dropdownItem}
                                  style={{ padding: '10px 14px', fontSize: 13, color: '#344054', cursor: 'pointer' }}
                                  onClick={() => {
                                    handleDeckersJoistStatusChange('Released');
                                    setActiveDropdown(null);
                                  }}
                                >
                                  Released
                                </div>
                                <div
                                  className={styles.dropdownItem}
                                  style={{ padding: '10px 14px', fontSize: 13, color: '#344054', cursor: 'pointer' }}
                                  onClick={() => {
                                    handleDeckersJoistStatusChange('Unreleased');
                                    setActiveDropdown(null);
                                  }}
                                >
                                  Unreleased
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </section> */}

                {/* Right - Project Access Notes */}
                <section className={styles.bidOverviewPanel}>
                  <div className={styles.panelTitleRow}>
                    <h2>Project Access Notes</h2>
                    {!isCompleted && (
                      <button
                        type="button"
                        className={styles.bidIconButton}
                        aria-label="Edit notes"
                        onClick={() => setTextEditorTab('notes')}
                      >
                        <svg className={styles.editIconSvg} width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7.84986 11.9778H12.3499M0.649902 11.9778L3.92439 11.318C4.09822 11.283 4.25784 11.1974 4.38319 11.0719L11.7134 3.73767C12.0649 3.38603 12.0647 2.81604 11.7129 2.46469L10.1601 0.913635C9.8085 0.562434 9.2388 0.562673 8.88749 0.914169L1.55647 8.24921C1.43136 8.37439 1.34594 8.53367 1.31088 8.70715L0.649902 11.9778Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {isNotesEmpty(accessNotes) ? (
                    <div className={styles.emptyStateContainer}>
                      <svg width="120" height="100" viewBox="100 5 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M202.084 36.4848L180.956 99.69C180.015 102.504 176.971 104.023 174.157 103.082L109.042 81.3162C106.227 80.3755 104.709 77.3315 105.649 74.517L126.777 11.3116C127.718 8.4974 130.762 6.97852 133.576 7.9192L198.691 29.6854C201.505 30.6263 203.024 33.6703 202.084 36.4848Z" fill="#48B5EE" />
                        <path d="M206.142 20.8993L211.609 87.3181C211.852 90.2754 209.652 92.8703 206.695 93.1137L138.269 98.7457C135.312 98.9891 132.717 96.7891 132.474 93.8315L127.007 27.4128C126.763 24.4555 128.964 21.8606 131.921 21.6172L200.346 15.9852C203.304 15.7417 205.899 17.942 206.142 20.8993Z" fill="white" />
                        <path d="M174.25 19.4377C174.25 23.1311 171.249 26.1322 167.543 26.1322C163.849 26.1322 160.848 23.1313 160.848 19.4377C160.848 15.7314 163.849 12.7305 167.543 12.7305C171.249 12.7305 174.25 15.7314 174.25 19.4377Z" fill="#48B5EE" />
                        <path d="M207.202 20.8131C206.909 17.2917 203.842 14.6444 200.26 14.9264L174.919 17.0124C173.897 13.9142 170.979 11.6693 167.542 11.6693C164.556 11.6693 161.963 13.3709 160.667 15.8543L133.914 6.91143C130.553 5.78452 126.895 7.60865 125.769 10.9738L104.642 74.1787C103.517 77.5449 105.339 81.1975 108.704 82.3233L131.076 89.8016L131.415 93.9192C131.695 97.3233 134.546 99.8275 137.819 99.8275C137.998 99.8275 138.177 99.8202 138.357 99.8056L156.529 98.3097L173.819 104.089C177.218 105.224 180.849 103.36 181.963 100.027L183.273 96.1084L206.782 94.1733C210.327 93.8791 212.96 90.776 212.668 87.2312L207.202 20.8131ZM167.542 13.7943C170.655 13.7943 173.187 16.3263 173.187 19.4382C173.187 22.5438 170.655 25.0706 167.542 25.0706C164.437 25.0706 161.911 22.5438 161.911 19.4382C161.911 16.3263 164.438 13.7943 167.542 13.7943ZM109.379 80.3084C107.124 79.554 105.904 77.1072 106.657 74.8534L127.784 11.6484C128.535 9.40416 130.971 8.17059 133.239 8.92656L159.949 17.8547C159.922 17.9843 159.907 18.1179 159.886 18.2497L131.834 20.5588C128.298 20.8493 125.658 23.9634 125.948 27.5008L130.886 87.4976L109.379 80.3084ZM179.949 99.3528C179.194 101.608 176.744 102.826 174.494 102.075L161.908 97.8677L180.969 96.2987L179.949 99.3528ZM206.608 92.0547L138.183 97.6871C135.861 97.8952 133.73 96.153 133.534 93.7451L128.067 27.3265C127.871 24.9543 129.634 22.8711 132.009 22.6778L159.85 20.386C160.319 24.217 163.587 27.1958 167.542 27.1958C171.827 27.1958 175.312 23.7156 175.312 19.4382C175.312 19.3289 175.3 19.2227 175.296 19.1145L200.434 17.0452C202.783 16.8444 204.886 18.5946 205.083 20.9872L210.549 87.4057C210.747 89.7788 208.983 91.8594 206.608 92.0547Z" fill="#2324CA" />
                        <path d="M197.539 34.5938C198.124 34.545 198.559 34.0325 198.511 33.4471C198.464 32.8629 197.96 32.4386 197.365 32.4748L137.559 37.3974C136.974 37.4462 136.539 37.9587 136.587 38.544C136.633 39.0993 137.097 39.5194 137.645 39.5194C137.674 39.5194 137.703 39.5183 137.733 39.5164L197.539 34.5938Z" fill="#2324CA" />
                        <path d="M154.76 51.5239C155.346 51.4752 155.78 50.9627 155.733 50.3773C155.685 49.793 155.185 49.3646 154.586 49.405L138.656 50.7155C138.071 50.7643 137.636 51.2768 137.684 51.8621C137.729 52.4174 138.194 52.8375 138.742 52.8375C138.771 52.8375 138.8 52.8364 138.83 52.8345L154.76 51.5239Z" fill="#2324CA" />
                        <path d="M163.4 48.6787C162.815 48.7275 162.38 49.24 162.427 49.8254C162.473 50.3806 162.938 50.8008 163.486 50.8008C163.515 50.8008 163.544 50.7997 163.574 50.7977L198.635 47.9119C199.22 47.8632 199.655 47.3506 199.607 46.7653C199.559 46.181 199.063 45.7587 198.46 45.793L163.4 48.6787Z" fill="#2324CA" />
                        <path d="M199.557 59.1123L183.626 60.4239C183.041 60.4727 182.606 60.9852 182.653 61.5706C182.7 62.1258 183.164 62.5459 183.712 62.5459C183.741 62.5459 183.77 62.5448 183.8 62.5429L199.731 61.2313C200.317 61.1825 200.751 60.67 200.704 60.0846C200.655 59.4993 200.155 59.0696 199.557 59.1123Z" fill="#2324CA" />
                        <path d="M175.959 62.1213C175.911 61.5371 175.409 61.1096 174.812 61.149L139.752 64.0348C139.166 64.0836 138.732 64.5961 138.779 65.1814C138.825 65.7366 139.29 66.1568 139.838 66.1568C139.867 66.1568 139.896 66.1557 139.926 66.1538L174.986 63.268C175.572 63.2192 176.006 62.7067 175.959 62.1213Z" fill="#2324CA" />
                        <path d="M195.169 72.8833L146.333 76.902C145.747 76.9508 145.313 77.4633 145.36 78.0487C145.406 78.6039 145.871 79.024 146.419 79.024C146.448 79.024 146.477 79.0229 146.507 79.021L195.343 75.0022C195.929 74.9534 196.363 74.4409 196.316 73.8556C196.268 73.2713 195.767 72.8449 195.169 72.8833Z" fill="#2324CA" />
                      </svg>
                      <p className={styles.emptyStateText}>No access notes yet.</p>
                    </div>
                  ) : (
                    <div className={styles.longTextPanel} dangerouslySetInnerHTML={{ __html: accessNotes }} />
                  )}
                </section>
              </div>

              {/* Row 4: Personnel List */}
              <div className={styles.bidOverviewPanel} style={{ margin: 25, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ margin: 0 }}>Personnel List</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Search"
                      style={{
                        padding: '8px 14px',
                        border: '1px solid #D0D5DD',
                        borderRadius: 8,
                        fontSize: 13,
                        width: 180,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {!isCompleted && (
                      <button
                        type="button"
                        className={styles.primaryButton}
                        style={{
                          padding: '8px 20px',
                          borderRadius: 24,
                          background: '#3047f7',
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#fff',
                          cursor: 'pointer',
                          border: 'none',
                          fontFamily: 'inherit'
                        }}
                        onClick={handleOpenAddTeam}
                      >
                        + Add New Team
                      </button>
                    )}
                  </div>
                </div>

                {teams.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center' }}>
                    <PeopleEmptyIllustration />
                    <span style={{ fontSize: 15, color: '#667085', fontStyle: 'italic', marginTop: 12 }}>No teams added yet.</span>
                  </div>
                ) : (
                  <div>
                    {teams.map((team) => {
                      const filteredMembers = team.members.filter((member) =>
                        member.name.toLowerCase().includes(searchTerm.toLowerCase())
                      );

                      if (searchTerm && filteredMembers.length === 0) return null;

                      return (
                        <div key={team.id} style={{ marginTop: 24, borderBottom: '1px solid #EAECF0', paddingBottom: 24 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#3047F7', margin: 0 }}>{team.name}</h4>
                            {!isCompleted && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  type="button"
                                  className={styles.bidIconButton}
                                  title="Edit Team"
                                  onClick={() => handleOpenEditTeam(team)}
                                >
                                  <svg className={styles.editIconSvg} width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.84986 11.9778H12.3499M0.649902 11.9778L3.92439 11.318C4.09822 11.283 4.25784 11.1974 4.38319 11.0719L11.7134 3.73767C12.0649 3.38603 12.0647 2.81604 11.7129 2.46469L10.1601 0.913635C9.8085 0.562434 9.2388 0.562673 8.88749 0.914169L1.55647 8.24921C1.43136 8.37439 1.34594 8.53367 1.31088 8.70715L0.649902 11.9778Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className={styles.bidIconButton}
                                  title="Delete Team"
                                  onClick={() => handleConfirmDeleteTeam(team.id)}
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: 16 }}>
                            {filteredMembers.map((member) => (
                              <div
                                key={member.id}
                                style={{
                                  background: '#FFFFFF',
                                  border: '1px solid #EAECF0',
                                  borderRadius: 8,
                                  padding: 16,
                                  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.04)'
                                }}
                              >
                                <h5 style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: '0 0 10px 0' }}>{member.name}</h5>
                                <div style={{ fontSize: 12, color: '#344054', margin: '6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <span style={{ color: '#667085', fontWeight: 400 }}>Email:</span> {member.email}
                                </div>
                                <div style={{ fontSize: 12, color: '#344054', margin: '6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <span style={{ color: '#667085', fontWeight: 400 }}>Phone:</span> {member.phone}
                                </div>
                                <div style={{ fontSize: 12, color: '#344054', margin: '6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <span style={{ color: '#667085', fontWeight: 400 }}>Designation:</span> {member.designation}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <PersonnelTeamModal
                isOpen={isTeamModalOpen}
                onClose={() => setIsTeamModalOpen(false)}
                onSubmit={handleTeamSubmit}
                clients={bid?.clients || []}
                editingTeam={editingTeam}
              />
            </>
          )}

          <div className={styles.bidCreatedBy}>Created By: <strong><b>{createdBy}</b></strong></div>
        </>
      ) : null}

      {activeOverviewTab === 'rfis' ? (
        <RFIsPage hideTopTabs isCompleted={isCompleted} />
      ) : null}

      {activeOverviewTab === 'documents' ? (
        <div className={styles.bidOverviewPanel}>
          <h2>Documents</h2>
        </div>
      ) : null}

      {activeOverviewTab === 'vendors' ? (
        <VendorsTab
          bid={bid}
          onNotify={onNotify}
          isCompleted={isCompleted}
          onVendorUpdated={fetchVendorsForOverview}
        />
      ) : null}

      {activeOverviewTab === 'submittals' ? (
        <SubmittalsPage hideTopTabs bidId={bid?.id} isCompleted={isCompleted} />
      ) : null}

      {activeOverviewTab === 'financials' ? (
        <FinancialsAdminTab bidId={bid?.id} isCompleted={isCompleted} />
      ) : null}

      {activeOverviewTab === 'gallery' ? (
        <GalleryPage hideTopTabs bidId={bid?.id} isCompleted={isCompleted} />
      ) : null}

      {activeOverviewTab === 'tables' ? (
        <div className={styles.bidCostView}>
          <div className={styles.bidCostHeader}>
            <h1>Cost Details</h1>
            <p>
              Manage and calculate items value for {bid.project_name || 'Untitled Project'}
            </p>
          </div>

          <div className={styles.costDetailsCard}>
            <h2>Line Items</h2>
            {hasSavedEstimate ? (
              <div className={styles.costEstimateStatus}>
                Estimate has been saved. Value: {formattedSubTotal}
              </div>
            ) : (
              <div className={styles.costEstimateHint}>
                Please save your estimate changes to update the bid value.
              </div>
            )}

            <div className={styles.costTableShell}>
              <table className={styles.costTable}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Qty <span>/ Unit</span></th>
                    <th>Rate <span>/ Unit ($)</span></th>
                    <th>Price <span>($)</span></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bidItems.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text"
                          placeholder="Item Name"
                          value={item.item || ''}
                          onChange={(e) => handleBidItemChange(item.id, 'item', e.target.value)}
                          disabled={isCompleted}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description || ''}
                          onChange={(e) => handleBidItemChange(item.id, 'description', e.target.value)}
                          disabled={isCompleted}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Quantity"
                          value={item.qty || ''}
                          onChange={(e) => handleBidItemChange(item.id, 'qty', e.target.value)}
                          disabled={isCompleted}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Rate"
                          value={item.rate || ''}
                          onChange={(e) => handleBidItemChange(item.id, 'rate', e.target.value)}
                          disabled={isCompleted}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Price"
                          value={item.price || ''}
                          readOnly
                        />
                      </td>
                      <td>
                        <div className={styles.costRowActions}>
                          <button
                            type="button"
                            className={styles.costRemoveButton}
                            onClick={() => handleRemoveBidItem(item.id)}
                            disabled={bidItems.length <= 1 || isCompleted}
                            title="Remove item"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            className={styles.costAddButton}
                            onClick={() => handleAddBidItem(item.id)}
                            disabled={isCompleted}
                            title="Add item after"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  <tr className={styles.costSubtotalRow}>
                    <td colSpan="3" />
                    <td>
                      <span>Sub Total:</span>
                    </td>
                    <td>
                      <strong>{formattedSubTotal}</strong>
                    </td>
                    <td />
                  </tr>

                  <tr className={styles.costGrandTotalRow}>
                    <td colSpan="3" />
                    <td>
                      <span>Grand Total:</span>
                    </td>
                    <td>
                      <strong>{formattedGrandTotal}</strong>
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.costFooterActions}>
              <button
                type="button"
                className={styles.costIconButton}
                onClick={handleDownloadEstimateExcel}
                disabled={!areEstimateActionsEnabled}
                title="Download Excel"
              >
                <ExcelIcon />
              </button>
              <button
                type="button"
                className={styles.costIconButton}
                onClick={handleDownloadEstimatePdf}
                disabled={!areEstimateActionsEnabled}
                title="Download PDF"
              >
                <DownloadIcon />
              </button>
              <button
                type="button"
                className={styles.previewEstimateButton}
                onClick={handlePreviewEstimate}
                disabled={!areEstimateActionsEnabled}
              >
                Preview PDF
              </button>
              <button
                type="button"
                className={styles.sendEstimateButton}
                onClick={() => setShowEstimateShare(true)}
                disabled={!areEstimateActionsEnabled}
              >
                Send Estimate
              </button>
              <button
                type="button"
                className={styles.saveEstimateButton}
                onClick={handleSaveEstimate}
                disabled={!canSaveEstimate || isCompleted}
              >
                {isEstimateSaveLoading ? 'Saving...' : 'Save Estimate'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeOverviewTab === 'files' ? (
        <div className={styles.bidFilesPage}>
          <section className={styles.fileManagerSummaryCard}>
            <h2>File Manager</h2>
            <p>
              SteelMart | File Manager | {formatManagedFileSize(totalUploadedFileSize)} | {totalUploadedFiles} file{totalUploadedFiles === 1 ? '' : 's'} in current folder
            </p>
          </section>

          <section className={styles.fileManagerToolbarCard}>
            <div className={styles.fileManagerToolbarTop}>
              <div className={styles.fileManagerSearch}>
                <span className={styles.fileManagerSearchIcon}><SearchOutlineIcon /></span>
                <input
                  type="text"
                  placeholder="Search"
                  value={fileSearchTerm}
                  onChange={(event) => setFileSearchTerm(event.target.value)}
                />
                {fileSearchTerm ? (
                  <button
                    type="button"
                    className={styles.fileManagerSearchClear}
                    onClick={() => setFileSearchTerm('')}
                    aria-label="Clear files search"
                  >
                    <ClearIcon />
                  </button>
                ) : null}
              </div>

              <div className={styles.fileManagerToolbarActions}>
                {!isCompleted && (
                  <>
                    <button
                      type="button"
                      className={styles.fileManagerOutlineButton}
                      onClick={handleCreateFolder}
                      disabled={isFileManagerActionLoading}
                    >
                      New Folder
                    </button>
                    <button
                      type="button"
                      className={styles.fileManagerPrimaryButton}
                      onClick={handleUploadFilesClick}
                      disabled={isFileManagerActionLoading}
                    >
                      Upload New File
                    </button>
                    <button
                      type="button"
                      className={styles.fileManagerOutlineButton}
                      onClick={handleUploadFolderClick}
                      disabled={isFileManagerActionLoading}
                    >
                      Upload Folder
                    </button>
                    <input
                      ref={uploadFileInputRef}
                      type="file"
                      className={styles.fileManagerHiddenInput}
                      multiple
                      onChange={handleUploadFiles}
                    />
                    <input
                      ref={uploadFolderInputRef}
                      type="file"
                      className={styles.fileManagerHiddenInput}
                      multiple
                      webkitdirectory=""
                      directory=""
                      onChange={handleUploadFolder}
                    />
                  </>
                )}
              </div>
            </div>

            <div className={styles.fileManagerPath}>
              <button type="button" className={styles.fileManagerPathButton} onClick={() => handleNavigateToTrailIndex(-1)}>
                Files
              </button>
              <span className={styles.fileManagerPathSeparator}>/</span>
              <span>{getSalesBidDisplayId(bid)}</span>
              {folderTrail.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <span className={styles.fileManagerPathSeparator}>/</span>
                  {index === folderTrail.length - 1 ? (
                    <span>{folder.folder_name}</span>
                  ) : (
                    <button
                      type="button"
                      className={styles.fileManagerPathButton}
                      onClick={() => handleNavigateToTrailIndex(index)}
                    >
                      {folder.folder_name}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className={styles.fileManagerStatusText}>
              {isFileManagerLoading ? 'Loading file manager...' : isFileManagerActionLoading ? 'Applying file changes...' : browserPath}
            </div>
          </section>

          <section className={styles.fileManagerTableCard}>
            <table className={styles.fileManagerTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Last Modified</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isFileManagerLoading ? (
                  <tr>
                    <td colSpan="4" className={styles.fileManagerEmptyState}>Loading files and folders...</td>
                  </tr>
                ) : filteredFileEntries.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={styles.fileManagerEmptyState}>
                      {currentFolder?.id ? 'No folders or files found in this folder.' : 'No folders created for this bid yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredFileEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <div className={styles.fileManagerNameCell}>
                          <span className={styles.fileManagerNameIcon}>
                            {entry.type === 'folder' ? <FolderRowIcon /> : <FileRowIcon extension={entry.extension} />}
                          </span>
                          {entry.type === 'folder' ? (
                            <button
                              type="button"
                              className={styles.fileManagerNameButton}
                              onClick={() => handleOpenFolder(entry)}
                            >
                              {entry.name}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.fileManagerNameButton}
                              onClick={() => handlePreviewFile(entry)}
                              title="Open file preview"
                            >
                              {entry.name}
                            </button>
                          )}
                        </div>
                      </td>
                      <td>{formatManagedFileSize(entry.size)}</td>
                      <td>{formatDateTime(entry.lastModified)}</td>
                      <td>
                        <div className={styles.fileManagerActionCell}>
                          <button
                            type="button"
                            className={styles.fileManagerActionButton}
                            aria-label={entry.type === 'folder' ? `Open ${entry.name}` : `Preview ${entry.name}`}
                            title={entry.type === 'folder' ? 'Open folder' : 'Preview file'}
                            onClick={() => (entry.type === 'folder' ? handleOpenFolder(entry) : handlePreviewFile(entry))}
                            disabled={isFileManagerActionLoading}
                          >
                            <LinkActionIcon />
                          </button>
                          <div className={styles.fileManagerActionMenuWrap} onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              className={styles.fileManagerActionButton}
                              aria-label={`More actions for ${entry.name}`}
                              onClick={() => setOpenEntryActionId((currentId) => (currentId === entry.id ? null : entry.id))}
                              disabled={isFileManagerActionLoading}
                            >
                              <MoreActionIcon />
                            </button>
                            {openEntryActionId === entry.id ? (
                              <div className={styles.fileManagerRowMenu}>
                                {!isCompleted && (
                                  <button type="button" className={styles.fileManagerRowMenuButton} onClick={() => handleRenameEntry(entry)}>
                                    Rename
                                  </button>
                                )}
                                {!isCompleted && (
                                  <button type="button" className={styles.fileManagerRowMenuButtonDanger} onClick={() => handleDeleteEntry(entry)}>
                                    Delete
                                  </button>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>
      ) : null}

      {showEstimateShare ? (
        <div className={styles.estimateShareOverlay}>
          <div className={styles.estimateSharePopup} role="dialog" aria-modal="true" aria-labelledby="estimate-share-title">
            <div className={styles.estimateShareHeader}>
              <h3 id="estimate-share-title">Share</h3>
              <button
                type="button"
                className={styles.estimateShareClose}
                onClick={() => setShowEstimateShare(false)}
                aria-label="Close share popup"
              >
                ×
              </button>
            </div>

            <label className={styles.estimateShareLabel}>Select employees or companies to send estimate</label>
            <div className={styles.estimateShareSearchBox}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={estimateShareSearch}
                onChange={(event) => setEstimateShareSearch(event.target.value)}
              />
            </div>

            {/* Select All / Deselect All */}
            {filteredEstimateRecipients.length > 0 && (
              <div style={{ display: 'flex', gap: 10, margin: '6px 0 2px', padding: '0 2px' }}>
                <button
                  type="button"
                  style={{ fontSize: 12, color: '#1C33BB', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                  onClick={() => setSelectedEstimateRecipients(filteredEstimateRecipients.map((r) => r.id))}
                >
                  Select All
                </button>
                <span style={{ color: '#D0D5DD', fontSize: 12 }}>|</span>
                <button
                  type="button"
                  style={{ fontSize: 12, color: '#667085', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => setSelectedEstimateRecipients([])}
                >
                  Clear
                </button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#667085' }}>
                  {selectedEstimateRecipients.length} selected
                </span>
              </div>
            )}

            <div className={styles.estimateShareList}>
              {filteredEstimateRecipients.length > 0 ? (
                filteredEstimateRecipients.map((recipient) => (
                  <label key={recipient.id} className={styles.estimateShareRow}>
                    <input
                      type="checkbox"
                      checked={selectedEstimateRecipients.includes(recipient.id)}
                      onChange={() => {
                        setSelectedEstimateRecipients((prev) =>
                          prev.includes(recipient.id)
                            ? prev.filter((id) => id !== recipient.id)
                            : [...prev, recipient.id]
                        );
                      }}
                    />
                    <span>{recipient.label} ({recipient.email})</span>
                  </label>
                ))
              ) : estimateRecipients.length === 0 ? (
                <div className={styles.estimateShareEmpty}>No client recipient email is available for this bid</div>
              ) : (
                <div className={styles.estimateShareEmpty}>No matching names found</div>
              )}
            </div>

            <div className={styles.estimateShareActions}>
              <button type="button" className={styles.estimateShareCancel} onClick={() => setShowEstimateShare(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.estimateShareSend}
                onClick={handleSendEstimateEmail}
                disabled={selectedEstimateRecipients.length === 0 || isEstimateActionLoading}
              >
                {isEstimateActionLoading ? 'Sending...' : `Send Email${selectedEstimateRecipients.length > 1 ? ` (${selectedEstimateRecipients.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {previewEntry ? (
        <div className={styles.filePreviewOverlay} onClick={handleClosePreview}>
          <div
            className={styles.filePreviewModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="file-preview-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.filePreviewHeader}>
              <div className={styles.filePreviewHeaderLeft}>
                <span className={styles.filePreviewIcon}>
                  <FileRowIcon extension={previewEntry.extension} />
                </span>
                <div>
                  <h3 id="file-preview-title" className={styles.filePreviewTitle}>{previewEntry.name}</h3>
                  <p className={styles.filePreviewSubtitle}>
                    {browserPath}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.filePreviewClose}
                onClick={handleClosePreview}
                aria-label="Close file preview"
              >
                ×
              </button>
            </div>

            <div className={styles.filePreviewMeta}>
              <div>
                <span>Type</span>
                <strong>{previewEntry.extension ? previewEntry.extension.toUpperCase() : 'File'}</strong>
              </div>
              <div>
                <span>Size</span>
                <strong>{formatManagedFileSize(previewEntry.size)}</strong>
              </div>
              <div>
                <span>Last Modified</span>
                <strong>{formatDateTime(previewEntry.lastModified)}</strong>
              </div>
            </div>

            <div className={styles.filePreviewBody}>
              {isPreviewLoading ? (
                <div className={styles.filePreviewStatus}>Loading preview...</div>
              ) : previewError ? (
                <div className={styles.filePreviewStatus}>{previewError}</div>
              ) : previewBlobUrl ? (
                previewMime.startsWith('image/') ? (
                  <img src={previewBlobUrl} alt={previewEntry.name} className={styles.filePreviewImage} />
                ) : previewMime === 'application/pdf' ? (
                  <iframe
                    src={previewBlobUrl}
                    title={previewEntry.name}
                    className={styles.filePreviewFrame}
                  />
                ) : previewMime.startsWith('video/') ? (
                  <video src={previewBlobUrl} controls className={styles.filePreviewMedia} />
                ) : previewMime.startsWith('audio/') ? (
                  <audio src={previewBlobUrl} controls className={styles.filePreviewAudio} />
                ) : previewMime === 'text/html' ? (
                  <iframe
                    src={previewBlobUrl}
                    title={previewEntry.name}
                    className={styles.filePreviewFrame}
                    sandbox=""
                  />
                ) : previewTextContent ? (
                  <pre className={styles.filePreviewText}>{previewTextContent}</pre>
                ) : (
                  <div className={styles.filePreviewStatus}>
                    Preview is not available for this file type. Use Download or Open in New Tab to view it.
                  </div>
                )
              ) : (
                <div className={styles.filePreviewStatus}>No preview available.</div>
              )}
            </div>

            <div className={styles.filePreviewActions}>
              <button
                type="button"
                className={styles.filePreviewSecondary}
                onClick={handleOpenPreviewInNewTab}
                disabled={!previewBlobUrl}
              >
                Open in New Tab
              </button>
              <button
                type="button"
                className={styles.filePreviewPrimary}
                onClick={handleDownloadFromPreview}
                disabled={isFileManagerActionLoading}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SoWExclusionModal
        isOpen={Boolean(textEditorTab)}
        initialTab={textEditorTab || 'sow'}
        scopeOfWork={scopeOfWork}
        exclusion={exclusion}
        accessNotes={accessNotes}
        onClose={() => setTextEditorTab(null)}
        onSave={handleSaveScopeExclusionAndNotes}
      />
    </div>
  );
}

export default BidOverviewPage;




