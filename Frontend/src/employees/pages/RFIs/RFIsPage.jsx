import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopTabs from '../../components/TopTabs/TopTabs';
import AddRFIModal from './AddRFIModal';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import styles from './RFIsPage.module.css';
import { getBid, getBidRFIs, deleteBidRFI, updateBidRFI } from '../../services/api';
import StatusBadge from '../../../common/components/StatusBadge/StatusBadge';

/* ── SVG icon helpers ── */
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 6l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M10 3v10M6 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 15v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M4 6h12M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 6l1 11a2 2 0 002 2h4a2 2 0 002-2l1-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
    <path d="M5 13l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PdfDocIcon = () => (
  <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
    <rect x="0.5" y="0.5" width="23" height="27" rx="3.5" fill="#EEF0FF" stroke="#D0D5DD" />
    <path d="M6 3h8l6 6v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" fill="#D2D6FF" />
    <path d="M14 3v6h6" fill="#A8B4FF" />
    <text x="12" y="20" textAnchor="middle" fill="#3047f7" fontSize="6" fontWeight="700" fontFamily="Inter, sans-serif">PDF</text>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M7.333 12.667A5.333 5.333 0 107.333 2a5.333 5.333 0 000 10.667zM14 14l-2.9-2.9" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M4 8h8M6 12h4" stroke="#344054" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
    <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SortArrowsIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6, opacity: 0.5 }}>
    <path d="M12 4l-4 4h8l-4-4zM12 20l4-4H8l4 4z" fill="currentColor" />
  </svg>
);



/* Inline StatusBadge removed in favor of central component */

const TABS = [
  'Overview',
  'Grand Total',
  'Files',
  'RFIs',
  'Submittals',
  'Documents',
  'Vendors',
  'Financials & Admin',
  'Gallery',
];

const mapTabToKey = (tab) => {
  if (tab === 'Grand Total') return 'tables';
  if (tab === 'Financials & Admin') return 'financials';
  return tab.toLowerCase();
};

