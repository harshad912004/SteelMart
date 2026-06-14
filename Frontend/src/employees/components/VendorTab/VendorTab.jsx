import React, { useEffect, useState } from 'react';
import styles from './VendorTab.module.css';

export default function VendorTab({
  bidId,
  bidStatus,
  projectStatus,
  getBidVendors,
  getAvailableVendors,
  inviteVendorsToBid,
  approveVendorProposal,
  rejectVendorProposal,
  removeVendorFromBid,
  onCompleteProject,
  bidDueDate
}) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const res = await getBidVendors(bidId);
      setVendors(res.vendors || res.data?.vendors || res.data || []);
      setError(null);
    } catch (err) {
      setError(err?.data?.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bidId) {
      loadVendors();
    }
  }, [bidId]);

  const handleApprove = async (vendorEntryId) => {
    if (!window.confirm('Are you sure you want to approve this vendor proposal?')) return;
    try {
      await approveVendorProposal(bidId, vendorEntryId);
      loadVendors();
    } catch (err) {
      alert(err?.data?.message || 'Failed to approve proposal');
    }
  };

  const handleReject = async (vendorEntryId) => {
    const reason = window.prompt('Enter reason for rejection (optional):');
    if (reason === null) return; // cancelled
    try {
      await rejectVendorProposal(bidId, vendorEntryId, reason);
      loadVendors();
    } catch (err) {
      alert(err?.data?.message || 'Failed to reject proposal');
    }
  };

  const handleCompleteProject = async () => {
    if (!window.confirm('Are you sure you want to mark this project as COMPLETED? This action cannot be undone.')) return;
    try {
      setCompleting(true);
      if (onCompleteProject) await onCompleteProject(bidId);
    } catch (err) {
      alert(err?.data?.message || 'Failed to complete project');
    } finally {
      setCompleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'invited': return <span className={`${styles.badge} ${styles.badgeYellow}`}>Invited</span>;
      case 'proposal_sent': return <span className={`${styles.badge} ${styles.badgeBlue}`}>Proposal Sent</span>;
      case 'approved': return <span className={`${styles.badge} ${styles.badgeGreen}`}>Approved</span>;
      case 'rejected': return <span className={`${styles.badge} ${styles.badgeRed}`}>Rejected</span>;
      case 'not_bidding': return <span className={`${styles.badge} ${styles.badgeGray}`}>Not Bidding</span>;
      default: return <span className={styles.badge}>{status}</span>;
    }
  };

  // Show the Complete button only if project bid_status is 'won' and not yet completed
  const bidStatusLower = String(bidStatus || '').toLowerCase();
  const isWon = bidStatusLower === 'won';
  const isAlreadyCompleted = String(projectStatus || '').toLowerCase() === 'completed';
  const showCompleteButton = isWon && !isAlreadyCompleted && typeof onCompleteProject === 'function';

  if (loading) return <div>Loading vendors...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Project Vendors</h2>
        {showCompleteButton && (
          <button
            type="button"
            className={styles.completeBtn}
            onClick={handleCompleteProject}
            disabled={completing}
            title="Mark this project as fully completed"
          >
            {completing ? 'Completing...' : '✓ Mark as Completed'}
          </button>
        )}
        {isAlreadyCompleted && (
          <span className={`${styles.badge} ${styles.badgeGreen}`} style={{ fontSize: 14, padding: '6px 14px' }}>
            ✓ Project Completed
          </span>
        )}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Status</th>
              <th>Proposed Price</th>
              <th>Lead Time</th>
              <th>Due Date</th>
              <th>Documents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                  No vendors have been invited to this project yet.
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td>{vendor.vendor_name}</td>
                  <td>{getStatusBadge(vendor.status)}</td>
                  <td>
                    {vendor.proposal_price ? `$${parseFloat(vendor.proposal_price).toLocaleString()}` : '-'}
                  </td>
                  <td>{vendor.proposal_lead_time || '-'}</td>
                  <td>
                    {(() => {
                      if (vendor.proposal_lead_time && bidDueDate) {
                        const d = new Date(bidDueDate);
                        if (!isNaN(d.getTime())) {
                          d.setDate(d.getDate() + Number(vendor.proposal_lead_time));
                          return d.toLocaleDateString();
                        }
                      }
                      return vendor.due_date ? new Date(vendor.due_date).toLocaleDateString() : '-';
                    })()}
                  </td>
                  <td>
                    {vendor.proposal_documents ? (
                      <div className={styles.docLinks}>
                        {JSON.parse(vendor.proposal_documents).map((doc, i) => (
                          <a key={i} href={`/uploads/${doc}`} target="_blank" rel="noreferrer" className={styles.docLink}>
                            Document {i + 1}
                          </a>
                        ))}
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    {(vendor.status === 'proposal_sent' || vendor.status === 'invited') && (
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.approveBtn}
                          disabled={vendor.status === 'invited'}
                          onClick={() => handleApprove(vendor.id)}
                          style={{
                            cursor: vendor.status === 'invited' ? 'not-allowed' : 'pointer',
                            opacity: vendor.status === 'invited' ? 0.5 : 1
                          }}
                        >
                          Approve
                        </button>
                        {vendor.status === 'proposal_sent' && (
                          <button className={styles.rejectBtn} onClick={() => handleReject(vendor.id)}>Reject</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}