import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Trash2,
  ChevronDown,
  Plus,
  FileText,
  Upload,
  ChevronLeft,
} from 'lucide-react';
import styles from './RFIDetailView.module.css';
import { getVendorBidRFI, addVendorBidRFIHistory } from '../../services/api';
import StatusBadge from '../../../common/components/StatusBadge/StatusBadge';

/* Inline StatusBadge removed in favor of central component */

function RFIDetailView({ bidId, rfiId, rfiData, onBack, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rfi, setRfi] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [replyMessage, setReplyMessage] = useState('');
  const fileInputRef = useRef(null);
  
  const fetchDetail = async () => {
    if (!bidId || !rfiId) return;
    setLoading(true);
    try {
      const res = await getVendorBidRFI(bidId, rfiId);
      if (res && res.success) {
        setRfi(res.rfi || res.data?.rfi);
        setHistory(res.history || res.data?.history || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [bidId, rfiId]);

  const handleAddReply = async () => {
    if (!replyMessage.trim()) return;
    try {
      const file = fileInputRef.current?.files?.[0];
      await addVendorBidRFIHistory(bidId, rfiId, file, replyMessage);
      setReplyMessage('');
      setShowForm(false);
      fetchDetail();
    } catch (error) {
      console.error(error);
    }
  };

  const data = rfi || rfiData || {};

  return (
    <div className={styles.container}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        <ChevronLeft size={16} /> Back to RFIs
      </button>

      {/* Header */}
      <div className={styles.topSection}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <span className={styles.rfiTitle}>{data?.title || 'Untitled RFI'}</span>
            <Eye size={18} className={styles.viewIcon} />
          </div>
          <span className={styles.rfiCode}>RFI-{data?.id || 'N/A'}</span>
        </div>
          <div className={styles.topActions}>
          <button className={styles.statusBadge} style={{ border: 'none', padding: 0 }}>
            <StatusBadge status={data?.status} />
          </button>
          {onDelete && (
            <button type="button" className={styles.statusBadge} style={{ border: 'none', padding: 0, background: 'transparent' }} onClick={onDelete}>
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className={styles.description}>{data?.description || data?.notes || 'No description available.'}</p>

      {/* History Header */}
      <div className={styles.historyHeader}>
        <span className={styles.historyTitle}>RFI History</span>
        <div className={styles.historyRight}>
          <div className={styles.ballInCourt}>
            <span className={styles.ballInCourtName}>{data?.ball_in_court || 'N/A'}</span>
            <span className={styles.ballInCourtLabel}>Ball in Court</span>
          </div>
          {data?.ball_in_court !== 'General Contractor' && (
            <button className={styles.addHistoryBtn} onClick={() => setShowForm(true)}>
              <Plus size={16} /> Add New
            </button>
          )}
        </div>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className={styles.addForm}>
          <div className={styles.addFormTitle}>Add To History</div>
          <div className={styles.addFormGrid}>
            <div className={styles.formField}>
              <label>Notes</label>
              <textarea 
                className={styles.formTextarea} 
                placeholder="Type notes here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
              />
            </div>
            <div className={styles.formField}>
              <label>Attachment</label>
              <div className={styles.uploadBox} onClick={() => fileInputRef.current?.click()}>
                <button
                  type="button"
                  className={styles.browseBtn}
                >
                  Browse File
                </button>
                <span className={styles.uploadHint} style={{ display: 'block', marginTop: 4 }}>or Drop file</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>
          <div className={styles.addFormActions}>
            <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button className={styles.submitBtn} onClick={handleAddReply}>
              Add
            </button>
          </div>
        </div>
      )}

      {/* History List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading history...</div>
      ) : (
        <div className={styles.historyList}>
          {history.map((entry, idx) => (
            <div key={entry?.id || idx} className={styles.historyCard}>
              <div
                className={`${styles.historyDot} ${idx === 0 ? styles.dotGreen : styles.dotGray}`}
              />
              <div className={styles.historyBody}>
                <div>
                  <span className={styles.historyName}>{entry?.created_by_name || 'Vendor'}</span>
                  <span className={styles.historyCompany}>{entry?.company || 'Company'}</span>
                </div>
                <div className={styles.historyText}>{entry?.message}</div>
                <div className={styles.historyMeta}>
                  {entry?.file_url && (
                    <a
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/rfi-files/${entry.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.pdfBadge}
                    >
                      <FileText size={12} /> PDF
                    </a>
                  )}
                  <span className={styles.historyTime}>
                    {(() => {
                      try {
                        const dt = new Date(entry?.created_at);
                        if (isNaN(dt.getTime())) return '';
                        return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(dt);
                      } catch (e) {
                        return '';
                      }
                    })()}
                  </span>
                  <span className={styles.historyDate}>
                    {(() => {
                      try {
                        const dt = new Date(entry?.created_at);
                        if (isNaN(dt.getTime())) return '';
                        return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(dt);
                      } catch (e) {
                        return '';
                      }
                    })()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RFIDetailView;
