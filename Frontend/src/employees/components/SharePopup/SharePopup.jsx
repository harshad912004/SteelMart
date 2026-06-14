import React from 'react';

function SharePopup({
  styles,
  showSharePopup,
  setShowSharePopup,
  shareSearchTerm,
  setShareSearchTerm,
  filteredShareOptions,
  selectedShareOption,
  setSelectedShareOption,
}) {
  if (!showSharePopup) return null;

  return (
    <div className={styles.shareOverlay}>
      <div className={styles.sharePopup} role="dialog" aria-modal="true" aria-labelledby="share-title">
        <div className={styles.shareHeader}>
          <h3 id="share-title">Share</h3>
          <button
            type="button"
            className={styles.shareCloseButton}
            onClick={() => setShowSharePopup(false)}
            aria-label="Close share popup"
          >
            ×
          </button>
        </div>

        <label className={styles.shareLabel}>Select a company name</label>
        <div className={styles.shareSearchBox}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={shareSearchTerm}
            onChange={(event) => setShareSearchTerm(event.target.value)}
          />
        </div>

        <div className={styles.shareOptionList}>
          {filteredShareOptions.length > 0 ? (
            filteredShareOptions.map((option) => (
              <label key={option.id} className={styles.shareOptionRow}>
                <input
                  type="radio"
                  name="share-option"
                  checked={selectedShareOption === option.id}
                  onChange={() => setSelectedShareOption(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))
          ) : (
            <div className={styles.shareEmptyState}>No matching names found</div>
          )}
        </div>

        <div className={styles.shareActions}>
          <button
            type="button"
            className={styles.shareCancelButton}
            onClick={() => setShowSharePopup(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.shareSendButton}
            onClick={() => setShowSharePopup(false)}
            disabled={!selectedShareOption}
          >
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}

export default SharePopup;