import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClient, updateClient, deleteClient, getClientEmployees, getClientTypes, getBids } from '../../../common/services/api';
import styles from './ContactDetailPage.module.css';
import Modal from '../../components/Modal';
import { Toast } from '../../components/Toast';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useToastState from '../../hooks/useToastState';
import { capitalizeFirstCharacter, sanitizePhoneNumberInput } from '../../utils/inputFormat';
import { validateCompanyForm } from '../../utils/validation';
import { formatTimeOpen } from '../../utils/dateFormat';
import { getStatusDisplayLabel } from '../../utils/bidHelpers';
import { formatClientTypeLabel, formatEmployeeTag } from '../../utils/clientType';
import { getRoleLabel } from '../../constants/roles';

const DETAIL_TABS = ['Employee Details', 'Bids with', 'Projects with'];
const CONTACT_BIDS_FETCH_LIMIT = 1000;

const EMPTY_FORM = { companyName: '', companyWebsite: '', officeNumber: '', clientTypeId: '' };

const normalizeTypeId = (value) => (
  value === undefined || value === null || value === '' ? '' : String(value)
);

const extractEmployees = (response) => {
  const payload = response?.employees ?? response?.data?.employees ?? response?.data?.data ?? response?.data;
  return Array.isArray(payload) ? payload : [];
};

const mapContact = (c) => ({
  id: c.id,
  companyName: c.company_name || '',
  companyWebsite: c.website || '',
  officeNumber: c.office_number || '-',
  clientTypeId: normalizeTypeId(c.client_type_id),
  clientTypeName: formatClientTypeLabel(c.client_type || ''),
  address: c.address || c.office_address || c.officeAddress || c.company_address || c.companyAddress || '-',
});

const getCount = (counts, keys) => keys.reduce((total, key) => total + Number(counts?.[key] || 0), 0);

const getBidStatsFromResponse = (data, bids) => {
  const counts = data?.data?.statusCounts || data?.statusCounts || {};
  const pagination = data?.pagination || data?.data?.pagination || {};
  const total = Number(pagination.totalRecords ?? counts.all ?? bids.length) || 0;
  const won = getCount(counts, ['won', 'approved']);
  const lost = getCount(counts, ['lost', 'cancelled', 'canceled']);
  const pending = getCount(counts, ['bidinprogress', 'sentToClient', 'pending', 'open']);

  return {
    total,
    lost,
    won,
    open: pending,
  };
};

