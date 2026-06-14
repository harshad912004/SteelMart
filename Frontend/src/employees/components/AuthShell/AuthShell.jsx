import React from 'react';
import SteelMartLogo from '../../../common/assets/logo.png';
import SteelMartFullLogo from '../../../common/assets/SteelMart_Logo.png';
import styles from './AuthShell.module.css';

function AuthShell({ children, footer = null }) {
  return (
    <div className={styles.page}>
      {/* Left branding panel */}
      <aside className={styles.brandingPanel}>
        <div className={styles.brandingContent}>
          <img
            src={SteelMartFullLogo}
            alt="SteelMart"
            className={styles.brandingLogo}
          />
          <h2 className={styles.brandingTagline}>
            Stronger Connections.
            <br />
            <strong>Stronger Business.</strong>
          </h2>
          <p className={styles.brandingDescription}>
            SteelMart connects employees, suppliers
            and partners in one seamless platform
            to build a stronger future together.
          </p>
        </div>
      </aside>

      <main className={styles.right}>
        <div className={styles.content}>
          <div className={styles.logoFrame}>
            <img
              src={SteelMartLogo}
              alt="SteelMart Steel Industries, LLC"
              className={styles.logo}
            />
          </div>
          {children}
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

export default AuthShell;