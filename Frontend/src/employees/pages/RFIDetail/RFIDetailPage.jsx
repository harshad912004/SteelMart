import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopTabs from '../../components/TopTabs/TopTabs';
import AddHistoryModal from './AddHistoryModal';
import styles from './RFIDetailPage.module.css';
import { getBid, getBidRFI, deleteBidRFI, deleteBidRFIHistory, updateBidRFI } from '../../services/api';
import StatusBadge from '../../../common/components/StatusBadge/StatusBadge';

const BackArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

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

const PdfDocIcon = () => (
  <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
    <rect x="0.5" y="0.5" width="23" height="27" rx="3.5" fill="#EEF0FF" stroke="#D0D5DD" />
    <path d="M6 3h8l6 6v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" fill="#D2D6FF" />
    <path d="M14 3v6h6" fill="#A8B4FF" />
    <text x="12" y="20" textAnchor="middle" fill="#3047f7" fontSize="6" fontWeight="700" fontFamily="Inter, sans-serif">PDF</text>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M4 6h12M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 6l1 11a2 2 0 002 2h4a2 2 0 002-2l1-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <path d="M3.5 5.25l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

function RFIDetailPage({ hideTopTabs = false, bidId: propBidId }) {
  const { id, rfiId } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const queryBidId = searchParams.get('bid');
  const bidId = parseInt(propBidId || id || queryBidId, 10);
  const parsedRfiId = parseInt(rfiId, 10);

  const [activeTab, setActiveTab] = useState('RFIs');
  const [showAddModal, setShowAddModal] = useState(false);

  const [project, setProject] = useState(null);
  const [rfi, setRfi] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRFI = async () => {
    if (!bidId || !parsedRfiId) return;
    try {
      setLoading(true);
      const res = await getBidRFI(bidId, parsedRfiId);
      if (res && res.success) {
        setRfi(res.rfi || (res.data && res.data.rfi));
        setHistory(res.history || (res.data && res.data.history) || []);
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
    fetchRFI();
  }, [bidId, parsedRfiId]);

  useEffect(() => {
    fetchProject();
  }, [bidId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const tabKey = mapTabToKey(tab);
    navigate(`/dashboard/projects?bid=${bidId}&tab=${tabKey}`);
  };

  const handleDeleteHistory = async (historyId) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await deleteBidRFIHistory(bidId, parsedRfiId, historyId);
      fetchRFI();
    } catch (err) {
      console.error(err);
      alert('Error deleting history entry');
    }
  };

  const handleDeleteRfi = async () => {
    if (!window.confirm('Are you sure you want to delete this RFI?')) return;
    try {
      await deleteBidRFI(bidId, parsedRfiId);
      navigate(`/dashboard/projects?bid=${bidId}&tab=rfis`);
    } catch (err) {
      console.error(err);
      alert('Error deleting RFI');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await updateBidRFI(bidId, parsedRfiId, { status });
      fetchRFI();
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  if (loading && !rfi) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading RFI...</div>;
  }

  if (!rfi) {
    return <div style={{ padding: 40, textAlign: 'center' }}>RFI not found.</div>;
  }

  return (
    <>
      {!hideTopTabs && <TopTabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />}

      <div className={styles.pageWrapper}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate(`/dashboard/projects?bid=${bidId}&tab=rfis`)}
        >
          <BackArrowIcon />
          <span>Back to RFIs</span>
        </button>

        <div className={styles.rfiHeader}>
          <div>
            <div className={styles.rfiTitleRow}>
              <h1 className={styles.rfiTitle}>{rfi.title}</h1>
              <button className={styles.eyeButton}><EyeIcon /></button>
            </div>
            <p className={styles.rfiSubtitle}>{project?.bid_project_id || project?.bid_sales_id || (bidId ? `225-${bidId.toString().padStart(3, '0')}` : '224-354-A')}</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.statusBadge}>
              <StatusBadge
                status={rfi.status}
                withArrow
                onStatusChange={handleStatusChange}
                statusOptions={['draft', 'open', 'submitted', 'under_review', 'responded', 'closed']}
              />
            </div>
            <button className={styles.trashButton} onClick={handleDeleteRfi}><TrashIcon /></button>
          </div>
        </div>
        <p className={styles.rfiDescription}>{rfi.description || rfi.notes || 'No description available.'}</p>

        <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h3 className={styles.historyTitle}>RFI History</h3>
            <div className={styles.historyHeaderRight}>
              <div className={styles.courtInfo}>
                <span className={styles.courtCompany}>{rfi.ball_in_court || 'Aquil Tech Labs'}</span>
                <span className={styles.courtLabel}>Ball in Court</span>
              </div>
              <button className={styles.addNewButton} onClick={() => setShowAddModal(true)}>
                + Add New
              </button>
            </div>
          </div>
          <div className={styles.historyEntries}>
            {history.length > 0 ? history.map((entry) => (
              <div key={entry.id} className={styles.historyCard}>
                <div className={styles.historyCardLeft}>
                  <div className={styles.personRow}>
                    <div className={styles.onlineDot} />
                    <span className={styles.personName}>{entry.created_by_name || 'Unknown'}</span>
                  </div>
                  <div className={styles.personCompany}>{entry.company || ''}</div>
                  <p className={styles.historyMessage}>{entry.message}</p>
                  <span className={styles.historyTimestamp}>{formatTimestamp(entry.created_at)}</span>
                  <button
                    type="button"
                    className={styles.trashButton}
                    style={{ marginTop: 12 }}
                    onClick={() => handleDeleteHistory(entry.id)}
                  >
                    <TrashIcon />
                  </button>
                </div>

                <div className={styles.historyCardRight}>
                  {entry.file_url && (
                    <a href={getFileUrl(entry.file_url)} target="_blank" rel="noopener noreferrer" className={styles.pdfIcon}>
                      <PdfDocIcon />
                    </a>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#667085' }}>
                No history entries yet.
              </div>
            )}
          </div>
        </div>

        {showAddModal && (
          <AddHistoryModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            bidId={bidId}
            rfiId={parsedRfiId}
            onAdded={fetchRFI}
          />
        )}
      </div>
    </>
  );
}

export default RFIDetailPage;
