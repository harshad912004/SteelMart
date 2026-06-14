import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import { getProjectsWithRFIs } from '../../../common/services/api';
import styles from './RfiProjectsModal.module.css';

function RfiProjectsModal({ isOpen, onClose }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const fetchProjects = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getProjectsWithRFIs();
        if (response?.success) {
          setProjects(response.data?.projects || response.projects || []);
        } else {
          throw new Error(response?.message || 'Failed to fetch projects with RFIs.');
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load projects. Please try again.');
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
    return undefined;
  }, [isOpen]);

  const handleSelectProject = (projectId) => {
    navigate(`/dashboard/projects/${projectId}/rfis`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select RFI Project" width="580px">
      <div className={styles.container}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading projects...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.emptyIcon}>
              <path d="M7 3.75H14.75L19 8V19.25A1.75 1.75 0 0 1 17.25 21H7A2 2 0 0 1 5 19V5.75A2 2 0 0 1 7 3.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 3.75V8.5H18.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3>No Projects with RFIs</h3>
            <p>There are currently no active projects that contain RFIs.</p>
          </div>
        ) : (
          <div className={styles.listContainer}>
            <p className={styles.instruction}>Select a project below to go to its RFI board:</p>
            <div className={styles.projectList}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={styles.projectRow}
                  onClick={() => handleSelectProject(project.id)}
                >
                  <div className={styles.projectInfo}>
                    <span className={styles.projectId}>{project.bid_project_id || `PRJ-${String(project.id).padStart(4, '0')}`}</span>
                    <span className={styles.projectName}>{project.project_name}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.selectBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectProject(project.id);
                    }}
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default RfiProjectsModal;
