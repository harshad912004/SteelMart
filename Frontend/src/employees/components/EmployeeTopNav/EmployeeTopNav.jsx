import React from 'react';
import styles from './EmployeeTopNav.module.css';

const tabs = ['Active', 'InActive', 'Blocked', 'Deleted'];

function EmployeeTopNav({ activeTab = 'Active', onTabChange }) {
  return (
    <nav className={styles.navContainer}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`.trim()}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}

export default EmployeeTopNav;