function AvatarIcon({ size = 24, color = '#98A2B3' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill={color} />
      <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" fill={color} />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contact, setContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailTab, setDetailTab] = useState('Employee Details');
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmp, setIsLoadingEmp] = useState(false);
  const [contactBids, setContactBids] = useState([]);
  const [bidStats, setBidStats] = useState({ total: 0, lost: 0, won: 0, open: 0 });
  const [isLoadingBids, setIsLoadingBids] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [bidSearch, setBidSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const debouncedBidSearch = useDebouncedValue(bidSearch);
  const debouncedProjectSearch = useDebouncedValue(projectSearch);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast, setToast, closeToast } = useToastState();
  const [clientTypes, setClientTypes] = useState([]);

  const fetchContact = async () => {
    setIsLoading(true);
    try {
      const data = await getClient(id);
      const c = data.data || data.client || data;
      const mapped = mapContact(c);
      setContact(mapped);
      setFormData({
        companyName: mapped.companyName,
        companyWebsite: mapped.companyWebsite,
        officeNumber: mapped.officeNumber === '-' ? '' : mapped.officeNumber,
        clientTypeId: mapped.clientTypeId,
      });
    } catch (err) {
      setToast({
        isOpen: true,
        message: err?.data?.message || err.message || 'Failed to fetch contact',
        isSuccess: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientTypeOptions = async () => {
    try {
      const data = await getClientTypes();
      const list = data.data || data.types || [];
      setClientTypes(Array.isArray(list) ? list : []);
    } catch {
      setClientTypes([]);
    }
  };

  const fetchEmployees = async () => {
    setIsLoadingEmp(true);
    try {
      const data = await getClientEmployees(id);
      setEmployees(extractEmployees(data));
    } catch {
      setEmployees([]);
    } finally {
      setIsLoadingEmp(false);
    }
  };

  const fetchContactBids = async () => {
    if (!id) return;

    setIsLoadingBids(true);
    try {
      const search = detailTab === 'Projects with' ? debouncedProjectSearch : debouncedBidSearch;
      const data = await getBids(1, '', search, '', String(id), '', CONTACT_BIDS_FETCH_LIMIT);
      const responseBids = data?.data?.bids || data?.bids || data?.data || [];
      const bidList = Array.isArray(responseBids) ? responseBids : [];

      setContactBids(bidList);
      setBidStats(getBidStatsFromResponse(data, bidList));
    } catch {
      setContactBids([]);
      setBidStats({ total: 0, lost: 0, won: 0, open: 0 });
    } finally {
      setIsLoadingBids(false);
    }
  };

  useEffect(() => {
    fetchContact();
    fetchClientTypeOptions();
  }, [id]);

  useEffect(() => {
    if (detailTab === 'Employee Details') {
      fetchEmployees();
      return;
    }

    if (detailTab === 'Bids with' || detailTab === 'Projects with') {
      fetchContactBids();
    }
  }, [detailTab, id, debouncedBidSearch, debouncedProjectSearch]);

  useEffect(() => {
    if (detailTab === 'Employee Details') fetchEmployees();
  }, [detailTab, id]);

  const handleUpdate = async () => {
    const validationMessage = validateCompanyForm(formData);
    if (validationMessage) {
      setToast({ isOpen: true, message: validationMessage, isSuccess: false });
      return;
    }
    setIsUpdating(true);
    try {
      const data = await updateClient(contact.id, {
        company_name: formData.companyName.trim(),
        website: formData.companyWebsite.trim(),
        office_number: formData.officeNumber || null,
        client_type_id: formData.clientTypeId || null,
      });
      setToast({ isOpen: true, message: data.message || 'Contact updated', isSuccess: true });
      setShowEditModal(false);
      fetchContact();
    } catch (err) {
      setToast({ isOpen: true, message: err.message || 'Failed to update', isSuccess: false });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteClient(contact.id);
      navigate('/dashboard/contacts');
    } catch (err) {
      setToast({ isOpen: true, message: err.message || 'Failed to delete', isSuccess: false });
    }
  };

  const filteredEmployees = employees.filter((e) => {
    if (!empSearch.trim()) return true;
    const q = empSearch.toLowerCase();
    return (
      (e.first_name || '').toLowerCase().includes(q) ||
      (e.last_name || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q)
    );
  });

  const projectTotals = useMemo(() => {
    const totalValue = contactBids.reduce((sum, bid) => sum + Number(bid.grand_total ?? bid.bid_value ?? 0), 0);
    const activeStatuses = ['bidinprogress', 'senttoclient'];
    const completedStatuses = ['won', 'approved'];
    const normalize = (value) => String(value || '').toLowerCase().replace(/\s|-/g, '');

    return {
      totalValue,
      activeCount: contactBids.filter((bid) => activeStatuses.includes(normalize(bid.status))).length,
      completedCount: contactBids.filter((bid) => completedStatuses.includes(normalize(bid.status))).length,
    };
  }, [contactBids]);

  return (
    <>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        isSuccess={toast.isSuccess}
        onClose={closeToast}
        duration={3000}
      />
      <div className={styles.pageWrapper}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumbRow}>
          <span className={styles.breadcrumbLink} onClick={() => navigate('/dashboard/contacts')}>Contacts</span>
          <span className={styles.breadcrumbSep}>&gt;</span>
          <span className={styles.breadcrumbCurrent}>{contact?.companyName || 'Contact Details'}</span>
        </div>

        {isLoading && <div className={styles.loadingState}>Loading contact details...</div>}
        {!isLoading && !contact && <div className={styles.loadingState}>Contact not found.</div>}

        {!isLoading && contact && (
          <div className={styles.detailCard}>
            {/* Header */}
            <div className={styles.detailHeader}>
              <div className={styles.detailHeaderLeft}>
                <span className={styles.companyName}>{contact.companyName}</span>
                <span className={styles.typeBadge}>| {contact.clientTypeName || 'N/A'}</span>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.iconBtn} title="Edit" onClick={() => setShowEditModal(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
                  </svg>
                </button>
                <button className={styles.iconBtn} title="Cancel">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
                  </svg>
                </button>
                <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete" onClick={handleDelete}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Info row */}
            <div className={styles.infoRow}>
              <div className={styles.avatar}><AvatarIcon size={36} /></div>
              <div className={styles.infoItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 011 1V20a1 1 0 01-1 1C9.61 21 3 14.39 3 6a1 1 0 011-1h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.25 1.11l-2.39 1.8z" fill="#98A2B3" /></svg>
                <div>
                  <div className={styles.infoLabel}>Phone Number</div>
                  <div className={styles.infoValue}>{contact.officeNumber}</div>
                </div>
              </div>
              <div className={styles.infoItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" fill="#98A2B3" /></svg>
                <div>
                  <div className={styles.infoLabel}>Address</div>
                  <div className={styles.infoValue}>{contact.address}</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabRow}>
              {DETAIL_TABS.map((t) => (
                <button
                  key={t}
                  className={`${styles.tab} ${detailTab === t ? styles.tabActive : ''}`}
                  onClick={() => setDetailTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div className={styles.tabBody}>
              {detailTab === 'Employee Details' && (
                <div>
                  <div className={styles.tableHeader}>
                    <span className={styles.tableTitle}>Employee Details</span>
                    <div className={styles.tableSearch}>
                      <SearchIcon />
                      <input className={styles.tableSearchInput} type="text" placeholder="Search" value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} />
                    </div>
                  </div>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Phone Number</th>
                        <th>Email</th>
                        <th>Designation</th>
                        {contact?.clientTypeName === 'Vendor' && <th>Tag</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingEmp && <tr><td colSpan={contact?.clientTypeName === 'Vendor' ? 6 : 5} className={styles.emptyCell}>Loading...</td></tr>}
                      {!isLoadingEmp && filteredEmployees.length === 0 && <tr><td colSpan={contact?.clientTypeName === 'Vendor' ? 6 : 5} className={styles.emptyCell}>No employees found</td></tr>}
                      {!isLoadingEmp && filteredEmployees.map((e) => (
                        <tr key={e.id}>
                          <td>{e.first_name || '-'}</td>
                          <td>{e.last_name || '-'}</td>
                          <td>{e.phone || e.phone_number || '-'}</td>
                          <td>{e.email || '-'}</td>
                          <td>{getRoleLabel(e.designation || e.role) || '-'}</td>
                          {contact?.clientTypeName === 'Vendor' && <td>{formatEmployeeTag(e.tag) || '-'}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === 'Bids with' && (
                <div>
                  <div className={styles.statCards}>
                    <div className={`${styles.statCard}`}><span className={styles.statVal}>{bidStats.total}</span><span className={styles.statLbl}>Total Bids</span></div>
                    <div className={`${styles.statCard} ${styles.cardRed}`}><span className={`${styles.statVal} ${styles.valRed}`}>{bidStats.lost}</span><span className={styles.statLbl}>Lost / Withdrawn Bids</span></div>
                    <div className={`${styles.statCard} ${styles.cardGreen}`}><span className={`${styles.statVal} ${styles.valGreen}`}>{bidStats.won}</span><span className={styles.statLbl}>Won Bids</span></div>
                    <div className={`${styles.statCard} ${styles.cardBlue}`}><span className={`${styles.statVal} ${styles.valBlue}`}>{bidStats.open}</span><span className={styles.statLbl}>Pending / Open Bids</span></div>
                  </div>
                  <div className={styles.tableHeader}>
                    <span className={styles.tableTitle}>Bids</span>
                    <div className={styles.tableSearch}>
                      <SearchIcon />
                      <input
                        className={styles.tableSearchInput}
                        type="text"
                        placeholder="Search"
                        value={bidSearch}
                        onChange={(e) => setBidSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <table className={styles.table}>
                    <thead><tr><th>Project Name &amp; Number</th><th>$Value</th><th>Time Open</th><th>Status</th></tr></thead>
                    <tbody>
                      {isLoadingBids && <tr><td colSpan="4" className={styles.emptyCell}>Loading bids...</td></tr>}
                      {!isLoadingBids && contactBids.length === 0 && <tr><td colSpan="4" className={styles.emptyCell}>No bids found</td></tr>}
                      {!isLoadingBids && contactBids.map((bid) => (
                        <tr key={bid.id}>
                          <td>{bid.project_name || '-'}</td>
                          <td>{(bid.grand_total != null || bid.bid_value != null) ? `$${Number(bid.grand_total ?? bid.bid_value).toLocaleString()}` : '-'}</td>
                          <td>{bid.created_at ? <span className={styles.timeBadge}>{formatTimeOpen(bid.created_at)}</span> : '-'}</td>
                          <td>{getStatusDisplayLabel(bid)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === 'Projects with' && (
                <div>
                  <div className={styles.statCards3}>
                    <div className={`${styles.statCard} ${styles.cardGreen}`}><span className={`${styles.statVal} ${styles.valGreen}`}>${projectTotals.totalValue.toLocaleString()}</span><span className={styles.statLbl}>Total Value</span></div>
                    <div className={`${styles.statCard} ${styles.cardRed}`}><span className={`${styles.statVal} ${styles.valRed}`}>{projectTotals.activeCount}</span><span className={styles.statLbl}>Active Projects</span></div>
                    <div className={`${styles.statCard} ${styles.cardBlue}`}><span className={`${styles.statVal} ${styles.valBlue}`}>{projectTotals.completedCount}</span><span className={styles.statLbl}>Completed Projects</span></div>
                  </div>
                  <div className={styles.tableHeader}>
                    <span className={styles.tableTitle}>Projects</span>
                    <div className={styles.tableSearch}>
                      <SearchIcon />
                      <input
                        className={styles.tableSearchInput}
                        type="text"
                        placeholder="Search"
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <table className={styles.table}>
                    <thead><tr><th>Project Name &amp; Number</th><th>$Value</th><th>Time Open</th><th>Status</th></tr></thead>
                    <tbody>
                      {isLoadingBids && <tr><td colSpan="4" className={styles.emptyCell}>Loading projects...</td></tr>}
                      {!isLoadingBids && contactBids.length === 0 && <tr><td colSpan="4" className={styles.emptyCell}>No projects found</td></tr>}
                      {!isLoadingBids && contactBids.map((bid) => (
                        <tr key={bid.id}>
                          <td>{bid.project_name || '-'}</td>
                          <td>{(bid.grand_total != null || bid.bid_value != null) ? `$${Number(bid.grand_total ?? bid.bid_value).toLocaleString()}` : '-'}</td>
                          <td>{bid.created_at ? <span className={styles.timeBadge}>{formatTimeOpen(bid.created_at)}</span> : '-'}</td>
                          <td>{getStatusDisplayLabel(bid)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Update Contact Details">
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Company Name *</label>
            <input type="text" value={formData.companyName} onChange={(e) => setFormData((f) => ({ ...f, companyName: capitalizeFirstCharacter(e.target.value) }))} />
          </div>
          <div className={styles.formGroup}>
            <label>Company Website</label>
            <input type="text" value={formData.companyWebsite} onChange={(e) => setFormData((f) => ({ ...f, companyWebsite: e.target.value }))} />
          </div>
          <div className={styles.formGroup}>
            <label>Office Number</label>
            <input type="tel" value={formData.officeNumber} onChange={(e) => setFormData((f) => ({ ...f, officeNumber: sanitizePhoneNumberInput(e.target.value) }))} inputMode="numeric" maxLength={10} pattern="[0-9]{10}" />
          </div>
          <div className={styles.formGroup}>
            <label>Company Type</label>
            <select value={formData.clientTypeId} onChange={(e) => setFormData((f) => ({ ...f, clientTypeId: e.target.value }))}>
              <option value="">Select Company Type</option>
              {clientTypes.map((type) => <option key={type.id} value={String(type.id)}>{formatClientTypeLabel(type.type_name)}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
          <button className={styles.updateBtn} onClick={handleUpdate} disabled={isUpdating}>{isUpdating ? 'Updating...' : 'Update'}</button>
        </div>
      </Modal>
    </>
  );
}

export default ContactDetailPage;