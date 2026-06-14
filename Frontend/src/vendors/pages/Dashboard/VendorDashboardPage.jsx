import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Check, CheckCircle, ChevronDown, LogOut, Truck, Wrench, X, XCircle, Ban } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../../common/assets/SteelMart_Logo.png';
import noDataCalendar from '../../../common/assets/no-data-calendar.svg';
import noDataBids from '../../../common/assets/no-data-bids.svg';
import noDataCrm from '../../../common/assets/no-data-crm.svg';
import { DashboardIcon } from '../../../common/components/Icons';
import { useAuth } from '../../../common/hooks/useAuth';
import { getCurrentUserSummary } from '../../../common/auth/session';
import { getVendorDashboard, vendorNotBidding } from '../../services/api';
import VendorProfileModal from '../../components/VendorProfileModal';
import styles from './VendorDashboardPage.module.css';

const emptyStateMap = {
  activeProjects: { image: noDataCalendar, message: 'No active projects at the moment.' },
  invitedToBid: { image: noDataBids, message: 'No bid invitations right now.' },
  pendingApproval: { image: noDataCrm, message: 'No bids pending approval.' },
  bidsLost: { image: noDataBids, message: 'No lost bids to display.' },
  notBidding: { image: noDataCrm, message: 'No skipped bids to display.' },
  completedProjects: { image: noDataCalendar, message: 'No completed projects yet.' },
};

const sectionConfigs = [
  { key: 'activeProjects', title: 'Active Projects', badge: 'Active', tone: 'active' },
  { key: 'invitedToBid', title: 'Invited to Bid', badge: 'Invited', tone: 'invited', dismissible: true },
  { key: 'pendingApproval', title: 'Pending Approval', badge: 'Bid Sent', tone: 'pending' },
  { key: 'completedProjects', title: 'Completed Projects', badge: 'Completed', tone: 'neutral' },
  { key: 'bidsLost', title: 'Bids Lost', badge: 'Bid Lost', tone: 'lost' },
  { key: 'notBidding', title: 'Not Bidding', badge: 'Not Bidding', tone: 'neutral', accepted: true },
];

