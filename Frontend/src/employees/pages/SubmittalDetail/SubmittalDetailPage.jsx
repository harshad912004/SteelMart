import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopTabs from '../../components/TopTabs/TopTabs';
import styles from './SubmittalDetailPage.module.css';
import {
  getBid,
  getBidSubmittal,
  updateBidSubmittal,
  deleteBidSubmittal,
  addBidSubmittalVersion,
  addBidSubmittalReply,
  updateBidSubmittalVersion,
  deleteBidSubmittalVersion
} from '../../services/api';
import StatusBadge from '../../../common/components/StatusBadge/StatusBadge';

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

const BackArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/submittal-files/${url}`;
};

const formatTimestamp = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${h.toString().padStart(2,'0')}:${mins} ${ampm}, ${d.getDate().toString().padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/* ── Inline SVG Icons ── */

function EyeIcon({ size = 18, color = '#667085' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M1.667 10S4.167 4.167 10 4.167 18.333 10 18.333 10 15.833 15.833 10 15.833 1.667 10 1.667 10z"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function ShareIcon({ size = 18, color = '#667085' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M15 6.667a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM5 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM15 18.333a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM7.25 11.167l5.5 3.166M12.75 5.667l-5.5 3.166"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function ReplyIcon({ size = 18, color = '#667085' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M7.5 5L3.333 8.333 7.5 11.667"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M16.667 15V11.667A3.333 3.333 0 0013.333 8.333H3.333"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon({ size = 18, color = '#667085' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M14.167 2.5a2.357 2.357 0 013.333 3.333L6.25 17.083l-4.583 1.25 1.25-4.583L14.167 2.5z"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon({ size = 18, color = '#D92D20' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M2.5 5h15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M6.667 5V3.333A1.667 1.667 0 018.333 1.667h3.334a1.667 1.667 0 011.666 1.666V5m2.5 0v11.667a1.667 1.667 0 01-1.666 1.666H5.833a1.667 1.667 0 01-1.666-1.666V5h11.666z"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M8.333 9.167v5M11.667 9.167v5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PdfIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 40" fill="none">
      <rect x="0.5" y="0.5" width="35" height="39" rx="3.5" fill="#FFF" stroke="#EAECF0" />
      <path d="M8 4h14l8 8v24a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" fill="#EFF8FF" />
      <path d="M22 4v8h8" fill="#B2DDFF" />
      <path d="M22 4v8h8" stroke="#B2DDFF" strokeWidth="1" />
      <text x="18" y="28" textAnchor="middle" fill="#1570EF" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">PDF</text>
    </svg>
  );
}

function ChevronDownIcon({ size = 16, color = '#1570EF' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronUpIcon({ size = 16, color = '#1570EF' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4 10l4-4 4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DropdownArrowIcon({ size = 14, color = '#344054' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3.5 5.25l3.5 3.5 3.5-3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Inline StatusBadge removed in favor of central component */
/* ── Add Version Modal (inline) ── */
function AddVersionInline({ onSubmit, onCancel }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('open');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const handleSubmit = async () => {
    if (!message.trim()) return alert('Message is required');
    setLoading(true);
    try {
      await onSubmit(file, message, status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#FCFCFD', border: '1px solid #EAECF0', borderRadius: 8, padding: '20px', marginBottom: 16 }}>
      <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#1D2939' }}>Add New Version</h4>
      <textarea
        className={styles.commentTextarea}
        placeholder="Enter version details..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D0D5DD', fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="responded">Responded</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="closed">Closed</option>
          <option value="need_revision">Need Revision</option>
        </select>
        <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #D0D5DD', background: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
          {file ? file.name : 'Attach File'}
        </button>
        <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
      </div>
      <div className={styles.commentActions}>
        <button className={styles.cancelCommentBtn} onClick={onCancel}>Cancel</button>
        <button className={styles.addCommentBtn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Adding...' : 'Add Version'}
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ── */

function SubmittalDetailPage({ hideTopTabs = false, bidId: propBidId }) {
  const { id, submittalId: paramSubmittalId } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const queryBidId = searchParams.get('bid');
  const bidId = parseInt(propBidId || id || queryBidId, 10);
  const submittalId = parseInt(paramSubmittalId, 10);

  const [activeTab, setActiveTab] = useState('Submittals');
  const [project, setProject] = useState(null);
  const [submittal, setSubmittal] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [commentLoading, setCommentLoading] = useState({});

  const fetchSubmittal = async () => {
    try {
      setLoading(true);
      const res = await getBidSubmittal(bidId, submittalId);
      if (res && res.success) {
        setSubmittal(res.submittal || (res.data && res.data.submittal));
        setVersions(res.versions || (res.data && res.data.versions) || []);
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
    if (bidId && submittalId) fetchSubmittal();
  }, [bidId, submittalId]);

  useEffect(() => {
    fetchProject();
  }, [bidId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const tabKey = mapTabToKey(tab);
    navigate(`/dashboard/projects?bid=${bidId}&tab=${tabKey}`);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateBidSubmittal(bidId, submittalId, { status: newStatus });
      fetchSubmittal();
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this submittal?')) return;
    try {
      await deleteBidSubmittal(bidId, submittalId);
      navigate(`/dashboard/projects?bid=${bidId}&tab=submittals`);
    } catch (err) {
      console.error(err);
      alert('Error deleting submittal');
    }
  };

  const handleAddVersion = async (file, message, status) => {
    try {
      await addBidSubmittalVersion(bidId, submittalId, file, message, status);
      setShowAddVersion(false);
      fetchSubmittal();
    } catch (err) {
      console.error(err);
      alert('Error adding version');
    }
  };

  const handleAddReply = async (versionId) => {
    const msg = commentTexts[versionId]?.trim();
    if (!msg) return;
    setCommentLoading(prev => ({ ...prev, [versionId]: true }));
    try {
      await addBidSubmittalReply(bidId, submittalId, versionId, msg);
      setCommentTexts(prev => ({ ...prev, [versionId]: '' }));
      fetchSubmittal();
    } catch (err) {
      console.error(err);
      alert('Error adding reply');
    } finally {
      setCommentLoading(prev => ({ ...prev, [versionId]: false }));
    }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteBidSubmittalVersion(bidId, submittalId, versionId);
      fetchSubmittal();
    } catch (err) {
      console.error(err);
      alert('Error deleting');
    }
  };

  const handleVersionStatusChange = async (versionId, newStatus) => {
    try {
      await updateBidSubmittalVersion(bidId, submittalId, versionId, { status: newStatus });
      fetchSubmittal();
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const toggleReply = (entryId) => {
    setExpandedReplies((prev) => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  const handleCommentChange = (entryId, value) => {
    setCommentTexts((prev) => ({ ...prev, [entryId]: value }));
  };

  const clearComment = (entryId) => {
    setCommentTexts((prev) => ({ ...prev, [entryId]: '' }));
  };

  if (loading && !submittal) {
    return <div className={styles.pageWrapper}><p style={{ padding: 32, color: '#667085' }}>Loading...</p></div>;
  }

  if (!submittal) {
    return <div className={styles.pageWrapper}><p style={{ padding: 32, color: '#667085' }}>Submittal not found.</p></div>;
  }

  return (
    <>
      {/* Top Tabs */}
      {!hideTopTabs && <TopTabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />}

      <div className={styles.pageWrapper}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate(`/dashboard/projects?bid=${bidId}&tab=submittals`)}
        >
          <BackArrowIcon />
          <span>Back to Submittals</span>
        </button>

      {/* Submittal Header */}
      <div className={styles.submittalHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.submittalTitle}>{submittal.title}</h1>
            <span className={styles.eyeIconWrapper}>
              <EyeIcon size={20} color="#98A2B3" />
            </span>
          </div>
          <p className={styles.submittalSubtitle}>{project?.bid_project_id || `SUB-${submittal.id}`}</p>
        </div>
        <div className={styles.headerRight}>
          <StatusBadge status={submittal.status} withArrow onStatusChange={handleStatusChange} statusOptions={['draft', 'open', 'submitted', 'under_review', 'responded', 'need_revision', 'approved', 'rejected', 'closed']} />
          <button className={styles.trashBtn} title="Delete" onClick={handleDelete}>
            <TrashIcon size={20} color="#D92D20" />
          </button>
        </div>
      </div>

      {/* Submittal History Card */}
      <div className={styles.historyCard}>
        {/* History Header */}
        <div className={styles.historyHeader}>
          <h2 className={styles.historyTitle}>Submittal History</h2>
          <div className={styles.historyHeaderRight}>
            {submittal.ball_in_court && (
              <div className={styles.ballInCourt}>
                <span className={styles.bicCompany}>{submittal.ball_in_court}</span>
                <span className={styles.bicLabel}>Ball in Court</span>
              </div>
            )}
            <button className={styles.addVersionBtn} onClick={() => setShowAddVersion(true)}>+ Add New Version</button>
          </div>
        </div>

        {/* Add Version Inline */}
        {showAddVersion && (
          <AddVersionInline onSubmit={handleAddVersion} onCancel={() => setShowAddVersion(false)} />
        )}

        {/* Version Entries */}
        <div className={styles.entriesList}>
          {versions.map((entry, idx) => (
            <div key={entry.id} className={styles.entryWrapper}>
              <div className={styles.entryCard}>
                {/* New Badge — show on first (latest) entry */}
                {idx === 0 && <span className={styles.newBadge}>New</span>}

                {/* Entry Header Row */}
                <div className={styles.entryHeader}>
                  <div className={styles.entryMeta}>
                    <span className={styles.entryName}>{entry.created_by_name || 'Unknown'}</span>
                    <span className={styles.entryCompany}>{entry.company || ''}</span>
                  </div>
                  <div className={styles.entryActions}>
                    <StatusBadge status={entry.status} withArrow onStatusChange={(s) => handleVersionStatusChange(entry.id, s)} statusOptions={['draft', 'open', 'submitted', 'under_review', 'responded', 'need_revision', 'approved', 'rejected', 'closed']} />
                    {entry.file_url && (
                      <div className={styles.pdfGroup}>
                        <PdfIcon size={40} />
                        <div className={styles.pdfIcons}>
                          <a href={getFileUrl(entry.file_url)} target="_blank" rel="noopener noreferrer" className={styles.iconBtn} title="View">
                            <EyeIcon size={16} />
                          </a>
                          <button className={styles.iconBtn} title="Share"><ShareIcon size={16} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                <p className={styles.entryMessage}>{entry.message}</p>

                {/* Timestamp */}
                <span className={styles.entryTimestamp}>{formatTimestamp(entry.created_at)}</span>

                {/* Bottom Row */}
                <div className={styles.entryFooter}>
                  <div className={styles.footerLeft}>
                    {(entry.replies && entry.replies.length > 0) && (
                      <button
                        className={styles.viewReplyBtn}
                        onClick={() => toggleReply(entry.id)}
                      >
                        {expandedReplies[entry.id] ? (
                          <>
                            <ChevronUpIcon size={16} color="#1570EF" />
                            <span>Hide Reply ({entry.replies.length})</span>
                          </>
                        ) : (
                          <>
                            <ChevronDownIcon size={16} color="#1570EF" />
                            <span>View Reply ({entry.replies.length})</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className={styles.footerRight}>
                    <button className={styles.replyBtn} onClick={() => { setExpandedReplies(prev => ({ ...prev, [entry.id]: true })); }}>
                      <ReplyIcon size={16} color="#667085" />
                      <span>Reply</span>
                    </button>
                    <span className={styles.versionLabel}>Version - {entry.version}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Reply Thread */}
              {expandedReplies[entry.id] && (
                <div className={styles.replyThread}>
                  {/* Comment Input */}
                  <div className={styles.commentInputSection}>
                    <textarea
                      className={styles.commentTextarea}
                      placeholder="Type your comment here..."
                      value={commentTexts[entry.id] || ''}
                      onChange={(e) => handleCommentChange(entry.id, e.target.value)}
                      rows={3}
                    />
                    <div className={styles.commentActions}>
                      <button
                        className={styles.cancelCommentBtn}
                        onClick={() => clearComment(entry.id)}
                      >
                        Cancel
                      </button>
                      <button
                        className={styles.addCommentBtn}
                        onClick={() => handleAddReply(entry.id)}
                        disabled={commentLoading[entry.id]}
                      >
                        {commentLoading[entry.id] ? 'Adding...' : 'Add Comment'}
                      </button>
                    </div>
                  </div>

                  {/* Reply Comments */}
                  {(entry.replies || []).map((reply) => (
                    <div key={reply.id} className={styles.replyCard}>
                      <div className={styles.replyHeader}>
                        <div className={styles.replyMeta}>
                          <span className={styles.replyName}>{reply.created_by_name || 'Unknown'}</span>
                          <span className={styles.replyCompany}>{reply.company || ''}</span>
                        </div>
                        <div className={styles.replyActions}>
                          <button className={styles.iconBtn} title="Delete" onClick={() => handleDeleteVersion(reply.id)}>
                            <TrashIcon size={18} color="#D92D20" />
                          </button>
                        </div>
                      </div>
                      <p className={styles.replyMessage}>{reply.message}</p>
                      <span className={styles.replyTimestamp}>{formatTimestamp(reply.created_at)}</span>
                    </div>
                  ))}

                  {/* Hide Reply Link */}
                  <div className={styles.hideReplyRow}>
                    <button
                      className={styles.viewReplyBtn}
                      onClick={() => toggleReply(entry.id)}
                    >
                      <ChevronUpIcon size={16} color="#1570EF" />
                      <span>Hide Reply</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
    </>
  );
}

export default SubmittalDetailPage;
