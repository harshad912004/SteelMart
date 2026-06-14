import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopTabs from '../../components/TopTabs/TopTabs';
import styles from './FinancialsAdminPage.module.css';
import {
  getBid,
  updateBid,
  getFinancialsAdminData,
  updateProjectExpenses,
  addChangeOrder,
  updateChangeOrderStatus,
  addProjectPayment,
  addComplianceDocument,
  updateComplianceDocumentStatus,
  uploadBidRootFile,
  getBidRootFiles,
} from '../../../common/services/api';
import { getSalesBidDisplayId } from '../../utils/bidHelpers';

const TABS = [
  'Overview',
  'Grand Total',
  'Files',
  'RFIs',
  'Submittals',
  'Documents',
  'Vendors',
  'Financials & Admin',
  'Gallery',
];

const mapTabToKey = (tab) => {
  if (tab === 'Grand Total') return 'tables';
  if (tab === 'Financials & Admin') return 'financials';
  return tab.toLowerCase();
};

/* ── Inline SVG Icons ── */

const ChevronIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const UploadCloudIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const PdfIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const DownloadIcon = () => (
  <svg className={styles.exportIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const EyeIcon = () => (
  <svg className={styles.tableActionIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const PencilIcon = () => (
  <svg className={styles.tableActionIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg className={styles.largeCardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const CoinsIcon = () => (
  <svg className={styles.largeCardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="M16.71 13.88l-3.23 3.32" />
  </svg>
);

const WalletIcon = () => (
  <svg className={styles.largeCardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
    <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
  </svg>
);


/* ── Helper: format currency ── */
const formatCurrency = (val) => {
  const num = Number(val);
  if (isNaN(num) || val === null || val === undefined) return '$0.00';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/* ── SVG Donut Chart Component ── */
const DonutChart = ({ data, totalValue }) => {
  // data: array of { label, value, color }
  const [hoveredData, setHoveredData] = useState(null);
  
  const total = data.reduce((acc, curr) => acc + Number(curr.value), 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  // If total is 0, render a single gray circle
  if (total === 0) {
    return (
      <div className={styles.chartContainer}>
        <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ width: 200, height: 200, transform: 'rotate(-90deg)' }}>
          <circle cx="0" cy="0" r="1" fill="transparent" stroke="#EAECF0" strokeWidth="0.3" />
        </svg>
        <div className={styles.chartCenterText}>
          <p className={styles.chartTotalValue}>{formatCurrency(totalValue)}</p>
          <p className={styles.chartTotalLabel}>Booked Revenue</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ width: 200, height: 200, transform: 'rotate(-90deg)' }}>
        {data.map(slice => {
          if (slice.value === 0) return null;
          
          const slicePercent = slice.value / total;
          
          // if it's the only slice, draw a circle instead of a path
          if (slicePercent === 1) {
             return <circle key={slice.label} cx="0" cy="0" r="1" fill="transparent" stroke={slice.color} strokeWidth="0.3" />;
          }

          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += slicePercent;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          
          const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
          
          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`
          ].join(' ');

          return (
            <path
              key={slice.label}
              d={pathData}
              fill="transparent"
              stroke={slice.color}
              strokeWidth="0.35"
              strokeLinecap="round" // Gives rounded edges to the donut segments if needed (can be removed if gaps aren't desired)
              onMouseEnter={() => setHoveredData(slice)}
              onMouseLeave={() => setHoveredData(null)}
              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease' }}
            />
          );
        })}
      </svg>
      <div className={styles.chartCenterText}>
        <p className={styles.chartTotalValue}>{formatCurrency(totalValue)}</p>
        <p className={styles.chartTotalLabel}>Booked Revenue</p>
      </div>

      {hoveredData && (
        <div className={styles.chartTooltip}>
          <div className={styles.chartTooltipTitle}>{hoveredData.label}</div>
          <div className={styles.chartTooltipRow}>
            <span className={styles.chartTooltipLabel}>Total</span>
            <span className={styles.chartTooltipValue}>{formatCurrency(hoveredData.value)}</span>
          </div>
        </div>
      )}
    </div>
  );
};


/* ── Main Component ── */
function FinancialsAdminPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Financials');
  const fileInputRef = useRef(null);
  const coiFileInputRef = useRef(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const tabKey = mapTabToKey(tab);
    navigate(`/dashboard/projects?bid=${id}&tab=${tabKey}`);
  };

  /* ── State ── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);

  // Accordion states
  const [coOpen, setCoOpen] = useState(true);
  const [paymentsOpen, setPaymentsOpen] = useState(true);
  const [docsOpen, setDocsOpen] = useState(false);

  // Project Documents
  const [contractFiles, setContractFiles] = useState([]);
  const [showPrevVersions, setShowPrevVersions] = useState(false);
  const [isSignedPdf, setIsSignedPdf] = useState(false);
  const [overhead, setOverhead] = useState('');
  const [profit, setProfit] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Compliance
  const [complianceDocs, setComplianceDocs] = useState([]);
  const [showAddComplianceModal, setShowAddComplianceModal] = useState(false);
  const [newComplianceName, setNewComplianceName] = useState('');
  const [newComplianceType, setNewComplianceType] = useState('general');

  // Financials
  const [financials, setFinancials] = useState(null);
  const [changeOrders, setChangeOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // Edit Expenses Modal
  const [showEditExpenses, setShowEditExpenses] = useState(false);
  const [expenseForm, setExpenseForm] = useState({});

  // Add Change Order form
  const [showAddCO, setShowAddCO] = useState(false);
  const [coForm, setCoForm] = useState({ name: '', number: '', amount: '' });

  // Add Payment form
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ vendor_name: '', amount: '', date: '', note: '' });

  // New sub-tabs and Invoice Modal states
  const [subTab, setSubTab] = useState('Invoices');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ vendor: '', contact: '', dueDate: '', note: '', items: [] });
  const [invoiceItem, setInvoiceItem] = useState({ description: '', quantity: 1, unitPrice: 0, tax: 0 });

  const handleAddInvoiceItem = () => {
    setInvoiceForm(f => ({
      ...f,
      items: [...f.items, { ...invoiceItem, amount: invoiceItem.quantity * invoiceItem.unitPrice }]
    }));
    setInvoiceItem({ description: '', quantity: 1, unitPrice: 0, tax: 0 });
  };

  const handleRemoveInvoiceItem = (index) => {
    setInvoiceForm(f => ({
      ...f,
      items: f.items.filter((_, i) => i !== index)
    }));
  };

  const invoiceSubtotal = invoiceForm.items.reduce((sum, item) => sum + item.amount, 0);
  const invoiceTaxTotal = invoiceForm.items.reduce((sum, item) => sum + (item.amount * (item.tax / 100)), 0);
  const invoiceTotal = invoiceSubtotal + invoiceTaxTotal;


  /* ── Load Data ── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bidRes, finRes, filesRes] = await Promise.all([
        getBid(id),
        getFinancialsAdminData(id),
        getBidRootFiles(id).catch(() => ({ files: [] })),
      ]);

      if (bidRes && bidRes.success !== false) {
        const proj = bidRes.bid || bidRes.data?.bid || bidRes.data;
        setProject(proj);
        setOverhead(proj?.overhead ?? '');
        setProfit(proj?.profit ?? '');
      }

      if (finRes && finRes.success !== false) {
        const data = finRes.data || finRes;
        setFinancials(data.financials || null);
        setChangeOrders(data.changeOrders || data.change_orders || []);
        setPayments(data.payments || []);
        setComplianceDocs(data.complianceDocs || data.compliance_docs || []);

        if (data.financials) {
          setExpenseForm({
            labour_cost: data.financials.labour_cost || 0,
            material_cost: data.financials.material_cost || 0,
            vendor_cost: data.financials.vendor_cost || 0,
            overhead_cost_percent: data.financials.overhead_cost_percent || 0,
            estimated_profit: data.financials.estimated_profit || 0,
            payment_received: data.financials.payment_received || 0,
            balance_remaining: data.financials.balance_remaining || 0,
          });
        }
      }

      if (filesRes && (filesRes.files || filesRes.data?.files)) {
        setContractFiles(filesRes.files || filesRes.data?.files || []);
      }
    } catch (err) {
      console.error('Failed to load financials data:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Derived Dashboard Data ── */
  const labourCost = Number(financials?.labour_cost || 0);
  const materialCost = Number(financials?.material_cost || 0);
  const vendorCost = Number(financials?.vendor_cost || 0);
  const estProfitDb = Number(financials?.estimated_profit || 0);
  const paymentReceived = Number(financials?.payment_received || 0);
  const balanceRemaining = Number(financials?.balance_remaining || 0);
  const overheadPercent = Number(financials?.overhead_cost_percent || 0);

  const bidValue = Number(financials?.bid_value || project?.bid_value || 0);
  const awardNumber = Number(financials?.award_number || project?.award_number || 0);

  // Booked Revenue = bid value + award number + labour cost + material cost + vendor cost.
  const bookedRevenue = bidValue + awardNumber + labourCost + materialCost + vendorCost;

  // Profit = Booked Revenue − (labour cost + material cost + vendor cost)
  const estProfit = bookedRevenue - (labourCost + materialCost + vendorCost);
  
  const chartData = [
    { label: 'Bid Value', value: bidValue, color: '#10B981' },
    { label: 'Award Number', value: awardNumber, color: '#8B5CF6' },
    { label: 'Labour Cost', value: labourCost, color: '#3B82F6' },
    { label: 'Material Cost', value: materialCost, color: '#EC4899' },
    { label: 'Vendor Cost', value: vendorCost, color: '#F59E0B' },
  ];

  const totalCOAmount = changeOrders.reduce((sum, co) => sum + Number(co.amount), 0);

  const coiDocs = complianceDocs.filter(d => d.type === 'coi');
  const generalDocs = complianceDocs.filter(d => d.type !== 'coi');

  const hasMissingContract = contractFiles.length === 0;
  const hasNoInsurance = coiDocs.length === 0;
  const expensesExceedRevenue = (labourCost + materialCost + vendorCost) > bookedRevenue;
  // A simple proxy for "Invoiced Added without Payment": say if balance > 0 and no payments recorded
  const invoicedWithoutPayment = balanceRemaining > 0 && payments.length === 0;


  /* ── Handlers (Expenses) ── */
  const handleSaveExpenses = async () => {
    try {
      setSaving(true);
      await updateProjectExpenses(id, expenseForm);
      await loadData();
      setShowEditExpenses(false);
    } catch (err) {
      alert('Failed to save expenses.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Handlers (Contract & Compliance) ── */
  const handleFileDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) await uploadContractFile(files[0]);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) await uploadContractFile(files[0]);
    e.target.value = '';
  };

  const uploadContractFile = async (file) => {
    try {
      setUploading(true);
      await uploadBidRootFile(id, file, '', file.name);
      const filesRes = await getBidRootFiles(id).catch(() => ({ files: [] }));
      if (filesRes && (filesRes.files || filesRes.data?.files)) {
        setContractFiles(filesRes.files || filesRes.data?.files || []);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveContract = async () => {
    try {
      setSaving(true);
      await updateBid(id, { overhead: overhead || null, profit: profit || null });
      alert('Saved successfully!');
    } catch (err) {
      alert('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComplianceDoc = async () => {
    if (!newComplianceName) return;
    try {
      setSaving(true);
      await addComplianceDocument(id, { document_name: newComplianceName, type: newComplianceType, status: 'File Received' });
      setNewComplianceName('');
      setNewComplianceType('general');
      setShowAddComplianceModal(false);
      await loadData();
    } catch (err) {
      alert('Failed to add compliance document.');
    } finally {
      setSaving(false);
    }
  };

  const handleComplianceStatusChange = async (docId, status) => {
    try {
      await updateComplianceDocumentStatus(id, { id: docId, status });
      await loadData();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleCOIUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      try {
        setUploading(true);
        const uploadRes = await uploadBidRootFile(id, files[0], '', files[0].name);
        const fileUrl = uploadRes?.file?.file_path || uploadRes?.data?.file?.file_path || files[0].name;
        await addComplianceDocument(id, { document_name: 'Certificate of Insurance', type: 'coi', file_url: fileUrl, status: 'File Received' });
        await loadData();
      } catch (err) {
        alert('Failed to upload COI.');
      } finally {
        setUploading(false);
      }
    }
    e.target.value = '';
  };

  /* ── Handlers (Change Orders & Payments) ── */
  const handleAddChangeOrder = async () => {
    if (!coForm.name || !coForm.amount) return;
    try {
      setSaving(true);
      await addChangeOrder(id, { name: coForm.name, number: coForm.number, amount: Number(coForm.amount) });
      setCoForm({ name: '', number: '', amount: '' });
      setShowAddCO(false);
      await loadData();
    } catch (err) {
      alert('Failed to add change order.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeOrderStatus = async (coId, status) => {
    try {
      await updateChangeOrderStatus(id, { id: coId, status });
      await loadData();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.vendor_name || !paymentForm.amount) return;
    try {
      setSaving(true);
      await addProjectPayment(id, {
        vendor_name: paymentForm.vendor_name,
        amount: Number(paymentForm.amount),
        date: paymentForm.date || null,
        note: paymentForm.note || '',
      });
      setPaymentForm({ vendor_name: '', amount: '', date: '', note: '' });
      setShowAddPayment(false);
      await loadData();
    } catch (err) {
      alert('Failed to add payment.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Files Sorting ── */
  const sortedContractFiles = [...contractFiles].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const latestFile = sortedContractFiles[0] || null;
  const previousFiles = sortedContractFiles.slice(1);

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <TopTabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />
        <div className={styles.loadingWrapper}><div className={styles.spinner} /></div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <TopTabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />

      <div className={styles.pageBody}>
        {/* ═══════════════════════════════════════════
            Section 1: Project Expenses Dashboard
        ═══════════════════════════════════════════ */}
        <div className={styles.expensesSection}>
          <div className={styles.expensesHeader}>
            <h2 className={styles.expensesTitle}>Project Expenses</h2>
            <div className={styles.expensesHeaderActions}>
              <button type="button" className={styles.exportBtn} onClick={() => setShowEditExpenses(true)}>
                <PencilIcon /> Edit Data
              </button>
              <button type="button" className={styles.exportBtn}>
                <DownloadIcon /> Export to PDF
              </button>
              <button type="button" className={styles.exportBtn}>
                <DownloadIcon /> Export to Excel
              </button>
            </div>
          </div>

          <div className={styles.dashboardLayout}>
            {/* SVG Donut Chart */}
            <DonutChart data={chartData} totalValue={bookedRevenue} />

            {/* Dashboard Cards */}
            <div className={styles.dashboardCards}>
              
              <div className={styles.smallCardsRow}>
                <div className={`${styles.smallCard} ${styles.smallCardBlue}`}>
                  <p className={styles.smallCardValue}>{formatCurrency(labourCost)}</p>
                  <p className={styles.smallCardLabel}>Labour Cost</p>
                  <p style={{ fontSize: 10, color: '#98A2B3', marginTop: 2 }}>Not tracked</p>
                </div>
                <div className={`${styles.smallCard} ${styles.smallCardPink}`}>
                  <p className={styles.smallCardValue}>{formatCurrency(materialCost)}</p>
                  <p className={styles.smallCardLabel}>Material Cost</p>
                  <p style={{ fontSize: 10, color: '#98A2B3', marginTop: 2 }}>From project estimate</p>
                </div>
                <div className={`${styles.smallCard} ${styles.smallCardOrange}`}>
                  <p className={styles.smallCardValue}>{formatCurrency(vendorCost)}</p>
                  <p className={styles.smallCardLabel}>Vendor Cost</p>
                  <p style={{ fontSize: 10, color: '#98A2B3', marginTop: 2 }}>Approved vendor proposals</p>
                </div>
                <div className={`${styles.smallCard} ${styles.smallCardYellow}`}>
                  <p className={styles.smallCardValue}>{overheadPercent}%</p>
                  <p className={styles.smallCardLabel}>Overhead Cost (%)</p>
                  <p style={{ fontSize: 10, color: '#98A2B3', marginTop: 2 }}>Set at onboarding</p>
                </div>
              </div>

              <div className={styles.largeCardsRow}>
                <div className={`${styles.largeCard} ${styles.largeCardBlue}`}>
                  <div className={styles.largeCardIconWrapper}>
                    <div className={`${styles.largeCardIconBox} ${styles.largeCardIconBlue}`}>
                      <ChartBarIcon />
                    </div>
                  </div>
                  <p className={styles.largeCardValue}>
                    {formatCurrency(estProfit)}
                    {bookedRevenue > 0 && (
                      <span className={styles.largeCardPercent}>({Math.round((estProfit / bookedRevenue) * 100)}%)</span>
                    )}
                  </p>
                  <p className={styles.largeCardLabel}>Estimated Profit</p>
                </div>
                <div className={`${styles.largeCard} ${styles.largeCardGreen}`}>
                  <div className={styles.largeCardIconWrapper}>
                    <div className={`${styles.largeCardIconBox} ${styles.largeCardIconGreen}`}>
                      <CoinsIcon />
                    </div>
                  </div>
                  <p className={styles.largeCardValue}>{formatCurrency(paymentReceived)}</p>
                  <p className={styles.largeCardLabel}>Payment Received</p>
                </div>
                <div className={`${styles.largeCard} ${styles.largeCardPurple}`}>
                  <div className={styles.largeCardIconWrapper}>
                    <div className={`${styles.largeCardIconBox} ${styles.largeCardIconPurple}`}>
                      <WalletIcon />
                    </div>
                  </div>
                  <p className={styles.largeCardValue}>{formatCurrency(balanceRemaining)}</p>
                  <p className={styles.largeCardLabel}>Balance Remaining</p>
                </div>
              </div>

            </div>
          </div>

          {/* Warning Badges row */}
          <div className={styles.warningBadgesRow}>
            {hasMissingContract && <span className={styles.warningBadge}>Missing Contract</span>}
            {hasNoInsurance && <span className={styles.warningBadge}>No Insurance</span>}
            {invoicedWithoutPayment && <span className={styles.warningBadge}>Invoiced Added without Payment</span>}
            {expensesExceedRevenue && <span className={styles.warningBadge}>Expenses Exceed Revenue</span>}
            {!hasMissingContract && !hasNoInsurance && !invoicedWithoutPayment && !expensesExceedRevenue && (
              <span style={{ fontSize: 12, color: '#667085' }}>No active warnings.</span>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            Section 2: Estimates / Invoices / Purchase Orders
        ═══════════════════════════════════════════ */}
        <div className={styles.subTabsContainer}>
          <div className={styles.subTabsList}>
            <button className={subTab === 'Estimates' ? styles.subTabActive : styles.subTab} onClick={() => setSubTab('Estimates')}>Estimates</button>
            <button className={subTab === 'Invoices' ? styles.subTabActive : styles.subTab} onClick={() => setSubTab('Invoices')}>Invoices</button>
            <button className={subTab === 'Purchase Orders' ? styles.subTabActive : styles.subTab} onClick={() => setSubTab('Purchase Orders')}>Purchase Orders</button>
          </div>
        </div>

        {subTab === 'Invoices' && (
          <div className={styles.invoicesSection}>
            <div className={styles.invoicesHeaderRow}>
              <h3 className={styles.invoicesTitle}>Invoices</h3>
              <button type="button" className={styles.createInvoiceBtn} onClick={() => setShowCreateInvoice(true)}>
                <PlusIcon /> Create
              </button>
            </div>
            
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice #</th>
                  <th>Status</th>
                  <th>Total Amount</th>
                  <th>Due Date</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {/* Dummy Data for UI */}
                <tr>
                  <td>Jan 12, 2026</td>
                  <td>INV-001</td>
                  <td><span className={styles.coStatusPill} style={{borderColor: '#10B981', color: '#10B981'}}>Paid</span></td>
                  <td>$5,200.00</td>
                  <td>Jan 26, 2026</td>
                  <td>Initial Deposit</td>
                  <td><div className={styles.tableActionIcons}><EyeIcon /><PencilIcon /></div></td>
                </tr>
                <tr>
                  <td>Feb 05, 2026</td>
                  <td>INV-002</td>
                  <td><span className={styles.coStatusPill} style={{borderColor: '#F59E0B', color: '#F59E0B'}}>Pending</span></td>
                  <td>$1,500.00</td>
                  <td>Feb 19, 2026</td>
                  <td>Material Cost</td>
                  <td><div className={styles.tableActionIcons}><EyeIcon /><PencilIcon /></div></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {subTab === 'Estimates' && (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No Estimates available.</p>
          </div>
        )}

        {subTab === 'Purchase Orders' && (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No Purchase Orders available.</p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          Modals (Edit Expenses & Add Compliance)
      ═══════════════════════════════════════════ */}
      {showEditExpenses && (
        <div className={styles.modalOverlay} onClick={() => setShowEditExpenses(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Edit Financial Data</h3>
            <div className={styles.modalFields}>
              <div style={{ background: '#F9FAFB', border: '1px solid #EAECF0', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#667085', margin: 0, lineHeight: 1.6 }}>
                  <strong style={{ color: '#344054' }}>Auto-populated fields (read-only):</strong><br />
                  • <strong>Labour Cost</strong> — always $0.00 (not tracked)<br />
                  • <strong>Material Cost</strong> — pulled from the project estimate grand total<br />
                  • <strong>Vendor Cost</strong> — sum of approved vendor proposal prices<br />
                  • <strong>Overhead %</strong> — set during project onboarding
                </p>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Estimated Profit ($)</label>
                <input className={styles.fieldInput} type="number" value={expenseForm.estimated_profit || ''} onChange={(e) => setExpenseForm(f => ({ ...f, estimated_profit: e.target.value }))} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Payment Received ($)</label>
                <input className={styles.fieldInput} type="number" value={expenseForm.payment_received || ''} onChange={(e) => setExpenseForm(f => ({ ...f, payment_received: e.target.value }))} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Balance Remaining ($)</label>
                <input className={styles.fieldInput} type="number" value={expenseForm.balance_remaining || ''} onChange={(e) => setExpenseForm(f => ({ ...f, balance_remaining: e.target.value }))} />
              </div>
            </div>
            <div className={styles.modalBtnRow}>
              <button type="button" className={styles.cancelBtn} style={{ padding: '8px 16px' }} onClick={() => setShowEditExpenses(false)}>Cancel</button>
              <button type="button" className={styles.saveBtn} style={{ padding: '8px 16px' }} onClick={handleSaveExpenses} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {showAddComplianceModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddComplianceModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Add Compliance Document</h3>
            <div className={styles.modalFields}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Document Name</label>
                <input className={styles.fieldInput} placeholder="Enter document name" value={newComplianceName} onChange={(e) => setNewComplianceName(e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Type</label>
                <select className={styles.fieldInput} value={newComplianceType} onChange={(e) => setNewComplianceType(e.target.value)}>
                  <option value="general">General</option>
                  <option value="coi">Certificate of Insurance</option>
                </select>
              </div>
            </div>
            <div className={styles.modalBtnRow}>
              <button type="button" className={styles.cancelBtn} style={{ padding: '8px 16px' }} onClick={() => setShowAddComplianceModal(false)}>Cancel</button>
              <button type="button" className={styles.saveBtn} style={{ padding: '8px 16px' }} onClick={handleAddComplianceDoc} disabled={saving || !newComplianceName}>{saving ? 'Adding...' : 'Add Document'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          Create Invoice Modal
      ═══════════════════════════════════════════ */}
      {showCreateInvoice && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateInvoice(false)}>
          <div className={styles.invoiceModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.invoiceModalHeader}>
              <h3 className={styles.invoiceModalTitle}>Add / Create New Invoice</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setShowCreateInvoice(false)}>×</button>
            </div>
            
            <div className={styles.invoiceModalBody}>
              <div className={styles.invoiceTopSection}>
                <div className={styles.invoiceFormLeft}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Company/Vendor Name</label>
                    <select className={styles.fieldInput} value={invoiceForm.vendor} onChange={(e) => setInvoiceForm({...invoiceForm, vendor: e.target.value})}>
                      <option value="">Select Vendor</option>
                      <option value="Vendor A">Vendor A</option>
                      <option value="Vendor B">Vendor B</option>
                    </select>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Contact Person</label>
                    <input className={styles.fieldInput} value={invoiceForm.contact} onChange={(e) => setInvoiceForm({...invoiceForm, contact: e.target.value})} placeholder="Contact name" />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Invoice Due Date</label>
                    <input type="date" className={styles.fieldInput} value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Note</label>
                    <textarea className={styles.fieldInput} rows={2} value={invoiceForm.note} onChange={(e) => setInvoiceForm({...invoiceForm, note: e.target.value})} placeholder="Add note..."></textarea>
                  </div>
                </div>
                
                <div className={styles.invoiceFormRight}>
                  <div className={styles.invoiceDropzone}>
                    <div className={styles.uploadIconContainer}><UploadCloudIcon /></div>
                    <p className={styles.dropzoneText}>Drag and Drop your file here</p>
                    <span className={styles.dropzoneHint}>or</span>
                    <button type="button" className={styles.browseFileBtn}>Browse File</button>
                  </div>
                </div>
              </div>

              <div className={styles.invoiceItemsSection}>
                <h4 className={styles.invoiceItemsTitle}>Description</h4>
                <table className={styles.invoiceItemsTable}>
                  <thead>
                    <tr>
                      <th style={{width: '35%'}}>Description</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Amount</th>
                      <th>Tax (%)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceForm.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.description}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td>{formatCurrency(item.amount)}</td>
                        <td>{item.tax}%</td>
                        <td>
                          <button type="button" className={styles.fileActionBtnDanger} onClick={() => handleRemoveInvoiceItem(idx)}><TrashIcon /></button>
                        </td>
                      </tr>
                    ))}
                    <tr className={styles.addItemRow}>
                      <td><input className={styles.fieldInput} value={invoiceItem.description} onChange={e => setInvoiceItem({...invoiceItem, description: e.target.value})} placeholder="Item description" /></td>
                      <td><input type="number" className={styles.fieldInput} value={invoiceItem.quantity} onChange={e => setInvoiceItem({...invoiceItem, quantity: Number(e.target.value)})} /></td>
                      <td><input type="number" className={styles.fieldInput} value={invoiceItem.unitPrice} onChange={e => setInvoiceItem({...invoiceItem, unitPrice: Number(e.target.value)})} /></td>
                      <td>{formatCurrency(invoiceItem.quantity * invoiceItem.unitPrice)}</td>
                      <td><input type="number" className={styles.fieldInput} value={invoiceItem.tax} onChange={e => setInvoiceItem({...invoiceItem, tax: Number(e.target.value)})} /></td>
                      <td>
                        <button type="button" className={styles.outlineBtn} onClick={handleAddInvoiceItem} disabled={!invoiceItem.description}>+ Add</button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className={styles.invoiceTotals}>
                  <div className={styles.invoiceTotalRow}>
                    <span>Subtotal:</span>
                    <span>{formatCurrency(invoiceSubtotal)}</span>
                  </div>
                  <div className={styles.invoiceTotalRow}>
                    <span>Tax:</span>
                    <span>{formatCurrency(invoiceTaxTotal)}</span>
                  </div>
                  <div className={`${styles.invoiceTotalRow} ${styles.invoiceTotalFinal}`}>
                    <span>Total:</span>
                    <span>{formatCurrency(invoiceTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.invoiceModalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowCreateInvoice(false)}>Cancel</button>
              <button type="button" className={styles.saveBtn} onClick={() => setShowCreateInvoice(false)}>Create Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancialsAdminPage;
