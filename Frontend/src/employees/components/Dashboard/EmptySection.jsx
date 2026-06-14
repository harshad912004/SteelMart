import React from 'react';
import styles from './EmptySection.module.css';
import noDataCalendar from '../../../common/assets/no-data-calendar.svg';
import noDataBids from '../../../common/assets/no-data-bids.svg';
import noDataCrm from '../../../common/assets/no-data-crm.svg';

const illustrations = {
  calendar: noDataCrm ,
  bids: noDataBids  ,
  crm: noDataCalendar,
};

export default function EmptySection({ title, message, type }) {
  const src = illustrations[type] || illustrations.calendar;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.content}>
        <img
          src={src}
          alt={message}
          className={styles.illustration}
        />
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
