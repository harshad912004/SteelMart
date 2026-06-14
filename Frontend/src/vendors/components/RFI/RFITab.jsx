import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
} from 'lucide-react';
import styles from '../../../employees/pages/RFIs/RFIsPage.module.css';
import { getVendorBidRFIs } from '../../services/api';
import StatusBadge from '../../../common/components/StatusBadge/StatusBadge';

const WarningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="#F04438" strokeWidth="1.5" />
    <path d="M12 8v4" stroke="#F04438" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1" fill="#F04438" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 6l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ReplyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M8 5L3 10l5 5M3 10h10a4 4 0 010 8H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
    <path d="M2 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M4 6h12M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 6l1 11a2 2 0 002 2h4a2 2 0 002-2l1-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ verticalAlign: 'middle', marginRight: 4 }}>
    <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SortArrowsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6, verticalAlign: 'middle', cursor: 'pointer' }}>
    <path d="M12 4l-4 4h8l-4-4zM12 20l4-4H8l4 4z" fill="#98A2B3" />
  </svg>
);

const PdfDocIcon = () => (
  <svg width="42" height="48" viewBox="0 0 36 40" fill="none">
    <rect x="0.5" y="0.5" width="35" height="39" rx="3.5" fill="#FFF" stroke="#EAECF0" />
    <path d="M8 4h14l8 8v24a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" fill="#EFF8FF" />
    <path d="M22 4v8h8" fill="#B2DDFF" />
    <path d="M22 4v8h8" stroke="#B2DDFF" strokeWidth="1" />
    <text x="18" y="28" textAnchor="middle" fill="#1570EF" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">PDF</text>
  </svg>
);

