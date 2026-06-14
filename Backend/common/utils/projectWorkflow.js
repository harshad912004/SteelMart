const normalizeWorkflowStatus = (value) => (
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
);

const RFI_STATUSES = ['draft', 'open', 'submitted', 'under_review', 'responded', 'closed'];
const SUBMITTAL_STATUSES = ['draft', 'open', 'submitted', 'under_review', 'responded', 'approved', 'rejected', 'closed', 'need_revision'];

const buildStatusCounts = (rows, allowedStatuses) => {
  const counts = { total: 0 };

  allowedStatuses.forEach((status) => {
    counts[status] = 0;
  });

  rows.forEach((row) => {
    const status = normalizeWorkflowStatus(row?.status);
    const count = Number(row?.count) || 0;
    counts.total += count;
    if (Object.prototype.hasOwnProperty.call(counts, status)) {
      counts[status] += count;
    }
  });

  return counts;
};

const sanitizeStatus = (value, allowedStatuses, fallbackStatus) => {
  if (value === undefined || value === null || value === '') {
    return fallbackStatus;
  }

  const normalized = normalizeWorkflowStatus(value);
  return allowedStatuses.includes(normalized) ? normalized : null;
};

const canManageEmployeeWorkflow = (user) => {
  const role = normalizeWorkflowStatus(user?.role);
  return ['admin', 'teamlead', 'projectlead', 'legalteam'].includes(role);
};

module.exports = {
  normalizeWorkflowStatus,
  RFI_STATUSES,
  SUBMITTAL_STATUSES,
  buildStatusCounts,
  sanitizeStatus,
  canManageEmployeeWorkflow,
};