const formatDate = (value) => {
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

const formatCurrency = (value) => {
  try {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (err) {
    return 'N/A';
  }
};

/* ── Topbar (same as overview page, without back button) ── */
function VendorTopbar({
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

      <div className={styles.topbarTitle}>Welcome, {companyName}!</div>

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

/* ── Sidebar (same as overview page with Log Out button) ── */
function VendorSidebar({ sidebarOpen, onLogout }) {
  const items = [
    { label: 'My Dashboard', key: 'home', icon: DashboardIcon },
    { label: 'Active Projects', key: 'activeProjects', icon: Truck },
    { label: 'Invited to Bid', key: 'invitedToBid', icon: Bell },
    { label: 'Pending Approval', key: 'pendingApproval', icon: Check },
    { label: 'Completed Projects', key: 'completedProjects', icon: CheckCircle },
    { label: 'Bids Lost', key: 'bidsLost', icon: XCircle },
    { label: 'Not Bidding', key: 'notBidding', icon: Ban },
  ];

  const handleScrollToTop = () => {
    const el = document.getElementById('dashboard-content');
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScroll = (key) => {
    const el = document.getElementById(key);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
      <div className={styles.sidebarContent}>
        <nav className={styles.nav}>
          {items.slice(0, 1).map(({ label, key, icon: Icon, active }) => (
            <button
              key={key}
              type="button"
              className={`${styles.navItem} ${active ? styles.active : ''}`}
              onClick={handleScrollToTop}
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
              className={styles.navItem}
              onClick={() => handleScroll(key)}
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

function ProjectCard({ project, config, onNotBidding }) {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    if (project?.id) {
      navigate(`/vendor/project/${project.id}`);
    }
  };

  const calculatedDueDate = (() => {
    try {
      if (project?.leadTime && project?.dueDate) {
        const d = new Date(project.dueDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + Number(project.leadTime));
          return formatDate(d);
        }
      }
      return formatDate(project?.dueDate);
    } catch (err) {
      return 'N/A';
    }
  })();

  const badgeTone = config?.tone || 'neutral';
  const badgeText = config?.badge || 'N/A';

  return (
    <article className={styles.card} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <span className={`${styles.badge} ${styles[badgeTone]}`}>{badgeText}</span>
      <h3>{project?.projectName || 'Untitled Project'}</h3>
      <p className={styles.projectCode}>{project?.projectCode || (project?.id ? `Project #${project.id}` : 'N/A')}</p>

      {config?.key === 'activeProjects' && (
        <>
          <p className={styles.detail}>
            {project?.rfi?.total || 0} RFIs, <strong>{project?.rfi?.unresolved || 0} Unresolved</strong>
          </p>
          <p className={styles.detail}>
            Submittals: <strong>{project?.submittals?.open || 0} Open</strong>
          </p>
          <p className={styles.dueDate}>Next Due Date: <span>{calculatedDueDate}</span></p>
        </>
      )}

      {config?.key === 'completedProjects' && (
        <>
          <p className={styles.infoLabel}>Final Info:</p>
          <p className={styles.muted}>Price: {formatCurrency(project?.price)}</p>
          <p className={styles.muted}>Lead Time: {project?.leadTime || 'N/A'}</p>
        </>
      )}

      {config?.key === 'invitedToBid' && (
        <>
          <p className={styles.infoLabel}>Required Info:</p>
          <p className={styles.muted}>Price: {formatCurrency(project?.price)}</p>
          <p className={styles.muted}>Lead Time: {project?.leadTime || 'N/A'}</p>
          <p className={styles.dueDate}>Due Date: <span>{calculatedDueDate}</span></p>
          {project?.status === 'invited' && (
            <button
              type="button"
              className={styles.cardIconButton}
              aria-label="Not Bidding"
              title="Not Bidding"
              onClick={(e) => {
                e.stopPropagation();
                if (onNotBidding && project?.id) onNotBidding(project.id);
              }}
            >
              <Ban size={14} strokeWidth={2.5} />
            </button>
          )}
        </>
      )}

      {(config?.key === 'pendingApproval' || config?.key === 'bidsLost' || config?.key === 'notBidding') && (
        <>
          <p className={styles.infoLabel}>Submitted Info:</p>
          <p className={styles.muted}>Price: {formatCurrency(project?.price)}</p>
          <p className={styles.muted}>Lead Time: {project?.leadTime || 'N/A'}</p>
          {config?.key === 'bidsLost' && (
            <p className={styles.muted}>Rejected Reason: {project?.rejectedReason || 'N/A'}</p>
          )}
          {config?.key === 'notBidding' && (
            <button type="button" className={styles.cardIconButton} aria-label="Restore bid">
              <Check size={14} strokeWidth={2.5} />
            </button>
          )}
        </>
      )}
    </article>
  );
}

const VISIBLE_COUNT = 4;

function DashboardSection({ config, projects, onNotBidding }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = (projects || []).length > VISIBLE_COUNT;
  const visibleProjects = expanded ? (projects || []) : (projects || []).slice(0, VISIBLE_COUNT);

  return (
    <section id={config?.key} className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>{config?.title}</h2>
        {hasMore && (
          <button
            type="button"
            className={styles.expandButton}
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={expanded ? 'Show less' : 'Show all'}
          >
            <ChevronDown
              size={20}
              style={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease',
              }}
            />
          </button>
        )}
      </div>
      {(projects || []).length > 0 ? (
        <div className={styles.cardGrid}>
          {visibleProjects.map((project) => (
            <ProjectCard key={`${config?.key}-${project?.id}`} project={project} config={config} onNotBidding={onNotBidding} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <img
            src={emptyStateMap[config?.key]?.image || noDataCalendar}
            alt="No data"
            className={styles.emptyIllustration}
          />
          <p className={styles.emptyMessage}>
            {emptyStateMap[config?.key]?.message || 'No projects in this section.'}
          </p>
        </div>
      )}
    </section>
  );
}

export default function VendorDashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const userSummary = getCurrentUserSummary();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  ));
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getVendorDashboard();
        if (isMounted) {
          setDashboard(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.data?.message || err.message || 'Unable to load dashboard.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const companyName = useMemo(() => (
    dashboard?.vendor?.companyName
    || userSummary?.companyName
    || userSummary?.email
    || 'Vendor'
  ), [dashboard, userSummary]);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate('/vendor/login', { replace: true });
  };

  const reloadDashboard = async () => {
    try {
      setLoading(true);
      const response = await getVendorDashboard();
      setDashboard(response);
    } catch (err) {
      setError(err.data?.message || err.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotBidding = async (projectId) => {
    if (!window.confirm('Are you sure you want to opt out of bidding on this project?')) return;
    try {
      await vendorNotBidding(projectId);
      await reloadDashboard();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to opt out.');
    }
  };

  return (
    <div className={styles.shell}>
      <VendorTopbar
        companyName={companyName}
        profileMenuOpen={profileMenuOpen}
        profileMenuRef={profileMenuRef}
        userEmail={userSummary?.email || 'Vendor'}
        userRole={userSummary?.role || 'Vendor'}
        onLogout={handleLogout}
        onToggleProfile={() => setProfileMenuOpen((current) => !current)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onToggleSidebar={() => setSidebarOpen((current) => !current)}
        sidebarOpen={sidebarOpen}
      />

      <div className={styles.layoutBody}>
        {sidebarOpen ? <div className={styles.overlay} onClick={() => setSidebarOpen(false)} /> : null}
        <VendorSidebar sidebarOpen={sidebarOpen} onLogout={handleLogout} />
        <main id="dashboard-content" className={styles.content}>
          {loading && <div className={styles.statePanel}>Loading vendor dashboard...</div>}
          {!loading && error && <div className={styles.statePanel}>{error}</div>}
          {!loading && !error && sectionConfigs.map((config) => (
            <DashboardSection
              key={config.key}
              config={config}
              projects={dashboard?.sections?.[config.key] || []}
              onNotBidding={handleNotBidding}
            />
          ))}
        </main>
      </div>
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
