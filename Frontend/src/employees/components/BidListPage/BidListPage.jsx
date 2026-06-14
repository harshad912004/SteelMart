import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BidTable from '../BidTable';
import { Toast } from '../Toast';
import BidDetailsViewModal from '../BidDetailsViewModal/BidDetailsViewModal';
import ProjectOnboardingModal from '../../pages/CRM/ProjectOnboardingModal';
import { updateBid, getBid, uploadBidRootFile, createBidFolder, getBidFolders, uploadBidFolderFile, deleteBid } from '../../../common/services/api';
import BidOverviewPage from '../BidOverview/BidOverviewPage';
import styles from '../../pages/Sales/SalesPage.module.css';
import { getBidCreatedTime } from '../../utils/bidHelpers';
import { ClearIcon } from '../Icons';
import ApproveBidModal from '../ApproveBidModal';

const getContractorName = (c) => {
  if (!c) return '';
  if (typeof c === 'object') {
    return c.name || c.client_name || c.company_name || '';
  }
  return String(c);
};

function BidListPage({
  title,
  tabs,
  defaultTab,
  defaultSort = '',
  searchPlaceholder,
  fetchBids,
  preTabsContent = null,
  toolbarAction = null,
  reloadToken = 0,
  pinnedBids = [],
  onTogglePin,
  onPinnedChange,
  hideTabs = false,
  idType = null,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [bids, setBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSort, setSelectedSort] = useState(defaultSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalRecords: 0, currentPage: 1 });
  const [selectedBid, setSelectedBid] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]);
  const [toast, setToast] = useState({ isOpen: false, message: '', isSuccess: true });
  const [viewBid, setViewBid] = useState(null);
  const [bidFilesById, setBidFilesById] = useState({});
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveBidTarget, setApproveBidTarget] = useState(null);

  const loadData = async (page = 1, search = '', tab = activeTab) => {
    setIsLoading(true);
    try {
      const result = await fetchBids(page, search, tab);
      setBids(result?.bids || []);
      setPagination({
        totalPages: result?.totalPages || 1,
        totalRecords: typeof result?.totalRecords === 'number' ? result.totalRecords : (result?.bids?.length || 0),
        currentPage: page
      });
    } catch (error) {
      setToast({ isOpen: true, message: error.message || `Failed to load ${title.toLowerCase()}`, isSuccess: false });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentPage, searchTerm, activeTab);
  }, [currentPage, searchTerm, activeTab, reloadToken]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const bidId = searchParams.get('bid');

    if (!bidId) {
      setViewBid(null);
    } else if (!viewBid || String(viewBid.id) !== String(bidId)) {
      setIsLoading(true);
      getBid(bidId)
        .then((data) => {
          if (data && data.success !== false) {
            const detailedBid = data.bid || data.data?.bid || data.data || { id: bidId };
            setViewBid(detailedBid);
          }
        })
        .catch(() => {
          setViewBid({ id: bidId });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [location.search]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleBidClick = async (bid) => {
    setIsLoading(true);
    try {
      const data = await getBid(bid.id);
      if (data?.success === false) {
        throw new Error(data?.message || 'Failed to fetch bid details');
      }
      const detailedBid = data?.bid || data?.data?.bid || data?.data || bid;
      setViewBid(detailedBid);
      navigate(`${location.pathname}?bid=${bid.id}`);
    } catch (error) {
      setToast({ isOpen: true, message: error.message || 'Failed to load bid details', isSuccess: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = async (action, bid) => {
    if (action === 'view') {
      setIsLoading(true);
      try {
        const data = await getBid(bid.id);
        if (data?.success === false) {
          throw new Error(data?.message || 'Failed to fetch bid details');
        }
        const detailedBid = data?.bid || data?.data?.bid || data?.data || bid;
        setSelectedBid(detailedBid);
        setIsViewModalOpen(true);
      } catch (error) {
        setToast({ isOpen: true, message: error.message || 'Failed to load bid details', isSuccess: false });
      } finally {
        setIsLoading(false);
      }
    } else if (action === 'won') {
      setSelectedBid(bid);
      setIsOnboardingOpen(true);
    } else if (action === 'lost') {
      if (window.confirm(`Are you sure you want to mark this ${title.toLowerCase().slice(0, -1)} as lost?`)) {
        updateBid(bid.id, { ...bid, status: 'lost' })
          .then((res) => {
            if (res?.success) {
              setToast({ isOpen: true, message: 'Status updated to Lost', isSuccess: true });
              loadData(currentPage, searchTerm, activeTab);
            } else {
              throw new Error(res?.message || 'Failed to update status');
            }
          })
          .catch(err => {
            setToast({ isOpen: true, message: err.message || 'Failed to update status', isSuccess: false });
          });
      }
    } else if (action === 'pin' || action === 'unpin') {
      if (typeof onTogglePin !== 'function') {
        setToast({ isOpen: true, message: 'Pin action is unavailable for this view.', isSuccess: false });
        return;
      }

      setIsLoading(true);
      try {
        await onTogglePin(action, bid);
        await loadData(currentPage, searchTerm, activeTab);
        if (typeof onPinnedChange === 'function') {
          await onPinnedChange();
        }
      } catch (error) {
        setToast({ isOpen: true, message: error.message || 'Failed to update pin state', isSuccess: false });
      } finally {
        setIsLoading(false);
      }
    } else if (action === 'send') {
      setToast({ isOpen: true, message: 'Estimate sent successfully to client!', isSuccess: true });
    } else if (action === 'approve') {
      setIsLoading(true);
      try {
        const data = await getBid(bid.id);
        if (data?.success === false) {
          throw new Error(data?.message || 'Failed to fetch bid details');
        }
        const detailedBid = data?.bid || data?.data?.bid || data?.data || bid;
        setApproveBidTarget(detailedBid);
        setIsApproveModalOpen(true);
      } catch (error) {
        setToast({ isOpen: true, message: error.message || 'Failed to load bid details', isSuccess: false });
      } finally {
        setIsLoading(false);
      }
    } else if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete this bid?`)) {
        setIsLoading(true);
        try {
          const res = await deleteBid(bid.id);
          if (res?.success) {
            setToast({ isOpen: true, message: 'Bid deleted successfully', isSuccess: true });
            loadData(currentPage, searchTerm, activeTab);
          } else {
            throw new Error(res?.message || 'Failed to delete bid');
          }
        } catch (error) {
          setToast({ isOpen: true, message: error.message || 'Failed to delete bid', isSuccess: false });
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleApproveBidSubmit = async (selectedGcIds) => {
    if (!approveBidTarget) return;

    try {
      setIsLoading(true);
      const gcIdsString = selectedGcIds.join(',');
      const data = await updateBid(approveBidTarget.id, {
        status: 'approved',
        approved_by: gcIdsString
      });

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to approve bid');
      }

      setToast({ isOpen: true, message: 'Bid approved successfully!', isSuccess: true });
      setIsApproveModalOpen(false);
      setApproveBidTarget(null);
      loadData(currentPage, searchTerm, activeTab);
    } catch (error) {
      setToast({ isOpen: true, message: error.message || 'Failed to approve bid', isSuccess: false });
    } finally {
      setIsLoading(false);
    }
  };

  const getBidDueTime = (bid) => {
    const dateStr = bid?.due_date || bid?.dueDate;
    if (!dateStr) return 0;
    const parsed = Date.parse(dateStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  const visibleBids = useMemo(() => {
    const sortType = selectedSort || 'due_desc';
    return [...bids].sort((a, b) => {
      const direction = sortType === 'due_asc' ? 1 : -1;
      return (getBidDueTime(a) - getBidDueTime(b)) * direction;
    });
  }, [bids, selectedSort]);

  const firstItemNumber = bids.length > 0 ? (currentPage - 1) * 5 + 1 : 0;
  const lastItemNumber = Math.min(currentPage * 5, pagination.totalRecords);

  const pageNumbers = [];
  for (let i = 1; i <= pagination.totalPages; i++) {
    pageNumbers.push(i);
  }

  const effectiveIdType = idType || (String(title || '').toLowerCase().includes('project') ? 'project' : null);

  if (viewBid) {
    return (
      <>
        <Toast
          isOpen={toast.isOpen}
          message={toast.message}
          isSuccess={toast.isSuccess}
          onClose={() => setToast({ ...toast, isOpen: false })}
          duration={3000}
        />
        <BidOverviewPage
          bid={viewBid}
          isSalesOrCRM={false}
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
            navigate(location.pathname);
          }}
          onBidUpdated={(updatedBid) => {
            setViewBid((currentBid) => {
              const prevPinned = currentBid?.is_pinned;
              const nextPinned = updatedBid?.is_pinned;
              if (prevPinned !== nextPinned && typeof onPinnedChange === 'function') {
                onPinnedChange();
              }
              return { ...currentBid, ...updatedBid };
            });
          }}
          onNotify={(message, isSuccess) => setToast({ isOpen: true, message, isSuccess })}
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
        onClose={() => setToast({ ...toast, isOpen: false })}
        duration={3000}
      />
      <div className={styles.pageWrapper}>
        {preTabsContent}

        {/* Tab Controls */}
        {!hideTabs ? (
          <div className={styles.tabsContainer}>
            {tabs.map(tab => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              >
                {tab}
              </button>
            ))}
          </div>
        ) : null}

        {pinnedBids && pinnedBids.length > 0 ? (() => {
          const PINNED_COLLAPSED_COUNT = 4;
          const visiblePinnedBids = pinnedExpanded ? pinnedBids : pinnedBids.slice(0, PINNED_COLLAPSED_COUNT);
          const hasMore = pinnedBids.length > PINNED_COLLAPSED_COUNT;

          return (
            <section className={styles.pinnedSection}>
              <div className={styles.pinnedSectionHeader}>
                <h2>Pinned Projects</h2>
                {hasMore ? (
                  <button
                    type="button"
                    className={styles.pinnedExpandButton}
                    onClick={() => setPinnedExpanded((prev) => !prev)}
                    aria-label={pinnedExpanded ? 'Collapse pinned projects' : 'Show all pinned projects'}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ transform: pinnedExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}
                    >
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : null}
              </div>
              <div className={styles.pinnedGrid}>
                {visiblePinnedBids.map((pinnedBid) => {
                  const status = String(pinnedBid.status || '').toLowerCase();
                  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
                  const badgeClass = status === 'won'
                    ? styles.pinnedStatusBadgeWon
                    : status === 'lost'
                      ? styles.pinnedStatusBadgeLost
                      : status === 'pending' || status === 'draft'
                        ? styles.pinnedStatusBadgePending
                        : styles.pinnedStatusBadge;

                  const rawContractor = pinnedBid.client_name
                    || pinnedBid.client
                    || pinnedBid.general_contractor
                    || (Array.isArray(pinnedBid.selected_general_contractors) && pinnedBid.selected_general_contractors[0]?.name)
                    || '';
                  const contractor = getContractorName(rawContractor);

                  const subContractorStatus = pinnedBid.sub_contractor_status || 'Invited';
                  const documentStatus = pinnedBid.document_status || 'Pending';

                  const subContractorClass = subContractorStatus === 'Accepted'
                    ? styles.pinnedCardStatusAccepted
                    : subContractorStatus === 'Ongoing'
                      ? styles.pinnedCardStatusOngoing
                      : styles.pinnedCardStatusInvited;

                  const documentClass = documentStatus === 'Ongoing'
                    ? styles.pinnedCardStatusOngoing
                    : documentStatus === 'Accepted'
                      ? styles.pinnedCardStatusAccepted
                      : styles.pinnedCardStatusPending;

                  return (
                    <div
                      key={pinnedBid.id}
                      className={styles.pinnedCard}
                      onClick={() => handleBidClick(pinnedBid)}
                      role="button"
                      tabIndex={0}
                    >
                      <button
                        type="button"
                        className={styles.pinnedCardPinButton}
                        title="Unpin project"
                        onClick={async (event) => {
                          event.stopPropagation();
                          if (typeof onTogglePin === 'function') {
                            await onTogglePin('unpin', pinnedBid);
                            if (typeof onPinnedChange === 'function') {
                              await onPinnedChange();
                            }
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(45deg)' }}>
                          <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <div className={styles.pinnedCardBadgeRow}>
                        <span className={badgeClass}>{statusLabel}</span>
                      </div>
                      <span className={styles.pinnedCardProjectId}>
                        {pinnedBid.bid_project_id || pinnedBid.project_id || '—'}
                      </span>
                      <span className={styles.pinnedCardName}>
                        {pinnedBid.project_name || 'Untitled Project'}
                        {contractor ? (
                          <em style={{ color: '#98A2B3', fontWeight: 400 }}> led by {contractor}.</em>
                        ) : null}
                      </span>
                      <div className={styles.pinnedCardInfoRow}>
                        <span>Sub-contractors:</span>
                        <span className={`${styles.pinnedCardStatusValue} ${subContractorClass}`}>
                          {subContractorStatus}
                        </span>
                      </div>
                      {/* <div className={styles.pinnedCardInfoRow}>
                        <span>Documents:</span>
                        <span className={`${styles.pinnedCardStatusValue} ${documentClass}`}>
                          {documentStatus}
                        </span>
                      </div> */}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })() : null}

        <div className={styles.container}>
          <div className={styles.filterSection}>
            <div className={styles.leftFilters}>
              <div className={styles.filterGroup}>
                <select
                  className={styles.filterDropdown}
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
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
                  placeholder={searchPlaceholder}
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
              {toolbarAction}
            </div>
          </div>

          <BidTable
            bids={visibleBids}
            onBidClick={handleBidClick}
            onActionClick={handleActionClick}
            isLoading={isLoading}
            pipeline="crm"
            idType={effectiveIdType}
          />

          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Showing data {firstItemNumber} to {lastItemNumber} of {pagination.totalRecords} entries
            </span>
            <div className={styles.paginationButtons}>
              <button
                className={styles.pageButton}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1 || isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.41 16.59L10.83 12L15.41 7.41L14 6L8 12L14 18L15.41 16.59Z" fill="currentColor" /></svg>
              </button>
              {pageNumbers.map(page => (
                <span
                  key={page}
                  className={page === currentPage ? styles.pageNumber : styles.pageNumberInactive}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </span>
              ))}
              <button
                className={styles.pageButton}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage >= pagination.totalPages || isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="currentColor" /></svg>
              </button>
            </div>
          </div>
        </div>

        <BidDetailsViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedBid(null);
          }}
          bid={selectedBid}
          onActionClick={handleActionClick}
          allowedActions={['edit', 'delete', 'approve', 'lost', 'won']}
        />

        <ApproveBidModal
          isOpen={isApproveModalOpen}
          onClose={() => {
            setIsApproveModalOpen(false);
            setApproveBidTarget(null);
          }}
          onConfirm={handleApproveBidSubmit}
          bid={approveBidTarget}
        />

        <ProjectOnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => {
            setIsOnboardingOpen(false);
            setSelectedBid(null);
          }}
          bid={selectedBid}
          onSubmit={async (payload, projectContractFiles) => {
            try {
              const res = await updateBid(selectedBid.id, payload);
              if (!res?.success) throw new Error(res?.message || 'Failed to onboard project');

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

              setToast({ isOpen: true, message: 'Onboarding saved successfully!', isSuccess: true });
              setIsOnboardingOpen(false);
              setSelectedBid(null);
              loadData(currentPage, searchTerm, activeTab);
            } catch (err) {
              setToast({ isOpen: true, message: err.message || 'Onboarding failed', isSuccess: false });
            }
          }}
        />
      </div>
    </>
  );
}

export default BidListPage;