const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/rfi-files/${url}`;
};

const formatTimestamp = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${h.toString().padStart(2, '0')}:${mins} ${ampm}, ${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const RFI_STATUS_OPTIONS = ['draft', 'open', 'submitted', 'under_review', 'responded', 'closed'];

/* ── Main Component ── */

function RFIsPage({ hideTopTabs = false, bidId: propBidId, isCompleted = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const queryBidId = searchParams.get('bid');
  const bidId = parseInt(propBidId || id || queryBidId, 10);

  const [activeTab, setActiveTab] = useState('RFIs');
  const [project, setProject] = useState(null);
  const [rfis, setRfis] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ total: 0, draft: 0, open: 0, submitted: 0, under_review: 0, responded: 0, closed: 0 });
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, id: null });

  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Items');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 5;

  const fetchRFIs = async () => {
    if (!bidId) return;
    try {
      setLoading(true);
      const normalizedStatus = statusFilter === 'All Items' ? 'all' : statusFilter.toLowerCase().replace(/\s+/g, '_');
      const res = await getBidRFIs(bidId, currentPage, rowsPerPage, searchQuery, normalizedStatus);
      if (res && res.success) {
        setRfis(res.rfis || (res.data && res.data.rfis) || []);
        setStatusCounts(res.statusCounts || (res.data && res.data.statusCounts) || { total: 0, draft: 0, open: 0, submitted: 0, under_review: 0, responded: 0, closed: 0 });
        setTotalPages(res.totalPages || (res.data && res.data.totalPages) || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProject = async () => {
    if (!bidId) return;
    try {
      const res = await getBid(bidId);
      if (res?.success) {
        setProject(res.bid || res.data?.bid || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRFIs();
  }, [bidId, currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchProject();
  }, [bidId]);

  const toggleRow = (rowId) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const handleStatusChange = async (rfiId, newStatus) => {
    try {
      await updateBidRFI(bidId, rfiId, { status: newStatus });
      fetchRFIs();
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModalState({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const { id } = deleteModalState;
    if (!id) return;
    try {
      await deleteBidRFI(bidId, id);
      setDeleteModalState({ isOpen: false, id: null });
      fetchRFIs();
    } catch (err) {
      console.error(err);
      alert('Error deleting RFI');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const tabKey = mapTabToKey(tab);
    navigate(`/dashboard/projects?bid=${bidId}&tab=${tabKey}`);
  };

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(c => c + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(c => c - 1); };

  return (
    <>
      {!hideTopTabs && <TopTabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />}

      <div className={styles.pageWrapper}>

        <div className={styles.projectHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.projectName}>{project?.project_name || 'Project Name'}</h1>
            <p className={styles.projectSubtitle}>{project?.bid_project_id || project?.bid_sales_id || (bidId ? `225-${bidId.toString().padStart(3, '0')}` : '225-048')}</p>
          </div>
          <div className={styles.headerRight}>
            <p className={styles.projectGC}>
              <span>General Contractor:</span> {project?.clients?.[0]?.client_name || 'N/A'}
            </p>
            <p className={styles.projectAddress}>
              <MapPinIcon /> {project?.address || 'N/A'}
            </p>
          </div>
        </div>

        {/* ── List Area ── */}
        <div className={styles.listContainer}>
          <div className={styles.tableToolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.searchBox}>
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className={styles.filterWrapper}>
                <button
                  type="button"
                  className={styles.filterBtn}
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  <FilterIcon />
                  {statusFilter}
                  <ChevronDownIcon />
                </button>
                {showFilterDropdown && (
                  <div className={styles.filterDropdown}>
                    {['All Items', 'Draft', 'Open', 'Submitted', 'Under Review', 'Responded', 'Closed'].map((opt) => (
                      <div
                        key={opt}
                        className={styles.filterOption}
                        onClick={() => { setStatusFilter(opt); setShowFilterDropdown(false); setCurrentPage(1); }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.toolbarRight}>
              {!isCompleted && (
                <button
                  type="button"
                  className={styles.addNewBtn}
                  onClick={() => setShowAddModal(true)}
                >
                  Add New
                </button>
              )}
            </div>
          </div>

          {/* Table View */}
          <div className={styles.tableWrapper}>
            <table className={styles.rfiTable}>
              <thead>
                <tr>
                  <th>RFI No.</th>
                  <th>RFI Name</th>
                  <th>Notes</th>
                  <th>Status<SortArrowsIcon /></th>
                  <th>Ball in Court<SortArrowsIcon /></th>
                  <th>Action</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {loading && rfis.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : rfis.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No RFIs found.</td></tr>
                ) : (
                  rfis.map((item, idx) => {
                    const isExpanded = !!expandedRows[item.id];
                    const history = item.history || [];
                    const absoluteIndex = (currentPage - 1) * rowsPerPage + idx + 1;

                    return (
                      <React.Fragment key={item.id}>
                        <tr className={isExpanded ? styles.expandedRowParent : ''}>
                          <td className={styles.srNoCell}>RFI{String(item.sr_no || idx + 1).padStart(4, '0')}</td>
                          <td className={styles.titleCell}>
                            <span className={styles.rfiTitle}>{item.title}</span>
                          </td>
                          <td className={styles.notesCell}>{item.notes || 'RFI 1 - Please see inside'}</td>
                          <td className={styles.statusCell}>
                            <StatusBadge
                              status={item.status}
                              onStatusChange={(newStatus) => handleStatusChange(item.id, newStatus)}
                              statusOptions={RFI_STATUS_OPTIONS}
                            />
                          </td>
                          <td className={styles.ballCell}>
                            {item.ball_in_court || 'General Contractor'}
                          </td>
                          <td className={styles.actionCell}>
                            <div className={styles.actionIcons}>
                              <button className={styles.iconBtn} title="View" onClick={() => navigate(`/dashboard/projects/${bidId}/rfis/${item.id}`)}><EyeIcon /></button>
                              <button
                                className={styles.iconBtn}
                                title="Download"
                                disabled={!history.some((entry) => entry.file_url)}
                                onClick={() => {
                                  const fileEntry = history.find((entry) => entry.file_url);
                                  if (fileEntry) window.open(getFileUrl(fileEntry.file_url), '_blank', 'noopener,noreferrer');
                                }}
                              >
                                <DownloadIcon />
                              </button>
                              {!isCompleted && (
                                <button className={styles.iconBtn} title="Delete" onClick={(e) => { e.stopPropagation(); handleDeleteClick(item.id); }}><TrashIcon /></button>
                              )}
                            </div>
                          </td>
                          <td className={styles.chevronCell}>
                            <button
                              type="button"
                              className={`${styles.iconBtn} ${styles.chevronBtn} ${isExpanded ? styles.chevronOpen : ''}`}
                              onClick={() => toggleRow(item.id)}
                            >
                              <ChevronDownIcon />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded History row */}
                        {isExpanded && (
                          <tr className={styles.expandedRowChild}>
                            <td colSpan="7" style={{ padding: 0 }}>
                              <div className={styles.historyWrapper}>
                                {history.length > 0 ? history.map(entry => (
                                  <div key={entry.id} className={styles.historyCard}>
                                    <div className={styles.historyInfo}>
                                      <div className={styles.personHeader}>
                                        <span className={styles.dotOnline} />
                                        <div className={styles.personNameGroup}>
                                          <span className={styles.personName}>{entry.created_by_name || 'Unknown'}</span>
                                          <div className={styles.personCompany}>{entry.company || 'Aquil Tech Labs'}</div>
                                        </div>
                                      </div>
                                      <p className={styles.historyMessage}>{entry.message}</p>
                                      <span className={styles.historyTime}>{formatTimestamp(entry.created_at)}</span>
                                    </div>
                                    {entry.file_url ? (
                                      <div className={styles.historyPdf}>
                                        <a href={getFileUrl(entry.file_url)} target="_blank" rel="noopener noreferrer">
                                          <PdfDocIcon />
                                        </a>
                                      </div>
                                    ) : null}
                                  </div>
                                )) : (
                                  <div style={{ padding: '20px 32px', color: '#667085' }}>No history entries yet.</div>
                                )}
                                <div style={{ textAlign: 'center' }}>
                                  <button className={styles.viewMoreBtn} onClick={() => navigate(`/dashboard/projects/${bidId}/rfis/${item.id}`)}>
                                    View More
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.paginationArea}>
            <button
              className={styles.pageBtn}
              onClick={handlePrevPage}
              disabled={currentPage === 1 || rfis.length === 0}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {rfis.length > 0 ? currentPage : 0} of {totalPages}
            </span>
            <button
              className={styles.pageBtn}
              onClick={handleNextPage}
              disabled={currentPage === totalPages || rfis.length === 0}
            >
              Next
            </button>
          </div>
        </div>

        {/* ── Modals ── */}
        {deleteModalState.isOpen && (
          <DeleteConfirmModal
            isOpen={deleteModalState.isOpen}
            onClose={() => setDeleteModalState({ isOpen: false, id: null })}
            onConfirm={confirmDelete}
            itemName="this RFI"
          />
        )}

        {showAddModal && (
          <AddRFIModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            bidId={bidId}
            onCreated={fetchRFIs}
          />
        )}
      </div>
    </>
  );
}

export default RFIsPage;
