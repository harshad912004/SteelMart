import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Calendar,
  Check,
  CheckCircle as CheckCircleIcon,
  ChevronLeft,
  ClipboardList,
  Eye,
  EyeOff,
  Grid2X2,
  Lock,
  LogOut,
  Truck,
  Upload,
  Wrench,
  X,
  XCircle,
  Ban
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import logo from '../../../common/assets/SteelMart_Logo.png';
import noDataCalendar from '../../../common/assets/no-data-calendar.svg';
import noDataBids from '../../../common/assets/no-data-bids.svg';
import noDataCrm from '../../../common/assets/no-data-crm.svg';
import { useAuth } from '../../../common/hooks/useAuth';
import { DashboardIcon } from '../../../common/components/Icons';
import { getCurrentUserSummary } from '../../../common/auth/session';
import { getVendorProject, createVendorBidRFI, createVendorBidSubmittal, addVendorBidRFIHistory, addVendorBidSubmittalVersion, deleteVendorBidRFI, deleteVendorBidSubmittal, submitVendorProposal, vendorNotBidding, getVendorProjectMaterials } from '../../services/api';
import VendorProfileModal from '../../components/VendorProfileModal';
import RFITab from '../../components/RFI/RFITab';
import RFIDetailView from '../../components/RFI/RFIDetailView';
import AddRFIModal from '../../components/RFI/AddRFIModal';
import ShareRFIModal from '../../components/RFI/ShareRFIModal';
import DeleteConfirmModal from '../../components/RFI/DeleteConfirmModal';
import SubmittalsTab from '../../components/Submittals/SubmittalsTab';
import SubmittalDetailView from '../../components/Submittals/SubmittalDetailView';
import AddSubmittalModal from '../../components/Submittals/AddSubmittalModal';
import styles from './VendorProjectDetailPage.module.css';


const formatDetailDate = (value) => {
  if (!value) return 'N/A';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch (err) {
    return 'N/A';
  }
};

/* ── Tab definitions ── */
const BASE_TABS = [
  { key: 'overview', label: 'Overview' },
];

const APPROVED_TABS = [
  { key: 'rfis', label: 'RFIs' },
  { key: 'submittals', label: 'Submittals' },
  { key: 'documents', label: 'Documents' },
];

