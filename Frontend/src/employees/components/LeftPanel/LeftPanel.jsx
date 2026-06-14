import React from 'react';
import styles from './LeftPanel.module.css';
import SteelMartLogo from '../../../common/assets/SteelMart_Logo.png';
import handshakeIllustration from '../../assets/handshake-illustration.png';

export default function LeftPanel() {
  return (
    <div className={styles.panel}>
      {/* <div className={styles.logoWrapper}>
        <img
          src={SteelMartLogo}
          alt="SteelMart Steel Industries, LLC"
          className={styles.logo}
        />
      </div> */}

      <div className={styles.illustrationWrapper}>
        <img
          src={handshakeIllustration}
          alt="Two business professionals shaking hands"
          className={styles.illustration}
        />
      </div>

    </div>
  );
}