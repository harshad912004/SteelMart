import React, { useEffect, useState, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import styles from './SoWExclusionModal.module.css';

/* Register custom undo/redo SVG icons in the Quill toolbar */
const icons = Quill.import('ui/icons');
icons['undo'] = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>`;
icons['redo'] = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path></svg>`;

const fallbackText = `<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris</p>`;

const quillModules = {
  toolbar: {
    container: [
      ['undo', 'redo'],
      [{ header: [1, 2, 3, false] }],
      [{ align: [] }],
      ['bold', 'italic', 'underline', 'strike'],
    ],
    handlers: {
      undo: function () { this.quill.history.undo(); },
      redo: function () { this.quill.history.redo(); },
    },
  },
  history: {
    delay: 1000,
    maxStack: 50,
    userOnly: true,
  },
};

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'align',
];

function SoWExclusionModal({
  isOpen,
  onClose,
  initialTab = 'sow',
  scopeOfWork = '',
  exclusion = '',
  accessNotes = '',
  onSave,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [values, setValues] = useState({
    sow: scopeOfWork || fallbackText,
    exclusion: exclusion || fallbackText,
    notes: accessNotes || '',
  });
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const isNotesEmpty = (content) => {
    if (!content) return true;
    const stripped = content.replace(/<[^>]*>/g, '').trim();
    return stripped === '' || stripped === 'No project access notes added yet.';
  };

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setValues({
      sow: scopeOfWork || fallbackText,
      exclusion: exclusion || fallbackText,
      notes: accessNotes || '',
    });
    const hasNotes = accessNotes && accessNotes.replace(/<[^>]*>/g, '').trim() !== '';
    setIsEditingNotes(!!hasNotes);
  }, [exclusion, initialTab, isOpen, scopeOfWork, accessNotes]);

  if (!isOpen) return null;

  const title = activeTab === 'sow'
    ? 'Scope of Work'
    : activeTab === 'exclusion'
      ? 'Exclusion'
      : 'Project Access Notes';

  const handleQuillChange = (content) => {
    setValues((previousValues) => ({
      ...previousValues,
      [activeTab]: content,
    }));
  };

  const handleSave = () => {
    onSave?.({
      scopeOfWork: values.sow,
      exclusion: values.exclusion,
      accessNotes: values.notes,
      activeTab,
    });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalContainer}>


        <div className={styles.modalContent}>
          <div className={styles.header}>
            <h2>{title}</h2>
            <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className={styles.editorContainer}>
            {activeTab === 'notes' && !isEditingNotes && isNotesEmpty(values.notes) ? (
              <div className={styles.emptyStateContainer}>
                <svg width="120" height="100" viewBox="100 5 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M202.084 36.4848L180.956 99.69C180.015 102.504 176.971 104.023 174.157 103.082L109.042 81.3162C106.227 80.3755 104.709 77.3315 105.649 74.517L126.777 11.3116C127.718 8.4974 130.762 6.97852 133.576 7.9192L198.691 29.6854C201.505 30.6263 203.024 33.6703 202.084 36.4848Z" fill="#48B5EE"/>
                  <path d="M206.142 20.8993L211.609 87.3181C211.852 90.2754 209.652 92.8703 206.695 93.1137L138.269 98.7457C135.312 98.9891 132.717 96.7891 132.474 93.8315L127.007 27.4128C126.763 24.4555 128.964 21.8606 131.921 21.6172L200.346 15.9852C203.304 15.7417 205.899 17.942 206.142 20.8993Z" fill="white"/>
                  <path d="M174.25 19.4377C174.25 23.1311 171.249 26.1322 167.543 26.1322C163.849 26.1322 160.848 23.1313 160.848 19.4377C160.848 15.7314 163.849 12.7305 167.543 12.7305C171.249 12.7305 174.25 15.7314 174.25 19.4377Z" fill="#48B5EE"/>
                  <path d="M207.202 20.8131C206.909 17.2917 203.842 14.6444 200.26 14.9264L174.919 17.0124C173.897 13.9142 170.979 11.6693 167.542 11.6693C164.556 11.6693 161.963 13.3709 160.667 15.8543L133.914 6.91143C130.553 5.78452 126.895 7.60865 125.769 10.9738L104.642 74.1787C103.517 77.5449 105.339 81.1975 108.704 82.3233L131.076 89.8016L131.415 93.9192C131.695 97.3233 134.546 99.8275 137.819 99.8275C137.998 99.8275 138.177 99.8202 138.357 99.8056L156.529 98.3097L173.819 104.089C177.218 105.224 180.849 103.36 181.963 100.027L183.273 96.1084L206.782 94.1733C210.327 93.8791 212.96 90.776 212.668 87.2312L207.202 20.8131ZM167.542 13.7943C170.655 13.7943 173.187 16.3263 173.187 19.4382C173.187 22.5438 170.655 25.0706 167.542 25.0706C164.437 25.0706 161.911 22.5438 161.911 19.4382C161.911 16.3263 164.438 13.7943 167.542 13.7943ZM109.379 80.3084C107.124 79.554 105.904 77.1072 106.657 74.8534L127.784 11.6484C128.535 9.40416 130.971 8.17059 133.239 8.92656L159.949 17.8547C159.922 17.9843 159.907 18.1179 159.886 18.2497L131.834 20.5588C128.298 20.8493 125.658 23.9634 125.948 27.5008L130.886 87.4976L109.379 80.3084ZM179.949 99.3528C179.194 101.608 176.744 102.826 174.494 102.075L161.908 97.8677L180.969 96.2987L179.949 99.3528ZM206.608 92.0547L138.183 97.6871C135.861 97.8952 133.73 96.153 133.534 93.7451L128.067 27.3265C127.871 24.9543 129.634 22.8711 132.009 22.6778L159.85 20.386C160.319 24.217 163.587 27.1958 167.542 27.1958C171.827 27.1958 175.312 23.7156 175.312 19.4382C175.312 19.3289 175.3 19.2227 175.296 19.1145L200.434 17.0452C202.783 16.8444 204.886 18.5946 205.083 20.9872L210.549 87.4057C210.747 89.7788 208.983 91.8594 206.608 92.0547Z" fill="#2324CA"/>
                  <path d="M197.539 34.5938C198.124 34.545 198.559 34.0325 198.511 33.4471C198.464 32.8629 197.96 32.4386 197.365 32.4748L137.559 37.3974C136.974 37.4462 136.539 37.9587 136.587 38.544C136.633 39.0993 137.097 39.5194 137.645 39.5194C137.674 39.5194 137.703 39.5183 137.733 39.5164L197.539 34.5938Z" fill="#2324CA"/>
                  <path d="M154.76 51.5239C155.346 51.4752 155.78 50.9627 155.733 50.3773C155.685 49.793 155.185 49.3646 154.586 49.405L138.656 50.7155C138.071 50.7643 137.636 51.2768 137.684 51.8621C137.729 52.4174 138.194 52.8375 138.742 52.8375C138.771 52.8375 138.8 52.8364 138.83 52.8345L154.76 51.5239Z" fill="#2324CA"/>
                  <path d="M163.4 48.6787C162.815 48.7275 162.38 49.24 162.427 49.8254C162.473 50.3806 162.938 50.8008 163.486 50.8008C163.515 50.8008 163.544 50.7997 163.574 50.7977L198.635 47.9119C199.22 47.8632 199.655 47.3506 199.607 46.7653C199.559 46.181 199.063 45.7587 198.46 45.793L163.4 48.6787Z" fill="#2324CA"/>
                  <path d="M199.557 59.1123L183.626 60.4239C183.041 60.4727 182.606 60.9852 182.653 61.5706C182.7 62.1258 183.164 62.5459 183.712 62.5459C183.741 62.5459 183.77 62.5448 183.8 62.5429L199.731 61.2313C200.317 61.1825 200.751 60.67 200.704 60.0846C200.655 59.4993 200.155 59.0696 199.557 59.1123Z" fill="#2324CA"/>
                  <path d="M175.959 62.1213C175.911 61.5371 175.409 61.1096 174.812 61.149L139.752 64.0348C139.166 64.0836 138.732 64.5961 138.779 65.1814C138.825 65.7366 139.29 66.1568 139.838 66.1568C139.867 66.1568 139.896 66.1557 139.926 66.1538L174.986 63.268C175.572 63.2192 176.006 62.7067 175.959 62.1213Z" fill="#2324CA"/>
                  <path d="M195.169 72.8833L146.333 76.902C145.747 76.9508 145.313 77.4633 145.36 78.0487C145.406 78.6039 145.871 79.024 146.419 79.024C146.448 79.024 146.477 79.0229 146.507 79.021L195.343 75.0022C195.929 74.9534 196.363 74.4409 196.316 73.8556C196.268 73.2713 195.767 72.8449 195.169 72.8833Z" fill="#2324CA"/>
                </svg>
                <p className={styles.emptyStateText}>No access notes yet.</p>
              </div>
            ) : (
              <ReactQuill
                theme="snow"
                value={values[activeTab] || ''}
                onChange={handleQuillChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder={`Enter ${title} here...`}
                className={styles.quillEditor}
              />
            )}
          </div>

          <div className={styles.footer}>
            <button className={styles.cancelBtn} type="button" onClick={onClose}>Cancel</button>
            <button className={styles.saveBtn} type="button" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SoWExclusionModal;