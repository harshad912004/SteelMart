import React from 'react';
import styles from './TopTabs.module.css';

function TopTabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <nav className={`${styles.navContainer} ${className}`.trim()}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`.trim()}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}

export default TopTabs;