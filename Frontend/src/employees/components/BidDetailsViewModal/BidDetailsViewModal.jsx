import React from 'react';
import { formatShortDate, formatDateTime, getSalesBidDisplayId, getStatusDisplayLabel } from '../../utils/bidHelpers';
import styles from './BidDetailsViewModal.module.css';

function BidDetailsViewModal({ isOpen, onClose, bid, onActionClick, allowedActions }) {
  if (!isOpen || !bid) return null;
  const salesBidDisplayId = getSalesBidDisplayId(bid);

  const showAction = (actionName) => {
    if (!allowedActions) return true;
    return allowedActions.includes(actionName);
  };

  // Forward-only state machine guards (mirrors backend)
  const statusLower = String(bid?.status || '').toLowerCase();
  const canApprove = statusLower === 'senttoclient';
  const canWon = statusLower === 'approved';
  const canLost = statusLower === 'senttoclient' || statusLower === 'approved';
  const isTerminal = statusLower === 'won' || statusLower === 'lost';

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return styles.statusCompleted;
      case 'approved': return styles.statusApproved;
      case 'won': return styles.statusWon;
      case 'lost': return styles.statusLost;
      case 'senttoclient':
      case 'sent to client': return styles.statusSentToClient;
      case 'bidinprogress':
      case 'bid in progress': return styles.statusInProgress;
      default: return styles.statusInProgress;
    }
  };

  // Resolve general contractors (multiple possible API shapes)
  const contractors = (() => {
    if (Array.isArray(bid.selected_general_contractors) && bid.selected_general_contractors.length) {
      return bid.selected_general_contractors.map(c => c.name || c.company_name || c.client_name || String(c.id)).join(', ');
    }

    if (Array.isArray(bid.clients) && bid.clients.length) {
      return bid.clients.map(c => c.name || c.client_name || c.company_name || String(c.id)).join(', ');
    }

    if (Array.isArray(bid.client_names) && bid.client_names.length) return bid.client_names.join(', ');
    if (bid.client_name) return bid.client_name;
    if (bid.client) return bid.client;
    if (bid.general_contractor) return bid.general_contractor;
    if (Array.isArray(bid.client_ids) && bid.client_ids.length) return bid.client_ids.map(String).join(', ');
    return 'N/A';
  })();

  // Resolve contributors (associated client employees) from multiple possible shapes
  const contributors = (() => {
    if (Array.isArray(bid.clients) && bid.clients.length) {
      return bid.clients.flatMap(c => (c.employees || []).map(e => `${e.first_name || e.firstName || ''} ${e.last_name || e.lastName || ''}`.trim()));
    }

    if (Array.isArray(bid.selected_employees) && bid.selected_employees.length) {
      return bid.selected_employees.map(e => `${e.firstName || e.first_name || e.fallbackName || ''} ${e.lastName || e.last_name || ''}`.trim()).filter(Boolean);
    }

    if (Array.isArray(bid.employees) && bid.employees.length) {
      return bid.employees.map(e => `${e.first_name || e.firstName || ''} ${e.last_name || e.lastName || ''}`.trim()).filter(Boolean);
    }

    if (Array.isArray(bid.client_employees) && bid.client_employees.length) {
      return bid.client_employees.map(e => `${e.first_name || e.firstName || ''} ${e.last_name || e.lastName || ''}`.trim()).filter(Boolean);
    }

    return [];
  })();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h2 className={styles.projectName}>{bid.project_name}</h2>
            <div className={styles.addressSub}>
              {salesBidDisplayId ? `${salesBidDisplayId} • ` : ''}
              {bid.address || 'Address not specified'}
            </div>
          </div>
          <div className={styles.headerRight}>
            <span className={`${styles.statusBadge} ${getStatusClass(bid.project_status === 'completed' ? 'completed' : bid.status)}`}>
              {getStatusDisplayLabel(bid.project_status === 'completed' ? 'completed' : bid.status)}
            </span>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="#667085" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Divider */}
        <div className={styles.divider}></div>

        {/* Details Grid */}
        <div className={styles.detailsGrid}>
          {/* Total Value */}
          <div className={styles.detailCard}>
            <span className={styles.detailLabel}>Total Value</span>
            <span className={styles.totalValue}>
              {bid.grand_total != null ? `$${Number(bid.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : bid.bid_value != null ? `$${Number(bid.bid_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
            </span>
          </div>

          {/* Follow-up Date */}
          {/* <div className={styles.detailCard}>
            <span className={styles.detailLabel}>Last Follow-up Date</span>
            <div className={styles.dateWithIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className={styles.detailValue}>{formatShortDate(bid.last_follow_up_date)}</span>
            </div>
          </div> */}

          {/* Due Date */}
          <div className={styles.detailCard}>
            <span className={styles.detailLabel}>Due Date</span>
            <div className={styles.dateWithIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className={styles.detailValue}>{formatShortDate(bid.due_date)}</span>
            </div>
          </div>

          {/* Contributors */}
          <div className={styles.detailCard}>
            <span className={styles.detailLabel}>Contributors</span>
            <div className={styles.contributorsArea}>
              {contributors.length > 0 ? (
                <>
                  <div className={styles.avatarStack}>
                    {contributors.slice(0, 3).map((name, index) => {
                      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      return (
                        <div
                          key={index}
                          className={styles.contributorAvatar}
                          style={{ zIndex: 3 - index }}
                          title={name}
                        >
                          {initials}
                        </div>
                      );
                    })}
                    {contributors.length > 3 && (
                      <div className={styles.avatarMore}>+{contributors.length - 3}</div>
                    )}
                  </div>
                  <div className={styles.contributorNames}>
                    {contributors.slice(0, 2).join(', ')}{contributors.length > 2 ? '...' : ''}
                  </div>
                </>
              ) : (
                <span className={styles.detailValue}>No contributors</span>
              )}
            </div>
          </div>
        </div>

        {/* Approved By Panel */}
        <div className={styles.approvedPanel}>
          <div className={styles.panelTitle}>Administrative Approval</div>
          <div className={styles.approverCard}>
            <div className={styles.approverLeft}>
              <div className={styles.approverAvatar}>
                {bid.created_by_name ? bid.created_by_name.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className={styles.approverInfo}>
                <div className={styles.approverName}>{bid.created_by_name || 'Admin Officer'}</div>
                <div className={styles.approverDesignation}>Project Administrator</div>
              </div>
            </div>
            <div className={styles.approverRight}>
              <div className={styles.approvalStatus}>
                <span className={`${styles.statusBadgeSmall} ${getStatusClass(bid.project_status === 'completed' ? 'completed' : bid.status)}`}>
                  {getStatusDisplayLabel(bid.project_status === 'completed' ? 'completed' : bid.status)}
                </span>
                <span className={styles.approvalTime}>{formatDateTime(bid.updated_at || bid.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footerActions}>
          <div className={styles.actionsBar}>
            {showAction('edit') && (
              <button
                type="button"
                className={styles.actionBtn}
                title="Edit Bid"
                onClick={() => {
                  onClose();
                  if (onActionClick) onActionClick('edit', bid);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475467" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            )}
            {showAction('share') && (
              <button
                type="button"
                className={styles.actionBtn}
                title="Share"
                onClick={() => {
                  onClose();
                  if (onActionClick) onActionClick('share', bid);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475467" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            )}
            {showAction('archive') && (
              <button
                type="button"
                className={styles.actionBtn}
                title="Archive"
                onClick={() => {
                  onClose();
                  if (onActionClick) onActionClick('archive', bid);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475467" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
              </button>
            )}
            {showAction('delete') && (
              <button
                type="button"
                className={styles.actionBtn}
                title="Delete"
                onClick={() => {
                  onClose();
                  if (onActionClick) onActionClick('delete', bid);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475467" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            )}
            {showAction('approve') && (
              <button
                type="button"
                className={styles.actionBtn}
                title={
                  !canApprove
                    ? `Cannot approve from '${bid?.status}' status (must be Sent To Client)`
                    : 'Approve Bid'
                }
                disabled={!canApprove}
                onClick={() => {
                  onClose();
                  if (onActionClick) onActionClick('approve', bid);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475467" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            )}
            {showAction('send') && (
              <button
                type="button"
                className={styles.actionBtn}
                title="Send"
                onClick={() => {
                  onClose();
                  if (onActionClick) onActionClick('send', bid);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475467" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            )}
            {showAction('won') && (
              <button
                type="button"
                className={styles.actionBtn}
                title={!canWon ? `Cannot mark as Won from '${bid?.status}' status (must be Approved)` : 'Won / Awarded — Start Onboarding'}
                disabled={!canWon}
                onClick={() => {
                  onClose();
                  if (onActionClick) onActionClick('won', bid);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475467" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6v5Zm12 0h1.5a2.5 2.5 0 0 0 0-5H18v5ZM6 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a6 6 0 0 1-6 6v3h3v2H9v-2h3v-3a6 6 0 0 1-6-6V3Z" />
                </svg>
              </button>
            )}
            {showAction('lost') && (
              <button
                type="button"
                className={styles.actionBtn}
                title={isTerminal ? `Cannot mark as Lost from '${bid?.status}' status` : 'Mark as Lost'}
                disabled={!canLost}
                onClick={() => {
                  onClose();
                  if (onActionClick) onActionClick('lost', bid);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475467" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BidDetailsViewModal;
