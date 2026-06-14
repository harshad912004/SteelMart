import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toast } from '../../components/Toast';
import { ChevronDownIcon, ViewIcon } from '../../components/Icons';
import { DownloadIcon, FileRowIcon } from '../../components/Icons/BidIcons';
import Pagination from '../../components/Pagination/Pagination';
import BidOverviewPage from '../../components/BidOverview/BidOverviewPage';
import {
  getAllClients,
  getBids,
  getBid,
  getReportingDashboard,
  getReportingEmployees,
  getReportingEstimateLedger,
  getReportingNoResponseClients,
  downloadEstimatePdf,
} from '../../../common/services/api';
import { triggerBlobDownload } from '../../utils/bidHelpers';
import styles from './ReportsPage.module.css';

const REPORT_TABS = ['Company & Bids', 'Employees', 'Customers', 'Estimate Ledger'];
const DATE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

const emptyToast = { isOpen: false, message: '', isSuccess: true };

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value, fractionDigits = 2) => `$${toNumber(value).toLocaleString(undefined, {
  minimumFractionDigits: fractionDigits,
  maximumFractionDigits: fractionDigits,
})}`;

const formatWholeNumber = (value) => toNumber(value).toLocaleString();

const formatCompactRatio = (value) => Number.isFinite(value) ? Math.round(value).toString() : '0';

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

const formatStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();

  switch (normalized) {
    case 'senttoclient':
    case 'sent to client':
      return 'Sent To Client';
    case 'bidinprogress':
    case 'bid in progress':
      return 'Bid In Progress';

    case 'won':
      return 'Won';
    case 'lost':
      return 'Lost';
    case 'approved':
      return 'Approved';
    default:
      return status || 'Pending';
  }
};

const getDisplayName = (record) => {
  if (!record) return 'Customer';
  return record.employee_name || record.company_name || record.client_name || record.name || record.email || 'Customer';
};

const getInitials = (value) => {
  if (!value || typeof value !== 'string') return 'C';
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

const getStatusTone = (status) => {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized === 'won' || normalized === 'approved') return styles.statusSuccess;
  if (normalized === 'lost') return styles.statusDanger;
  return styles.statusNeutral;
};

const getBidValue = (bid) => (
  toNumber(
    bid?.grand_total
    ?? bid?.grandTotal
    ?? bid?.bid_value
    ?? bid?.bidValue
    ?? bid?.sub_total
    ?? bid?.subTotal
    ?? bid?.base_contract_amount
    ?? 0
  )
);

const getBidClientNames = (bid) => {
  if (Array.isArray(bid?.clients) && bid.clients.length) {
    return bid.clients.map((client) => {
      if (typeof client === 'string') return client;
      return client?.company_name || client?.client_name || client?.name || 'Customer';
    }).join(', ');
  }

  if (typeof bid?.client_name === 'object') {
    return bid.client_name?.company_name || bid.client_name?.client_name || bid.client_name?.name || 'Customer';
  }

  return bid?.client_name || bid?.client || bid?.general_contractor || 'Customer';
};

const matchesDateFilter = (dateValue, filter) => {
  if (filter === 'all') return true;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  const getStartOfWeek = (value) => {
    const date = new Date(value);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);

    return date;
  };

  if (filter === 'week') {
    const startOfWeek = getStartOfWeek(now);
    const startOfNextWeek = new Date(startOfWeek);

    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

    return parsed >= startOfWeek && parsed < startOfNextWeek;
  }

  if (filter === 'month') {
    return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
  }

  if (filter === 'year') {
    return parsed.getFullYear() === now.getFullYear();
  }

  return true;
};

const getMonthWindow = (offset = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { start, end };
};

const matchesMonthWindow = (dateValue, offset = 0) => {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return false;

  const { start, end } = getMonthWindow(offset);
  return parsed >= start && parsed < end;
};

const matchesPreviousDateFilter = (dateValue, filter) => {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();

  if (filter === 'week') {
    const getStartOfWeek = (value) => {
      const date = new Date(value);
      const day = date.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      date.setDate(date.getDate() + diff);
      date.setHours(0, 0, 0, 0);
      return date;
    };
    const startOfCurrentWeek = getStartOfWeek(now);
    const startOfPreviousWeek = new Date(startOfCurrentWeek);
    startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);
    return parsed >= startOfPreviousWeek && parsed < startOfCurrentWeek;
  }

  if (filter === 'month') {
    return matchesMonthWindow(dateValue, -1);
  }

  if (filter === 'year') {
    return parsed.getFullYear() === now.getFullYear() - 1;
  }

  return false;
};

const normalizeBid = (bid) => ({
  id: bid?.id,
  projectName: bid?.project_name || bid?.projectName || 'Untitled Project',
  clientNames: getBidClientNames(bid),
  bidValue: getBidValue(bid),
  status: String(bid?.status || ''),
  createdAt: bid?.created_at || bid?.createdAt || bid?.updated_at || bid?.updatedAt,
  updatedAt: bid?.updated_at || bid?.updatedAt || bid?.created_at || bid?.createdAt,
  createdById: bid?.created_by_id != null
    ? String(bid.created_by_id)
    : (bid?.created_by != null && !Number.isNaN(Number(bid.created_by)) ? String(bid.created_by) : ''),
  createdByName: bid?.created_by_name || (typeof bid?.created_by === 'string' && Number.isNaN(Number(bid.created_by)) ? bid.created_by : ''),
});

const normalizeClient = (client) => ({
  id: client?.id || client?._id || client?.client_id || client?.clientId,
  companyName: client?.company_name || client?.companyName || client?.name || 'Customer',
  employeeCount: toNumber(client?.employee_count || client?.employees_count || client?.employeeCount || client?.employeesCount),
});

const normalizeEmployeeReportRow = (employee) => ({
  id: employee?.employee_id != null ? String(employee.employee_id) : '',
  name: employee?.employee_name || employee?.email || 'Employee',
  subtitle: employee?.role || employee?.email || (employee?.employee_id != null ? String(employee.employee_id) : 'No ID'),
  bidCount: toNumber(employee?.bid_count),
  totalBidValue: toNumber(employee?.total_bid_value),
  winRatio: toNumber(employee?.win_ratio),
});

const extractPagination = (response) => (
  response?.pagination
  || response?.data?.pagination
  || response?.meta?.pagination
  || { totalPages: 1 }
);

const extractEmployees = (response) => {
  const payload = response?.employees ?? response?.data?.employees ?? response?.data?.data ?? response?.data;
  return Array.isArray(payload) ? payload : [];
};

const extractBids = (response) => {
  const payload = response?.bids ?? response?.data?.bids ?? response?.data?.data ?? response?.data;
  return Array.isArray(payload) ? payload : [];
};

const extractClients = (response) => {
  const payload =
    response?.contacts
    ?? response?.clients
    ?? response?.companies
    ?? response?.data?.contacts
    ?? response?.data?.clients
    ?? response?.data?.companies
    ?? response?.data?.data
    ?? response?.data;

  return Array.isArray(payload) ? payload : [];
};

const extractDashboard = (response) => (
  response?.data?.dashboard
  || response?.dashboard
  || response?.data?.data?.dashboard
  || null
);

const extractNoResponseClients = (response) => {
  const payload = response?.data?.clients ?? response?.clients ?? response?.data?.data?.clients;
  return Array.isArray(payload) ? payload : [];
};

const extractReportingEmployees = (response) => {
  const payload = response?.data?.employees ?? response?.employees ?? response?.data?.data?.employees;
  return Array.isArray(payload) ? payload : [];
};

const extractLedgerRows = (response) => {
  const payload = response?.data?.ledger ?? response?.ledger ?? response?.data?.data?.ledger;
  return Array.isArray(payload) ? payload : [];
};

const dedupeById = (items, keySelector) => {
  const seen = new Set();
  const nextItems = [];

  items.forEach((item, index) => {
    const key = keySelector(item, index);
    if (key == null || seen.has(key)) return;
    seen.add(key);
    nextItems.push(item);
  });

  return nextItems;
};

const fetchAllPages = async (loadPage, extractRows) => {
  const firstResponse = await loadPage(1);
  const firstRows = extractRows(firstResponse);
  const totalPages = Math.max(1, toNumber(extractPagination(firstResponse)?.totalPages || extractPagination(firstResponse)?.pages || 1));

  if (totalPages === 1) {
    return firstRows;
  }

  const remainingResponses = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => loadPage(index + 2))
  );

  return [
    ...firstRows,
    ...remainingResponses.flatMap((response) => extractRows(response)),
  ];
};

const escapeCsvValue = (value) => {
  const stringValue = String(value ?? '');
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const triggerCsvDownload = (fileName, headers, rows) => {
  if (typeof window === 'undefined') return;

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => window.URL.revokeObjectURL(url), 500);
};

