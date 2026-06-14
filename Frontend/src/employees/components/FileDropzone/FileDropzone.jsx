import React from 'react';

function FileDropzone({
  styles,
  label,
  isDragOver,
  setIsDragOver,
  uploadedFiles,
  setUploadedFiles,
  handleFileDrop,
  handleFileSelect,
  handleFolderSelect,
}) {
  const hasFiles = uploadedFiles && uploadedFiles.length > 0;

  return (
    <div className={styles.inputGroupFull}>
      <label className={styles.label}>{label}</label>
      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''} ${hasFiles ? styles.hasFile : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleFileDrop}
      >
        <svg className={styles.uploadIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        {hasFiles ? (
          <div className={styles.fileInfo}>
            {uploadedFiles.length === 1 && !uploadedFiles[0].webkitRelativePath ? (
              <>
                <strong className={styles.fileName}>{uploadedFiles[0].name}</strong>
                <span className={styles.fileSize}>({(uploadedFiles[0].size / 1024).toFixed(1)} KB)</span>
              </>
            ) : (
              <>
                <strong className={styles.fileName}>
                  {uploadedFiles[0].webkitRelativePath
                    ? `Folder: ${uploadedFiles[0].webkitRelativePath.split('/')[0]}`
                    : `${uploadedFiles.length} files selected`}
                </strong>
                <span className={styles.fileSize}>
                  ({(uploadedFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </>
            )}
            <button type="button" className={styles.removeFileBtn} onClick={() => setUploadedFiles([])}>
              Remove Uploads
            </button>
          </div>
        ) : (
          <div className={styles.dropText}>
            <strong>
              Drag files/folders or{' '}
              <label className={styles.selectFileLink} style={{ display: 'inline-block', marginTop: '6px', cursor: 'pointer' }}>
                browse files
                <input type="file" multiple className={styles.fileInput} onChange={handleFileSelect} />
              </label>
              {' '}or{' '}
              <label className={styles.selectFileLink} style={{ display: 'inline-block', marginTop: '6px', cursor: 'pointer' }}>
                browse folder
                <input type="file" webkitdirectory="" directory="" multiple className={styles.fileInput} onChange={handleFolderSelect} />
              </label>
            </strong>
            <span style={{ display: 'block', fontSize: '11px', color: '#98A2B3', marginTop: '2px' }}>
              JPEG, PNG, PDF formats, or folders up to 50MB
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileDropzone;