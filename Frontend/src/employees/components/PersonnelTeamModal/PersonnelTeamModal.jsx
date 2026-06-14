import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import styles from './PersonnelTeamModal.module.css';

/* ── Icons ── */
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F04438" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const PlusIcon = ({ color = '#12B76A' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const SteelmartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M3 9h6M3 15h6M15 7h2M15 11h2M15 15h2" />
  </svg>
);

const GCIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const VendorIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const TEAM_TYPES = [
  { value: 'steelmart', label: 'SteelMart Team', desc: 'Internal company members', Icon: SteelmartIcon, color: '#3047F7' },
  { value: 'generalContractor', label: 'General Contractor Team', desc: 'GC partners on this project', Icon: GCIcon, color: '#0BA5EC' },
  { value: 'vendor', label: 'Vendor Team', desc: 'Vendor companies on this project', Icon: VendorIcon, color: '#6941C6' },
];

const EMPTY_ROW = () => ({ tempId: Math.random(), employeeId: '', phone: '', email: '', designation: '', isNew: false });
const EMPTY_NEW_MEMBER = () => ({ tempId: Math.random(), first_name: '', last_name: '', phone: '', email: '', designation: '' });

function PersonnelTeamModal({
  isOpen,
  onClose,
  onSubmit,
  editingTeam = null,
  personnelEmployees = null, // { steelmart, gcCompanies, gcEmployees, vendorCompanies, vendorEmployees }
}) {
  const [teamType, setTeamType] = useState('steelmart');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [rows, setRows] = useState([EMPTY_ROW()]);
  const [newMembers, setNewMembers] = useState([]); // for GC/vendor only — new contacts

  /* Derive available data from current team type */
  const companies = (() => {
    if (teamType === 'generalContractor') return personnelEmployees?.gcCompanies || [];
    if (teamType === 'vendor') return personnelEmployees?.vendorCompanies || [];
    return [];
  })();

  const allEmployees = (() => {
    if (teamType === 'steelmart') return personnelEmployees?.steelmart || [];
    if (teamType === 'generalContractor') return (personnelEmployees?.gcEmployees || []).filter(e => String(e.company_id) === String(selectedCompanyId));
    if (teamType === 'vendor') return (personnelEmployees?.vendorEmployees || []).filter(e => String(e.company_id) === String(selectedCompanyId));
    return [];
  })();

  /* Reset on open */
  useEffect(() => {
    if (!isOpen) return;

    if (editingTeam) {
      const tt = editingTeam.team_type || 'generalContractor';
      setTeamType(tt);
      setSelectedCompanyId(String(editingTeam.company_id || ''));
      setTeamName(editingTeam.team_name || '');
      setRows(
        Array.isArray(editingTeam.members) && editingTeam.members.length > 0
          ? editingTeam.members.map(m => ({
              tempId: Math.random(),
              employeeId: String(m.id || m.employee_id || ''),
              phone: m.phone || '',
              email: m.email || '',
              designation: m.designation || '',
              isNew: false,
            }))
          : [EMPTY_ROW()]
      );
      setNewMembers([]);
    } else {
      setTeamType('steelmart');
      setSelectedCompanyId('');
      setTeamName('');
      setRows([EMPTY_ROW()]);
      setNewMembers([]);
    }
  }, [isOpen, editingTeam]);

  /* When teamType changes while adding, clear company + rows */
  useEffect(() => {
    if (!isOpen || editingTeam) return;
    setSelectedCompanyId('');
    setRows([EMPTY_ROW()]);
    setNewMembers([]);
  }, [teamType]);

  /* When company changes (adding), clear rows */
  useEffect(() => {
    if (!isOpen || editingTeam) return;
    setRows([EMPTY_ROW()]);
    setNewMembers([]);
  }, [selectedCompanyId]);

  /* Row handlers */
  const handleEmployeeChange = (tempId, employeeId) => {
    const emp = allEmployees.find(e => String(e.id) === String(employeeId));
    setRows(rows.map(r => r.tempId !== tempId ? r : {
      ...r,
      employeeId,
      phone: emp?.phone || '',
      email: emp?.email || '',
      designation: emp?.designation || '',
    }));
  };

  const handleAddRow = () => setRows([...rows, EMPTY_ROW()]);

  const handleRemoveRow = (tempId) => {
    if (rows.length === 1) setRows([EMPTY_ROW()]);
    else setRows(rows.filter(r => r.tempId !== tempId));
  };

  const handleQuickAdd = (emp) => {
    const empId = String(emp.id);
    if (rows.some(r => r.employeeId === empId)) return;
    const emptyIdx = rows.findIndex(r => !r.employeeId);
    if (emptyIdx !== -1) {
      setRows(rows.map((r, i) => i !== emptyIdx ? r : {
        ...r, employeeId: empId, phone: emp.phone || '', email: emp.email || '', designation: emp.designation || '',
      }));
    } else {
      setRows([...rows, { tempId: Math.random(), employeeId: empId, phone: emp.phone || '', email: emp.email || '', designation: emp.designation || '', isNew: false }]);
    }
  };

  /* New member handlers (GC / Vendor only) */
  const handleAddNewMember = () => setNewMembers([...newMembers, EMPTY_NEW_MEMBER()]);

  const handleNewMemberChange = (tempId, field, value) => {
    setNewMembers(newMembers.map(m => m.tempId !== tempId ? m : { ...m, [field]: value }));
  };

  const handleRemoveNewMember = (tempId) => setNewMembers(newMembers.filter(m => m.tempId !== tempId));

  /* Save */
  const handleSave = () => {
    if (!teamName.trim()) { alert('Please enter a team name'); return; }

    const needsCompany = teamType !== 'steelmart';
    if (needsCompany && !selectedCompanyId) { alert('Please select a company'); return; }

    const employeeIds = rows.map(r => Number(r.employeeId)).filter(Boolean);
    const validNewMembers = newMembers.filter(m => m.first_name.trim());

    if (employeeIds.length === 0 && validNewMembers.length === 0) {
      alert('Please add at least one team member');
      return;
    }

    onSubmit({
      team_name: teamName.trim(),
      team_type: teamType,
      company_id: needsCompany ? Number(selectedCompanyId) : null,
      employee_ids: employeeIds,
      new_members: validNewMembers.map(m => ({
        first_name: m.first_name.trim(),
        last_name: m.last_name.trim(),
        phone: m.phone.trim() || null,
        email: m.email.trim() || null,
        designation: m.designation.trim() || 'employee',
      })),
    });
  };

  const needsCompany = teamType !== 'steelmart';
  const showNewMemberSection = needsCompany && selectedCompanyId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTeam ? 'Edit Team' : 'Add Team'}
      width="880px"
    >
      <div className={styles.modalContent}>

        {/* ── Team Type Selector ── */}
        <div className={styles.teamTypeSection}>
          <label className={styles.sectionLabel}>Team Type</label>
          <div className={styles.teamTypeGrid}>
            {TEAM_TYPES.map(({ value, label, desc, Icon, color }) => (
              <button
                key={value}
                type="button"
                className={`${styles.teamTypeCard} ${teamType === value ? styles.teamTypeCardActive : ''}`}
                style={teamType === value ? { '--type-color': color, borderColor: color } : { '--type-color': color }}
                onClick={() => !editingTeam && setTeamType(value)}
                disabled={!!editingTeam}
              >
                <span className={styles.teamTypeIcon} style={{ color: teamType === value ? color : '#98A2B3' }}>
                  <Icon />
                </span>
                <span className={styles.teamTypeLabel}>{label}</span>
                <span className={styles.teamTypeDesc}>{desc}</span>
                {teamType === value && <span className={styles.teamTypeCheck} style={{ background: color }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Team Name + Company ── */}
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Team Name <span className={styles.required}>*</span></label>
            <input
              type="text"
              placeholder="Enter team name"
              className={styles.input}
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
            />
          </div>

          {needsCompany && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {teamType === 'generalContractor' ? 'General Contractor' : 'Vendor'} Company <span className={styles.required}>*</span>
              </label>
              <select
                className={styles.select}
                value={selectedCompanyId}
                onChange={e => setSelectedCompanyId(e.target.value)}
                disabled={!!editingTeam}
              >
                <option value="" disabled>Select Company</option>
                {companies.map(c => (
                  <option key={c.company_id} value={c.company_id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Add Team Members ── */}
        <div className={styles.teamMemberSection}>
          <div className={styles.teamMemberHeaderRow}>
            <span className={styles.teamMemberHeader}>Add Team Members</span>
            {allEmployees.length > 0 && (
              <div className={styles.quickAddRow}>
                <span className={styles.quickAddLabel}>Quick Add:</span>
                <div className={styles.quickAddList}>
                  {allEmployees.slice(0, 6).map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      className={`${styles.quickAddBtn} ${rows.some(r => String(r.employeeId) === String(emp.id)) ? styles.quickAddBtnDone : ''}`}
                      onClick={() => handleQuickAdd(emp)}
                    >
                      {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()}
                    </button>
                  ))}
                  {allEmployees.length > 6 && <span className={styles.quickAddMore}>+{allEmployees.length - 6} more</span>}
                </div>
              </div>
            )}
          </div>

          {(teamType === 'steelmart' || (needsCompany && selectedCompanyId) || (needsCompany && !selectedCompanyId && allEmployees.length > 0)) && (
            <div className={styles.tableWrapper}>
              <table className={styles.membersTable}>
                <thead>
                  <tr>
                    <th>Personnel</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Designation</th>
                    <th style={{ width: 40, textAlign: 'center' }}>
                      <button type="button" className={styles.plusBtn} onClick={handleAddRow} title="Add Row">
                        <PlusIcon />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.tempId}>
                      <td>
                        <select
                          className={styles.tableSelect}
                          value={row.employeeId}
                          onChange={e => handleEmployeeChange(row.tempId, e.target.value)}
                          disabled={needsCompany && !selectedCompanyId}
                        >
                          <option value="" disabled>Select Personnel</option>
                          {allEmployees.map(e => (
                            <option key={e.id} value={e.id}>
                              {e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim()}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input type="text" placeholder="Phone No." className={styles.tableInput} value={row.phone} disabled />
                      </td>
                      <td>
                        <input type="text" placeholder="Email ID" className={styles.tableInput} value={row.email} disabled />
                      </td>
                      <td>
                        <input type="text" placeholder="Designation" className={styles.tableInput} value={row.designation} disabled />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" className={styles.trashBtn} onClick={() => handleRemoveRow(row.tempId)} title="Remove Row">
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {needsCompany && !selectedCompanyId && (
            <p className={styles.selectCompanyHint}>
              Please select a company above to load available personnel.
            </p>
          )}
        </div>

        {/* ── New Contact Member (GC / Vendor only) ── */}
        {showNewMemberSection && (
          <div className={styles.newMembersSection}>
            <div className={styles.newMembersHeader}>
              <span className={styles.newMembersTitle}>Add New Contact to Company</span>
              <span className={styles.newMembersSubtitle}>
                New members will also appear in Contacts under this company
              </span>
              <button type="button" className={styles.addNewMemberBtn} onClick={handleAddNewMember}>
                <PlusIcon color="#3047F7" />
                Add New Person
              </button>
            </div>

            {newMembers.length > 0 && (
              <div className={styles.tableWrapper}>
                <table className={styles.membersTable}>
                  <thead>
                    <tr>
                      <th>First Name <span className={styles.required}>*</span></th>
                      <th>Last Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Designation</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {newMembers.map(m => (
                      <tr key={m.tempId}>
                        <td>
                          <input
                            type="text"
                            placeholder="First name"
                            className={`${styles.tableInput} ${styles.tableInputEditable}`}
                            value={m.first_name}
                            onChange={e => handleNewMemberChange(m.tempId, 'first_name', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Last name"
                            className={`${styles.tableInput} ${styles.tableInputEditable}`}
                            value={m.last_name}
                            onChange={e => handleNewMemberChange(m.tempId, 'last_name', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Phone"
                            className={`${styles.tableInput} ${styles.tableInputEditable}`}
                            value={m.phone}
                            onChange={e => handleNewMemberChange(m.tempId, 'phone', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            placeholder="Email"
                            className={`${styles.tableInput} ${styles.tableInputEditable}`}
                            value={m.email}
                            onChange={e => handleNewMemberChange(m.tempId, 'email', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Designation"
                            className={`${styles.tableInput} ${styles.tableInputEditable}`}
                            value={m.designation}
                            onChange={e => handleNewMemberChange(m.tempId, 'designation', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" className={styles.trashBtn} onClick={() => handleRemoveNewMember(m.tempId)}>
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.saveBtn} onClick={handleSave}>
            {editingTeam ? 'Save Changes' : 'Add Team'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default PersonnelTeamModal;