import React from 'react';
import DataTable from '../DataTable/DataTable';
import { ChevronDownIcon } from '../Icons';
import { formatClientTypeLabel } from '../../utils/clientType';
import styles from './ContactTable.module.css';

const columns = ['Company NAME', 'Company Website', 'Company Type', 'Office Number', 'ACTIONS'];

function ContactTable({ contacts, onContactClick, onActionClick, isLoading = false }) {
  return (
    <DataTable
      styles={styles}
      columns={columns}
      rows={contacts}
      isLoading={isLoading}
      loadingMessage="Loading contacts..."
      emptyMessage="No contacts found"
      renderRow={(contact) => (
        <tr key={contact.id} onClick={() => onContactClick(contact)}>
          <td>
            <div className={styles.nameCell}>
              <div className={styles.companyName}>{contact.companyName}</div>
            </div>
          </td>
          <td>
            <div className={styles.websiteCell}>
              <div className={styles.companyWebsite}>{contact.companyWebsite}</div>
            </div>
          </td>
          <td>
            <div className={styles.clientTypeIdCell}>
              <div className={styles.clientTypeId}>{formatClientTypeLabel(contact.clientTypeName || contact.clientTypeId)}</div>
            </div>
          </td>
          <td>
            <div className={styles.officeNumberCell}>
              <div className={styles.officeNumber}>{contact.officeNumber}</div>
            </div>
          </td>
          <td onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={(event) => {
                event.stopPropagation();
                const rect = event.currentTarget.getBoundingClientRect();
                onActionClick(contact, rect);
              }}
            >
              <ChevronDownIcon />
            </button>
          </td>
        </tr>
      )}
    />
  );
}

export default ContactTable;
