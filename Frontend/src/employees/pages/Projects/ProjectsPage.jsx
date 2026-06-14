import React, { useEffect, useState } from 'react';
import BidListPage from '../../components/BidListPage/BidListPage';
import { Toast } from '../../components/Toast';
import AddProjectModal from './AddProjectModal';
import RfiProjectsModal from './RfiProjectsModal';
import SubmittalProjectsModal from './SubmittalProjectsModal';
import { getBids, pinBid, unpinBid } from '../../../common/services/api';
import styles from './ProjectsPage.module.css';

const TABS = ['Won'];
const PROJECT_ACTIONS = [
  {
    key: 'rfis',
    label: 'RFIs',
    iconClassName: 'rfisIcon',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3.75H14.75L19 8V19.25A1.75 1.75 0 0 1 17.25 21H7A2 2 0 0 1 5 19V5.75A2 2 0 0 1 7 3.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 3.75V8.5H18.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.5 11H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8.5 14H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8.5 17H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'submittals',
    label: 'Submittals',
    iconClassName: 'submittalsIcon',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 4.75A1.75 1.75 0 0 1 6.75 3H14.5L19 7.5V19.25A1.75 1.75 0 0 1 17.25 21H6.75A1.75 1.75 0 0 1 5 19.25V4.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 3V8H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.5 11H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8.5 14H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8.5 17H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 13.5H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 17.5H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'contracts',
    label: 'Contracts',
    iconClassName: 'contractsIcon',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6.75 3H13.75L18.5 7.75V19.25A1.75 1.75 0 0 1 16.75 21H6.75A1.75 1.75 0 0 1 5 19.25V4.75A1.75 1.75 0 0 1 6.75 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.5 3V8H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.5 11H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8.5 14H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8.5 17H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18.5 4.75L20 3.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'external-project',
    label: 'External Project',
    iconClassName: 'externalProjectIcon',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3H17A2 2 0 0 1 19 5V19A2 2 0 0 1 17 21H7A2 2 0 0 1 5 19V5A2 2 0 0 1 7 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 7H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 11H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 15H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14.5 3V7.25H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function ProjectsPage() {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isRfiModalOpen, setIsRfiModalOpen] = useState(false);
  const [isSubmittalModalOpen, setIsSubmittalModalOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [toast, setToast] = useState({ isOpen: false, message: '', isSuccess: true });
  const [pinnedBids, setPinnedBids] = useState([]);
  const [pinnedLoading, setPinnedLoading] = useState(false);

  const fetchPinnedBids = async () => {
    setPinnedLoading(true);
    try {
      const pinnedResponse = await getBids(1, '', '', '', '', 'crm', 50, true);
      setPinnedBids(pinnedResponse?.bids || []);
    } catch (error) {
      setPinnedBids([]);
    } finally {
      setPinnedLoading(false);
    }
  };

  const fetchBids = async (page, search) => {
    const res = await getBids(page, 'won', search, '', '', 'crm');
    const bidsList = res?.bids || res?.data?.bids || [];
    const pag = res?.pagination || res?.data?.pagination || {
      totalPages: 1,
      totalRecords: bidsList.length
    };
    return {
      bids: bidsList,
      totalPages: pag.totalPages || 1,
      totalRecords: pag.totalRecords !== undefined ? pag.totalRecords : bidsList.length,
    };
  };

  const toggleProjectPin = async (action, bid) => {
    try {
      const response = action === 'pin'
        ? await pinBid(bid.id)
        : await unpinBid(bid.id);

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to update pinned state');
      }

      await fetchPinnedBids();
      setToast({ isOpen: true, message: response.message || `Project ${action === 'pin' ? 'pinned' : 'unpinned'} successfully`, isSuccess: true });
    } catch (error) {
      setToast({ isOpen: true, message: error.message || 'Unable to update pinned status', isSuccess: false });
      throw error;
    }
  };

  useEffect(() => {
    fetchPinnedBids();
  }, [reloadToken]);

  return (
    <>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        isSuccess={toast.isSuccess}
        onClose={() => setToast((current) => ({ ...current, isOpen: false }))}
        duration={3000}
      />

      <BidListPage
        title="Projects"
        tabs={TABS}
        defaultTab="Won"
        hideTabs
        defaultSort="due_desc"
        searchPlaceholder="Search projects..."
        fetchBids={fetchBids}
        idType="project"
        reloadToken={reloadToken}
        pinnedBids={pinnedBids}
        onTogglePin={toggleProjectPin}
        onPinnedChange={fetchPinnedBids}
        toolbarAction={(
          <button type="button" className={styles.addProjectButton} onClick={() => setIsAddProjectOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Add Project
          </button>
        )}
        preTabsContent={(
          <section className={styles.quickActionsSection} aria-label="Project quick actions">
            <div className={styles.quickActionsHeader}>
              <h2>Manage Your Active Projects</h2>
              <p>Click on the buttons below to quickly resolve your issues</p>
            </div>

            <div className={styles.quickActionsGrid}>
              {PROJECT_ACTIONS.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  className={styles.quickActionCard}
                  onClick={(event) => {
                    if (action.key === 'external-project') {
                      setIsAddProjectOpen(true);
                    } else if (action.key === 'rfis') {
                      setIsRfiModalOpen(true);
                    } else if (action.key === 'submittals') {
                      setIsSubmittalModalOpen(true);
                    } else {
                      event.preventDefault();
                    }
                  }}
                >
                  <span className={`${styles.quickActionIcon} ${styles[action.iconClassName]}`}>
                    {action.icon}
                  </span>
                  <span className={styles.quickActionLabel}>{action.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      />

      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onCreated={() => setReloadToken((current) => current + 1)}
        onNotify={(message, isSuccess) => setToast({ isOpen: true, message, isSuccess })}
      />

      <RfiProjectsModal
        isOpen={isRfiModalOpen}
        onClose={() => setIsRfiModalOpen(false)}
      />

      <SubmittalProjectsModal
        isOpen={isSubmittalModalOpen}
        onClose={() => setIsSubmittalModalOpen(false)}
      />
    </>
  );
}

export default ProjectsPage;
