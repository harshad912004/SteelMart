import React, { useState, useEffect } from 'react';
import styles from './FinancialsAdminTab.module.css';
import {
  DownloadIcon,
  ExcelIcon,
  ContactActionIcon, // Eye icon
  EditPencilIcon,
} from '../Icons/BidIcons';
import { ChevronDown, ChevronUp, Share2, Upload, FileText, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import {
  getFinancialsAdminData,
  updateProjectExpenses,
  addChangeOrder,
  updateChangeOrderStatus,
  addProjectPayment,
  addComplianceDocument,
  updateComplianceDocumentStatus
} from '../../../common/services/api';

const formatCurrency = (val) => {
  const num = Number(val);
  if (isNaN(num) || val === null || val === undefined) return '$0.00';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const DonutChart = ({ data, totalValue }) => {
  const [hoveredData, setHoveredData] = useState(null);
  
  const total = data.reduce((acc, curr) => acc + Number(curr.value), 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  if (total === 0) {
    return (
      <div className={styles.donutContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ width: 200, height: 200, transform: 'rotate(-90deg)' }}>
          <circle cx="0" cy="0" r="1" fill="transparent" stroke="#e5e7eb" strokeWidth="0.3" />
        </svg>
        <div className={styles.donutCenter}>
          <div className={styles.donutAmount}>{formatCurrency(totalValue)}</div>
          <div className={styles.donutLabel}>Booked Revenue</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.donutContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ width: 200, height: 200, transform: 'rotate(-90deg)' }}>
        {data.map(slice => {
          if (slice.value === 0) return null;
          
          const slicePercent = slice.value / total;
          
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
              strokeLinecap="round"
              onMouseEnter={() => setHoveredData(slice)}
              onMouseLeave={() => setHoveredData(null)}
              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease' }}
            />
          );
        })}
      </svg>
      <div className={styles.donutCenter}>
        <div className={styles.donutAmount}>{formatCurrency(totalValue)}</div>
        <div className={styles.donutLabel}>Booked Revenue</div>
      </div>

      {hoveredData && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '-20px',
          background: '#fff',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '11px',
          pointerEvents: 'none',
          zIndex: 10,
          minWidth: '120px',
          textAlign: 'left'
        }}>
          <div style={{ fontWeight: 600, color: '#111827', marginBottom: '6px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>{hoveredData.label}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Total</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(hoveredData.value)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function FinancialsAdminTab({ bidId, isCompleted = false }) {
  const [changeOrderOpen, setChangeOrderOpen] = useState(true);
  const [paymentsOpen, setPaymentsOpen] = useState(true);
  const [documentsOpen, setDocumentsOpen] = useState(true);

  const [showCOIModal, setShowCOIModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState({});
  const [changeOrders, setChangeOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complianceDocs, setComplianceDocs] = useState([]);

  // Forms states
  const [overheadInput, setOverheadInput] = useState('');
  const [profitInput, setProfitInput] = useState('');
  const [newCOI, setNewCOI] = useState({ document_name: '', expiry_date: '' });
  const [newPayment, setNewPayment] = useState({ vendor_name: 'Tech Base Media', amount: '', date: '', note: '' });
  const [selectedContractDocs, setSelectedContractDocs] = useState([]);

  const fetchData = async (silent = false) => {
    if (!bidId) return;
    try {
      if (!silent) setLoading(true);
      const res = await getFinancialsAdminData(bidId);
      const data = res?.data || res || {};
      setFinancials(data.financials || {});
      setChangeOrders(data.changeOrders || []);
      setPayments(data.payments || []);
      setComplianceDocs(data.complianceDocs || []);
      setOverheadInput(data.financials?.overhead_cost_percent || '');
      setProfitInput(data.financials?.estimated_profit || '');
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [bidId]);

  const handleSaveExpenses = async () => {
    try {
      await updateProjectExpenses(bidId, {
        overhead_cost_percent: Number(overheadInput),
        estimated_profit: Number(profitInput)
      });
      if (selectedContractDocs.length > 0) {
        await Promise.all(selectedContractDocs.map(file =>
          addComplianceDocument(bidId, {
            document_name: file.name,
            type: 'general',
            uploaded_by: 'Current User',
            status: 'File Received'
          })
        ));
        setSelectedContractDocs([]);
      }
      fetchData(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadCOI = async () => {
    try {
      await addComplianceDocument(bidId, {
        document_name: newCOI.document_name || 'New Document',
        type: 'coi',
        uploaded_by: 'Current User',
        expiry_date: newCOI.expiry_date || null,
        status: 'File Received'
      });
      setShowCOIModal(false);
      setNewCOI({ document_name: '', expiry_date: '' });
      fetchData(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterPayment = async () => {
    try {
      await addProjectPayment(bidId, {
        vendor_name: newPayment.vendor_name,
        amount: Number(newPayment.amount) || 0,
        date: newPayment.date || null,
        note: newPayment.note
      });
      setShowPaymentModal(false);
      setNewPayment({ vendor_name: 'Tech Base Media', amount: '', date: '', note: '' });
      fetchData(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCOIStatus = async (docId, status) => {
    try {
      await updateComplianceDocumentStatus(docId, { id: docId, status });
      fetchData(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectGeneralDoc = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedContractDocs(prev => [...prev, ...files]);
    }
  };

  const handleChangeOrderStatus = async (coId, status) => {
    try {
      await updateChangeOrderStatus(bidId, { id: coId, status });
      fetchData(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading financials data...</div>;
  }

  const totalChangeOrders = changeOrders.reduce((sum, co) => sum + Number(co.amount || 0), 0);

  const labourCost = Number(financials?.labour_cost || 0);
  const materialCost = Number(financials?.material_cost || 0);
  const vendorCost = Number(financials?.vendor_cost || 0);
  const bidValue = Number(financials?.bid_value || 0);
  const awardNumber = Number(financials?.award_number || 0);
  const bookedRevenue = bidValue + awardNumber + labourCost + materialCost + vendorCost;
  const estProfit = bookedRevenue - (labourCost + materialCost + vendorCost);

  const chartData = [
    { label: 'Bid Value', value: bidValue, color: '#8b5cf6' },
    { label: 'Award Number', value: awardNumber, color: '#ec4899' },
    { label: 'Labour Cost', value: labourCost, color: '#2563eb' },
    { label: 'Material Cost', value: materialCost, color: '#10b981' },
    { label: 'Vendor Cost', value: vendorCost, color: '#f59e0b' },
  ];

  return (
    <div className={styles.tabContainer}>

      {/* Project Expenses */}
      <div className={styles.sectionCard}>
        {/* <div className={styles.sectionHeader}>
          <h2>Project Expenses</h2>
          <div className={styles.headerActions}>
            <button type="button" className={styles.textButton}>
              <DownloadIcon /> Export to PDF
            </button>
            <button type="button" className={styles.textButton}>
              <ExcelIcon /> Export to Excel
            </button>
          </div>
        </div> */}

        <div className={styles.expensesGrid}>
          <div className={styles.expensesLeft}>
            <DonutChart data={chartData} totalValue={bookedRevenue} />
          </div>
          <div className={styles.expensesRight}>
            <div className={styles.statsTopRow}>
              <div className={styles.statCard}>
                <div className={styles.statAmount}>${financials?.labour_cost || 0}</div>
                <div className={styles.statLabel}><span className={styles.dotLabour} /> Labour Cost</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statAmount}>${financials?.material_cost || 0}</div>
                <div className={styles.statLabel}><span className={styles.dotMaterial} /> Material Cost</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statAmount}>${financials?.vendor_cost || 0}</div>
                <div className={styles.statLabel}><span className={styles.dotVendor} /> Vendor Cost</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statAmount}>{financials?.overhead_cost_percent || 0}%</div>
                <div className={styles.statLabel}><span className={styles.dotOverhead} /> Overhead Cost (in %)</div>
              </div>
            </div>

            <div className={styles.statsBottomRow}>
              <div className={styles.statCardWide}>
                <div className={styles.statIconProfit}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg></div>
                <div>
                  <div className={styles.statAmount}>
                    {formatCurrency(estProfit)}
                    {bookedRevenue > 0 && (
                      <span className={styles.statSubAmount} style={{ marginLeft: 6 }}>
                        ({Math.round((estProfit / bookedRevenue) * 100)}%)
                      </span>
                    )}
                  </div>
                  <div className={styles.statLabel}>Estimated Profit</div>
                </div>
              </div>
              <div className={styles.statCardWide}>
                <div className={styles.statIconPayment}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></div>
                <div>
                  <div className={styles.statAmount}>${financials?.payment_received || 0}</div>
                  <div className={styles.statLabel}>Payment Received</div>
                </div>
              </div>
              <div className={styles.statCardWide}>
                <div className={styles.statIconBalance}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /><path d="M12 8v4l3 3" /></svg></div>
                <div>
                  <div className={styles.statAmount}>${financials?.balance_remaining || 0}</div>
                  <div className={styles.statLabel}>Balance Remaining</div>
                </div>
              </div>
            </div>

            {/* <div className={styles.warningTags}>
              {complianceDocs.filter(d => d.type === 'general').length === 0 && <span className={styles.tagRed}>Missing Contract</span>}
              {complianceDocs.filter(d => d.type === 'coi').length === 0 && <span className={styles.tagRed}>No Insurance</span>}
              {((financials?.labour_cost || 0) + (financials?.material_cost || 0) + (financials?.vendor_cost || 0)) > (financials?.payment_received || 0) && <span className={styles.tagRed}>Expenses Exceed Revenue</span>}
            </div> */}
          </div>
        </div>
      </div>

      {/* Change Order */}
      {/* <div className={styles.sectionCard}>
        <div className={styles.accordionHeader} onClick={() => setChangeOrderOpen(!changeOrderOpen)}>
          <h2>Change Order</h2>
          {changeOrderOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {changeOrderOpen && (
          <div className={styles.accordionContent}>
            <div className={styles.subHeaderRow}>
              <div className={styles.totalText}>Total: <strong>${totalChangeOrders.toLocaleString()}</strong></div>
              <div className={styles.headerActions}>
                <button type="button" className={styles.outlineButton}><ContactActionIcon /> View Log</button>
                <button type="button" className={styles.outlineButton}><ContactActionIcon /> View All</button>
              </div>
            </div>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Change Order Name</th>
                  <th>Change Order Number</th>
                  <th>Status</th>
                  <th>Change Order Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {changeOrders.length > 0 ? changeOrders.map((co) => (
                  <tr key={co.id}>
                    <td>{co.name}</td>
                    <td>{co.number}</td>
                    <td>
                      <span className={
                        co.status === 'Approved' ? styles.statusApproved : 
                        co.status === 'Rejected' ? styles.statusRejected : styles.statusOpen
                      }>{co.status}</span>
                    </td>
                    <td>${Number(co.amount).toLocaleString()}</td>
                      <td className={styles.actionsCell}>
                        {!isCompleted && (<>
                          <button className={styles.iconBtn} onClick={() => handleChangeOrderStatus(co.id, 'Approved')} title="Approve"><CheckCircle size={16} color="#10b981" /></button>
                          <button className={styles.iconBtn} onClick={() => handleChangeOrderStatus(co.id, 'Rejected')} title="Reject"><XCircle size={16} color="#ef4444" /></button>
                        </>)}
                      </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>No change orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div> */}

      {/* Project Payments */}
      {/* <div className={styles.sectionCard}>
        <div className={styles.accordionHeader} onClick={() => setPaymentsOpen(!paymentsOpen)}>
          <h2>Project Payments</h2>
          {paymentsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {paymentsOpen && (
          <div className={styles.accordionContent}>
            <div className={styles.subHeaderRow} style={{ justifyContent: 'flex-end' }}>
              {!isCompleted && <button type="button" className={styles.outlineButton} onClick={() => setShowPaymentModal(true)}>+ Register a New Payment</button>}
            </div>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Amount</th>
                  <th>Invoice File</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.vendor_name}</td>
                    <td>${Number(p.amount).toLocaleString()}</td>
                    <td className={styles.actionsCell}><FileText size={18} /> <EditPencilIcon /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '16px' }}>No payments recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div> */}

      {/* Project Documents */}
      <div className={styles.sectionCard}>
        <div className={styles.accordionHeader} onClick={() => setDocumentsOpen(!documentsOpen)}>
          <h2>Project Documents</h2>
          {documentsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {documentsOpen && (
          <div className={styles.accordionContent}>
            <div className={styles.grid2Col}>
              <div className={styles.docPanel}>
                <h3>Contract</h3>
                <div className={styles.uploadBox}>
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <input type="file" multiple style={{ display: 'none' }} onChange={handleSelectGeneralDoc} disabled={isCompleted} />
                    <Upload size={24} color="#2563eb" />
                    <p>Drag your file or <span className={styles.textLink}>browse</span></p>
                    <p className={styles.uploadSubtext}>JPEG, PNG, and PDF formats, up to 50MB</p>
                  </label>
                </div>
              </div>
              <div className={styles.docList}>
                {selectedContractDocs.map((file, idx) => (
                  <div className={styles.docItem} key={`selected-${idx}`}>
                    <div className={styles.docIcon}><FileText size={20} color="#2563eb" /></div>
                    <div className={styles.docInfo}>
                      <div className={styles.docName}>{file.name}</div>
                      <div className={styles.docVersion}>Selected for upload</div>
                    </div>
                    <div className={styles.docDelete} style={{ color: '#ef4444', cursor: 'pointer' }} onClick={() => setSelectedContractDocs(prev => prev.filter((_, i) => i !== idx))}><Trash2 size={16} /></div>
                  </div>
                ))}
                {complianceDocs.filter(d => d.type === 'general').length > 0 ? complianceDocs.filter(d => d.type === 'general').map((doc, index, arr) => (
                  <div className={styles.docItem} key={doc.id}>
                    <div className={styles.docIcon}><FileText size={20} color="#2563eb" /></div>
                    <div className={styles.docInfo}>
                      <div className={styles.docName}>{doc.document_name}</div>
                      <div className={styles.docVersion}>Version {arr.length - index}</div>
                    </div>
                    <Share2 size={16} color="#6b7280" />
                    <div className={styles.docDelete} style={{ color: '#ef4444' }}><Trash2 size={16} /></div>
                  </div>
                )) : selectedContractDocs.length === 0 && (
                  <div style={{ padding: '16px', color: '#6b7280' }}>No contract documents found.</div>
                )}
              </div>
            </div>

            <div className={styles.grid2Col} style={{ marginTop: 24 }}>
              <div>
                <label className={styles.inputLabel}>Overhead</label>
                <div className={styles.inputWrapper}>
                  <input type="text" value={overheadInput} onChange={(e) => setOverheadInput(e.target.value)} placeholder="Enter Overhead" className={styles.textInput} disabled={isCompleted} />
                  <span className={styles.inputSuffix}>%</span>
                </div>
              </div>
              <div>
                <label className={styles.inputLabel}>Profit</label>
                <div className={styles.inputWrapper}>
                  <input type="text" value={profitInput} onChange={(e) => setProfitInput(e.target.value)} placeholder="Enter Profit" className={styles.textInput} disabled={isCompleted} />
                  <span className={styles.inputSuffix}>$</span>
                </div>
              </div>
            </div>

            <div className={styles.actionButtonsRow}>
              <button className={styles.cancelButton} onClick={fetchData}>Cancel</button>
              {!isCompleted && <button className={styles.saveButton} onClick={handleSaveExpenses}>Save</button>}
            </div>
          </div>
        )}
      </div>

      {/* Compliance */}
      {/* <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2>Compliance</h2>
        </div>

        <div className={styles.subSection}>
          <div className={styles.subHeaderRow}>
            <h3>Certificate of Insurance</h3>
            {!isCompleted && <button className={styles.outlineButton} onClick={() => setShowCOIModal(true)}>+ Add COI</button>}
          </div>
          <div className={styles.docCardsGrid}>
            {complianceDocs.filter(d => d.type === 'coi').map((doc) => (
              <div className={styles.docCard} key={doc.id}>
                <div className={styles.docIcon}><FileText size={24} color="#2563eb" /></div>
                <div className={styles.docInfo}>
                  <div className={styles.docName}>{doc.document_name}</div>
                  <div className={styles.docMeta}>Uploaded by: {doc.uploaded_by}</div>
                  {doc.expiry_date && <div className={styles.docMeta}>Expiry Date: {new Date(doc.expiry_date).toLocaleDateString()}</div>}
                  {doc.status === 'File Received' && (
                      <div className={styles.docCheckRow}>
                        {!isCompleted && (<>
                          <button className={styles.iconBtnAction} style={{ color: '#10b981' }} onClick={() => handleUpdateCOIStatus(doc.id, 'Approved')}><CheckCircle size={16} /></button>
                          <button className={styles.iconBtnAction} style={{ color: '#ef4444' }} onClick={() => { setShowRejectModal(true); }}><XCircle size={16} /></button>
                        </>)}
                      </div>
                  )}
                </div>
                <div className={styles.docCardActions}>
                  <span className={
                    doc.status === 'Approved' ? styles.statusApproved :
                      doc.status === 'Certificate Expired' ? styles.statusExpired : styles.statusWarning
                  }>{doc.status}</span>
                  <button className={styles.iconBtn}><Share2 size={16} /></button>
                  <button className={styles.iconBtn}><XCircle size={16} /></button>
                </div>
              </div>
            ))}
            {complianceDocs.filter(d => d.type === 'coi').length === 0 && <p style={{ color: '#6b7280' }}>No certificates found.</p>}
          </div>
        </div>
      </div> */}

      {/* COI Modal */}
      {showCOIModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add New COI</h3>
              <button className={styles.closeBtn} onClick={() => setShowCOIModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Document Name</label>
                <input type="text" value={newCOI.document_name} onChange={e => setNewCOI({ ...newCOI, document_name: e.target.value })} placeholder="Enter Document Name" />
              </div>
              <div className={styles.inputGroup}>
                <label>Upload Document</label>
                <div className={styles.uploadBoxLarge}>
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <input type="file" style={{ display: 'none' }} onChange={e => {
                      if (e.target.files?.[0]) setNewCOI({ ...newCOI, document_name: e.target.files[0].name })
                    }} />
                    <Upload size={24} color="#2563eb" />
                    <p>Drag your file or <span className={styles.textLink}>browse</span></p>
                    <p className={styles.uploadSubtext}>jpeg, png, and pdf formats, up to 30MB</p>
                    {newCOI.document_name && <p style={{ marginTop: 8, color: '#10b981', fontWeight: 500 }}>{newCOI.document_name} selected</p>}
                  </label>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Expiry Date</label>
                <input type="date" value={newCOI.expiry_date} onChange={e => setNewCOI({ ...newCOI, expiry_date: e.target.value })} placeholder="Select Date" />
              </div>
              <div className={styles.modalActions}>
                <button className={styles.outlineButtonModal} onClick={() => setShowCOIModal(false)}>Cancel</button>
                <button className={styles.primaryButtonModal} onClick={handleUploadCOI}>Upload</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Payment Modal */}
      {showPaymentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Register a New Payment</h3>
              <button className={styles.closeBtn} onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Select a Vendor</label>
                <select className={styles.selectInput} value={newPayment.vendor_name} onChange={e => setNewPayment({ ...newPayment, vendor_name: e.target.value })}>
                  <option>Tech Base Media</option>
                  <option>KSB Company</option>
                  <option>Other Vendor</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Document Name</label>
                <input type="text" placeholder="Enter Document Name" />
              </div>
              <div className={styles.inputGroup}>
                <label>Upload Document</label>
                <div className={styles.uploadBoxLarge}>
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <input type="file" style={{ display: 'none' }} onChange={e => {
                      if (e.target.files?.[0]) setNewPayment({ ...newPayment, note: (newPayment.note || '') + ' [File: ' + e.target.files[0].name + ']' })
                    }} />
                    <Upload size={24} color="#2563eb" />
                    <p>Drag your file or <span className={styles.textLink}>browse</span></p>
                    <p className={styles.uploadSubtext}>jpeg, png, and pdf formats, up to 30MB</p>
                  </label>
                </div>
              </div>
              <div className={styles.grid2Col}>
                <div className={styles.inputGroup}>
                  <label>Payment Amount</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputPrefix}>$</span>
                    <input type="text" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} placeholder="Enter Amount" className={styles.textInputWithPrefix} style={{ paddingLeft: '24px' }} />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>Date</label>
                  <input type="date" value={newPayment.date} onChange={e => setNewPayment({ ...newPayment, date: e.target.value })} />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Note</label>
                <textarea rows="3" value={newPayment.note} onChange={e => setNewPayment({ ...newPayment, note: e.target.value })} placeholder="Enter note..."></textarea>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.outlineButtonModal} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button className={styles.primaryButtonModal} onClick={handleRegisterPayment}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h3>Reject</h3>
              <button className={styles.closeBtn} onClick={() => setShowRejectModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Reason for rejection</label>
                <textarea rows="4" placeholder="Enter reason..."></textarea>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.outlineButtonModal} onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button className={styles.dangerButtonModal} onClick={() => setShowRejectModal(false)}>Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