const SearchIconSvg = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M7.333 12.667A5.333 5.333 0 107.333 2a5.333 5.333 0 000 10.667zM14 14l-2.9-2.9" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M15 6.667a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM5 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM15 18.333a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM7.25 11.167l5.5 3.166M12.75 5.667l-5.5 3.166" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M9 13l2-2m-2.5 3.5a4.243 4.243 0 01-6-6l2.5-2.5a4.243 4.243 0 016 6m2.5-8.5a4.243 4.243 0 016 6l-2.5 2.5a4.243 4.243 0 01-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const formatTimestamp = (ts) => {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    const hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${h.toString().padStart(2,'0')}:${mins} ${ampm}, ${d.getDate().toString().padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (err) {
    return '';
  }
};

const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/rfi-files/${url}`;
};

/* Inline StatusBadge removed in favor of central component */

function RFITab({ bidId, onViewRFI, onAddNew, onDelete, refreshTrigger = 0 }) {
  const [expandedId, setExpandedId] = useState(null);
  const [rfis, setRfis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const rowsPerPage = 5;

  const fetchRFIs = async () => {
    if (!bidId) return;
    setLoading(true);
    try {
      const res = await getVendorBidRFIs(bidId, currentPage, rowsPerPage, searchQuery, statusFilter);
      if (res && res.success) {
        setRfis(res.rfis || res.data?.rfis || []);
        setTotalPages(res.totalPages || res.data?.totalPages || 1);
        setTotalRecords(res.totalRecords || res.data?.totalRecords || 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRFIs();
  }, [bidId, currentPage, searchQuery, statusFilter, refreshTrigger]);

  const toggleRow = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(c => c + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(c => c - 1); };

  return (
    <div className={styles.logContainer}>
      <div className={styles.logHeader}>
        <h2 className={styles.logTitle}>RFI Log</h2>
        <div className={styles.toolbarRight}>
          <div className={styles.searchBox}>
            <SearchIconSvg />
            <input 
              type="text" 
              placeholder="Search RFIs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
            <button
              type="button"
              className={styles.addNewBtn}
              onClick={() => onAddNew?.()}
            >
              <Plus size={16} /> Add New
            </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.rfiTable}>
          <thead>
            <tr>
              <th>Number</th>
              <th>Title</th>
              <th>Notes</th>
              <th>Status <SortArrowsIcon /></th>
              <th>Ball in Court <SortArrowsIcon /></th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && rfis.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
            ) : rfis.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No RFIs found.</td></tr>
            ) : (
              rfis.map((item, idx) => {
                const absoluteIndex = (currentPage - 1) * rowsPerPage + idx + 1;
                const isExpanded = expandedId === item?.id;
                const history = item?.history || [];

                return (
                  <React.Fragment key={item?.id || idx}>
                    <tr 
                      className={isExpanded ? styles.expandedRowParent : ''} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => item?.id && toggleRow(item.id)}
                    >
                      <td className={styles.srNoCell}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {item?.priority === 'High' && (
                            <div style={{ alignSelf: 'flex-start', background: '#475467', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                              Priority - High
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <WarningIcon />
                            <span>RFI {String(item?.sr_no || absoluteIndex).padStart(3, '0')}</span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.titleCell}>
                        <span className={styles.rfiTitle}>{item?.title || 'Untitled RFI'}</span>
                      </td>
                      <td className={styles.notesCell} style={{ color: '#475467' }}>
                        {(item?.notes || item?.description || 'N/A').substring(0, 40)}
                      </td>
                      <td className={styles.statusCell}>
                        <StatusBadge status={item?.status} />
                      </td>
                      <td className={styles.ballCell}>
                        <div className={styles.ballCompany}>{item?.ball_in_court || 'N/A'}</div>
                      </td>
                      <td className={styles.actionCell}>
                        <div className={styles.actionIcons} onClick={e => e.stopPropagation()}>
                          <button className={styles.iconBtn} title="View" onClick={() => item?.id && onViewRFI?.(item)}>
                            <EyeIcon />
                          </button>
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
                          <button className={styles.iconBtn} title="Delete" onClick={() => item?.id && onDelete?.(item)}>
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className={styles.expandedRowChild}>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div className={styles.historyWrapper}>
                            <div style={{ padding: '0 32px 16px', color: '#475467', fontSize: 14 }}>
                              {item?.description || item?.notes || 'No description provided.'}
                            </div>
                            {history.length > 0 ? history.map((entry, entryIdx) => (
                              <div key={entry?.id || entryIdx} className={styles.historyCard} style={{ flexDirection: 'column' }}>
                                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                                  <div className={styles.historyInfo}>
                                    <div className={styles.personHeader}>
                                      <span className={styles.dotOnline} />
                                      <div className={styles.personNameGroup}>
                                        <span className={styles.personName}>{entry?.created_by_name || 'Vendor User'}</span>
                                        <div className={styles.personCompany}>{entry?.company || 'Vendor Company'}</div>
                                      </div>
                                    </div>
                                    <p className={styles.historyMessage}>{entry?.message}</p>
                                    <span className={styles.historyTime}>{formatTimestamp(entry?.created_at)}</span>
                                  </div>
                                  <div className={styles.historyRight}>
                                    <StatusBadge status={entry?.status} />
                                    {entry?.file_url && (
                                      <div className={styles.submittalHistoryPdf}>
                                        <div className={styles.pdfIconBox}>
                                          <a href={getFileUrl(entry.file_url)} target="_blank" rel="noopener noreferrer">
                                            <PdfDocIcon />
                                          </a>
                                        </div>
                                        <div className={styles.pdfActions}>
                                          <EyeIcon />
                                          <ShareIcon />
                                        </div>
                                        <span className={styles.pdfVersion}>Version - {entry?.version || 1}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className={styles.replyActionRow}>
                                  <button className={styles.viewReplyBtn}>
                                    <ChevronDownIcon /> View Reply
                                  </button>
                                </div>
                              </div>
                            )) : (
                              <div style={{ padding: '20px 32px', color: '#667085' }}>No history entries yet.</div>
                            )}
                            <div style={{ textAlign: 'center' }}>
                              <button className={styles.viewMoreBtn} onClick={() => item?.id && onViewRFI?.(item)}>
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

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 20, marginBottom: 20 }}>
        <button 
          onClick={handlePrevPage} 
          disabled={currentPage === 1 || rfis.length === 0}
          style={{ padding: '8px 16px', background: '#F2F4F7', border: '1px solid #D0D5DD', borderRadius: 6, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
        >
          Previous
        </button>
        <span style={{ fontSize: 14, fontFamily: "'Inter', sans-serif", color: '#344054' }}>
          Page {rfis.length > 0 ? currentPage : 0} of {totalPages}
        </span>
        <button 
          onClick={handleNextPage} 
          disabled={currentPage === totalPages || rfis.length === 0}
          style={{ padding: '8px 16px', background: '#F2F4F7', border: '1px solid #D0D5DD', borderRadius: 6, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default RFITab;