/* ── Topbar ── */
function ProjectTopbar({
  companyName,
  profileMenuOpen,
  profileMenuRef,
  userEmail,
  userRole,
  onLogout,
  onToggleProfile,
  onOpenProfile,
  onToggleSidebar,
  sidebarOpen,
  onBack,
}) {
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userEmail || 'Vendor')}`;

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <Link to="/vendor/dashboard" className={styles.brandContainer} aria-label="Go to vendor dashboard">
          <img src={logo} alt="SteelMart" className={styles.brandLogo} />
          <div className={styles.brandDivider} />
          <div className={styles.brandPortalTitle}>DSC PORTAL</div>
        </Link>

        <button
          className={styles.sidebarToggle}
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {onBack && (
        <button type="button" className={styles.backArrow} onClick={onBack} aria-label="Go back">
          <ChevronLeft size={20} />
        </button>
      )}

      <div className={styles.topbarTitle}>
        Welcome, {companyName}!
      </div>

      <div className={styles.topbarRight}>
        {/* <button className={styles.iconButton} type="button" aria-label="Notifications">
          <Bell size={22} fill="currentColor" strokeWidth={0} />
        </button> */}

        <div className={styles.profileMenu} ref={profileMenuRef}>
          <button
            className={styles.profileTrigger}
            type="button"
            onClick={onToggleProfile}
            aria-label="Open profile menu"
            aria-expanded={profileMenuOpen}
          >
            <img src={avatarUrl} alt={userEmail} className={styles.topbarAvatar} />
          </button>

          {profileMenuOpen ? (
            <div className={styles.profileDropdown}>
              <div className={styles.profileSummary}>
                <img src={avatarUrl} alt={userEmail} className={styles.dropdownAvatar} />
                <div className={styles.profileSummaryText}>
                  <div className={styles.profileName}>{userEmail}</div>
                  <div className={styles.profileRole}>{userRole}</div>
                </div>
              </div>

              <button
                className={styles.dropdownItem}
                type="button"
                onClick={() => {
                  onToggleProfile();
                  onOpenProfile();
                }}
              >
                Profile
              </button>
              <button className={`${styles.dropdownItem} ${styles.logoutItem}`} type="button" onClick={onLogout}>
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/* ── Sidebar ── */
function ProjectSidebar({ sidebarOpen, onLogout, activeSection }) {
  const navigate = useNavigate();

  const items = [
    { label: 'My Dashboard', key: 'home', icon: DashboardIcon },
    { label: 'Active Projects', key: 'activeProjects', icon: Truck },
    { label: 'Invited to Bid', key: 'invitedToBid', icon: Bell },
    { label: 'Pending Approval', key: 'pendingApproval', icon: Check },
    { label: 'Completed Projects', key: 'completedProjects', icon: CheckCircleIcon },
    { label: 'Bids Lost', key: 'bidsLost', icon: XCircle },
    { label: 'Not Bidding', key: 'notBidding', icon: Ban },
  ];

  return (
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
      <div className={styles.sidebarContent}>
        <nav className={styles.nav}>
          {items.slice(0, 1).map(({ label, key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={styles.navItem}
              onClick={() => navigate('/vendor/dashboard')}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sectionLabel}>Dashboard Sections</div>
        <nav className={styles.nav}>
          {items.slice(1).map(({ label, key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`${styles.navItem} ${activeSection === key ? styles.active : ''}`}
              onClick={() => navigate('/vendor/dashboard')}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

      </div>
    </aside>
  );
}

/* ── Send Confirm Modal ── */
function SendConfirmModal({ onClose, onSubmit }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Confirm Submission</h2>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <X size={22} />
          </button>
        </div>
        <div style={{ padding: '0 24px 24px', fontSize: 14, color: '#475467' }}>
          Are you sure you want to send this proposal? Once sent, you cannot edit the price or lead time unless requested by the admin.
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.submitBtn} onClick={onSubmit}>
            Confirm & Send
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Material List Modal ── */
function MaterialListModal({ projectId, onClose }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMaterials = async () => {
      try {
        const res = await getVendorProjectMaterials(projectId);
        if (isMounted) {
          setMaterials(res || { items: [] });
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.data?.message || 'Failed to load materials.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMaterials();
    return () => { isMounted = false; };
  }, [projectId]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} style={{ width: '800px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Project Material List</h2>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div style={{ padding: '0 24px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
          {loading && <div>Loading materials...</div>}
          {error && <div style={{ color: '#D92D20' }}>{error}</div>}
          {!loading && !error && materials?.items?.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #EAECF0', background: '#F9FAFB', fontSize: 12, color: '#667085' }}>Item</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #EAECF0', background: '#F9FAFB', fontSize: 12, color: '#667085' }}>Description</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #EAECF0', background: '#F9FAFB', fontSize: 12, color: '#667085' }}>QTY</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #EAECF0', background: '#F9FAFB', fontSize: 12, color: '#667085' }}>Rate</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #EAECF0', background: '#F9FAFB', fontSize: 12, color: '#667085' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {materials.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #EAECF0', fontSize: 14 }}>{item.item}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #EAECF0', fontSize: 14 }}>{item.description}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #EAECF0', fontSize: 14 }}>{item.quantity}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #EAECF0', fontSize: 14 }}>${Number(item.rate).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #EAECF0', fontSize: 14 }}>${Number(item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ textAlign: 'right', padding: '12px 16px', fontSize: 14, fontWeight: 'bold' }}>Sub Total:</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 'bold' }}>${Number(materials.sub_total || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan="4" style={{ textAlign: 'right', padding: '12px 16px', fontSize: 14, fontWeight: 'bold' }}>Grand Total:</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 'bold' }}>${Number(materials.grand_total || 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          )}
          {!loading && !error && (!materials?.items || materials?.items?.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#667085' }}>
              No materials found for this project.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Check Circle SVG (for proposal banners) ── */
function CheckCircle({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" />
      <path d="M7 12.5L10.5 16L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Overview Tab ── */
function OverviewTab({ project, proposalStatus, onSendProposal, onViewMaterials, onNotBidding }) {
  const [price, setPrice] = useState(project?.price && proposalStatus !== 'idle' ? String(project.price) : '');
  const [leadTime, setLeadTime] = useState(project?.leadTime && proposalStatus !== 'idle' ? String(project.leadTime) : '');
  const [showPrice, setShowPrice] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const isSubmitted = ['sent', 'approved', 'rejected', 'not_bidding'].includes(proposalStatus);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (price === undefined || price === null || price === '') {
      alert('Please enter a price to submit your proposal.');
      return;
    }
    onSendProposal({ price, leadTime, files: uploadedFiles });
  };

  const calculatedDueDate = (() => {
    try {
      const currentLeadTime = leadTime || project?.leadTime;
      if (currentLeadTime && project?.dueDate && project?.dueDate !== '—') {
        const d = new Date(project.dueDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + Number(currentLeadTime));
          return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        }
      }
      return project?.dueDate || '—';
    } catch (err) {
      return '—';
    }
  })();

  return (
    <>
      <h2 className={styles.sectionHeading}>Project Details</h2>

      <div className={styles.overviewGrid}>
        {/* Left — project info */}
        <div className={styles.projectInfoCard}>
          <h3 className={styles.projectName}>{project?.name || 'Untitled Project'}</h3>
          <p className={styles.projectDescription}>{project?.description || 'No description available.'}</p>
          {project?.scopeOfWork && (
            <div style={{ marginTop: 12 }}>
              <strong style={{ fontSize: 13, color: '#344054' }}>Scope of Work:</strong>
              <p style={{ fontSize: 13, color: '#475467', marginTop: 4 }}>{project.scopeOfWork}</p>
            </div>
          )}
          <div className={styles.dueDateRow}>
            <Calendar size={16} />
            Due Date: {calculatedDueDate}
          </div>

          <div className={styles.actionButtons}>
            <button type="button" className={styles.actionBtn} onClick={onViewMaterials}>
              <ClipboardList size={20} />
              View Material List
            </button>
            {proposalStatus === 'idle' && (
              <button
                type="button"
                className={styles.actionBtn}
                style={{ color: '#D92D20', borderColor: '#D92D20' }}
                onClick={onNotBidding}
              >
                <Ban size={20} />
                Not Bidding
              </button>
            )}
          </div>
        </div>

        {/* Right — bid form */}
        <div className={styles.bidFormCard}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Project Price (in $)</label>
            <div className={styles.fieldInputWrapper}>
              <input
                type={showPrice ? 'text' : 'password'}
                className={styles.fieldInput}
                placeholder="Enter Price in USD"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isSubmitted}
              />
              <button
                type="button"
                className={styles.toggleVisibility}
                onClick={() => setShowPrice((v) => !v)}
                aria-label={showPrice ? 'Hide price' : 'Show price'}
              >
                {showPrice ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Project Lead Time (in Days)</label>
            <div className={styles.fieldInputWrapper}>
              <input
                type="text"
                className={styles.fieldInput}
                placeholder="Enter Number of Working Days You Will Required"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                disabled={isSubmitted}
              />
            </div>
          </div>

          <div className={styles.fileUploadGroup}>
            <span className={styles.fieldLabel}>Add File</span>
            <div className={styles.fileUploadRow}>
              <button
                type="button"
                className={styles.browseBtn}
                disabled={isSubmitted}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                Browse File
              </button>
              <span className={styles.dropHint}>or Drop file</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                disabled={isSubmitted}
              />
            </div>
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 13, color: '#475467' }}>
                    <span>📎 {file.name}</span>
                    {!isSubmitted && (
                      <button type="button" onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D92D20', fontSize: 14, padding: 0 }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isSubmitted && (
            <button type="button" className={styles.sendProposalBtn} onClick={handleSend}>
              Send my Proposal
            </button>
          )}
        </div>
      </div>

      {/* Status banners */}
      {proposalStatus === 'sent' && (
        <div className={`${styles.proposalBanner} ${styles.sent}`}>
          <CheckCircle className={`${styles.bannerIcon} ${styles.sentIcon}`} />
          <p className={`${styles.bannerTitle} ${styles.sentTitle}`}>Proposal Sent — Pending Review</p>
          <p className={styles.bannerMessage}>
            SteelMart Team is reviewing your proposal and will get back to you shortly.
          </p>
        </div>
      )}

      {proposalStatus === 'approved' && (
        <div className={`${styles.proposalBanner} ${styles.approved}`}>
          <CheckCircle className={`${styles.bannerIcon} ${styles.approvedIcon}`} />
          <p className={`${styles.bannerTitle} ${styles.approvedTitle}`}>Proposal Approved</p>
          <p className={styles.bannerMessage}>
            Please head to the RFI and Submittals tab to get more details on the project!
          </p>
        </div>
      )}

      {proposalStatus === 'rejected' && (
        <div className={`${styles.proposalBanner} ${styles.sent}`} style={{ borderColor: '#D92D20', background: '#FEF3F2' }}>
          <X size={22} style={{ color: '#D92D20', flexShrink: 0 }} />
          <p className={`${styles.bannerTitle}`} style={{ color: '#D92D20' }}>Bid Lost</p>
          <p className={styles.bannerMessage}>
            {project?.rejectedReason || 'Your proposal was not selected for this project.'}
          </p>
        </div>
      )}

      {proposalStatus === 'not_bidding' && (
        <div className={`${styles.proposalBanner} ${styles.sent}`} style={{ borderColor: '#667085', background: '#F9FAFB' }}>
          <X size={22} style={{ color: '#667085', flexShrink: 0 }} />
          <p className={`${styles.bannerTitle}`} style={{ color: '#667085' }}>Not Bidding</p>
          <p className={styles.bannerMessage}>
            You have opted out of bidding for this project.
          </p>
        </div>
      )}
    </>
  );
}

/* ── Main page ── */
export default function VendorProjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { logout } = useAuth();
  const userSummary = getCurrentUserSummary();

  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true,
  );
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [activeTab, setActiveTab] = useState('overview');

  /* Proposal flow state derived from API vendorStatus */
  const [proposalStatus, setProposalStatus] = useState('idle'); // 'idle' | 'sent' | 'approved' | 'rejected' | 'not_bidding'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMaterialList, setShowMaterialList] = useState(false);
  const [proposalData, setProposalData] = useState({ price: '', leadTime: '', files: [] });

  /* RFI tab state */
  const [rfiView, setRfiView] = useState('list'); // 'list' | 'detail'
  const [selectedRfi, setSelectedRfi] = useState(null);
  const [showAddRfiModal, setShowAddRfiModal] = useState(false);
  const [showShareRfiModal, setShowShareRfiModal] = useState(false);
  const [showDeleteRfiModal, setShowDeleteRfiModal] = useState(false);
  const [deleteRfiName, setDeleteRfiName] = useState('');
  const [pendingDeleteRfi, setPendingDeleteRfi] = useState(null);

  /* Submittals tab state */
  const [submittalView, setSubmittalView] = useState('list'); // 'list' | 'detail'
  const [selectedSubmittal, setSelectedSubmittal] = useState(null);
  const [showAddSubmittalModal, setShowAddSubmittalModal] = useState(false);
  const [showDeleteSubmittalModal, setShowDeleteSubmittalModal] = useState(false);
  const [deleteSubmittalName, setDeleteSubmittalName] = useState('');
  const [pendingDeleteSubmittal, setPendingDeleteSubmittal] = useState(null);

  /* Refresh triggers */
  const [rfiRefresh, setRfiRefresh] = useState(0);
  const [submittalRefresh, setSubmittalRefresh] = useState(0);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  useEffect(() => {
    let isMounted = true;
    const loadProject = async () => {
      try {
        setProjectLoading(true);
        setProjectError('');
        const response = await getVendorProject(id);
        const projectData = response?.project || response?.data?.project || null;

        if (!projectData) {
          throw new Error(response?.message || 'Project details were not returned by the server.');
        }

        if (isMounted) {
          const vendorStatus = projectData.vendorStatus || projectData.status;
          // Derive proposalStatus from the vendor's status
          if (vendorStatus === 'proposal_sent') {
            setProposalStatus('sent');
          } else if (vendorStatus === 'approved') {
            setProposalStatus('approved');
          } else if (vendorStatus === 'rejected') {
            setProposalStatus('rejected');
          } else if (vendorStatus === 'not_bidding') {
            setProposalStatus('not_bidding');
          } else {
            setProposalStatus('idle');
          }

          setProject({
            id: projectData.id,
            name: projectData.projectName || 'Untitled Project',
            description: projectData.description || 'No description available.',
            scopeOfWork: projectData.scopeOfWork || '',
            dueDate: formatDetailDate(projectData.dueDate),
            status: projectData.status,
            vendorStatus: vendorStatus,
            projectCode: projectData.projectCode,
            price: projectData.price,
            location: projectData.location,
            leadTime: projectData.leadTime,
            proposalNotes: projectData.proposalNotes || '',
            rejectedReason: projectData.rejectedReason || '',
            vendorEntryId: projectData.vendorEntryId,
          });
        }
      } catch (err) {
        console.warn('Failed to load project:', err);
        if (isMounted) {
          setProjectError(err?.data?.message || err?.message || 'Failed to load project details.');
        }
      } finally {
        if (isMounted) {
          setProjectLoading(false);
        }
      }
    };
    loadProject();
    return () => { isMounted = false; };
  }, [id]);

  const companyName = useMemo(
    () => userSummary?.companyName || userSummary?.email || 'Vendor',
    [userSummary],
  );

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate('/vendor/login', { replace: true });
  };

  const handleSendProposal = ({ price, leadTime, files }) => {
    setProposalData({ price, leadTime, files: files || [] });
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    try {
      await submitVendorProposal(
        id,
        proposalData.price,
        proposalData.leadTime || null,
        proposalData.files && proposalData.files.length > 0 ? proposalData.files : null
      );
      setProposalStatus('sent');
    } catch (err) {
      console.warn('Proposal submission error:', err);
      alert(err?.data?.message || 'Failed to submit proposal. Please try again.');
    }
  };

  const handleNotBidding = async () => {
    if (!window.confirm('Are you sure you want to opt out of bidding on this project?')) return;
    try {
      await vendorNotBidding(id);
      setProposalStatus('not_bidding');
    } catch (err) {
      console.warn('Opt out error:', err);
      alert(err?.data?.message || 'Failed to opt out of bidding. Please try again.');
    }
  };

  return (
    <div className={styles.shell}>
      <ProjectTopbar
        companyName={companyName}
        profileMenuOpen={profileMenuOpen}
        profileMenuRef={profileMenuRef}
        userEmail={userSummary?.email || 'Vendor'}
        userRole={userSummary?.role || 'Vendor'}
        onLogout={handleLogout}
        onToggleProfile={() => setProfileMenuOpen((c) => !c)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onToggleSidebar={() => setSidebarOpen((c) => !c)}
        sidebarOpen={sidebarOpen}
        onBack={() => navigate('/vendor/dashboard')}
      />

      <div className={styles.layoutBody}>
        {sidebarOpen ? <div className={styles.overlay} onClick={() => setSidebarOpen(false)} /> : null}
        <ProjectSidebar
          sidebarOpen={sidebarOpen}
          onLogout={handleLogout}
          activeSection={
            proposalStatus === 'approved' ? 'activeProjects'
              : proposalStatus === 'sent' ? 'pendingApproval'
                : proposalStatus === 'rejected' ? 'bidsLost'
                  : proposalStatus === 'not_bidding' ? 'notBidding'
                    : 'invitedToBid'
          }
        />

        <main className={styles.content}>
          {projectLoading && <div className={styles.statePanel}>Loading project details...</div>}
          {!projectLoading && projectError && <div className={styles.statePanel}>{projectError}</div>}
          {!projectLoading && !projectError && project && (
            <>
              {/* Tabs */}
              <div className={styles.tabs}>
                {BASE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`${styles.tabButton} ${activeTab === tab.key ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
                {APPROVED_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`${styles.tabButton} ${proposalStatus === 'approved'
                        ? (activeTab === tab.key ? styles.activeTab : '')
                        : styles.tabLocked
                      }`}
                    onClick={() => {
                      if (proposalStatus === 'approved') {
                        setActiveTab(tab.key);
                      }
                    }}
                    disabled={proposalStatus !== 'approved'}
                    title={
                      proposalStatus !== 'approved'
                        ? 'Your proposal must be approved by the admin to access this section'
                        : ''
                    }
                  >
                    {tab.label}
                    {proposalStatus !== 'approved' && (
                      <Lock size={13} className={styles.lockIcon} />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab body */}
              <div className={styles.tabContent}>
                {activeTab === 'overview' && (
                  <OverviewTab
                    project={project}
                    proposalStatus={proposalStatus}
                    onSendProposal={handleSendProposal}
                    onViewMaterials={() => setShowMaterialList(true)}
                    onNotBidding={handleNotBidding}
                  />
                )}
                {activeTab === 'rfis' && (
                  <>
                    {rfiView === 'list' && (
                      <RFITab
                        bidId={id}
                        refreshTrigger={rfiRefresh}
                        onViewRFI={(rfi) => {
                          setSelectedRfi(rfi);
                          setRfiView('detail');
                        }}
                        onAddNew={() => setShowAddRfiModal(true)}
                        onShare={() => setShowShareRfiModal(true)}
                        onDelete={(rfi) => {
                          setPendingDeleteRfi(rfi);
                          setDeleteRfiName(rfi?.title || `RFI ${rfi?.id}`);
                          setShowDeleteRfiModal(true);
                        }}
                      />
                    )}
                    {rfiView === 'detail' && selectedRfi && (
                      <RFIDetailView
                        bidId={id}
                        rfiId={selectedRfi?.id}
                        rfiData={selectedRfi}
                        onBack={() => { setRfiView('list'); setSelectedRfi(null); }}
                        onDelete={() => {
                          setPendingDeleteRfi(selectedRfi);
                          setDeleteRfiName(selectedRfi.title);
                          setShowDeleteRfiModal(true);
                        }}
                      />
                    )}
                  </>
                )}
                {activeTab === 'submittals' && (
                  <>
                    {submittalView === 'list' && (
                      <SubmittalsTab
                        bidId={id}
                        refreshTrigger={submittalRefresh}
                        onViewSubmittal={(submittal) => {
                          setSelectedSubmittal(submittal);
                          setSubmittalView('detail');
                        }}
                        onAddNew={() => setShowAddSubmittalModal(true)}
                        onDelete={(submittal) => {
                          setPendingDeleteSubmittal(submittal);
                          setDeleteSubmittalName(submittal?.title || `Submittal ${submittal?.id}`);
                          setShowDeleteSubmittalModal(true);
                        }}
                      />
                    )}
                    {submittalView === 'detail' && selectedSubmittal && (
                      <SubmittalDetailView
                        bidId={id}
                        submittalId={selectedSubmittal?.id}
                        submittalData={selectedSubmittal}
                        onBack={() => { setSubmittalView('list'); setSelectedSubmittal(null); }}
                        onDelete={() => {
                          setPendingDeleteSubmittal(selectedSubmittal);
                          setDeleteSubmittalName(selectedSubmittal.title);
                          setShowDeleteSubmittalModal(true);
                        }}
                      />
                    )}
                  </>
                )}
                {activeTab === 'documents' && (
                  <div className={styles.emptyTab}>
                    <img src={noDataCalendar} alt="No documents" className={styles.emptyIllustration} />
                    <p className={styles.emptyMessage}>No documents available for this project.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {showConfirmModal && (
        <SendConfirmModal
          onClose={() => setShowConfirmModal(false)}
          onSubmit={handleConfirmSubmit}
        />
      )}

      {showMaterialList && (
        <MaterialListModal
          projectId={id}
          onClose={() => setShowMaterialList(false)}
        />
      )}

      {/* RFI Modals */}
      {showAddRfiModal && (
        <AddRFIModal
          isOpen={showAddRfiModal}
          onClose={() => setShowAddRfiModal(false)}
          onCreate={async (data) => {
            try {
              const res = await createVendorBidRFI(id, {
                title: data.title,
                notes: data.notes,
                description: data.notes,
                priority: 'Medium'
              });
              if (res && res.success) {
                const rfiId = res.rfi?.id || res.data?.rfi?.id;
                if (rfiId && data.file) {
                  await addVendorBidRFIHistory(id, rfiId, data.file, 'Initial attachment');
                }
                setRfiRefresh(c => c + 1);
                setShowAddRfiModal(false);
              } else {
                alert(res?.message || 'Failed to create RFI');
              }
            } catch (err) {
              alert('Error creating RFI');
            }
          }}
        />
      )}
      {showShareRfiModal && (
        <ShareRFIModal
          isOpen={showShareRfiModal}
          onClose={() => setShowShareRfiModal(false)}
          onSend={(selected) => { console.log('Share RFI with:', selected); setShowShareRfiModal(false); }}
        />
      )}
      {showDeleteRfiModal && (
        <DeleteConfirmModal
          isOpen={showDeleteRfiModal}
          onClose={() => setShowDeleteRfiModal(false)}
          onConfirm={() => {
            if (pendingDeleteRfi?.id) {
              deleteVendorBidRFI(id, pendingDeleteRfi.id)
                .then(() => {
                  setRfiRefresh(c => c + 1);
                })
                .catch((err) => {
                  alert(err?.data?.message || 'Failed to delete RFI');
                });
            }
            setShowDeleteRfiModal(false);
            setPendingDeleteRfi(null);
            if (rfiView === 'detail') { setRfiView('list'); setSelectedRfi(null); }
          }}
          itemName={deleteRfiName}
        />
      )}

      {/* Submittal Modals */}
      {showAddSubmittalModal && (
        <AddSubmittalModal
          isOpen={showAddSubmittalModal}
          onClose={() => setShowAddSubmittalModal(false)}
          onCreate={async (data) => {
            try {
              const res = await createVendorBidSubmittal(id, {
                title: data.title,
                type: data.type,
                due_date: data.dueDate,
                priority: data.priority,
                description: 'Initial Submission'
              });
              if (res && res.success) {
                const submittalId = res.submittal?.id || res.data?.submittal?.id;
                if (submittalId) {
                  await addVendorBidSubmittalVersion(id, submittalId, data.file, 'Initial Submission', 'submitted');
                }
                setSubmittalRefresh(c => c + 1);
                setShowAddSubmittalModal(false);
              } else {
                alert(res?.message || 'Failed to create Submittal');
              }
            } catch (err) {
              alert('Error creating Submittal');
            }
          }}
        />
      )}
      {showDeleteSubmittalModal && (
        <DeleteConfirmModal
          isOpen={showDeleteSubmittalModal}
          onClose={() => setShowDeleteSubmittalModal(false)}
          onConfirm={() => {
            if (pendingDeleteSubmittal?.id) {
              deleteVendorBidSubmittal(id, pendingDeleteSubmittal.id)
                .then(() => {
                  setSubmittalRefresh(c => c + 1);
                })
                .catch((err) => {
                  alert(err?.data?.message || 'Failed to delete Submittal');
                });
            }
            setShowDeleteSubmittalModal(false);
            setPendingDeleteSubmittal(null);
            if (submittalView === 'detail') { setSubmittalView('list'); setSelectedSubmittal(null); }
          }}
          itemName={deleteSubmittalName}
        />
      )}

      {profileModalOpen && (
        <VendorProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          vendorData={{
            companyName,
            email: userSummary?.email,
            role: userSummary?.role || 'Vendor',
          }}
        />
      )}
    </div>
  );
}

