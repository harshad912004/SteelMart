import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { formatShortDate, getSalesBidDisplayId, isBidOverdue } from '../../utils/bidHelpers';
import styles from './DashboardSectionGrid.module.css';

export default function BidsDashboardList({ bids = [] }) {
  const navigate = useNavigate();
  const visibleBids = bids.slice(0, 6);

  const openBidsPage = () => navigate('/dashboard/sales');
  const openSpecificBid = (bidId) => navigate('/dashboard/sales', {
    state: { openBidId: bidId },
  });

  const getCardBadge = (bid) => {
    if (isBidOverdue(bid)) {
      return {
        label: 'Overdue',
        color: '#f08a00',
        border: '1px solid #f08a00',
      };
    }

    return {
      label: 'My Bids',
      color: '#2f3cff',
      border: '1px solid #2f3cff',
    };
  };

  const formatDueDate = (dueDate) => {
    const formatted = formatShortDate(dueDate);
    return formatted === 'N/A' ? 'N/A' : formatted.replace(/\//g, '-');
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>My Bids</h2>
        <button
          onClick={openBidsPage}
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
          onMouseEnter={e => { e.currentTarget.style.background = '#5b5fc7'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#5b5fc7'; }}
        >
          <Eye size={13} />
          View All
        </button>
      </div>

      <div className={styles.sectionGrid}>
        {visibleBids.map((bid) => {
          const badge = getCardBadge(bid);

          return (
            <div
              key={bid.id}
              onClick={openBidsPage}
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
                    {bid.project_name || 'Untitled Project'}
                  </div>
                  <div style={{ marginTop: '2px', fontSize: '11px', color: '#8a8f98' }}>
                    {getSalesBidDisplayId(bid)}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`View ${bid.project_name || 'bid'}`}
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
                  color: badge.color,
                  border: badge.border,
                  background: '#fff',
                }}>
                  {badge.label}
                </span>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '18px', fontSize: '13px', color: '#8a8f98' }}>
                <span style={{ fontWeight: 400 }}>Due Date: </span>
                <span style={{ color: '#4b5563', fontWeight: 500 }}>{formatDueDate(bid.due_date)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
