/**
 * Central StatusBadge component.
 *
 * Canonical color map shared across Employee and Vendor portals.
 * Replaces 6+ inline copies that previously diverged in color and label logic.
 */

/* ── Status → color/label map ── */
const STATUS_CONFIG = {
  /* ── RFI / Submittal statuses ── */
  draft:           { label: 'Draft',           bg: '#F2F4F7', color: '#475467', border: '#D0D5DD' },
  open:            { label: 'Open',            bg: '#EFF8FF', color: '#1570EF', border: '#B2DDFF' },
  submitted:       { label: 'Submitted',       bg: '#EEF4FF', color: '#3538CD', border: '#C7D7FE' },
  under_review:    { label: 'Under Review',    bg: '#FFFAEB', color: '#B54708', border: '#FEDF89' },
  responded:       { label: 'Responded',       bg: '#ECFDF3', color: '#027A48', border: '#ABEFC6' },
  closed:          { label: 'Closed',          bg: '#F2F4F7', color: '#344054', border: '#D0D5DD' },
  need_revision:   { label: 'Need Revision',   bg: '#FEF3F2', color: '#F04438', border: '#FECDCA' },

  /* ── Bid / Project statuses ── */
  approved:        { label: 'Approved',        bg: '#ECFDF3', color: '#279500', border: '#A6F4C5' },
  won:             { label: 'Won',             bg: '#ECFDF3', color: '#279500', border: '#A6F4C5' },
  active:          { label: 'Active',          bg: '#ECFDF3', color: '#279500', border: '#A6F4C5' },
  lost:            { label: 'Lost',            bg: '#FEF3F2', color: '#F0383B', border: '#FECDCA' },
  rejected:        { label: 'Rejected',        bg: '#FEF3F2', color: '#F0383B', border: '#FECDCA' },
  invited:         { label: 'Invited',         bg: '#EFF8FF', color: '#2324CA', border: '#B2DDFF' },
  pending:         { label: 'Pending',         bg: '#FFFAEB', color: '#FF9500', border: '#FEDF89' },
  proposal_sent:   { label: 'Bid Sent',        bg: '#FFFAEB', color: '#FF9500', border: '#FEDF89' },
  not_bidding:     { label: 'Not Bidding',     bg: '#F2F4F7', color: '#475467', border: '#D0D5DD' },
  notbidding:      { label: 'Not Bidding',     bg: '#F2F4F7', color: '#475467', border: '#D0D5DD' },

  /* ── Bid pipeline statuses ── */

  bidinprogress:   { label: 'Bid In Progress', bg: '#EFF8FF', color: '#2324CA', border: '#B2DDFF' },
  senttoclient:    { label: 'Sent To Client',  bg: '#FFFAEB', color: '#FF9500', border: '#FEDF89' },
  deleted:         { label: 'Deleted',         bg: '#F2F4F7', color: '#667085', border: '#D0D5DD' },
};

const DEFAULT_CONFIG = { label: '', bg: '#F2F4F7', color: '#475467', border: '#D0D5DD' };

export const getStatusConfig = (status) => {
  const key = String(status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return STATUS_CONFIG[key] || { ...DEFAULT_CONFIG, label: status || 'Unknown' };
};

export default STATUS_CONFIG;