function StatIcon({ tone = 'green', type = 'bars' }) {
  const toneClassName = tone === 'red' ? styles.iconToneRed : tone === 'gray' ? styles.iconToneGray : styles.iconToneGreen;

  return (
    <span className={`${styles.metricIcon} ${toneClassName}`}>
      {type === 'people' ? (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_423_1612)">
            <path d="M25.1437 13.7937C23.2 11.85 23 11.6375 23 11.45C23 11.3125 23.05 11.1938 23.1562 11.0938C23.3 10.9438 23.3375 10.9375 24.1562 10.9375H25V6.59375V2.24375L25.1562 2.09375L25.3063 1.9375H27.5H29.6937L29.8438 2.09375L30 2.24375V6.59375V10.9375H30.8438C31.6625 10.9375 31.7 10.9438 31.8438 11.0938C31.95 11.1938 32 11.3125 32 11.45C32 11.6375 31.8 11.85 29.8563 13.7937C27.8688 15.7875 27.7 15.9375 27.5 15.9375C27.3 15.9375 27.1312 15.7875 25.1437 13.7937ZM28.9062 13.3125L30.2812 11.9375H29.7938C29.3625 11.9375 29.2875 11.9187 29.1562 11.7812L29 11.6313V7.28125V2.9375H27.5H26V7.28125V11.6313L25.8438 11.7812C25.7125 11.9187 25.6375 11.9375 25.2062 11.9375H24.7188L26.0938 13.3125C26.85 14.0688 27.4813 14.6875 27.5 14.6875C27.5188 14.6875 28.15 14.0688 28.9062 13.3125Z" fill="#E40A09" stroke="#E40A09" strokeWidth="0.3" />
            <path d="M4.21905 5.99971L6.71905 8.49971H8.71905H10.7191L14.4691 12.2497L18.2191 15.9997H20.4566H22.7003L23.0816 16.3622C23.2941 16.5622 25.0566 18.2122 27.0003 20.0247C28.9441 21.8435 30.6378 23.4372 30.7628 23.5685C31.0503 23.8622 31.0753 24.1185 30.8441 24.3435C30.5878 24.606 30.3628 24.556 29.9191 24.1372C29.7066 23.931 27.9066 22.2435 25.9191 20.3872L22.3066 16.9997H20.0441H17.7816L14.0316 13.2497L10.2816 9.49971H8.28155H6.28155L3.64405 6.85596C1.23155 4.44971 1.0003 4.19971 1.0003 4.01221C1.0003 3.73721 1.2378 3.49971 1.5128 3.49971C1.69405 3.49971 1.94405 3.73096 4.21905 5.99971Z" fill="#E40A09" stroke="#E40A09" strokeWidth="0.3" />
            <path d="M4.84406 10.1562L5.00031 10.3062V20V29.6937L4.84406 29.8438L4.69406 30H3.00031H1.30656L1.15656 29.8438L1.00031 29.6937V20V10.3062L1.15656 10.1562L1.30656 10H3.00031H4.69406L4.84406 10.1562ZM2.00031 20V29H3.00031H4.00031V20V11H3.00031H2.00031V20Z" fill="#E40A09" stroke="#E40A09" strokeWidth="0.3" />
            <path d="M9.84406 14.1562L10.0003 14.3062V22V29.6937L9.84406 29.8438L9.69406 30H8.00031H6.30656L6.15656 29.8438L6.00031 29.6937V22V14.3062L6.15656 14.1562L6.30656 14H8.00031H9.69406L9.84406 14.1562ZM7.00031 22V29H8.00031H9.00031V22V15H8.00031H7.00031V22Z" fill="#E40A09" stroke="#E40A09" strokeWidth="0.3" />
            <path d="M14.8441 17.6562L15.0003 17.8062V23.75V29.6937L14.8441 29.8437L14.6941 30H13.0003H11.3066L11.1566 29.8437L11.0003 29.6937V23.75V17.8062L11.1566 17.6562L11.3066 17.5H13.0003H14.6941L14.8441 17.6562ZM12.0003 23.75V29H13.0003H14.0003V23.75V18.5H13.0003H12.0003V23.75Z" fill="#E40A09" stroke="#E40A09" strokeWidth="0.3" />
            <path d="M19.8441 21.6562L20.0003 21.8062V25.75V29.6937L19.8441 29.8438L19.6941 30H18.0003H16.3066L16.1566 29.8438L16.0003 29.6937V25.75V21.8062L16.1566 21.6562L16.3066 21.5H18.0003H19.6941L19.8441 21.6562ZM17.0003 25.75V29H18.0003H19.0003V25.75V22.5H18.0003H17.0003V25.75Z" fill="#E40A09" stroke="#E40A09" strokeWidth="0.3" />
            <path d="M24.8441 23.6562L25.0003 23.8063V26.75V29.6937L24.8441 29.8438L24.6941 30H23.0003H21.3066L21.1566 29.8438L21.0003 29.6937V26.75V23.8063L21.1566 23.6562L21.3066 23.5H23.0003H24.6941L24.8441 23.6562ZM22.0003 26.75V29H23.0003H24.0003V26.75V24.5H23.0003H22.0003V26.75Z" fill="#E40A09" stroke="#E40A09" strokeWidth="0.3" />
            <path d="M29.8441 26.1562L30.0003 26.3062V28V29.6937L29.8441 29.8438L29.6941 30H28.0003H26.3066L26.1566 29.8438L26.0003 29.6937V28V26.3062L26.1566 26.1562L26.3066 26H28.0003H29.6941L29.8441 26.1562ZM27.0003 28V29H28.0003H29.0003V28V27H28.0003H27.0003V28Z" fill="#E40A09" stroke="#E40A09" strokeWidth="0.3" />
          </g>
          <defs>
            <clipPath id="clip0_423_1612">
              <rect width="32" height="32" fill="white" />
            </clipPath>
          </defs>
        </svg>


      ) : type === 'badge' ? (
        <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.9404 0.106056C12.4654 0.281055 12.1404 0.549807 11.0216 1.66856C10.1341 2.56231 10.0029 2.67481 9.81536 2.67481C9.70286 2.67481 8.97161 2.57481 8.19036 2.44981C6.66536 2.21231 6.42786 2.20606 5.82786 2.43106C5.46536 2.56856 4.89036 3.04356 4.68411 3.38106C4.47786 3.71856 4.37161 4.14981 4.14661 5.58731C4.02786 6.34356 3.91536 7.01231 3.89036 7.06856C3.87161 7.12481 3.22786 7.48731 2.47161 7.87481C1.27786 8.48106 1.03411 8.63106 0.702859 8.95606C0.271609 9.38731 0.0591093 9.83731 0.00910932 10.4623C-0.0408907 11.0186 0.0966093 11.3998 0.884109 12.9373L1.58411 14.2998L0.884109 15.6561C0.0966093 17.1998 -0.0408907 17.5811 0.00910932 18.1373C0.0591093 18.7623 0.271609 19.2123 0.702859 19.6436C1.03411 19.9686 1.27786 20.1186 2.47161 20.7248C3.22786 21.1123 3.87161 21.4748 3.89036 21.5311C3.91536 21.5873 4.02786 22.2561 4.14661 23.0123C4.37161 24.4498 4.47786 24.8811 4.68411 25.2186C4.89036 25.5561 5.46536 26.0311 5.82786 26.1686C6.42786 26.3936 6.66536 26.3873 8.19036 26.1498C8.97161 26.0248 9.69661 25.9248 9.80911 25.9248C9.99036 25.9248 10.1529 26.0623 11.1716 27.0686C12.6216 28.4998 12.7654 28.5811 13.7404 28.5811C14.7154 28.5811 14.8591 28.4998 16.3091 27.0686C17.3279 26.0623 17.4904 25.9248 17.6716 25.9248C17.7841 25.9248 18.5091 26.0248 19.2904 26.1498C20.8154 26.3873 21.0529 26.3936 21.6529 26.1686C22.0154 26.0311 22.5904 25.5561 22.7966 25.2186C23.0029 24.8811 23.1091 24.4498 23.3341 23.0123C23.4529 22.2561 23.5654 21.5873 23.5904 21.5248C23.6091 21.4686 24.2529 21.1061 25.0154 20.7248C26.2216 20.1123 26.4466 19.9811 26.7779 19.6498C27.2091 19.2123 27.4216 18.7623 27.4716 18.1373C27.5216 17.5811 27.3841 17.1998 26.5966 15.6561L25.8966 14.2998L26.5966 12.9373C26.9779 12.1936 27.3404 11.4123 27.3966 11.2123C27.6154 10.4561 27.3966 9.60606 26.8279 8.99356C26.5216 8.66231 26.3529 8.55606 25.0591 7.89981C24.2716 7.49981 23.6091 7.13106 23.5904 7.06856C23.5654 7.01231 23.4529 6.34356 23.3341 5.58731C23.1091 4.14981 23.0029 3.71856 22.7966 3.38106C22.5904 3.04356 22.0154 2.56856 21.6529 2.43106C21.0529 2.20606 20.8154 2.21231 19.2904 2.44981C18.5091 2.57481 17.7841 2.67481 17.6716 2.67481C17.4904 2.67481 17.3279 2.53731 16.3091 1.53106C14.9154 0.156055 14.7216 0.0373058 13.8341 0.00605583C13.3904 -0.0126934 13.2029 0.0123062 12.9404 0.106056ZM15.0466 3.13106C16.7779 4.83106 16.8716 4.86231 19.3904 4.46231C20.6841 4.24981 20.8279 4.24356 20.9591 4.32481C21.1279 4.43731 21.1154 4.36856 21.4029 6.17481C21.7591 8.41231 21.8404 8.51856 23.9779 9.60606C25.0279 10.1373 25.3904 10.3498 25.4466 10.4686C25.5091 10.6061 25.4404 10.7748 24.7904 12.0811C23.6779 14.2998 23.6779 14.2998 24.7904 16.5186C25.4404 17.8248 25.5091 17.9936 25.4466 18.1311C25.3904 18.2498 25.0279 18.4623 23.9779 18.9936C21.8404 20.0811 21.7591 20.1873 21.4029 22.4248C21.1154 24.2311 21.1279 24.1623 20.9591 24.2748C20.8279 24.3561 20.6841 24.3498 19.3904 24.1373C16.8654 23.7373 16.7779 23.7623 15.0466 25.4686C14.2091 26.2936 13.8466 26.6123 13.7404 26.6123C13.6341 26.6123 13.2716 26.2936 12.4341 25.4686C10.7029 23.7623 10.6216 23.7373 8.09036 24.1373C6.79661 24.3498 6.65286 24.3561 6.52161 24.2748C6.35286 24.1623 6.36536 24.2311 6.07786 22.4248C5.72161 20.1873 5.64036 20.0811 3.50286 18.9936C2.45286 18.4623 2.09036 18.2498 2.03411 18.1311C1.97161 17.9936 2.04036 17.8311 2.69036 16.5186C3.80286 14.2998 3.80286 14.2998 2.69036 12.0811C2.04036 10.7686 1.97161 10.6061 2.03411 10.4686C2.09036 10.3498 2.45286 10.1373 3.50286 9.60606C5.64036 8.51856 5.72161 8.41231 6.07786 6.17481C6.36536 4.36856 6.35286 4.43731 6.52161 4.32481C6.65286 4.24356 6.79661 4.24981 8.09036 4.46231C10.6154 4.86231 10.7091 4.83106 12.4279 3.13106C13.2716 2.29981 13.6216 1.98731 13.7341 1.98731C13.8466 1.98731 14.1779 2.28106 15.0466 3.13106Z" fill="#45B36A" />
          <path d="M18.0841 10.2437C17.9653 10.2749 16.9466 11.2499 15.0403 13.1562L12.1778 16.0187L10.8841 14.7249C10.1653 14.0124 9.5028 13.3999 9.40905 13.3624C8.9778 13.2062 8.44655 13.3999 8.2153 13.7937C8.0653 14.0562 8.0528 14.5062 8.19655 14.7687C8.24655 14.8687 9.04655 15.7062 9.97155 16.6249C11.3778 18.0249 11.6903 18.2999 11.9153 18.3687C12.4841 18.5312 12.3841 18.6187 15.9466 15.0624C17.7278 13.2874 19.2341 11.7437 19.2841 11.6437C19.4278 11.3812 19.4091 10.9187 19.2466 10.6499C19.1028 10.4187 18.6716 10.1687 18.4216 10.1812C18.3403 10.1812 18.1903 10.2124 18.0841 10.2437Z" fill="#45B36A" />
        </svg>

      ) : type === 'badge1' ? (
        <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.7402 28.5146C14.226 28.5146 14.4899 28.4932 14.8125 28.3037C15.1427 28.1097 15.5352 27.7395 16.2627 27.0215C16.7713 26.5191 17.0686 26.2306 17.2617 26.0684C17.4544 25.9065 17.5562 25.8584 17.6719 25.8584C17.7049 25.8584 17.7756 25.8648 17.8701 25.876C17.9667 25.8874 18.0926 25.9045 18.2393 25.9248L19.3008 26.084C20.0646 26.2029 20.5002 26.2626 20.8193 26.2656C21.1332 26.2686 21.334 26.217 21.6289 26.1064C21.8002 26.0415 22.0288 25.8929 22.2412 25.7168C22.4534 25.5408 22.6417 25.3432 22.7393 25.1836C22.9371 24.8598 23.0429 24.4437 23.2686 23.002C23.328 22.6237 23.3855 22.267 23.4316 21.9971C23.4547 21.8623 23.4752 21.7489 23.4912 21.665C23.4992 21.6233 23.5058 21.5881 23.5117 21.5615C23.5171 21.5371 23.5228 21.5138 23.5283 21.5L23.5293 21.501C23.5364 21.4826 23.5489 21.4686 23.5547 21.4629C23.5632 21.4545 23.5738 21.4461 23.585 21.4375C23.6081 21.4197 23.6397 21.3974 23.6777 21.373C23.7542 21.3242 23.8616 21.2613 23.9912 21.1885C24.1211 21.1155 24.274 21.0321 24.4424 20.9434L24.9854 20.665C26.042 20.1285 26.3388 19.9643 26.6123 19.7158L26.7305 19.6025C27.1508 19.1761 27.3566 18.7407 27.4053 18.1318V18.1309C27.4471 17.6642 27.3552 17.3276 26.8027 16.2139L26.5371 15.6865L25.8369 14.3301L25.8213 14.2998L25.8369 14.2695L26.5371 12.9072C26.7273 12.5361 26.9127 12.1552 27.0576 11.8428C27.2036 11.5281 27.3056 11.2882 27.332 11.1943L27.333 11.1934C27.5445 10.4615 27.3331 9.63561 26.7793 9.03906C26.4826 8.71818 26.3252 8.61633 25.0293 7.95898C24.6352 7.75879 24.2714 7.56662 24.0039 7.41602C23.8703 7.34078 23.7594 7.27527 23.6807 7.22461C23.6416 7.19943 23.6088 7.17691 23.585 7.1582C23.5732 7.14898 23.5626 7.13902 23.5537 7.12988C23.5479 7.12393 23.5372 7.11198 23.5303 7.0957H23.5293C23.523 7.08149 23.517 7.05748 23.5117 7.03418C23.5058 7.00812 23.4992 6.97379 23.4912 6.93262C23.4752 6.84952 23.4547 6.7361 23.4316 6.60156C23.3855 6.33241 23.3279 5.97585 23.2686 5.59766C23.0429 4.15592 22.9371 3.73981 22.7393 3.41602C22.6417 3.25645 22.4534 3.0588 22.2412 2.88281C22.082 2.75079 21.9138 2.6339 21.7676 2.55664L21.6289 2.49316C21.334 2.38262 21.1332 2.33099 20.8193 2.33398C20.6597 2.33552 20.4708 2.3506 20.2266 2.38086L19.3008 2.51562C18.9098 2.57818 18.5327 2.63411 18.2393 2.6748C18.0926 2.69514 17.9667 2.71223 17.8701 2.72363C17.7756 2.73478 17.7049 2.74117 17.6719 2.74121C17.5562 2.74121 17.4544 2.69309 17.2617 2.53125C17.0686 2.36897 16.7713 2.08049 16.2627 1.57812C15.5639 0.888731 15.1724 0.521901 14.8467 0.321289C14.5279 0.125012 14.2716 0.0877541 13.832 0.0722656H13.8311C13.3926 0.0537539 13.2145 0.0790969 12.9629 0.168945H12.9639C12.5052 0.337929 12.1904 0.594737 11.0693 1.71582C10.6269 2.16137 10.3693 2.41525 10.1992 2.55762C10.114 2.62892 10.0466 2.67598 9.98633 2.7041C9.92394 2.73318 9.87067 2.7412 9.81543 2.74121C9.78259 2.74121 9.71147 2.7348 9.61621 2.72363C9.51901 2.71223 9.39164 2.69515 9.24414 2.6748C8.94914 2.63411 8.57053 2.57816 8.17969 2.51562C7.41598 2.39669 6.98023 2.33705 6.66113 2.33398C6.34738 2.33102 6.14648 2.38259 5.85156 2.49316C5.68025 2.55815 5.45267 2.70668 5.24023 2.88281C5.02784 3.05891 4.83879 3.25633 4.74121 3.41602C4.54336 3.7398 4.43854 4.15601 4.21289 5.59766C4.1535 5.97589 4.09499 6.33239 4.04883 6.60156C4.02575 6.7361 4.00531 6.84952 3.98926 6.93262C3.9813 6.97379 3.97465 7.00813 3.96875 7.03418C3.96347 7.05748 3.95749 7.08149 3.95117 7.0957H3.94922C3.94204 7.11192 3.93225 7.12446 3.92676 7.12988C3.91808 7.13842 3.90696 7.14745 3.89551 7.15625C3.87242 7.174 3.84069 7.19539 3.80273 7.21973C3.72644 7.26862 3.61944 7.33206 3.49023 7.40527C3.36076 7.47864 3.20849 7.56273 3.04102 7.65234L2.50195 7.93457C1.30695 8.54146 1.07181 8.68721 0.749023 9.00391C0.329463 9.42377 0.12389 9.85909 0.0751953 10.4678V10.4688C0.0273584 11.002 0.153982 11.3661 0.943359 12.9072L1.64355 14.2695L1.65918 14.2998L1.64355 14.3301L0.943359 15.6865C0.154048 17.2338 0.0273567 17.5975 0.0751953 18.1309V18.1318C0.123909 18.7408 0.330112 19.1757 0.75 19.5957C0.992092 19.8332 1.18412 19.9751 1.76953 20.2871L2.50195 20.665C2.88061 20.8591 3.23139 21.0477 3.49023 21.1943C3.61944 21.2676 3.72644 21.331 3.80273 21.3799C3.84069 21.4042 3.87242 21.4256 3.89551 21.4434C3.90696 21.4522 3.91808 21.4612 3.92676 21.4697C3.93235 21.4752 3.94207 21.4882 3.94922 21.5049L3.95117 21.5039C3.95749 21.5181 3.96347 21.5421 3.96875 21.5654C3.97465 21.5915 3.9813 21.6258 3.98926 21.667C4.00531 21.7501 4.02575 21.8635 4.04883 21.998C4.09499 22.2672 4.1535 22.6237 4.21289 23.002C4.43854 24.4436 4.54336 24.8598 4.74121 25.1836C4.83879 25.3433 5.02784 25.5407 5.24023 25.7168C5.45267 25.8929 5.68025 26.0415 5.85156 26.1064C6.14648 26.217 6.34738 26.2686 6.66113 26.2656C6.98023 26.2626 7.41598 26.2029 8.17969 26.084C8.57061 26.0214 8.94775 25.9655 9.24121 25.9248C9.38773 25.9045 9.51378 25.8874 9.61035 25.876C9.7051 25.8648 9.77669 25.8584 9.80957 25.8584C9.92501 25.8585 10.0265 25.9068 10.2188 26.0684C10.4119 26.2306 10.7101 26.5191 11.2188 27.0215C11.9459 27.7393 12.3378 28.1097 12.668 28.3037C12.9906 28.4933 13.2545 28.5146 13.7402 28.5146ZM13.7402 26.6787C13.7122 26.6787 13.684 26.669 13.6592 26.6572C13.6331 26.6448 13.6038 26.6269 13.5713 26.6045C13.5061 26.5596 13.4222 26.4923 13.3174 26.4004C13.1072 26.2162 12.8065 25.9282 12.3877 25.5156C11.9543 25.0884 11.6265 24.7697 11.3389 24.5361C11.0522 24.3034 10.8083 24.1585 10.543 24.0771C10.2772 23.9957 9.984 23.976 9.59766 24.0029C9.21059 24.03 8.73396 24.103 8.10059 24.2031H8.10156C7.45597 24.3092 7.09329 24.3645 6.87598 24.3828C6.76747 24.3919 6.69049 24.3924 6.63086 24.3838C6.56853 24.3748 6.52593 24.3556 6.48633 24.3311L6.48438 24.3301C6.44741 24.3055 6.40302 24.2812 6.36719 24.2314C6.33213 24.1827 6.30652 24.1134 6.2793 24.001C6.22458 23.775 6.15512 23.3365 6.01172 22.4355C5.83277 21.3116 5.72505 20.7445 5.40527 20.3184C5.24601 20.1063 5.03152 19.9259 4.72168 19.7305C4.56622 19.6324 4.3873 19.5308 4.18066 19.4199L3.47266 19.0527C2.94786 18.7872 2.59318 18.6004 2.3623 18.4648C2.24695 18.3971 2.1602 18.3414 2.09863 18.2939C2.03913 18.2481 1.99485 18.204 1.97363 18.1592V18.1582C1.92974 18.0614 1.94268 17.9619 2.0332 17.7402C2.12496 17.5156 2.30642 17.1444 2.63086 16.4893V16.4883C2.90927 15.933 3.11615 15.5201 3.25391 15.1768C3.39133 14.8342 3.45801 14.5653 3.45801 14.2998C3.45801 14.0343 3.39133 13.7654 3.25391 13.4229C3.11615 13.0795 2.90927 12.6666 2.63086 12.1113V12.1104C2.30642 11.4552 2.12496 11.084 2.0332 10.8594C1.94268 10.6377 1.92974 10.5382 1.97363 10.4414V10.4404C1.99485 10.3956 2.03913 10.3515 2.09863 10.3057C2.1602 10.2582 2.24695 10.2025 2.3623 10.1348C2.4778 10.067 2.62435 9.98652 2.80762 9.88965L3.47266 9.54688C4.00762 9.2747 4.41098 9.06506 4.72168 8.86914C5.03152 8.67373 5.24601 8.49335 5.40527 8.28125C5.72505 7.85513 5.83277 7.28799 6.01172 6.16406C6.15512 5.26315 6.22458 4.82463 6.2793 4.59863C6.30652 4.48625 6.33213 4.41689 6.36719 4.36816C6.40302 4.31838 6.44741 4.29415 6.48438 4.26953L6.48633 4.26855C6.52593 4.24404 6.56853 4.22481 6.63086 4.21582C6.69049 4.20725 6.76747 4.20769 6.87598 4.2168C7.09325 4.23506 7.45525 4.29146 8.10059 4.39746C8.73233 4.49754 9.20859 4.56916 9.5957 4.5957C9.9821 4.62216 10.2758 4.60235 10.542 4.52051C11.0767 4.35607 11.5173 3.93812 12.3809 3.08398C12.8027 2.66841 13.1029 2.3807 13.3115 2.19727C13.4155 2.10583 13.4984 2.03868 13.5635 1.99414C13.5961 1.97186 13.6257 1.95371 13.6523 1.94141C13.6779 1.92959 13.7063 1.9209 13.7344 1.9209C13.7617 1.92095 13.7891 1.92902 13.8145 1.94043C13.8406 1.95221 13.8695 1.96972 13.9014 1.99121C13.9653 2.03437 14.047 2.10005 14.1504 2.19043C14.3574 2.37145 14.6587 2.65834 15.0928 3.08301H15.0938C15.9636 3.93715 16.4068 4.35596 16.9424 4.52051C17.2089 4.60234 17.5021 4.62214 17.8877 4.5957C18.0808 4.58245 18.2963 4.55736 18.542 4.52344L19.3799 4.39648C20.0256 4.29042 20.3882 4.23503 20.6055 4.2168C20.7136 4.20773 20.7901 4.2073 20.8496 4.21582C20.9119 4.22481 20.9545 4.24404 20.9941 4.26855L20.9961 4.26953C21.0331 4.29417 21.0774 4.31838 21.1133 4.36816C21.1483 4.41688 21.174 4.48628 21.2012 4.59863C21.2559 4.82463 21.3254 5.26317 21.4688 6.16406C21.6477 7.2883 21.7562 7.85509 22.0762 8.28125C22.2355 8.49343 22.4497 8.67364 22.7598 8.86914C23.0704 9.06502 23.473 9.27477 24.0078 9.54688C24.5326 9.81238 24.8873 9.99923 25.1182 10.1348C25.2335 10.2025 25.3203 10.2582 25.3818 10.3057C25.4414 10.3516 25.4856 10.3956 25.5068 10.4404V10.4414C25.5507 10.5382 25.5378 10.6389 25.4473 10.8613C25.3555 11.0869 25.1741 11.4583 24.8496 12.1104V12.1113C24.5712 12.6666 24.3643 13.0795 24.2266 13.4229C24.0891 13.7654 24.0225 14.0343 24.0225 14.2998C24.0225 14.5653 24.0891 14.8342 24.2266 15.1768C24.3643 15.5201 24.5712 15.933 24.8496 16.4883V16.4893C25.1741 17.1413 25.3555 17.5128 25.4473 17.7383C25.5378 17.9607 25.5507 18.0615 25.5068 18.1582V18.1592L25.459 18.2266C25.4378 18.2488 25.4116 18.271 25.3818 18.2939C25.3203 18.3414 25.2335 18.3971 25.1182 18.4648C24.8873 18.6004 24.5326 18.7872 24.0078 19.0527C23.473 19.3248 23.0704 19.5346 22.7598 19.7305C22.4497 19.926 22.2355 20.1062 22.0762 20.3184C21.7562 20.7445 21.6477 21.3113 21.4688 22.4355C21.3254 23.3364 21.2559 23.775 21.2012 24.001C21.174 24.1133 21.1483 24.1827 21.1133 24.2314C21.0953 24.2564 21.0749 24.2746 21.0547 24.29L20.9961 24.3301L20.9941 24.3311L20.9307 24.3633C20.9074 24.3721 20.8808 24.3793 20.8496 24.3838C20.7901 24.3923 20.7136 24.3919 20.6055 24.3828C20.4969 24.3737 20.3517 24.3555 20.1533 24.3262L19.3799 24.2031C18.7479 24.103 18.2716 24.0299 17.8848 24.0029C17.499 23.976 17.2065 23.9957 16.9404 24.0771C16.4057 24.2408 15.9635 24.6584 15.0938 25.5156C14.675 25.9282 14.3733 26.2162 14.1631 26.4004C14.0583 26.4922 13.9743 26.5596 13.9092 26.6045C13.8767 26.6269 13.8474 26.6448 13.8213 26.6572C13.7964 26.6691 13.7683 26.6787 13.7402 26.6787Z" fill="#818182" stroke="#818182" strokeWidth="0.133333" />
          <path d="M9.28309 10.0274C9.12836 10.082 9 10.2666 9 10.4372C9 10.4724 9.01231 10.541 9.02813 10.5885C9.05451 10.6676 9.21451 10.833 10.9675 12.5882L12.877 14.5L10.9746 16.4048C9.93014 17.4512 9.05978 18.3341 9.04396 18.3675C8.96483 18.5258 9.00176 18.7422 9.13187 18.8705C9.25319 18.9937 9.41847 19.0306 9.59079 18.9743C9.66991 18.9479 9.83519 18.7879 11.5882 17.0344L13.5012 15.1244L15.4143 17.0344C17.1673 18.7879 17.3325 18.9479 17.4117 18.9743C17.584 19.0306 17.7493 18.9937 17.8706 18.8705C17.9937 18.7492 18.0306 18.5839 17.9743 18.4115C17.948 18.3324 17.7879 18.167 16.0349 16.4118L14.1254 14.5L16.0349 12.5865C17.7879 10.833 17.948 10.6676 17.9743 10.5885C18.0306 10.4161 17.9937 10.2508 17.8706 10.1295C17.7493 10.0063 17.584 9.9694 17.4117 10.0257C17.3325 10.0521 17.1673 10.2121 15.4125 11.9656L13.5012 13.8756L11.5882 11.9656C9.83519 10.2121 9.66991 10.0521 9.59079 10.0257C9.48353 9.99051 9.38507 9.99227 9.28309 10.0274Z" fill="#818182" stroke="#818182" />
        </svg>



      ) : (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.14375 4.08125C1.2 6.025 1 6.2375 1 6.425C1 6.5625 1.05 6.68125 1.15625 6.78125C1.3 6.93125 1.3375 6.9375 2.15625 6.9375H3V11.2812V15.6312L3.15625 15.7812L3.30625 15.9375H5.5H7.69375L7.84375 15.7812L8 15.6312V11.2812V6.9375H8.84375C9.6625 6.9375 9.7 6.93125 9.84375 6.78125C9.95 6.68125 10 6.5625 10 6.425C10 6.2375 9.8 6.025 7.85625 4.08125C5.86875 2.0875 5.7 1.9375 5.5 1.9375C5.3 1.9375 5.13125 2.0875 3.14375 4.08125ZM6.90625 4.5625L8.28125 5.9375H7.79375C7.3625 5.9375 7.2875 5.95625 7.15625 6.09375L7 6.24375V10.5938V14.9375H5.5H4V10.5938V6.24375L3.84375 6.09375C3.7125 5.95625 3.6375 5.9375 3.20625 5.9375H2.71875L4.09375 4.5625C4.85 3.80625 5.48125 3.1875 5.5 3.1875C5.51875 3.1875 6.15 3.80625 6.90625 4.5625Z" fill="#45B36A" stroke="#45B36A" strokeWidth="0.3" />
          <path d="M27.7813 5.99971L25.2813 8.49971H23.2813H21.2813L17.5313 12.2497L13.7813 15.9997H11.5438H9.3L8.91875 16.3622C8.70625 16.5622 6.94375 18.2122 5 20.0247C3.05625 21.8435 1.3625 23.4372 1.2375 23.5685C0.950002 23.8622 0.925002 24.1185 1.15625 24.3435C1.4125 24.606 1.6375 24.556 2.08125 24.1372C2.29375 23.931 4.09375 22.2435 6.08125 20.3872L9.69375 16.9997H11.9563H14.2188L17.9688 13.2497L21.7188 9.49971H23.7188H25.7188L28.3563 6.85596C30.7688 4.44971 31 4.19971 31 4.01221C31 3.73721 30.7625 3.49971 30.4875 3.49971C30.3063 3.49971 30.0563 3.73096 27.7813 5.99971Z" fill="#45B36A" stroke="#45B36A" strokeWidth="0.3" />
          <path d="M27.1562 10.1562L27 10.3062V20V29.6937L27.1562 29.8438L27.3063 30H29H30.6938L30.8438 29.8438L31 29.6937V20V10.3062L30.8438 10.1562L30.6938 10H29H27.3063L27.1562 10.1562ZM30 20V29H29H28V20V11H29H30V20Z" fill="#45B36A" stroke="#45B36A" strokeWidth="0.3" />
          <path d="M22.1562 14.1562L22 14.3062V22V29.6937L22.1562 29.8438L22.3063 30H24H25.6938L25.8438 29.8438L26 29.6937V22V14.3062L25.8438 14.1562L25.6938 14H24H22.3063L22.1562 14.1562ZM25 22V29H24H23V22V15H24H25V22Z" fill="#45B36A" stroke="#45B36A" strokeWidth="0.3" />
          <path d="M17.1562 17.6562L17 17.8062V23.75V29.6937L17.1562 29.8437L17.3063 30H19H20.6938L20.8438 29.8437L21 29.6937V23.75V17.8062L20.8438 17.6562L20.6938 17.5H19H17.3063L17.1562 17.6562ZM20 23.75V29H19H18V23.75V18.5H19H20V23.75Z" fill="#45B36A" stroke="#45B36A" strokeWidth="0.3" />
          <path d="M12.1562 21.6562L12 21.8062V25.75V29.6937L12.1562 29.8438L12.3063 30H14H15.6938L15.8438 29.8438L16 29.6937V25.75V21.8062L15.8438 21.6562L15.6938 21.5H14H12.3063L12.1562 21.6562ZM15 25.75V29H14H13V25.75V22.5H14H15V25.75Z" fill="#45B36A" stroke="#45B36A" strokeWidth="0.3" />
          <path d="M7.15625 23.6562L7 23.8063V26.75V29.6937L7.15625 29.8438L7.30625 30H9H10.6938L10.8438 29.8438L11 29.6937V26.75V23.8063L10.8438 23.6562L10.6938 23.5H9H7.30625L7.15625 23.6562ZM10 26.75V29H9H8V26.75V24.5H9H10V26.75Z" fill="#45B36A" stroke="#45B36A" strokeWidth="0.3" />
          <path d="M2.15625 26.1562L2 26.3062V28V29.6937L2.15625 29.8438L2.30625 30H4H5.69375L5.84375 29.8438L6 29.6937V28V26.3062L5.84375 26.1562L5.69375 26H4H2.30625L2.15625 26.1562ZM5 28V29H4H3V28V27H4H5V28Z" fill="#45B36A" stroke="#45B36A" strokeWidth="0.3" />
        </svg>

      )}
    </span>
  );
}

