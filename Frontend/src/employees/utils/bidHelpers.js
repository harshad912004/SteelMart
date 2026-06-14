import { getDecodedToken } from './authSession';

/**
 * Parse a date string (YYYY-MM-DD or ISO) into a local-timezone Date object.
 * Avoids the UTC-midnight bug where `new Date("2026-06-15")` is treated as
 * UTC midnight and then shifts to the previous day in negative-UTC timezones.
 */
const parseDateLocal = (dateStr) => {
  if (!dateStr) return null;
  const str = String(dateStr).split('T')[0];
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1; // 0-indexed month
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  const date = new Date(y, m, d);
  return isNaN(date.getTime()) ? null : date;
};

export { parseDateLocal };

export const getBidStatus = (bid) => String(bid?.status || '').toLowerCase();

export const normalizeBidStatusKey = (bidOrStatus) => {
  if (bidOrStatus && typeof bidOrStatus === 'object') {
    if (bidOrStatus.project_status === 'completed') {
      return 'completed';
    }
  }

  const rawStatus = typeof bidOrStatus === 'string'
    ? bidOrStatus
    : bidOrStatus?.status;

  const normalizedStatus = String(rawStatus || '').trim().toLowerCase();

  switch (normalizedStatus) {

    case 'bidinprogress':
    case 'bid in progress':
    case 'pending':
      return 'bidinprogress';
    case 'senttoclient':
    case 'sent to client':
    case 'shared with client':
    case 'client to respond':
      return 'senttoclient';
    default:
      return normalizedStatus;
  }
};

export const isSalesPipelineBid = (bidOrStatus, options = {}) => {
  const { includeDeleted = true } = options;
  const status = normalizeBidStatusKey(bidOrStatus);

  if (!includeDeleted && status === 'deleted') {
    return false;
  }

  return status === 'bidinprogress' || status === 'deleted';
};

export const isCrmPipelineBid = (bidOrStatus, options = {}) => {
  const { includeDeleted = true } = options;
  const status = normalizeBidStatusKey(bidOrStatus);

  if (!includeDeleted && status === 'deleted') {
    return false;
  }

  return status === 'senttoclient' || status === 'approved' || status === 'won' || status === 'lost' || status === 'deleted';
};

export const isBidOverdue = (bid) => {
  const status = getBidStatus(bid);
  if (!bid?.due_date || status === 'approved' || status === 'deleted') return false;

  const dueDate = parseDateLocal(bid.due_date);
  if (!dueDate) return false;

  dueDate.setHours(23, 59, 59, 999);
  return dueDate < new Date();
};

export const getBidCreatedTime = (bid) => {
  const dateValue = bid?.created_at || bid?.createdAt || bid?.date_created || bid?.created_date || bid?.updated_at || bid?.due_date;
  const date = dateValue ? new Date(dateValue) : null;
  return date && !isNaN(date) ? date.getTime() : 0;
};

export const formatShortDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = parseDateLocal(dateString);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

export const formatBidDetailDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = parseDateLocal(dateString);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date)) return 'N/A';
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const getSalesBidDisplayId = (bid) => bid?.bid_sales_id || bid?.bid_project_id || bid?.bid_number || bid?.bid_no || bid?.project_id || `BMB-${bid?.id || '000'}`;

export const getCrmBidDisplayId = (bid) => bid?.bid_crm_id || bid?.bid_project_id || bid?.bid_number || bid?.bid_no || bid?.project_id || `BMB-${bid?.id || '000'}`;

export const getBidDisplayId = (bid) => getCrmBidDisplayId(bid);

export const toToggleValue = (value) => (value === true || value === 1 || value === '1' ? 1 : 0);

export const toToggleBoolean = (value) => value === true || value === 1 || value === '1';

