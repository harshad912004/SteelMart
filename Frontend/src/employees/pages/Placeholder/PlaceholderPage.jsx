import React from 'react';
import { useLocation } from 'react-router-dom';
import styles from './PlaceholderPage.module.css';

function PlaceholderPage() {
  const location = useLocation();
  const title = location.pathname
    .split('/')
    .filter(Boolean)
    .join(' ')
    .replace(/\b\w/g, letter => letter.toUpperCase()) || 'Page';

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.panel}>
        <h1>{title}</h1>
        <p>This page is reserved for upcoming functionality.</p>
      </div>
    </div>
  );
}

export default PlaceholderPage;