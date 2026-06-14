import React from 'react';
import { getCurrentUserSummary } from '../../utils/authSession';
import { formatShortDate } from '../../utils/dateFormat';
import styles from './EmployeeDashboardPage.module.css';

function EmployeeDashboardPage() {
  const userSummary = getCurrentUserSummary();
  const userEmail = userSummary?.email || 'Employee';
  const userRole = userSummary?.role || 'Team Member';

  const summary = {
    pendingTasks: 3,
    upcomingHolidays: 2,
    leaveBalance: 12,
  };

  const recentActivities = [
    { id: 1, action: 'Completed project milestone', date: '2026-04-22' },
    { id: 2, action: 'Attended weekly sync', date: '2026-04-20' },
    { id: 3, action: 'Submitted timesheet', date: '2026-04-18' },
  ];

  const announcements = [
    { id: 1, title: 'Townhall Meeting', date: '2026-04-28' },
    { id: 2, title: 'Office closed on Friday', date: '2026-05-01' },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.header}>
        <div>
          <h1>Welcome, {userEmail}</h1>
          <p>Role: {userRole} | Here is your overview for today.</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending Tasks</span>
          <strong>{summary.pendingTasks}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Upcoming Holidays</span>
          <strong>{summary.upcomingHolidays}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Leave Balance</span>
          <strong>{summary.leaveBalance} days</strong>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Recent Announcements</h2>
          </div>
          <div className={styles.list}>
            {announcements.map((announcement) => (
              <div className={styles.row} key={announcement.id}>
                <span>{announcement.title}</span>
                <strong>{formatShortDate(announcement.date)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Recent Activities</h2>
          </div>
          <div className={styles.list}>
            {recentActivities.map((activity) => (
              <div className={styles.activityRow} key={activity.id}>
                <span>
                  <strong>{activity.action}</strong>
                  <small>{formatShortDate(activity.date)}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default EmployeeDashboardPage;