export const getBidContributors = (bid) => {
  const employees = Array.isArray(bid?.employees)
    ? bid.employees
    : Array.isArray(bid?.client_employees)
      ? bid.client_employees
      : Array.isArray(bid?.clients)
        ? bid.clients.flatMap((client) => Array.isArray(client?.employees) ? client.employees : [])
        : [];

  return employees.slice(0, 4).map((employee, index) => {
    const name = employee?.name || employee?.employee_name || employee?.full_name || `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim() || `Contributor ${index + 1}`;
    return {
      id: employee?.id || employee?._id || employee?.employee_id || employee?.client_employee_id || `${name}-${index}`,
      name,
    };
  });
};

export const getCurrentUserId = () => {
  const decoded = getDecodedToken();
  return decoded?.id || decoded?.user_id || decoded?.userId || decoded?.created_by || decoded?.adminId || decoded?.sub || null;
};

export const getRecipientName = (person, fallback = '') => {
  if (!person) return fallback;
  if (typeof person === 'string') return person;

  return person.name
    || person.company_name
    || person.companyName
    || person.client_name
    || person.employee_name
    || person.full_name
    || `${person.firstName || person.first_name || ''} ${person.lastName || person.last_name || ''}`.trim()
    || person.fallbackName
    || person.email
    || fallback;
};

export const getInitialBidItems = (bid) => {
  const estimateItems = bid?.estimation
    || bid?.estimations
    || bid?.estimate_items
    || bid?.estimateItems
    || bid?.bid_items
    || bid?.bidItems
    || bid?.cost_details
    || bid?.costDetails;

  const parsedItems = typeof estimateItems === 'string'
    ? (() => {
      try {
        return JSON.parse(estimateItems);
      } catch {
        return [];
      }
    })()
    : estimateItems;

  if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
    return [{ id: 1, item: '', description: '', qty: '', rate: '', price: '' }];
  }

  return parsedItems.map((item, index) => {
    const qty = item.qty ?? item.quantity ?? '';
    const rate = item.rate ?? '';
    const quantity = Number(qty) || 0;
    const rateValue = Number(rate) || 0;

    return {
      id: item.id || index + 1,
      item: item.item || '',
      description: item.description || '',
      qty,
      rate,
      price: item.price !== undefined && item.price !== null && item.price !== ''
        ? item.price
        : quantity && rateValue
          ? (quantity * rateValue).toFixed(2)
          : '',
    };
  });
};

export const getEstimateFileBaseName = (bid) => {
  const rawName = bid?.project_name || `estimate-${bid?.id || 'bid'}`;
  return String(rawName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `estimate-${bid?.id || 'bid'}`;
};

export const createDefaultEstimateRow = () => ({ id: Date.now(), item: '', description: '', qty: '', rate: '', price: '' });

export const normalizeEstimateItemsFromApi = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [createDefaultEstimateRow()];
  }

  return items.map((item, index) => {
    const qty = item.qty ?? item.quantity ?? '';
    const rate = item.rate ?? '';
    const quantity = Number(qty) || 0;
    const rateValue = Number(rate) || 0;
    return {
      id: item.id || item.item_id || Date.now() + index,
      item: item.item || '',
      description: item.description || '',
      qty,
      rate,
      price: item.price !== undefined && item.price !== null && item.price !== ''
        ? item.price
        : quantity && rateValue
          ? (quantity * rateValue).toFixed(2)
          : '',
    };
  });
};

export const buildEstimateExcelContent = (bid, items, subTotal, grandTotal = subTotal) => {
  const safeProjectName = (bid?.project_name || 'Untitled Project').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeAddress = (bid?.address || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rows = items.map((item) => `
    <tr>
      <td>${item.item || ''}</td>
      <td>${item.description || ''}</td>
      <td>${Number(item.qty) || 0}</td>
      <td>${(Number(item.rate) || 0).toFixed(2)}</td>
      <td>${(Number(item.price) || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <table border="1">
          <tr><th colspan="5">Estimate</th></tr>
          <tr><td colspan="5">Project Name: ${safeProjectName}</td></tr>
          <tr><td colspan="5">Address: ${safeAddress}</td></tr>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>QTY</th>
            <th>Rate</th>
            <th>Price</th>
          </tr>
          ${rows || '<tr><td colspan="5">No cost details available.</td></tr>'}
          <tr>
            <td colspan="4">Sub Total</td>
            <td>${subTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="4">Grand Total</td>
            <td>${grandTotal.toFixed(2)}</td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export const triggerBlobDownload = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const formatManagedFileSize = (sizeInBytes = 0) => {
  const size = Number(sizeInBytes) || 0;
  if (size <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / (1024 ** unitIndex);
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
};

export const buildBidFileManagerPath = (bid) => {
  if (typeof window === 'undefined') {
    return '/dashboard/sales';
  }

  const segments = window.location.pathname.split('/').filter(Boolean);
  return [...segments, String(getBidDisplayId(bid)).toLowerCase(), 'files'].join(' > ');
};

export const createManagedEntry = ({ name, type, size = 0, url = '', extension = '', lastModified = new Date().toISOString() }) => ({
  id: `${type}-${name}-${lastModified}`,
  name,
  type,
  size,
  url,
  extension,
  lastModified,
});

export const upsertManagedEntry = (entries, nextEntry) => {
  const currentEntries = Array.isArray(entries) ? entries : [];
  const existingIndex = currentEntries.findIndex((entry) => entry.type === nextEntry.type && entry.name === nextEntry.name);

  if (existingIndex === -1) {
    return [nextEntry, ...currentEntries];
  }

  const updatedEntries = [...currentEntries];
  updatedEntries[existingIndex] = {
    ...updatedEntries[existingIndex],
    ...nextEntry,
    id: nextEntry.id,
  };
  return updatedEntries;
};

export const buildBidUpdatePayload = (bid, overrides = {}) => ({
  project_name: bid.project_name || '',
  address: bid.address || '',
  due_date: bid.due_date || '',
  client_ids: Array.isArray(bid.selected_general_contractors)
    ? bid.selected_general_contractors.map((contractor) => contractor.id).filter(Boolean)
    : Array.isArray(bid.client_ids)
      ? bid.client_ids
      : [],
  client_employee_ids: Array.isArray(bid.selected_employees)
    ? bid.selected_employees.map((employee) => employee.id).filter(Boolean)
    : Array.isArray(bid.client_employee_ids)
      ? bid.client_employee_ids
      : [],
  drawing_date: bid.drawing_date || bid.dwg_date || '',
  drawing_description: bid.drawing_description || bid.dwg_description || '',
  db_wage_rate: toToggleValue(bid.db_wage_rate),
  tax_exempt: toToggleValue(bid.tax_exempt),
  fringes_amount: Number(bid.fringes_amount) || 0,
  base_contract_amount: Number(bid.base_contract_amount || bid.base_amount) || 0,
  ...(bid.grand_total !== undefined && bid.grand_total !== null && bid.grand_total !== ''
    ? { grand_total: Number(bid.grand_total) || 0 }
    : bid.bid_value !== undefined && bid.bid_value !== null && bid.bid_value !== ''
      ? { grand_total: Number(bid.bid_value) || 0 }
      : {}),
  status: bid.status || 'bidInProgress',
  ...overrides,
});

export const getStatusDisplayLabel = (status) => {
  const normalized = typeof status === 'object' && status !== null
    ? (status.project_status === 'completed' ? 'completed' : status.status)
    : status;

  switch (normalized) {
    case 'completed':
      return 'Completed';
    case 'bidInProgress':
    case 'bidinprogress':
    case 'bid in progress':
      return 'Bid In Progress';
    case 'sentToClient':
    case 'senttoclient':
    case 'sent to client':
      return 'Sent To Client';
    case 'lost':
      return 'Lost';
    case 'won':
      return 'Won';
    case 'approved':
      return 'Approved';
    case 'deleted':
      return 'Deleted';
    default:
      return normalized || 'Pending';
  }
};
