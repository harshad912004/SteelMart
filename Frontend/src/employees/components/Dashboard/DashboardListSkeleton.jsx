import React from 'react';
import styles from './DashboardSectionGrid.module.css';

export default function DashboardListSkeleton({ title = 'Loading' }) {
  const skeletonCards = [1, 2, 3, 4, 5, 6];

  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      animation: 'pulse 1.5s infinite ease-in-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>{title}</h2>
        <div style={{ width: '80px', height: '28px', background: '#f0f0f0', borderRadius: '8px' }}></div>
      </div>
      <div className={styles.sectionGrid}>
        {skeletonCards.map((i) => (
          <div
            key={i}
            style={{
              minHeight: '144px',
              display: 'flex',
              flexDirection: 'column',
              padding: '14px 16px',
              borderRadius: '8px',
              border: '1px solid #e6eaf0',
              background: '#fff',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ height: '16px', background: '#f5f5f5', borderRadius: '4px', width: '78%' }}></div>
                <div style={{ height: '10px', background: '#f5f5f5', borderRadius: '4px', width: '38%', marginTop: '8px' }}></div>
              </div>
              <div style={{ width: '28px', height: '28px', background: '#f5f5f5', borderRadius: '999px', flexShrink: 0 }}></div>
            </div>

            <div style={{ marginTop: '14px', width: '92px', height: '24px', background: '#f5f5f5', borderRadius: '999px' }}></div>

            <div style={{ marginTop: 'auto', paddingTop: '18px' }}>
              <div style={{ height: '12px', background: '#f5f5f5', borderRadius: '4px', width: '68%' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}