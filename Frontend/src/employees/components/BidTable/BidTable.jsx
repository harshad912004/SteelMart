import React from 'react';
import DataTable from '../DataTable/DataTable';
import { getBidDisplayId, getSalesBidDisplayId } from '../../utils/bidHelpers';
import { EditIcon, DeleteIcon } from '../Icons';
import styles from './BidTable.module.css';

// const columns = ['Project', 'Client', 'Bid Value', 'Last follow up date', 'Status', 'Actions'];
const columns = ['Project', 'Client', 'Bid Value', 'Status', 'Actions'];

function BidTable({ bids, onBidClick, onActionClick, isLoading = false, isDeletedView = false, pipeline = '', showPin = true, idType = null }) {
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return styles.statusCompleted;
      case 'approved': return styles.statusApproved;
      case 'bidinprogress':
      case 'bid in progress': return styles.statusInProgress;

      case 'senttoclient':
      case 'sent to client': return styles.statusSentToClient;
      case 'lost': return styles.statusLost;
      case 'won': return styles.statusWon;
      case 'client to respond': return styles.statusClientRespond;
      case 'shared with client': return styles.statusShared;
      case 'overdue': return styles.statusOverdue;
      case 'deleted': return styles.statusDeleted;
      default: return styles.statusDefault;
    }
  };

  const getStatusDisplayLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'bidInProgress':
      case 'bidinprogress':
      case 'bid in progress': return 'Bid In Progress';
      case 'sentToClient':
      case 'sent to client': return 'Sent To Client';
      case 'lost': return 'Lost';
      case 'won': return 'Won';
      case 'approved': return 'Approved';
      case 'deleted': return 'Deleted';
      default: return status || 'Pending';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date)) return 'N/A';
    return date.toLocaleString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const displayColumns = columns;

  return (
    <DataTable
      styles={styles}
      columns={displayColumns}
      rows={bids}
      isLoading={isLoading}
      loadingMessage="Loading bids..."
      emptyMessage="No bids found"
      renderRow={(bid) => {
        // Determine which id to display: 'crm' shows crm id, 'project' shows bid_project_id, otherwise sales
        const effectiveIdType = idType || (pipeline === 'crm' ? 'crm' : 'sales');
        let bidDisplayId;
        if (effectiveIdType === 'project') {
          bidDisplayId = bid?.bid_project_id || bid?.bid_sales_id || bid?.bid_crm_id || bid?.bid_number || bid?.bid_no || bid?.project_id || `BMB-${bid?.id || '000'}`;
        } else if (effectiveIdType === 'crm') {
          bidDisplayId = getBidDisplayId(bid);
        } else {
          bidDisplayId = getSalesBidDisplayId(bid);
        }
        const isDeleted = isDeletedView || String(bid.status || '').toLowerCase() === 'deleted';
        const isCompleted = String(bid.project_status || '').toLowerCase() === 'completed';
        const statusLower = String(bid.status || '').toLowerCase();

        // Forward-only state machine guards (mirrors backend ALLOWED_BID_STATUS_TRANSITIONS)
        const isTerminal = statusLower === 'won' || statusLower === 'lost';
        const canApprove = statusLower === 'senttoclient';
        const canWon = statusLower === 'approved';
        const canLost = statusLower === 'senttoclient' || statusLower === 'approved';

        // Legacy compat (some components use isApproved)
        const isApproved = statusLower === 'approved';

        const isPinned = bid?.is_pinned === 1 || bid?.isPinned === 1 || bid?.is_pinned === true || bid?.isPinned === true;

        return (
          <tr
            key={bid.id}
            className={isDeleted ? styles.deletedRow : ''}
            onClick={() => onBidClick(bid)}
          >
            <td>
              <div className={styles.nameCell}>
                <div>
                  <div className={styles.projectName}>{bid.project_name}</div>
                  <div className={styles.projectId}>
                    {bidDisplayId ? `${bidDisplayId} | ` : ''}
                    {bid.address || 'BMB-000-000'}
                  </div>
                </div>
              </div>
            </td>
            <td>
              {Array.isArray(bid.clients)
                ? bid.clients.map((client, index) => {
                  const label = (typeof client === 'object' && client !== null)
                    ? client.name || client.client_name || client.company_name || 'N/A'
                    : client;

                  return (
                    <div key={index}>
                      {label}{index < bid.clients.length - 1 ? ',' : ''}
                    </div>
                  );
                })
                : (typeof bid.client_name === 'object' && bid.client_name !== null)
                  ? bid.client_name.name || bid.client_name.client_name || bid.client_name.company_name || 'N/A'
                  : bid.client_name || bid.client || 'N/A'}
            </td>
            <td>
              {bid.grand_total != null ? `$${Number(bid.grand_total).toLocaleString()}` : bid.bid_value != null ? `$${Number(bid.bid_value).toLocaleString()}` : 'N/A'}
            </td>
            {/* <td>{formatDateTime(bid.last_follow_up_date)}</td> */}
            <td className={styles.statusCellWrap}>
              {bid.status_extra ? (
                <span className={`${styles.statusBadge} ${styles.statusOverdue} ${styles.statusExtra}`}>
                  {bid.status_extra}
                </span>
              ) : null}
              <span className={`${styles.statusBadge} ${getStatusClass(isDeleted ? 'deleted' : (bid.project_status === 'completed' ? 'completed' : bid.status))}`}>
                {getStatusDisplayLabel(isDeleted ? 'deleted' : (bid.project_status === 'completed' ? 'completed' : bid.status))}
              </span>
            </td>
            <td onClick={(event) => event.stopPropagation()} className={styles.actionsCell}>
              <div className={styles.actionsGroup}>
                {pipeline === 'crm' ? (
                  <>
                    {showPin && (
                      <button
                        type="button"
                        className={styles.actionIconButton}
                        title={isPinned ? 'Unpin project' : 'Pin project'}
                        disabled={isDeleted || isCompleted}
                        onClick={(e) => { e.stopPropagation(); onActionClick(isPinned ? 'unpin' : 'pin', bid); }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(45deg)' }}>
                          <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" fill={isPinned ? '#F59E0B' : 'none'} stroke={isPinned ? '#F59E0B' : '#344054'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.actionIconButton}
                      title="View Details"
                      onClick={(e) => { e.stopPropagation(); onActionClick('view', bid); }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={styles.actionIconButton}
                      title={
                        !canApprove
                          ? `Cannot approve from '${bid.status}' status (must be Sent To Client)`
                          : 'Approve Bid'
                      }
                      disabled={!canApprove || isDeleted || isCompleted}
                      onClick={(e) => { e.stopPropagation(); onActionClick('approve', bid); }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={styles.actionIconButton}
                      title={isTerminal ? `Cannot mark as Lost from '${bid.status}' status` : 'Mark as Lost'}
                      disabled={!canLost || isDeleted || isCompleted}
                      onClick={(e) => { e.stopPropagation(); onActionClick('lost', bid); }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={styles.actionIconButton}
                      title={!canWon ? `Cannot mark as Won from '${bid.status}' status (must be Approved)` : 'Won / Awarded — Start Onboarding'}
                      disabled={!canWon || isDeleted || isCompleted}
                      onClick={(e) => { e.stopPropagation(); onActionClick('won', bid); }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6v5Zm12 0h1.5a2.5 2.5 0 0 0 0-5H18v5ZM6 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a6 6 0 0 1-6 6v3h3v2H9v-2h3v-3a6 6 0 0 1-6-6V3Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={styles.actionIconButton}
                      title="Delete"
                      style={{ color: '#db2d2dff' }}
                      disabled={isDeleted || isCompleted}
                      onClick={(e) => { e.stopPropagation(); onActionClick('delete', bid); }}
                    >
                      <DeleteIcon size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    {showPin && (
                      <button
                        type="button"
                        className={styles.actionIconButton}
                        title={isPinned ? 'Unpin project' : 'Pin project'}
                        disabled={isDeleted || isCompleted}
                        onClick={(e) => { e.stopPropagation(); onActionClick(isPinned ? 'unpin' : 'pin', bid); }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(45deg)' }}>
                          <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" fill={isPinned ? '#F59E0B' : 'none'} stroke={isPinned ? '#F59E0B' : '#344054'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.actionIconButton}
                      title="Update"
                      style={{ color: '#667085' }}
                      disabled={isDeleted || isCompleted}
                      onClick={(e) => { e.stopPropagation(); onActionClick('edit', bid); }}
                    >
                      <EditIcon size={20} />
                    </button>
                    {(() => {
                      const isArchived = bid?.project_status === 'archived' || bid?.status === 'archived' || bid?.bid_status === 'archived';
                      return (
                        <button
                          type="button"
                          className={styles.actionIconButton}
                          title={isArchived ? 'Unarchive' : 'Archive'}
                          disabled={isDeleted || isCompleted}
                          style={{ color: '#667085' }}
                          onClick={(e) => { e.stopPropagation(); onActionClick(isArchived ? 'unarchive' : 'archive', bid); }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="21 8 21 21 3 21 3 8" />
                            <rect x="1" y="3" width="22" height="5" />
                            <line x1="10" y1="12" x2="14" y2="12" />
                          </svg>
                        </button>
                      );
                    })()}
                    <button
                      type="button"
                      className={styles.actionIconButton}
                      title="Delete"
                      disabled={isDeleted || isCompleted}
                      style={{ color: '#db2d2dff' }}
                      onClick={(e) => { e.stopPropagation(); onActionClick('delete', bid); }}
                    >
                      <DeleteIcon size={20} />
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        );
      }}
    />
  );
}

export default BidTable;