function WinRatioBarChart({ data }) {
  const [tooltip, setTooltip] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '32px 18px', textAlign: 'center', color: '#98a2b3', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
        No data available
      </div>
    );
  }

  const W = 600;
  const H = 220;
  const PL = 44;
  const PR = 16;
  const PT = 16;
  const PB = 52;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  const maxVal = Math.max(2, ...data.map((d) => Math.max(d.won, d.lost)));
  const yMax = Math.ceil(maxVal / 2) * 2 + 2;
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((yMax / tickCount) * i));

  const groupW = innerW / data.length;
  const bw = Math.min(22, groupW * 0.32);

  const yScale = (v) => PT + innerH - (v / yMax) * innerH;
  const hScale = (v) => (v / yMax) * innerH;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        {/* Y-axis label */}
        <text
          x={12}
          y={PT + innerH / 2}
          textAnchor="middle"
          fill="#667085"
          fontSize={11}
          fontFamily="Inter, sans-serif"
          transform={`rotate(-90, 12, ${PT + innerH / 2})`}
        >
          Values
        </text>

        {/* Grid lines + Y axis ticks */}
        {ticks.map((tick) => {
          const y = yScale(tick);
          return (
            <g key={tick}>
              <line x1={PL} x2={PL + innerW} y1={y} y2={y} stroke="#e7edf6" strokeWidth={1} />
              <text x={PL - 6} y={y + 4} textAnchor="end" fill="#98a2b3" fontSize={10} fontFamily="Inter, sans-serif">
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars + X labels */}
        {data.map((d, i) => {
          const cx = PL + i * groupW + groupW / 2;
          const wonX = cx - bw - 2;
          const lostX = cx + 2;
          const wonH = Math.max(1, hScale(d.won));
          const lostH = Math.max(1, hScale(d.lost));
          return (
            <g key={d.name}>
              <rect
                x={wonX}
                y={yScale(d.won)}
                width={bw}
                height={wonH}
                fill="#45B36A"
                rx={3}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setTooltip({ name: d.name, won: d.won, cx })}
                onMouseLeave={() => setTooltip(null)}
              />
              <rect
                x={lostX}
                y={yScale(d.lost)}
                width={bw}
                height={lostH}
                fill="#FF5C5C"
                rx={3}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setTooltip({ name: d.name, won: d.won, cx })}
                onMouseLeave={() => setTooltip(null)}
              />
              <text
                x={cx}
                y={PT + innerH + 18}
                textAnchor="middle"
                fill="#667085"
                fontSize={10}
                fontFamily="Inter, sans-serif"
              >
                {d.name.length > 12 ? `${d.name.slice(0, 11)}…` : d.name}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const tx = Math.min(Math.max(tooltip.cx, 60), W - 60);
          const ty = yScale(tooltip.won) - 10;
          return (
            <g>
              <rect x={tx - 54} y={ty - 40} width={108} height={36} rx={6} fill="#1a2236" />
              <text x={tx} y={ty - 24} textAnchor="middle" fill="#ffffff" fontSize={10} fontFamily="Inter, sans-serif" fontWeight="600">
                {tooltip.name.length > 14 ? `${tooltip.name.slice(0, 13)}…` : tooltip.name}
              </text>
              <text x={tx} y={ty - 8} textAnchor="middle" fill="#45B36A" fontSize={10} fontFamily="Inter, sans-serif">
                ● Won - {tooltip.won}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function ReportsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Company & Bids');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [companyMetricView, setCompanyMetricView] = useState('number');
  const [bids, setBids] = useState([]);
  const [clients, setClients] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [employeeSummary, setEmployeeSummary] = useState(null);
  const [employeeReportRows, setEmployeeReportRows] = useState([]);
  const [employeeReportPage, setEmployeeReportPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [employeePagination, setEmployeePagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0, perPage: 5 });
  const [noResponseClients, setNoResponseClients] = useState([]);
  const [estimateLedger, setEstimateLedger] = useState([]);
  const [isBaseLoading, setIsBaseLoading] = useState(true);
  const [isEmployeeReportLoading, setIsEmployeeReportLoading] = useState(true);
  const [isReportFeedsLoading, setIsReportFeedsLoading] = useState(true);
  const [toast, setToast] = useState(emptyToast);
  const [viewBid, setViewBid] = useState(null);
  const [bidFilesById, setBidFilesById] = useState({});

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const bidId = searchParams.get('bid');

    if (!bidId) {
      setViewBid(null);
    } else if (!viewBid || String(viewBid.id) !== String(bidId)) {
      setIsBaseLoading(true);
      getBid(bidId)
        .then((data) => {
          if (data && data.success !== false) {
            const detailedBid = data.bid || data.data?.bid || data.data || { id: bidId };
            setViewBid(detailedBid);
          }
        })
        .catch(() => {
          setViewBid({ id: bidId });
        })
        .finally(() => {
          setIsBaseLoading(false);
        });
    }
  }, [location.search]);

  const showError = useCallback((message) => {
    setToast({ isOpen: true, message, isSuccess: false });
  }, []);

  const handleBidClick = useCallback(async (bidId) => {
    if (!bidId) return;
    setIsBaseLoading(true);
    try {
      const data = await getBid(bidId);
      if (data?.success === false) {
        throw new Error(data?.message || 'Failed to fetch bid details');
      }
      const detailedBid = data?.bid || data?.data?.bid || data?.data || { id: bidId };
      setViewBid(detailedBid);
      navigate(`${location.pathname}?bid=${bidId}`);
    } catch (error) {
      showError(error.message || 'Failed to load bid details');
    } finally {
      setIsBaseLoading(false);
    }
  }, [showError, navigate, location.pathname]);

  const handlePdfDownloadClick = useCallback(async (event, row) => {
    event.stopPropagation();
    if (!row.bidId) return;
    try {
      setToast({ isOpen: true, message: 'Downloading estimate PDF...', isSuccess: true });
      const response = await downloadEstimatePdf(row.bidId);
      if (response && response.blob) {
        const fileName = row.projectName
          ? `${row.projectName.replace(/\s+/g, '_')}_estimate.pdf`
          : `${row.bidId}_estimate.pdf`;
        triggerBlobDownload(response.blob, fileName);
        setToast({ isOpen: true, message: 'Estimate PDF downloaded successfully', isSuccess: true });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      showError(error.message || 'Failed to download estimate PDF');
    }
  }, [showError]);

  const loadBaseData = useCallback(async () => {
    setIsBaseLoading(true);

    const [bidResult, clientResult] = await Promise.allSettled([
      fetchAllPages((page) => getBids(page, '', '', '', '', 'crm'), extractBids),
      fetchAllPages((page) => getAllClients(page, 100, '', ''), extractClients),
    ]);

    if (bidResult.status === 'fulfilled') {
      setBids(dedupeById(bidResult.value.map(normalizeBid), (bid) => bid.id));
    } else {
      setBids([]);
      showError(bidResult.reason?.message || 'Failed to load bids for reports');
    }

    if (clientResult.status === 'fulfilled') {
      setClients(dedupeById(clientResult.value.map(normalizeClient), (client, index) => client.id ?? `${client.companyName}-${index}`));
    } else {
      setClients([]);
      showError(clientResult.reason?.message || 'Failed to load customers for reports');
    }

    setIsBaseLoading(false);
  }, [showError]);

  const loadEmployeeReport = useCallback(async (filter, page) => {
    setIsEmployeeReportLoading(true);

    try {
      const response = await getReportingEmployees(page, filter);
      const summary = response?.data?.summary || response?.summary || response?.data?.data?.summary || null;
      const pagination = extractPagination(response);

      setEmployeeSummary(summary);
      setEmployeeReportRows(extractReportingEmployees(response).map(normalizeEmployeeReportRow));
      setEmployeePagination({
        currentPage: pagination?.currentPage || page,
        totalPages: pagination?.totalPages || 1,
        totalRecords: pagination?.totalRecords || 0,
        perPage: pagination?.perPage || 5,
      });
    } catch (error) {
      setEmployeeSummary(null);
      setEmployeeReportRows([]);
      setEmployeePagination({ currentPage: page, totalPages: 1, totalRecords: 0, perPage: 5 });
      showError(error.message || 'Failed to load employee report');
    } finally {
      setIsEmployeeReportLoading(false);
    }
  }, [showError]);

  const loadReportFeeds = useCallback(async (filter) => {
    setIsReportFeedsLoading(true);

    const [dashboardResult, noResponseResult, ledgerResult] = await Promise.allSettled([
      getReportingDashboard(filter),
      getReportingNoResponseClients(filter, 50),
      getReportingEstimateLedger(1, 100, '', filter),
    ]);

    if (dashboardResult.status === 'fulfilled') {
      setDashboard(extractDashboard(dashboardResult.value));
    } else {
      setDashboard(null);
      showError(dashboardResult.reason?.message || 'Failed to load company report summary');
    }

    if (noResponseResult.status === 'fulfilled') {
      setNoResponseClients(extractNoResponseClients(noResponseResult.value));
    } else {
      setNoResponseClients([]);
      showError(noResponseResult.reason?.message || 'Failed to load customer report summary');
    }

    if (ledgerResult.status === 'fulfilled') {
      setEstimateLedger(extractLedgerRows(ledgerResult.value));
    } else {
      setEstimateLedger([]);
      showError(ledgerResult.reason?.message || 'Failed to load estimate ledger');
    }

    setIsReportFeedsLoading(false);
  }, [showError]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    loadEmployeeReport(selectedDateFilter, employeeReportPage);
  }, [employeeReportPage, loadEmployeeReport, selectedDateFilter]);

  useEffect(() => {
    loadReportFeeds(selectedDateFilter);
  }, [loadReportFeeds, selectedDateFilter]);

  const filteredBids = useMemo(() => (
    bids.filter((bid) => matchesDateFilter(bid.createdAt || bid.updatedAt, selectedDateFilter))
  ), [bids, selectedDateFilter]);

  const employeeCards = useMemo(() => {
    return {
      currentBiddingValue: toNumber(employeeSummary?.current_bidding_value),
      biddingDelta: toNumber(employeeSummary?.bidding_delta),
      revenuePerEmployee: toNumber(employeeSummary?.revenue_per_employee),
      revenueDelta: toNumber(employeeSummary?.revenue_delta),
      currentlyHired: toNumber(employeeSummary?.currently_hired),
      lifetimeEmployees: toNumber(employeeSummary?.lifetime_employees),
    };
  }, [employeeSummary]);

  const companySummary = useMemo(() => {
    const fallbackWonCount = filteredBids.filter((bid) => String(bid.status || '').toLowerCase() === 'won').length;
    const fallbackLostCount = filteredBids.filter((bid) => String(bid.status || '').toLowerCase() === 'lost').length;
    const fallbackSentCount = filteredBids.filter((bid) => (
      ['senttoclient', 'sent to client', 'approved', 'won', 'lost'].includes(String(bid.status || '').toLowerCase())
    )).length;
    const totalBidValue = filteredBids.reduce((sum, bid) => sum + bid.bidValue, 0);
    const averageWonValue = toNumber(dashboard?.metrics?.average_won_bid_value);

    return {
      totalBids: toNumber(dashboard?.metrics?.total_bids) || filteredBids.length,
      bidsSent: toNumber(dashboard?.cards?.bids_sent?.count) || fallbackSentCount,
      bidsSentValue: toNumber(dashboard?.cards?.bids_sent?.value) || totalBidValue,
      jobsWon: toNumber(dashboard?.metrics?.jobs_won) || fallbackWonCount,
      jobsWonValue: toNumber(dashboard?.cards?.bids_won?.value) || 0,
      jobsLost: toNumber(dashboard?.metrics?.jobs_lost) || fallbackLostCount,
      jobsLostValue: toNumber(dashboard?.metrics?.jobs_lost_value) || 0,
      approvedBids: toNumber(dashboard?.cards?.approved_bids),
      deniedBids: toNumber(dashboard?.cards?.denied_bids),
      noResponseCount: toNumber(dashboard?.cards?.no_response?.count),
      noResponseValue: toNumber(dashboard?.cards?.no_response?.value),
      conversionRate: toNumber(dashboard?.metrics?.conversion_rate),
      conversionRateValue: toNumber(dashboard?.metrics?.conversion_rate_value),
      averageBidValue: toNumber(dashboard?.metrics?.average_bid_value) || (filteredBids.length > 0 ? totalBidValue / filteredBids.length : 0),
      averageWonBidValue: averageWonValue || 0
    };
  }, [dashboard, filteredBids]);

  const recentBidRows = useMemo(() => (
    [...filteredBids]
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
      .slice(0, 10)
  ), [filteredBids]);

  const customerSummary = useMemo(() => {
    const totalClientEmployees = clients.reduce((sum, client) => sum + client.employeeCount, 0);
    const uniqueNoResponseClients = new Set(
      noResponseClients.map((client) => client.client_id || client.id || client.company_name)
    );

    return {
      totalCompanies: clients.length,
      noResponseCompanies: uniqueNoResponseClients.size,
      totalClientEmployees,
      linkedBids: filteredBids.length,
    };
  }, [clients, filteredBids.length, noResponseClients]);

  const customerRows = useMemo(() => (
    noResponseClients.map((client, index) => ({
      id: client.client_id || client.id || `${client.company_name}-${index}`,
      bidId: client.bid_id || client.id,
      companyName: client.company_name || 'Customer',
      employeeName: client.employee_name || '-',
      email: client.email || '-',
      phone: client.phone || '-',
      projectName: client.project_name || '-',
      bidValue: toNumber(client.grand_total ?? client.bid_value),
    }))
  ), [noResponseClients]);

  const customerRevenueMetrics = useMemo(() => {
    const totalRevenue = filteredBids.reduce((sum, bid) => sum + bid.bidValue, 0);

    const previousBids = selectedDateFilter !== 'all'
      ? bids.filter((bid) => matchesPreviousDateFilter(bid.createdAt || bid.updatedAt, selectedDateFilter))
      : [];
    const prevRevenue = previousBids.reduce((sum, bid) => sum + bid.bidValue, 0);
    const revenueDelta = selectedDateFilter !== 'all' ? totalRevenue - prevRevenue : null;

    const avgValue = filteredBids.length > 0 ? totalRevenue / filteredBids.length : 0;
    const prevAvgValue = previousBids.length > 0 ? prevRevenue / previousBids.length : 0;
    const avgDelta = selectedDateFilter !== 'all' ? avgValue - prevAvgValue : null;

    const wonClientNames = new Set(
      filteredBids
        .filter((bid) => String(bid.status || '').toLowerCase() === 'won')
        .map((bid) => bid.clientNames)
    );
    const convertedCustomers = wonClientNames.size;
    const totalCustomers = clients.length;

    return { totalRevenue, revenueDelta, avgValue, avgDelta, convertedCustomers, totalCustomers };
  }, [bids, filteredBids, selectedDateFilter, clients]);

  const customerLeaderboard = useMemo(() => {
    const clientMap = new Map();

    filteredBids.forEach((bid) => {
      const clientName = bid.clientNames || 'Unknown';
      if (!clientMap.has(clientName)) {
        clientMap.set(clientName, { name: clientName, totalValue: 0, wonBids: 0, totalBids: 0 });
      }
      const entry = clientMap.get(clientName);
      entry.totalValue += bid.bidValue;
      entry.totalBids += 1;
      if (String(bid.status || '').toLowerCase() === 'won') entry.wonBids += 1;
    });

    return Array.from(clientMap.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)
      .map((entry) => ({
        ...entry,
        winRatio: entry.totalBids > 0 ? Math.round((entry.wonBids / entry.totalBids) * 100) : 0,
      }));
  }, [filteredBids]);

  const customerChartData = useMemo(() => {
    const clientMap = new Map();

    filteredBids.forEach((bid) => {
      const clientName = bid.clientNames || 'Unknown';
      if (!clientMap.has(clientName)) {
        clientMap.set(clientName, { name: clientName, won: 0, lost: 0, total: 0 });
      }
      const entry = clientMap.get(clientName);
      const status = String(bid.status || '').toLowerCase();
      entry.total += 1;
      if (status === 'won') entry.won += 1;
      else if (status === 'lost') entry.lost += 1;
    });

    return Array.from(clientMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredBids]);

  const customerTableRows = useMemo(() => {
    const clientMap = new Map();

    filteredBids.forEach((bid) => {
      const clientName = bid.clientNames || 'Unknown';
      const status = String(bid.status || '').toLowerCase();

      if (!clientMap.has(clientName)) {
        clientMap.set(clientName, {
          clientName,
          totalBids: 0,
          wonBids: 0,
          lostBids: 0,
          openBids: 0,
          totalValue: 0,
        });
      }

      const entry = clientMap.get(clientName);
      entry.totalBids += 1;
      entry.totalValue += bid.bidValue;

      if (status === 'won') entry.wonBids += 1;
      else if (status === 'lost') entry.lostBids += 1;
      else entry.openBids += 1;
    });

    return Array.from(clientMap.values())
      .map((entry) => ({
        ...entry,
        wonRatio: entry.totalBids > 0 ? (entry.wonBids / entry.totalBids) : 0,
        avgValuePerBid: entry.totalBids > 0 ? entry.totalValue / entry.totalBids : 0,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredBids]);

  const ledgerRows = useMemo(() => (
    estimateLedger
      .filter((row) => String(row.status || '').toLowerCase() === 'won')
      .sort((a, b) => new Date(b.due_date || b.dueDate || 0) - new Date(a.due_date || a.dueDate || 0))
      .map((row, index) => ({
        id: row.invoice_id || row.id || `${row.bid_id}-${index}`,
        bidId: row.bid_id || row.id,
        projectName: row.project_name || '-',
        bidProjectId: row.bid_project_id || '',
        clients: row.clients || '-',
        bidValue: toNumber(row.grand_total ?? row.bid_value),
        grandTotal: toNumber(row.grand_total || row.sub_total),
        status: row.status || '-',
        updatedAt: row.updated_at || row.created_at,
        dueDate: row.due_date || row.dueDate || '',
      }))
  ), [estimateLedger]);

  const ledgerSummary = useMemo(() => {
    const totalLedgerValue = ledgerRows.reduce((sum, row) => sum + row.grandTotal, 0);
    const wonLedgerValue = ledgerRows
      .filter((row) => String(row.status || '').toLowerCase() === 'won')
      .reduce((sum, row) => sum + row.grandTotal, 0);
    const pendingEstimates = ledgerRows.filter((row) => !['won', 'lost'].includes(String(row.status || '').toLowerCase())).length;

    return {
      totalEstimates: ledgerRows.length,
      totalLedgerValue,
      averageEstimateValue: ledgerRows.length > 0 ? totalLedgerValue / ledgerRows.length : 0,
      pendingEstimates,
      wonLedgerValue,
    };
  }, [ledgerRows]);

  const estimateLedgerMetrics = useMemo(() => {
    const currentBids = bids.filter((bid) => matchesDateFilter(bid.createdAt || bid.updatedAt, selectedDateFilter));
    const previousBids = selectedDateFilter !== 'all'
      ? bids.filter((bid) => matchesPreviousDateFilter(bid.createdAt || bid.updatedAt, selectedDateFilter))
      : [];

    const currentWon = currentBids.filter((bid) => String(bid.status || '').toLowerCase() === 'won');
    const currentLost = currentBids.filter((bid) => String(bid.status || '').toLowerCase() === 'lost');

    const wonCount = currentWon.length;
    const lostCount = currentLost.length;

    const wonValue = currentWon.reduce((sum, bid) => sum + bid.bidValue, 0);
    const lostValue = currentLost.reduce((sum, bid) => sum + bid.bidValue, 0);

    const previousWon = previousBids.filter((bid) => String(bid.status || '').toLowerCase() === 'won');
    const previousLost = previousBids.filter((bid) => String(bid.status || '').toLowerCase() === 'lost');

    const prevWonValue = previousWon.reduce((sum, bid) => sum + bid.bidValue, 0);
    const prevLostValue = previousLost.reduce((sum, bid) => sum + bid.bidValue, 0);

    const wonValueDelta = selectedDateFilter !== 'all' ? wonValue - prevWonValue : null;
    const lostValueDelta = selectedDateFilter !== 'all' ? lostValue - prevLostValue : null;

    return {
      wonValue,
      wonValueDelta,
      lostValue,
      lostValueDelta,
      wonCount,
      lostCount,
    };
  }, [bids, selectedDateFilter]);

  const employeePageNumbers = useMemo(() => (
    Array.from({ length: Math.max(1, employeePagination.totalPages || 1) }, (_, index) => index + 1)
  ), [employeePagination.totalPages]);

  const employeeFirstItemNumber = employeePagination.totalRecords > 0
    ? ((employeePagination.currentPage || 1) - 1) * (employeePagination.perPage || 5) + 1
    : 0;

  const employeeLastItemNumber = Math.min(
    (employeePagination.currentPage || 1) * (employeePagination.perPage || 5),
    employeePagination.totalRecords || 0
  );

  const handleEmployeePageChange = useCallback((page) => {
    const totalPages = Math.max(1, employeePagination.totalPages || 1);
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setEmployeeReportPage(nextPage);
  }, [employeePagination.totalPages]);

  const renderMetricCard = (label, value, subValue, iconTone, iconType, isNegative = false) => (
    <div className={styles.metricCard}>
      <div className={styles.metricCopy}>
        <span className={styles.metricLabel}>{label}</span>
        <strong className={styles.metricValue}>{value}</strong>
        {subValue ? (
          <span className={`${styles.metricDelta} ${isNegative ? styles.metricDeltaNegative : styles.metricDeltaPositive}`}>
            {subValue}
          </span>
        ) : null}
      </div>
      <StatIcon tone={iconTone} type={iconType} />
    </div>
  );

  const renderCompanyInsightCard = (label, value, subValue) => (
    <div className={styles.companyInsightCard}>
      <span className={styles.companyInsightLabel}>{label}</span>
      <strong className={styles.companyInsightValue}>{value}</strong>
      {subValue ? <span className={styles.companyInsightMeta}>{subValue}</span> : null}
    </div>
  );

  const renderLoadingRow = (message, colSpan) => (
    <tr>
      <td className={styles.emptyState} colSpan={colSpan}>{message}</td>
    </tr>
  );

  const renderEmptyRow = (message, colSpan) => (
    <tr>
      <td className={styles.emptyState} colSpan={colSpan}>{message}</td>
    </tr>
  );

  const companyPerformanceRows = useMemo(() => {
    const numberView = companyMetricView === 'number';

    return {
      primary: [
        {
          label: 'Total Bids Sent',
          value: numberView ? formatWholeNumber(companySummary.totalBids) : formatCurrency(companySummary.bidsSentValue),
          subValue: numberView
            ? `Value: ${formatCurrency(companySummary.bidsSentValue)}`
            : `${formatWholeNumber(companySummary.totalBids)} bids sent`,
        },
        {
          label: 'Jobs Won',
          value: numberView ? formatWholeNumber(companySummary.jobsWon) : formatCurrency(companySummary.jobsWonValue),
          subValue: numberView
            ? `Won Value: ${formatCurrency(companySummary.jobsWonValue)}`
            : `${formatWholeNumber(companySummary.jobsWon)} jobs won`,
        },
        {
          label: 'Jobs Lost',
          value: numberView ? formatWholeNumber(companySummary.jobsLost) : formatCurrency(companySummary.jobsLostValue),
          subValue: numberView
            ? `Lost Value: ${formatCurrency(companySummary.jobsLostValue)}`
            : `${formatWholeNumber(companySummary.jobsLost)} jobs lost`,
        },
      ],
      secondary: [
        {
          label: 'Conversion Rate',
          value: `${formatCompactRatio(companySummary.conversionRate)}%`,
          subValue: `${formatWholeNumber(companySummary.jobsWon)} of ${formatWholeNumber(companySummary.totalBids)} bids won`,
        },
        {
          label: 'Conversion Rate in $',
          value: `${formatCompactRatio(companySummary.conversionRateValue)}%`,
          subValue: `${formatCurrency(companySummary.jobsWonValue)} won value`,
        },
      ],
      tertiary: [
        {
          label: 'Average $ Value of a Bid',
          value: formatCurrency(companySummary.averageBidValue),
          subValue: `${formatWholeNumber(companySummary.totalBids)} total bids`,
        },
        {
          label: 'Average $ Value of Bids Won',
          value: formatCurrency(companySummary.averageWonBidValue),
          subValue: `${formatWholeNumber(companySummary.jobsWon)} winning bids`,
        },
      ],
    };
  }, [companyMetricView, companySummary]);

  if (viewBid) {
    return (
      <>
        <Toast
          isOpen={toast.isOpen}
          message={toast.message}
          isSuccess={toast.isSuccess}
          onClose={() => setToast(emptyToast)}
          duration={3000}
        />
        <BidOverviewPage
          bid={viewBid}
          files={bidFilesById[viewBid.id] || []}
          onFilesChange={(updater) => {
            setBidFilesById((currentFilesById) => {
              const existingEntries = currentFilesById[viewBid.id] || [];
              const nextEntries = typeof updater === 'function' ? updater(existingEntries) : updater;

              return {
                ...currentFilesById,
                [viewBid.id]: nextEntries,
              };
            });
          }}
          onBack={() => {
            setViewBid(null);
            navigate(location.pathname);
          }}
          onBidUpdated={(updatedBid) => setViewBid((currentBid) => ({
            ...currentBid,
            ...updatedBid,
          }))}
          onNotify={(message, isSuccess) => setToast({ isOpen: true, message, isSuccess })}
        />
      </>
    );
  }

  return (
    <>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        isSuccess={toast.isSuccess}
        onClose={() => setToast(emptyToast)}
        duration={3000}
      />

      <div className={styles.pageWrapper}>
        <div className={styles.tabRail}>
          {REPORT_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.contentPanel}>
          <div className={styles.toolbar}>
            <div className={styles.filterWrap}>
              <select
                className={styles.filterSelect}
                value={selectedDateFilter}
                onChange={(event) => {
                  setSelectedDateFilter(event.target.value);
                  setEmployeeReportPage(1);
                }}
              >
                {DATE_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>{`Filter: ${filter.label}`}</option>
                ))}
              </select>
              <span className={styles.filterCaret}>
                <ChevronDownIcon size={18} />
              </span>
            </div>
          </div>

          {activeTab === 'Employees' ? (
            <>
              <div className={styles.metricsGrid}>
                {renderMetricCard(
                  'CURRENTLY BIDDING',
                  formatCurrency(employeeCards.currentBiddingValue),
                  `${employeeCards.biddingDelta >= 0 ? '+' : '-'} ${formatCurrency(Math.abs(employeeCards.biddingDelta), 0)} from last month`,
                  'green',
                  'bars',
                  employeeCards.biddingDelta < 0
                )}

                {renderMetricCard(
                  'AVG. REVENUE / EMPLOYEE',
                  formatCurrency(employeeCards.revenuePerEmployee),
                  `${employeeCards.revenueDelta >= 0 ? '+' : '-'} ${formatCurrency(Math.abs(employeeCards.revenueDelta), 0)} from last month`,
                  'red',
                  'people',
                  employeeCards.revenueDelta < 0
                )}

                <div className={styles.splitMetricCard}>
                  <div className={styles.splitMetricPane}>
                    <StatIcon tone="green" type="badge" />
                    <span className={styles.splitMetricLabel}>Currently Hired</span>
                    <strong className={styles.splitMetricValue}>{formatWholeNumber(employeeCards.currentlyHired)}</strong>
                  </div>
                  <div className={styles.splitMetricDivider} />
                  <div className={styles.splitMetricPane}>
                    <StatIcon tone="gray" type="badge1" />
                    <span className={styles.splitMetricLabel}>Lifetime Employees</span>
                    <strong className={styles.splitMetricValue}>{formatWholeNumber(employeeCards.lifetimeEmployees)}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.tableScroll}>
                  <table className={styles.reportTable}>
                    <thead>
                      <tr>
                        <th>Employee Name</th>
                        <th>No. Of Bids</th>
                        <th>Total $ Value of Bids</th>
                        <th>Win Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isEmployeeReportLoading ? renderLoadingRow('Loading employee report...', 5) : null}
                      {!isEmployeeReportLoading && employeeReportRows.length === 0 ? renderEmptyRow('No employees found', 5) : null}
                      {!isEmployeeReportLoading ? employeeReportRows.map((row, index) => (
                        <tr key={`${row.id}-${index}`}>
                          <td>
                            <div className={styles.nameCell}>
                              <span className={styles.primaryText}>{row.name}</span>
                              <span className={styles.secondaryText}>{row.subtitle}</span>
                            </div>
                          </td>
                          <td>{String(row.bidCount).padStart(2, '0')}</td>
                          <td>{formatCurrency(row.totalBidValue, 1)}</td>
                          <td>{formatCompactRatio(row.winRatio)}</td>
                        </tr>
                      )) : null}
                    </tbody>
                  </table>
                </div>
              </div>
              <Pagination
                styles={styles}
                currentPage={employeePagination.currentPage}
                totalPages={employeePagination.totalPages}
                totalRecords={employeePagination.totalRecords}
                firstItemNumber={employeeFirstItemNumber}
                lastItemNumber={employeeLastItemNumber}
                pageNumbers={employeePageNumbers}
                isLoading={isEmployeeReportLoading}
                onPageChange={handleEmployeePageChange}
              />
            </>
          ) : null}

          {activeTab === 'Company & Bids' ? (
            <>
              <div className={styles.companySection}>
                <div className={styles.companyMain}>
                  <div className={styles.companyHeroGrid}>
                    <div className={styles.companyHeroCard}>
                      <div className={styles.companyHeroCopy}>
                        <span className={styles.companyHeroLabel}>BIDS SENT</span>
                        <strong className={styles.companyHeroValue}>{formatCurrency(companySummary.bidsSentValue)}</strong>
                        <span className={`${styles.companyHeroMeta} ${styles.companyHeroMetaPositive}`}>
                          {formatWholeNumber(companySummary.bidsSent)} bids sent
                        </span>
                      </div>
                      <StatIcon tone="green" type="bars" />
                    </div>

                    <div className={styles.companyHeroCard}>
                      <div className={styles.companyHeroCopy}>
                        <span className={styles.companyHeroLabel}>BIDS WON</span>
                        <strong className={styles.companyHeroValue}>{formatCurrency(companySummary.jobsWonValue)}</strong>
                        <span className={`${styles.companyHeroMeta} ${styles.companyHeroMetaNegative}`}>
                          {formatWholeNumber(companySummary.jobsWon)} jobs won
                        </span>
                      </div>
                      <StatIcon tone="red" type="people" />
                    </div>

                    <div className={styles.companyStatusCard}>
                      <div className={styles.companyStatusPane}>
                        <span className={styles.companyStatusIconPlain}>
                          <StatIcon tone="green" type="badge" />
                        </span>
                        <span className={styles.companyStatusLabel}>Approved Bids</span>
                        <strong className={styles.companyStatusValue}>{formatWholeNumber(companySummary.approvedBids)}</strong>
                      </div>
                      <div className={styles.companyStatusDivider} />
                      <div className={styles.companyStatusPane}>
                        <span className={styles.companyStatusIconPlain}>
                          <StatIcon tone="gray" type="badge1" />
                        </span>
                        <span className={styles.companyStatusLabel}>Denied Bids</span>
                        <strong className={styles.companyStatusValue}>{formatWholeNumber(companySummary.deniedBids)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.companyBoardCard}>
                    {/* <div className={styles.companyBoardToolbar}>
                      <div className={styles.companyBoardToggle}>
                        <span className={companyMetricView === 'number' ? styles.companyToggleLabelActive : styles.companyToggleLabel}>
                          Number
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={companyMetricView === 'value'}
                          aria-label="Toggle company metrics view"
                          className={`${styles.companyToggleSwitch} ${companyMetricView === 'value' ? styles.companyToggleSwitchActive : ''}`}
                          onClick={() => setCompanyMetricView((current) => current === 'number' ? 'value' : 'number')}
                        >
                          <span className={styles.companyToggleKnob} />
                        </button>
                        <span className={companyMetricView === 'value' ? styles.companyToggleLabelActive : styles.companyToggleLabel}>
                          Dollar Value
                        </span>
                      </div>
                    </div> */}

                    <div className={styles.companyBoardContent}>
                      <div className={styles.companyBoardRowThree}>
                        {companyPerformanceRows.primary.map((card) => (
                          <React.Fragment key={card.label}>
                            {renderCompanyInsightCard(card.label, card.value, card.subValue)}
                          </React.Fragment>
                        ))}
                      </div>

                      <div className={styles.companyBoardRowTwo}>
                        {companyPerformanceRows.secondary.map((card) => (
                          <React.Fragment key={card.label}>
                            {renderCompanyInsightCard(card.label, card.value, card.subValue)}
                          </React.Fragment>
                        ))}
                      </div>

                      <div className={styles.companyBoardRowTwo}>
                        {companyPerformanceRows.tertiary.map((card) => (
                          <React.Fragment key={card.label}>
                            {renderCompanyInsightCard(card.label, card.value, card.subValue)}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <aside className={styles.companySidePanel}>
                  <div className={styles.noResponseCard}>
                    <div className={styles.noResponseTitle}>No Response</div>
                    <div className={styles.noResponseCount}>{formatWholeNumber(companySummary.noResponseCount)}</div>
                    <div className={styles.noResponseDetail}>Job Lost: {formatCurrency(companySummary.noResponseValue)}</div>
                  </div>

                  <div className={styles.clientListCard}>
                    <div className={styles.panelTitle}>No Response Clients</div>
                    <div className={styles.clientList}>
                      {isReportFeedsLoading ? (
                        <div className={styles.emptyState}>Loading no response clients...</div>
                      ) : noResponseClients.length === 0 ? (
                        <div className={styles.emptyState}>No response clients found</div>
                      ) : noResponseClients.map((client, index) => {
                        const displayName = getDisplayName(client);
                        return (
                          <div className={styles.clientListItem} key={`${client.client_id || client.id || 'client'}-${index}-${displayName}`}>
                            <span className={styles.clientAvatar}>{getInitials(displayName)}</span>
                            <div className={styles.clientInfo}>
                              <span className={styles.clientName}>{displayName}</span>
                              <span className={styles.clientMeta}>{client.project_name || client.projectName || '-'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : null}

          {activeTab === 'Customers' ? (
            <>
              {/* ── 4 Metric Cards ── */}
              <div className={styles.metricsGridFour}>
                {renderMetricCard(
                  'TOTAL REVENUE',
                  formatCurrency(customerRevenueMetrics.totalRevenue),
                  customerRevenueMetrics.revenueDelta !== null
                    ? `${customerRevenueMetrics.revenueDelta >= 0 ? '↗' : '↘'} ${customerRevenueMetrics.revenueDelta >= 0 ? '+' : ''}${formatCurrency(Math.abs(customerRevenueMetrics.revenueDelta), 0)} from last month`
                    : null,
                  'green',
                  'bars',
                  customerRevenueMetrics.revenueDelta !== null && customerRevenueMetrics.revenueDelta < 0
                )}
                {renderMetricCard(
                  'AVERAGE VALUE / BID',
                  formatCurrency(customerRevenueMetrics.avgValue),
                  customerRevenueMetrics.avgDelta !== null
                    ? `${customerRevenueMetrics.avgDelta >= 0 ? '↗' : '↘'} ${customerRevenueMetrics.avgDelta >= 0 ? '+' : ''}${formatCurrency(Math.abs(customerRevenueMetrics.avgDelta), 0)} from last month`
                    : null,
                  'red',
                  'people',
                  customerRevenueMetrics.avgDelta !== null && customerRevenueMetrics.avgDelta < 0
                )}
                <div className={styles.customerCountCard}>
                  <StatIcon tone="green" type="badge" />
                  <span className={styles.customerCountLabel}>Converted Customers</span>
                  <strong className={styles.customerCountValue}>{customerRevenueMetrics.convertedCustomers}</strong>
                </div>
                <div className={styles.customerCountCard}>
                  <StatIcon tone="gray" type="badge1" />
                  <span className={styles.customerCountLabel}>Total Customers</span>
                  <strong className={styles.customerCountValue}>{customerRevenueMetrics.totalCustomers}</strong>
                </div>
              </div>

              {/* ── Leaderboard + Chart Row ── */}
              <div className={styles.customerMidSection}>
                <div className={styles.leaderboardCard}>
                  <div className={styles.leaderboardTitle}>Customer Leaderboard</div>
                  <div className={styles.leaderboardList}>
                    {isBaseLoading ? (
                      <div className={styles.emptyState}>Loading...</div>
                    ) : customerLeaderboard.length === 0 ? (
                      <div className={styles.emptyState}>No data</div>
                    ) : customerLeaderboard.map((item, index) => (
                      <div className={styles.leaderboardItem} key={`${item.name}-${index}`}>
                        <span className={styles.leaderboardItemName}>{item.name}</span>
                        <span className={styles.leaderboardItemMeta}>
                          {formatCurrency(item.totalValue)} | Win Ratio -{' '}
                          <span className={styles.leaderboardWinRatio}>{String(item.winRatio).padStart(2, '0')}%</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.winRatioChartCard}>
                  <div className={styles.winRatioChartHeader}>
                    <span className={styles.winRatioChartTitle}>Win Ratio for Companies</span>
                    <div className={styles.winRatioLegend}>
                      <span className={styles.winRatioLegendItem}>
                        <span className={styles.winRatioLegendDotGreen} /> Won
                      </span>
                      <span className={styles.winRatioLegendItem}>
                        <span className={styles.winRatioLegendDotRed} /> Lost
                      </span>
                    </div>
                  </div>
                  {isBaseLoading ? (
                    <div className={styles.emptyState}>Loading chart...</div>
                  ) : (
                    <WinRatioBarChart data={customerChartData} />
                  )}
                </div>
              </div>

              {/* ── Customer Table ── */}
              <div className={styles.tableCard}>
                <div className={styles.tableScroll}>
                  <table className={`${styles.reportTable} ${styles.customerTable}`}>
                    <thead>
                      <tr>
                        <th><span className={styles.sortableHeader}>Client Name</span></th>
                        <th><span className={styles.sortableHeader}>Won Ratio</span></th>
                        <th><span className={styles.sortableHeader}>Open Bids</span></th>
                        <th><span className={styles.sortableHeader}>Won Bids</span></th>
                        <th><span className={styles.sortableHeader}>Lost Bids</span></th>
                        <th><span className={styles.sortableHeader}>Avg Value / Bid</span></th>
                        <th><span className={styles.sortableHeader}>Total Value</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {isBaseLoading ? renderLoadingRow('Loading customer report...', 7) : null}
                      {!isBaseLoading && customerTableRows.length === 0 ? renderEmptyRow('No customer data found', 7) : null}
                      {!isBaseLoading ? customerTableRows.map((row, index) => (
                        <tr key={`${row.clientName}-${index}`}>
                          <td>{row.clientName}</td>
                          <td>{row.wonRatio}</td>
                          <td>{row.openBids}</td>
                          <td>{row.wonBids}</td>
                          <td>{row.lostBids}</td>
                          <td>{formatCurrency(row.avgValuePerBid)}</td>
                          <td>{formatCurrency(row.totalValue)}</td>
                        </tr>
                      )) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}

          {activeTab === 'Estimate Ledger' ? (
            <>
              <div className={styles.metricsGrid}>
                {renderMetricCard(
                  'BIDS WON',
                  formatCurrency(estimateLedgerMetrics.wonValue),
                  estimateLedgerMetrics.wonValueDelta !== null
                    ? `↗ ${estimateLedgerMetrics.wonValueDelta >= 0 ? '+' : ''}${formatCurrency(Math.abs(estimateLedgerMetrics.wonValueDelta), 0)} from last month`
                    : null,
                  'green',
                  'bars',
                  estimateLedgerMetrics.wonValueDelta < 0
                )}

                {renderMetricCard(
                  'BIDS LOST',
                  formatCurrency(estimateLedgerMetrics.lostValue),
                  estimateLedgerMetrics.lostValueDelta !== null
                    ? `↘ ${estimateLedgerMetrics.lostValueDelta >= 0 ? '+' : ''}${formatCurrency(Math.abs(estimateLedgerMetrics.lostValueDelta), 2)} from last month`
                    : null,
                  'red',
                  'people',
                  estimateLedgerMetrics.lostValueDelta < 0
                )}

                <div className={styles.splitMetricCard}>
                  <div className={styles.splitMetricPane}>
                    <StatIcon tone="green" type="badge" />
                    <span className={styles.splitMetricLabel}>Won Bids</span>
                    <strong className={styles.splitMetricValue}>{formatWholeNumber(estimateLedgerMetrics.wonCount)}</strong>
                  </div>
                  <div className={styles.splitMetricDivider} />
                  <div className={styles.splitMetricPane}>
                    <StatIcon tone="gray" type="badge1" />
                    <span className={styles.splitMetricLabel}>Lost Bids</span>
                    <strong className={styles.splitMetricValue}>{formatWholeNumber(estimateLedgerMetrics.lostCount)}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.tableScroll}>
                  <table className={styles.reportTable}>
                    <thead>
                      <tr>
                        <th><span className={styles.sortableHeader}>Project Name & Number</span></th>
                        <th><span className={styles.sortableHeader}>Client</span></th>
                        <th><span className={styles.sortableHeader}>Status</span></th>
                        <th><span className={styles.sortableHeader}>Action</span></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {isReportFeedsLoading ? renderLoadingRow('Loading estimate ledger...', 4) : null}
                      {!isReportFeedsLoading && ledgerRows.length === 0 ? renderEmptyRow('No estimate ledger records found', 4) : null}
                      {!isReportFeedsLoading ? ledgerRows.map((row, index) => (
                        <tr key={`${row.id}-${index}`} style={{ cursor: 'pointer' }} onClick={() => handleBidClick(row.bidId)}>
                          <td>
                            <div className={styles.projectNameCell}>
                              <span className={styles.primaryText}>{row.projectName}</span>
                              {row.bidProjectId && <span className={styles.secondaryText}>{row.bidProjectId}</span>}
                            </div>
                          </td>
                          <td>{row.clients}</td>
                          <td>
                            <span className={`${styles.ledgerStatusBadge} ${String(row.status).toLowerCase() === 'won' || String(row.status).toLowerCase() === 'approved'
                              ? styles.ledgerStatusWon
                              : String(row.status).toLowerCase() === 'lost'
                                ? styles.ledgerStatusLost
                                : styles.ledgerStatusOther
                              }`}>
                              {formatStatus(row.status)}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionBtnGroup}>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                title="View Project"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleBidClick(row.bidId);
                                }}
                              >
                                <ViewIcon size={18} />
                              </button>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                title="Download PDF"
                                onClick={(event) => handlePdfDownloadClick(event, row)}
                              >
                                <FileRowIcon extension="pdf" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default ReportsPage;