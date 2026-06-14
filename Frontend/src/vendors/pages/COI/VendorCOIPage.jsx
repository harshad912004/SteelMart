import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CloudUpload, FileText, Download } from 'lucide-react';
import styles from './VendorCOIPage.module.css';
import logo from '../../../common/assets/SteelMart_Logo.png';

export default function VendorCOIPage() {
  const navigate = useNavigate();
  const [isUploaded, setIsUploaded] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, under_approval, approved

  const handleUpload = () => {
    setIsUploaded(true);
    setStatus('under_approval');
  };

  return (
    <div className={styles.layout}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <img src={logo} alt="SteelMart" className={styles.brandLogo} />
        <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </button>
      </header>

      <div className={styles.mainContent}>
        {/* Left Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarTitle}>Shipping</div>
            <div className={styles.sidebarText}>1922 Benhill Ave. Baltimore<br/>MD 21226</div>
            <div className={styles.sidebarText}>Bassam@SteelMartsi.com</div>
            <div className={styles.sidebarText}>301-401-9013</div>
          </div>
          
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarTitle}>Billing</div>
            <div className={styles.sidebarText}>4245 buckskin Wood Dr.</div>
            <div className={styles.sidebarText}>Bassam@SteelMartsi.com</div>
            <div className={styles.sidebarText}>443-538-3517</div>
          </div>

          <div className={styles.sidebarSection}>
            <div className={styles.sidebarTitle}>Other</div>
            <div className={styles.sidebarText}>samy@SteelMartsi.com</div>
            <div className={styles.sidebarText}>443-255-1330</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {status === 'under_approval' && (
            <div className={styles.alertOrange}>
              The CoI for this project is under approval. Please wait for the project manager to get back with revisions
            </div>
          )}
          {status === 'approved' && (
            <div className={styles.alertRed}>
              The CoI for this project has already been sent and approved. To update the CoI please contact the Project Manager at SteelMart
            </div>
          )}

          <h1 className={styles.pageTitle}>Add Certificate of Insurance</h1>
          
          <div className={styles.projectTitle}>18 Ft. Stairs</div>
          <div className={styles.projectCode}>BMB-224-089</div>

          <div className={styles.card}>
            <div className={styles.infoList}>
              <div className={styles.infoRow}><span className={styles.infoLabel}>SteelMart Project Number:</span> PRJ-225113</div>
              <div className={styles.infoRow}><span className={styles.infoLabel}>Project Name:</span> 23 september</div>
              <div className={styles.infoRow}><span className={styles.infoLabel}>Project Address:</span> New York, New York, United States</div>
              <div className={styles.infoRow}><span className={styles.infoLabel}>General Contractor:</span> KSB</div>
              <div className={styles.infoRow}><span className={styles.infoLabel}>General Contractor Address:</span> 8601 Good Luck Road, Lanham, Maryland 20706, United States</div>
            </div>

            {!isUploaded ? (
              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Uploaded by</label>
                  <input type="text" className={styles.input} placeholder="Enter Name" />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Upload Certificate of Insurance</label>
                  <div className={styles.uploadBox}>
                    <CloudUpload size={32} color="#2563eb" />
                    <div className={styles.uploadText}>
                      Drag your file or <span className={styles.uploadLink}>browse</span>
                    </div>
                    <div className={styles.uploadSubtext}>pdf only, up to 10MB</div>
                  </div>
                </div>

                <button type="button" className={styles.submitBtn} onClick={handleUpload}>
                  Submit
                </button>
                
                {/* For demo purposes, button to switch to approved state */}
                <button type="button" onClick={() => { setIsUploaded(true); setStatus('approved'); }} style={{ marginLeft: 16, background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 12 }}>
                  (Simulate Approved State)
                </button>
              </div>
            ) : (
              <div className={styles.fileActions}>
                <div className={styles.fileActionCard}>
                  <FileText size={24} className={styles.fileActionIcon} />
                  View File
                </div>
                <div className={styles.fileActionCard}>
                  <Download size={24} className={styles.fileActionIcon} />
                  Download
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}