import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Plus, FileText, CornerUpLeft, ChevronLeft } from 'lucide-react';
import styles from './SubmittalDetailView.module.css';
import { getVendorBidSubmittal, addVendorBidSubmittalReply, addVendorBidSubmittalVersion } from '../../services/api';
import StatusBadge from '../../../common/components/StatusBadge/StatusBadge';

/* ───── helpers ───── */
/* Inline StatusBadge removed in favor of central component */

/* ───── component ───── */
function SubmittalDetailView({ bidId, submittalId, submittalData, onBack, onDelete }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showAddVersionForm, setShowAddVersionForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittal, setSubmittal] = useState(null);
  const [versions, setVersions] = useState([]);
  
  const [replyMessage, setReplyMessage] = useState('');
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [newVersionMessage, setNewVersionMessage] = useState('');
  const [newVersionFile, setNewVersionFile] = useState(null);

  const fetchDetail = async () => {
    if (!bidId || !submittalId) return;
    setLoading(true);
    try {
      const res = await getVendorBidSubmittal(bidId, submittalId);
      if (res && res.success) {
        setSubmittal(res.submittal || res.data?.submittal);
        setVersions(res.versions || res.data?.versions || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [bidId, submittalId]);

  const handleAddReply = async (versionId) => {
    if (!replyMessage.trim()) return;
    try {
      await addVendorBidSubmittalReply(bidId, submittalId, versionId, replyMessage);
      setReplyMessage('');
      setShowReplyForm(false);
      setActiveVersionId(null);
      fetchDetail();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddVersion = async () => {
    if (!newVersionMessage.trim() && !newVersionFile) return;
    try {
      await addVendorBidSubmittalVersion(bidId, submittalId, newVersionFile, newVersionMessage, 'submitted');
      setNewVersionMessage('');
      setNewVersionFile(null);
      setShowAddVersionForm(false);
      fetchDetail();
    } catch (error) {
      console.error(error);
    }
  };

  const data = submittal || submittalData || {};

  return (
    <div className={styles.detailContainer}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        <ChevronLeft size={16} /> Back to Submittals
      </button>

      {/* ─── Header ─── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <span className={styles.titleText}>{data?.title || 'Untitled Submittal'}</span>
            <Eye size={18} className={styles.titleIcon} />
          </div>
          <span className={styles.subtitle}>SUB-{data?.id || 'N/A'}</span>
        </div>

        <div className={styles.headerRight}>
          <StatusBadge status={data?.status} />
          {onDelete && (
            <button type="button" className={styles.statusBadge} style={{ border: 'none', background: 'transparent' }} onClick={onDelete}>
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Description ─── */}
      <p className={styles.description}>{data?.description || 'No description provided.'}</p>

      {/* ─── History section header ─── */}
      <div className={styles.historySectionHeader}>
        <span className={styles.historySectionTitle}>Submittal History</span>
        <div className={styles.historySectionRight}>
          <div className={styles.ballInCourt}>
            <span className={styles.ballInCourtName}>{data?.ball_in_court || 'N/A'}</span>
            <span className={styles.ballInCourtLabel}>Ball in Court</span>
          </div>
          {data?.ball_in_court !== 'General Contractor' && (
            <button type="button" className={styles.addHistoryBtn} onClick={() => setShowAddVersionForm((prev) => !prev)}>
              <Plus size={16} /> Add New Version
            </button>
          )}
        </div>
      </div>

      {showAddVersionForm && data?.ball_in_court !== 'General Contractor' && (
        <div className={styles.addHistoryForm} style={{ marginBottom: '16px' }}>
          <div className={styles.formGroup}>
            <label>Version Message</label>
            <textarea
              placeholder="Type version notes here..."
              value={newVersionMessage}
              onChange={(e) => setNewVersionMessage(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Attachment</label>
            <input type="file" onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)} />
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => { setShowAddVersionForm(false); setNewVersionFile(null); setNewVersionMessage(''); }}>
              Cancel
            </button>
            <button type="button" className={styles.addBtnForm} onClick={handleAddVersion}>
              Submit Version
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading history...</div>
      ) : (
        <div className={styles.historyList}>
          {versions.map((v, vIdx) => (
            <div className={styles.historyCard} key={v?.id || vIdx}>
              <div className={styles.historyCardHeader}>
                {vIdx === 0 && <span className={styles.newBadge}>Latest</span>}
                <span className={styles.historyName}>{v?.created_by_name || 'User'}</span>
                <span className={styles.historyCompany}>{v?.company || 'Company'}</span>
                <StatusBadge status={v?.status || data?.status} />
                {v?.file_url && (
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/submittal-files/${v.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.historyPdf}
                  >
                    <FileText size={16} />
                  </a>
                )}
              </div>

              <p className={styles.historyDesc}>{v?.message}</p>

              <div className={styles.historyFooter}>
                <span className={styles.historyTime}>
                  {(() => {
                    try {
                      const dt = new Date(v?.created_at);
                      if (isNaN(dt.getTime())) return '';
                      return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' }).format(dt);
                    } catch (e) {
                      return '';
                    }
                  })()}
                </span>
                <span className={styles.historyVersion}>Version - {v?.version || (versions.length - vIdx)}</span>
                
                {data?.ball_in_court !== 'General Contractor' && (
                  <button 
                    type="button" 
                    className={styles.addHistoryBtn} 
                    style={{ marginLeft: 'auto' }}
                    onClick={() => { setShowReplyForm(true); v?.id && setActiveVersionId(v.id); }}
                  >
                    <CornerUpLeft size={16} /> Reply
                  </button>
                )}
              </div>

              {/* Replies */}
              {v?.replies && v.replies.length > 0 && (
                <div style={{ marginTop: '15px', paddingLeft: '20px', borderLeft: '2px solid #e5e7eb' }}>
                  {v.replies.map((reply, replyIdx) => (
                    <div key={reply?.id || replyIdx} style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        {reply?.created_by_name || 'User'} ({reply?.company || 'Company'})
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{reply?.message}</div>
                    </div>
                  ))}
                </div>
              )}

              {showReplyForm && activeVersionId === v.id && (
                <div className={styles.addHistoryForm} style={{ marginTop: '15px' }}>
                  <div className={styles.formGroup}>
                    <label>Reply Message</label>
                    <textarea 
                      placeholder="Type reply here..." 
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => { setShowReplyForm(false); setActiveVersionId(null); }}>
                      Cancel
                    </button>
                    <button type="button" className={styles.addBtnForm} onClick={() => handleAddReply(v.id)}>
                      Submit Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SubmittalDetailView;
