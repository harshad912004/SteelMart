import React from 'react';
import DataTable from '../DataTable/DataTable';
import { ChevronDownIcon } from '../Icons';
import { getRoleLabel } from '../../constants/roles';
import styles from './EmployeeTable.module.css';

// const columns = ['NAME', 'ROLE', 'OPEN BIDS', 'LAST LOGIN', 'JOINED DATE', 'ACTIONS'];
const columns = ['NAME', 'ROLE', 'LAST LOGIN', 'JOINED DATE', 'ACTIONS'];

function EmployeeTable({ employees, onEmployeeClick, onActionClick, isLoading = false, isBlockedView = false }) {
  const getBidColor = (bids) => (bids === '00' ? styles.bidGreen : styles.bidRed);
  const isBlockedEmployee = (employee) => (
    isBlockedView || String(employee.status || '').toLowerCase() === 'blocked'
  );

  return (
    <DataTable
      styles={styles}
      columns={columns}
      rows={employees}
      isLoading={isLoading}
      loadingMessage="Loading employees..."
      emptyMessage="No employees found"
      renderRow={(employee) => {
        const isBlocked = isBlockedEmployee(employee);

        return (
          <tr
            key={employee.id}
            className={isBlocked ? styles.blockedRow : undefined}
            onClick={() => onEmployeeClick(employee)}
          >
            <td>
              <div className={styles.nameCell}>
                <div className={styles.avatarWrapper}>
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className={`${styles.avatar} ${isBlocked ? styles.blockedAvatar : ''}`}
                  />
                  <span className={`${styles.onlineDot} ${isBlocked ? styles.blockedDot : ''}`}></span>
                </div>
                <div>
                  <div className={styles.employeeName}>{employee.name}</div>
                  <div className={styles.employeeEmail}>{employee.email}</div>
                </div>
              </div>
            </td>
            <td>{getRoleLabel(employee.role)}</td>
            {/* <td>
              <span className={`${styles.bidCount} ${isBlocked ? styles.blockedBidCount : getBidColor(employee.openBids)}`}>
                {employee.openBids}
              </span>
            </td> */}
            <td>{employee.lastLogin}</td>
            <td>{employee.joinedDate}</td>
            <td onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={(event) => {
                  event.stopPropagation();
                  const rect = event.currentTarget.getBoundingClientRect();
                  onActionClick(employee, rect);
                }}
              >
                <ChevronDownIcon />
              </button>
            </td>
          </tr>
        );
      }}
    />
  );
}

export default EmployeeTable;