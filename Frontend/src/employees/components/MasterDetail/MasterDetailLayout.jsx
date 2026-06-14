import React from 'react';
import styles from './MasterDetailLayout.module.css';

function MasterDetailLayout({ listPanel, detailPanel }) {
  return (
    <div className={styles.splitView}>
      <div className={styles.leftPanel}>
        {listPanel}
      </div>
      <div className={styles.rightPanel}>
        {detailPanel}
      </div>
    </div>
  );
}

export default MasterDetailLayout;