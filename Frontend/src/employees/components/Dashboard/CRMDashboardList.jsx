import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { getBidDisplayId, getBidStatus, getRecipientName, isBidOverdue } from '../../utils/bidHelpers';
import styles from './DashboardSectionGrid.module.css';

const formatStatusLabel = (status) => {
  switch (status) {
    case 'client to respond':
    case 'shared with client':
    case 'senttoclient':
    case 'sent to client':
      return 'Client to Respond';
    case 'bidinprogress':
    case 'bid in progress':
    case 'pending':
      return 'Bid In Progress';

    case 'approved':
      return 'Approved';
    case 'won':
      return 'Won';
    case 'lost':
      return 'Lost';
    default:
      return status
        ? status
          .split(/[\s_]+/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
        : 'Pending';
  }
};

const getStatusBadge = (bid) => {
  if (isBidOverdue(bid)) {
    return {
      label: 'Overdue',
      color: '#b45309',
      border: '1px solid #f59e0b',
      background: '#fff7ed',
    };
  }

  const status = getBidStatus(bid);

  switch (status) {
    case 'approved':
    case 'won':
      return {
        label: formatStatusLabel(status),
        color: '#15803d',
        border: '1px solid #84cc16',
        background: '#f7fee7',
      };
    case 'lost':
      return {
        label: 'Lost',
        color: '#dc2626',
        border: '1px solid #fca5a5',
        background: '#fff1f2',
      };
    case 'client to respond':
    case 'shared with client':
    case 'senttoclient':
    case 'sent to client':
      return {
        label: 'Client to Respond',
        color: '#dc2626',
        border: '1px solid #fda4af',
        background: '#fff1f2',
      };
    case 'bidinprogress':
    case 'bid in progress':
    case 'pending':
      return {
        label: 'Bid In Progress',
        color: '#d97706',
        border: '1px solid #facc15',
        background: '#fffdf0',
      };

    default:
      return {
        label: formatStatusLabel(status),
        color: '#475467',
        border: '1px solid #d0d5dd',
        background: '#ffffff',
      };
  }
};

const getClientLabel = (bid) => {
  if (Array.isArray(bid?.clients) && bid.clients.length > 0) {
    return getRecipientName(bid.clients[0], 'N/A');
  }

  if (Array.isArray(bid?.client_names) && bid.client_names.length > 0) {
    return getRecipientName(bid.client_names[0], 'N/A');
  }

  return getRecipientName(
    bid?.client_name || bid?.client || bid?.general_contractor,
    'N/A'
  );
};

export default function CRMDashboardList({ bids = [] }) {
  const navigate = useNavigate();
  const visibleBids = bids.slice(0, 6);

  const openCRMPage = () => navigate('/dashboard/crm');
  const openSpecificBid = (bidId) => navigate('/dashboard/crm', {
    state: { openBidId: bidId },
  });

  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>CRM</h2>
        <button
          onClick={openCRMPage}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: '1.5px solid #5b5fc7',
            borderRadius: '8px',
            padding: '5px 12px',
            color: '#5b5fc7',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#5b5fc7'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#5b5fc7'; }}
        >
          <Eye size={13} />
          View All
        </button>
      </div>

      <div className={styles.sectionGrid}>
        {visibleBids.map((bid) => {
          const statusBadge = getStatusBadge(bid);
          const projectName = bid?.project_name || 'Untitled Project';
          const clientName = getClientLabel(bid);

          return (
            <div
              key={bid.id}
              onClick={() => openSpecificBid(bid.id)}
              style={{
                minHeight: '144px',
                display: 'flex',
                flexDirection: 'column',
                padding: '14px 16px',
                borderRadius: '8px',
                border: '1px solid #e6eaf0',
                background: '#fff',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 18px rgba(15, 23, 42, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(15, 23, 42, 0.04)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#2a2f3a',
                    lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {projectName}
                  </div>
                  <div style={{ marginTop: '2px', fontSize: '11px', color: '#8a8f98' }}>
                    {getBidDisplayId(bid)}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`View ${projectName}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    openSpecificBid(bid.id);
                  }}
                  style={{
                    flexShrink: 0,
                    width: '28px',
                    height: '28px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    color: '#4b5563',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#2f3cff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#4b5563'; }}
                >
                  <Eye size={18} />
                </button>
              </div>

              <div style={{ marginTop: '14px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '70px',
                  padding: '3px 14px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: statusBadge.color,
                  border: statusBadge.border,
                  background: statusBadge.background,
                }}>
                  {statusBadge.label}
                </span>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '18px', fontSize: '13px', color: '#8a8f98' }}>
                <span style={{ fontWeight: 400 }}>Client: </span>
                <span style={{ color: '#4b5563', fontWeight: 500 }}>{clientName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}