import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import SteelMartLogo from '../../../common/assets/SteelMart_Logo.png';
import { useAuth } from '../../../common/hooks/useAuth';
import useViewport from '../../hooks/useViewport';
import { getCurrentUserSummary } from '../../utils/authSession';
import AdminProfileModal from '../AdminProfileModal';
import styles from './DashboardLayout.module.css';
import {
  CRMIcon,
  ContactsIcon,
  DashboardIcon,
  EmployeeIcon,
  SalesIcon,
} from '../Icons';

const ProjectsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const ReportsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const CalendarNavIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ADMIN_NAV_SECTIONS = [
  {
    label: 'Human Resources',
    items: [
      { path: '/dashboard/employee', label: 'Employees', icon: EmployeeIcon },
      { path: '/dashboard/contacts', label: 'Contacts', icon: ContactsIcon },
    ],
  },
  {
    label: 'Pre-Construction',
    items: [
      { path: '/dashboard/sales', label: 'Sales', icon: SalesIcon },
      { path: '/dashboard/crm', label: 'CRM', icon: CRMIcon },
      { path: '/dashboard/reports', label: 'Reports', icon: ReportsIcon },
    ],
  },
  {
    label: 'Construction',
    items: [
      { path: '/dashboard/projects', label: 'Projects', icon: ProjectsIcon },

    ],
  }
];


function DashboardLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isMobileViewport, isDesktopViewport } = useViewport();
  const [sidebarOpen, setSidebarOpen] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  ));
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const userSummary = useMemo(() => getCurrentUserSummary(), []);
  const userEmail = userSummary?.email || 'User';
  const userRole = userSummary?.role || 'Administrator';

  const getBackPath = () => {
    const path = location.pathname.replace(/\/$/, '');
    const searchParams = new URLSearchParams(location.search);
    const hasBid = searchParams.has('bid') || location.search.includes('bid=');

    if (hasBid) {
      return path;
    }

    // Sub-pages go back to their respective main pages
    if (path.startsWith('/dashboard/employee/') && path !== '/dashboard/employee') {
      return '/dashboard/employee';
    }
    if (path.startsWith('/dashboard/contacts/') && path !== '/dashboard/contacts') {
      return '/dashboard/contacts';
    }

    return null;
  };

  const backPath = getBackPath();

  useEffect(() => {
    if (isMobileViewport) {
      setSidebarOpen(false);
      return;
    }

    if (isDesktopViewport) {
      setSidebarOpen(true);
    }
  }, [isDesktopViewport, isMobileViewport]);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [location.pathname, isMobileViewport]);

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

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userEmail || 'User')}`;

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate('/employee/login');
  };

  const handleOpenProfile = () => {
    setProfileMenuOpen(false);
    setProfileModalOpen(true);
  };

  return (
    <div className={styles.layoutContainer}>
      <AdminProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      <header className={styles.topbar}>
        <div className={styles.logoContainer}>
          <button
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <Link to="/dashboard" className={styles.brand} aria-label="Go to dashboard">
            <img src={SteelMartLogo} alt="SteelMart" />
          </Link>
        </div>

        {backPath ? (
          <button
            type="button"
            className={styles.backArrow}
            onClick={() => navigate(backPath)}
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
        ) : null}

        <div className={styles.topbarRight}>
          {/* <button className={styles.iconButton} aria-label="Notifications">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor" />
            </svg>
          </button> */}

          <div className={styles.profileMenu} ref={profileMenuRef}>
            <button
              className={styles.profileTrigger}
              onClick={() => setProfileMenuOpen((current) => !current)}
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

                <button className={styles.dropdownItem} onClick={handleOpenProfile}>
                  Profile
                </button>
                <button className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className={styles.layoutBody}>
        {isMobileViewport && sidebarOpen ? <div className={styles.overlay} onClick={() => setSidebarOpen(false)} /> : null}

        <aside
          className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed} ${isMobileViewport ? styles.mobile : styles.desktop}`}
        >
          <div className={styles.sidebarContent}>
            <nav className={styles.nav}>
              <Link to="/dashboard" className={`${styles.navItem} ${isActive('/dashboard') && location.pathname === '/dashboard' ? styles.active : ''}`}>
                <DashboardIcon />
                <span>My Dashboard</span>
              </Link>
              <Link to="/dashboard/calendar" className={`${styles.navItem} ${isActive('/dashboard/calendar') ? styles.active : ''}`}>
                <CalendarNavIcon />
                <span>My Calendar</span>
              </Link>
            </nav>

            {ADMIN_NAV_SECTIONS.map((section) => (
              <React.Fragment key={section.label}>
                <div className={styles.sectionLabel}>{section.label}</div>
                <nav className={styles.nav}>
                  {section.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </React.Fragment>
            ))}
          </div>
        </aside>

        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
